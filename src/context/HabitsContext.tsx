import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
  streak: number;
};

type Completion = { habit_id: string; completed_date: string };

type HabitsCtx = {
  habits: Habit[];
  completedDays: Record<string, number>;
  habitDays: Record<string, Record<string, boolean>>;
  toggleHabit: (id: string, date: string) => void;
  addHabit: (name: string, emoji: string) => void;
  deleteHabit: (id: string) => void;
};

const HabitsContext = createContext<HabitsCtx | null>(null);

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function buildDerived(completions: Completion[]) {
  const completedDays: Record<string, number> = {};
  const habitDays: Record<string, Record<string, boolean>> = {};
  for (const { habit_id, completed_date } of completions) {
    completedDays[completed_date] = (completedDays[completed_date] ?? 0) + 1;
    if (!habitDays[habit_id]) habitDays[habit_id] = {};
    habitDays[habit_id][completed_date] = true;
  }
  return { completedDays, habitDays };
}

// Compute current unbroken streak.
// If today isn't logged yet, count from yesterday so the user sees their
// maintained streak rather than 0 while they still have time to complete today.
function calcHabitStreak(habitId: string, hd: Record<string, Record<string, boolean>>): number {
  const days = hd[habitId] ?? {};
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const startOffset = days[todayKey] ? 0 : 1;
  let streak = 0;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (days[d.toISOString().split('T')[0]]) streak++;
    else break;
  }
  return streak;
}

function toCacheCompletions(hd: Record<string, Record<string, boolean>>): Completion[] {
  const out: Completion[] = [];
  for (const [habit_id, days] of Object.entries(hd))
    for (const completed_date of Object.keys(days))
      out.push({ habit_id, completed_date });
  return out;
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user!.id;

  const CACHE_HABITS      = `habito_habits_${userId}`;
  const CACHE_COMPLETIONS = `habito_completions_${userId}`;

  const [habits, setHabits]               = useState<Habit[]>([]);
  const [completedDays, setCompletedDays] = useState<Record<string, number>>({});
  const [habitDays, setHabitDays]         = useState<Record<string, Record<string, boolean>>>({});
  const [cacheReady, setCacheReady]       = useState(false);
  // Ref for synchronous reads inside callbacks (avoids stale closure)
  const habitDaysRef = useRef(habitDays);
  habitDaysRef.current = habitDays;

  // Persist to AsyncStorage whenever state changes (after initial load)
  useEffect(() => {
    if (!cacheReady) return;
    AsyncStorage.setMany({
      [CACHE_HABITS]:      JSON.stringify(habits),
      [CACHE_COMPLETIONS]: JSON.stringify(toCacheCompletions(habitDays)),
    }).catch(() => {});
  }, [habits, habitDays, cacheReady]);

  // On mount: load cache instantly, then sync Supabase in background
  useEffect(() => {
    let active = true;

    async function init() {
      // 1. Cache → instant render
      const cached = await AsyncStorage.getMany([CACHE_HABITS, CACHE_COMPLETIONS]);
      const rawH = cached[CACHE_HABITS];
      const rawC = cached[CACHE_COMPLETIONS];
      if (active && rawH && rawC) {
        const today = todayStr();
        const completions: Completion[] = JSON.parse(rawC);
        const { completedDays: cd, habitDays: hd } = buildDerived(completions);
        setHabits((JSON.parse(rawH) as Habit[]).map(h => ({
          ...h,
          completed: !!(hd[h.id]?.[today]),
          streak: calcHabitStreak(h.id, hd),
        })));
        setCompletedDays(cd);
        setHabitDays(hd);
      }
      if (active) setCacheReady(true);

      // 2. Supabase → merge & refresh cache
      const [{ data: hData }, { data: cData }] = await Promise.all([
        supabase.from('habits').select('*').eq('user_id', userId).order('created_at'),
        supabase.from('habit_completions').select('habit_id, completed_date').eq('user_id', userId),
      ]);
      if (!active || !hData || !cData) return;

      const today = todayStr();
      const { completedDays: cd, habitDays: hd } = buildDerived(cData);
      setHabits(hData.map(h => ({
        id: h.id, name: h.name, emoji: h.emoji,
        streak: calcHabitStreak(h.id, hd),
        completed: !!(hd[h.id]?.[today]),
      })));
      setCompletedDays(cd);
      setHabitDays(hd);
    }

    init();
    return () => { active = false; };
  }, [userId]);

  const toggleHabit = (id: string, date: string) => {
    const hd = habitDaysRef.current;
    const completing = !(hd[id]?.[date]);

    // Build updated habitDays synchronously for streak calculation
    const newRecord = { ...(hd[id] ?? {}) };
    if (completing) newRecord[date] = true; else delete newRecord[date];
    const newHd = { ...hd, [id]: newRecord };
    const newStreak = calcHabitStreak(id, newHd);

    setHabitDays(newHd);

    setCompletedDays(days => {
      const next = (days[date] ?? 0) + (completing ? 1 : -1);
      if (next <= 0) { const { [date]: _, ...rest } = days; return rest; }
      return { ...days, [date]: next };
    });

    // Only update habit.completed for today's date (other screens rely on it)
    setHabits(prev => prev.map(h => h.id === id
      ? { ...h, completed: date === todayStr() ? completing : h.completed, streak: newStreak }
      : h
    ));

    // Supabase sync — fire and forget
    if (completing) {
      supabase.from('habit_completions')
        .upsert({ habit_id: id, user_id: userId, completed_date: date },
          { onConflict: 'habit_id,completed_date' }).then(() => {});
    } else {
      supabase.from('habit_completions').delete()
        .eq('habit_id', id).eq('completed_date', date).then(() => {});
    }
    supabase.from('habits').update({ streak: newStreak }).eq('id', id).then(() => {});
  };

  const addHabit = (name: string, emoji: string) => {
    const id = uuid();
    setHabits(prev => [...prev, { id, name, emoji, completed: false, streak: 0 }]);
    supabase.from('habits').insert({ id, user_id: userId, name, emoji, streak: 0 }).then(() => {});
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    setHabitDays(hd => { const { [id]: _, ...rest } = hd; return rest; });
    supabase.from('habits').delete().eq('id', id).then(() => {});
  };

  return (
    <HabitsContext.Provider value={{ habits, completedDays, habitDays, toggleHabit, addHabit, deleteHabit }}>
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits(): HabitsCtx {
  const ctx = useContext(HabitsContext);
  if (!ctx) throw new Error('useHabits must be inside HabitsProvider');
  return ctx;
}
