import React, { createContext, useContext, useState } from 'react';

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  completed: boolean;
  streak: number;
};

type HabitsCtx = {
  habits: Habit[];
  completedDays: Record<string, number>; // 'YYYY-MM-DD' -> # habits logged
  habitDays: Record<string, Record<string, boolean>>; // habitId -> 'YYYY-MM-DD' -> completed
  toggleHabit: (id: string) => void;
  addHabit: (name: string, emoji: string) => void;
  deleteHabit: (id: string) => void;
};

const DEFAULT_HABITS: Habit[] = [
  { id: '1', name: '4AM Wake-Up', emoji: '⏰', completed: false, streak: 3 },
  { id: '2', name: '100 Push-Ups', emoji: '💪', completed: false, streak: 7 },
  { id: '3', name: 'Cold Shower',  emoji: '🚿', completed: false, streak: 12 },
];

// Per-habit seeded history — different consistency rates per default habit
function seedHabitDays(): Record<string, Record<string, boolean>> {
  const patterns: Record<string, number[]> = {
    '1': [1,0,1,1,0,1,0,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,0,1,0,1,1,0,0],
    '2': [1,1,0,1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,1,0,1,1,1,0,1,1,0,1,1,0],
    '3': [1,1,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0,1,1,1,1],
  };
  const result: Record<string, Record<string, boolean>> = {};
  const today = new Date();
  for (const [id, pattern] of Object.entries(patterns)) {
    result[id] = {};
    pattern.forEach((active, i) => {
      if (!active) return;
      const d = new Date(today);
      d.setDate(d.getDate() - (i + 1));
      result[id][d.toISOString().split('T')[0]] = true;
    });
  }
  return result;
}

// Seed realistic-looking past data so the heatmap isn't empty on first open
function seedDays(): Record<string, number> {
  const result: Record<string, number> = {};
  const pattern = [1,1,0,1,1,1,0,1,0,1,1,0,1,1,0,0,1,1,1,0,1,0,1,1,0,1,1,0,0,1];
  const today = new Date();
  pattern.forEach((active, i) => {
    if (!active) return;
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1));
    result[d.toISOString().split('T')[0]] = (i % 3) + 1;
  });
  return result;
}

const HabitsContext = createContext<HabitsCtx | null>(null);

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [completedDays, setCompletedDays] = useState<Record<string, number>>(seedDays);
  const [habitDays, setHabitDays] = useState<Record<string, Record<string, boolean>>>(seedHabitDays);

  const toggleHabit = (id: string) => {
    const key = todayStr();
    setHabits(prev => {
      const habit = prev.find(h => h.id === id);
      if (!habit) return prev;
      const completing = !habit.completed;
      setCompletedDays(days => {
        const next = (days[key] ?? 0) + (completing ? 1 : -1);
        if (next <= 0) {
          const { [key]: _, ...rest } = days;
          return rest;
        }
        return { ...days, [key]: next };
      });
      setHabitDays(hd => {
        const record = { ...(hd[id] ?? {}) };
        if (completing) { record[key] = true; } else { delete record[key]; }
        return { ...hd, [id]: record };
      });
      return prev.map(h =>
        h.id === id
          ? { ...h, completed: completing, streak: completing ? h.streak + 1 : Math.max(0, h.streak - 1) }
          : h
      );
    });
  };

  const addHabit = (name: string, emoji: string) => {
    setHabits(prev => [
      ...prev,
      { id: Date.now().toString(), name, emoji, completed: false, streak: 0 },
    ]);
  };

  const deleteHabit = (id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
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
