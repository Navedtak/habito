import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../context/HabitsContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

function pad(n: number) { return String(n).padStart(2, '0'); }

function toKey(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function calcStreak(completedDays: Record<string, number>): number {
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    if (completedDays[d.toISOString().split('T')[0]]) streak++;
    else break;
  }
  return streak;
}

function habitMonthConsistency(
  habitId: string,
  habitDays: Record<string, Record<string, boolean>>,
  today: Date,
): number {
  const daysElapsed = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth();
  let active = 0;
  for (let d = 1; d <= daysElapsed; d++) {
    if (habitDays[habitId]?.[`${year}-${pad(month + 1)}-${pad(d)}`]) active++;
  }
  return daysElapsed > 0 ? active / daysElapsed : 0;
}

function streakMessage(streak: number): string {
  if (streak === 0) return "You haven't shown up yet.\nThat's on you.";
  if (streak < 4)  return "You're just getting started.\nDon't you dare quit now.";
  if (streak < 7)  return "Almost a week. Most people\nquit here. Not you.";
  if (streak < 14) return "One week strong.\nCallus your mind. Keep going.";
  if (streak < 30) return "Two weeks of suffering.\nYou're becoming uncommon.";
  return `${streak} days straight.\nYou're in rare company. Stay hard.`;
}

export default function StatsScreen() {
  const { completedDays, habits, habitDays } = useHabits();
  const theme = useTheme();
  const styles = makeStyles(theme);

  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [filterHabitId, setFilterHabitId] = useState<string | null>(null);

  const [coachMsg, setCoachMsg]         = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError]     = useState<string | null>(null);

  const generateCoach = async () => {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not logged in');
      const res = await fetch(
        'https://oqumowdcsjbsmhquxnpk.supabase.co/functions/v1/ai-coach',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            'apikey': 'sb_publishable_DUo1Ij_A4f01MKZ4uXKG5w_bNirmyCu',
          },
        },
      );
      const data = await res.json();
      if (data?.error) throw new Error(data.error);
      setCoachMsg(data?.message ?? 'No response.');
    } catch (e: any) {
      setCoachError(e?.message ?? String(e));
    } finally {
      setCoachLoading(false);
    }
  };

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekDay = new Date(viewYear, viewMonth, 1).getDay();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());

  const streak = calcStreak(completedDays);

  const daysActiveThisMonth = Object.keys(completedDays).filter(k => {
    const d = new Date(k);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }).length;
  const daysElapsed = today.getDate();
  const monthPct = daysElapsed > 0 ? daysActiveThisMonth / daysElapsed : 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tabHeader}>
          <View style={styles.tabHeaderRow}>
            <View style={styles.tabIconWrap}>
              <Text style={styles.tabIcon}>⚡</Text>
            </View>
            <View style={styles.tabHeaderText}>
              <Text style={styles.tabLogo}>War Log</Text>
              <Text style={styles.tabSubtitle}>Every day counts. No exceptions.</Text>
            </View>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { marginRight: 8 }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.bigNum}>{streak}</Text>
            <Text style={styles.bigUnit}>day{streak !== 1 ? 's' : ''} streak</Text>
            <Text style={styles.tabMsg}>{streakMessage(streak)}</Text>
          </View>

          <View style={[styles.statCard, { marginLeft: 8 }]}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.bigNum}>{daysActiveThisMonth}</Text>
            <Text style={styles.bigUnit}>
              active in {MONTH_NAMES[today.getMonth()]}
            </Text>
            <View style={styles.miniTrack}>
              <View style={[styles.miniFill, { width: `${Math.round(monthPct * 100)}%` as any }]} />
            </View>
            <Text style={styles.tabPct}>{Math.round(monthPct * 100)}% consistency</Text>
          </View>
        </View>

        {/* ── Calendar ── */}
        <View style={styles.calCard}>

          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <TouchableOpacity
              style={[styles.filterChip, filterHabitId === null && styles.filterChipActive]}
              onPress={() => setFilterHabitId(null)}
            >
              <Text style={[styles.filterChipText, filterHabitId === null && styles.filterChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {habits.map(h => (
              <TouchableOpacity
                key={h.id}
                style={[styles.filterChip, filterHabitId === h.id && styles.filterChipActive]}
                onPress={() => setFilterHabitId(prev => prev === h.id ? null : h.id)}
              >
                <Text style={styles.filterChipEmoji}>{h.emoji}</Text>
                <Text style={[styles.filterChipText, filterHabitId === h.id && styles.filterChipTextActive]}>
                  {h.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterDivider} />

          <View style={styles.monthNav}>
            <TouchableOpacity style={styles.navBtn} onPress={goPrev}>
              <Text style={styles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity style={styles.navBtn} onPress={goNext}>
              <Text style={styles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dowRow}>
            {DAY_LABELS.map((d, i) => (
              <Text key={i} style={styles.dowLabel}>{d}</Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (day === null) return <View key={di} style={styles.dayCell} />;
                const key     = toKey(viewYear, viewMonth, day);
                const isLogged = filterHabitId
                  ? !!(habitDays[filterHabitId]?.[key])
                  : !!completedDays[key];
                const isToday  = key === todayKey;
                const isFuture = new Date(viewYear, viewMonth, day) > today;
                return (
                  <View
                    key={di}
                    style={[
                      styles.dayCell,
                      isLogged && styles.dayCellLogged,
                      isToday && !isLogged && styles.dayCellToday,
                      isFuture && styles.dayCellFuture,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        isLogged && styles.dayNumLogged,
                        isToday && !isLogged && styles.dayNumToday,
                        isFuture && styles.dayNumFuture,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.track }]} />
              <Text style={styles.legendText}>Not logged</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.purple }]} />
              <Text style={styles.legendText}>
                {filterHabitId
                  ? habits.find(h => h.id === filterHabitId)?.name ?? 'Logged'
                  : 'Any habit logged'}
              </Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, styles.legendDotToday, { borderColor: theme.purple }]} />
              <Text style={styles.legendText}>Today</Text>
            </View>
          </View>
        </View>

        {/* ── Goggins quote ── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "No one is going to come and save you. No one is coming to push you. You have to do this yourself."
          </Text>
          <Text style={styles.quoteAuthor}>— David Goggins</Text>
        </View>

        {/* ── AI Coach ── */}
        <View style={styles.coachCard}>
          <View style={styles.coachHeader}>
            <Text style={styles.coachTitle}>🤖 AI Coach</Text>
            <Text style={styles.coachSubtitle}>David Goggins style analysis</Text>
          </View>

          {coachMsg ? (
            <View style={styles.coachMsgWrap}>
              <Text style={[styles.coachMsgText, coachLoading && { opacity: 0.4 }]}>{coachMsg}</Text>
              <TouchableOpacity
                style={[styles.regenBtn, coachLoading && styles.generateBtnDisabled]}
                onPress={generateCoach}
                activeOpacity={0.8}
                disabled={coachLoading}
              >
                {coachLoading ? (
                  <View style={styles.generateBtnInner}>
                    <ActivityIndicator color={theme.purple} size="small" style={{ marginRight: 6 }} />
                    <Text style={styles.regenBtnText}>Regenerating…</Text>
                  </View>
                ) : (
                  <Text style={styles.regenBtnText}>↻ Regenerate</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.generateBtn, coachLoading && styles.generateBtnDisabled]}
              onPress={generateCoach}
              activeOpacity={0.85}
              disabled={coachLoading}
            >
              {coachLoading ? (
                <View style={styles.generateBtnInner}>
                  <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                  <Text style={styles.generateBtnText}>Analyzing your data…</Text>
                </View>
              ) : (
                <Text style={styles.generateBtnText}>⚡ Generate Coach Summary</Text>
              )}
            </TouchableOpacity>
          )}

          {coachError ? <Text style={styles.coachErrorText}>{coachError}</Text> : null}
        </View>

        {/* ── Active disciplines ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active Disciplines</Text>
          {habits.map(h => {
            const pct = habitMonthConsistency(h.id, habitDays, today);
            return (
              <View key={h.id} style={styles.habitRow}>
                <View style={styles.habitRowTop}>
                  <View style={styles.habitEmojiWrap}>
                    <Text style={styles.habitEmoji}>{h.emoji}</Text>
                  </View>
                  <Text style={styles.habitName}>{h.name}</Text>
                  <Text style={styles.habitStreak}>🔥 {h.streak}</Text>
                </View>
                <View style={styles.habitConsistRow}>
                  <View style={styles.habitTrack}>
                    <View style={[styles.habitFill, { width: `${Math.round(pct * 100)}%` as any }]} />
                  </View>
                  <Text style={styles.habitPct}>{Math.round(pct * 100)}%</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    tabHeader:     { paddingTop: 18, marginBottom: 20 },
    tabHeaderRow:  { flexDirection: 'row', alignItems: 'center', gap: 14 },
    tabIconWrap: {
      width: 52, height: 52, borderRadius: 16,
      backgroundColor: t.purple + '25',
      alignItems: 'center', justifyContent: 'center',
    },
    tabIcon:       { fontSize: 26 },
    tabHeaderText: { flex: 1 },
    tabLogo:       { fontSize: 26, fontWeight: '800', color: t.textPrimary, letterSpacing: -0.5 },
    tabSubtitle:   { fontSize: 15, color: t.textSecondary, marginTop: 2 },

    // ── Stats row
    statsRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 20,
      paddingVertical: 22,
      paddingHorizontal: 16,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: t.isDark ? 4 : 2 },
      shadowOpacity: t.isDark ? 0.4 : 0.07,
      shadowRadius: t.isDark ? 16 : 10,
      elevation: 3,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: t.border,
    },
    statEmoji: { fontSize: 22, marginBottom: 8 },
    bigNum: {
      fontSize: 52, fontWeight: '800', color: t.purple,
      lineHeight: 56, letterSpacing: -2,
    },
    bigUnit: {
      fontSize: 13, fontWeight: '500', color: t.textSecondary,
      marginTop: 3, marginBottom: 10, textAlign: 'center',
    },
    tabMsg: {
      fontSize: 13, color: t.textSecondary, textAlign: 'center',
      lineHeight: 20, fontStyle: 'italic',
    },
    miniTrack: {
      height: 4, width: '100%', backgroundColor: t.track,
      borderRadius: 100, overflow: 'hidden', marginTop: 12,
    },
    miniFill: { height: '100%', backgroundColor: t.purple, borderRadius: 100 },
    tabPct: { fontSize: 13, color: t.textSecondary, fontWeight: '600', marginTop: 6 },

    // ── Calendar filter
    filterRow: { flexDirection: 'row', gap: 8, paddingVertical: 12, paddingHorizontal: 2 },
    filterChip: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      paddingVertical: 7, paddingHorizontal: 14,
      borderRadius: 100, backgroundColor: t.card2,
    },
    filterChipActive:     { backgroundColor: t.purple },
    filterChipEmoji:      { fontSize: 13 },
    filterChipText:       { fontSize: 13, fontWeight: '600', color: t.textSecondary },
    filterChipTextActive: { color: '#fff' },
    filterDivider:        { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginHorizontal: -14 },

    // ── Calendar
    calCard: {
      backgroundColor: t.card,
      borderRadius: 20,
      padding: 14,
      marginBottom: 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: t.isDark ? 4 : 2 },
      shadowOpacity: t.isDark ? 0.4 : 0.07,
      shadowRadius: t.isDark ? 16 : 10,
      elevation: 3,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: t.border,
    },
    monthNav: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 10,
    },
    navBtn: {
      width: 32, height: 32, borderRadius: 100,
      backgroundColor: t.card2,
      alignItems: 'center', justifyContent: 'center',
    },
    navBtnText:  { fontSize: 18, color: t.textPrimary, fontWeight: '500' },
    monthLabel:  { fontSize: 16, fontWeight: '600', color: t.textPrimary, letterSpacing: -0.2 },

    dowRow: { flexDirection: 'row', marginBottom: 4 },
    dowLabel: {
      flex: 1, textAlign: 'center',
      fontSize: 12, fontWeight: '600', color: t.textSecondary,
    },

    weekRow: { flexDirection: 'row', marginBottom: 3 },

    dayCell: {
      flex: 1, aspectRatio: 1.3, margin: 1,
      borderRadius: 8,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.track,
    },
    dayCellLogged: { backgroundColor: t.purple },
    dayCellToday:  { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: t.purple },
    dayCellFuture: { backgroundColor: 'transparent' },

    dayNum:       { fontSize: 11, fontWeight: '600', color: t.textSecondary },
    dayNumLogged: { color: '#fff', fontWeight: '700' },
    dayNumToday:  { color: t.purple, fontWeight: '700' },
    dayNumFuture: { color: t.border },

    legend: {
      flexDirection: 'row', justifyContent: 'center', gap: 14,
      marginTop: 10, paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border,
    },
    legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendDot:      { width: 8, height: 8, borderRadius: 3 },
    legendDotToday: { backgroundColor: 'transparent', borderWidth: 1.5 },
    legendText:     { fontSize: 12, color: t.textSecondary, fontWeight: '500' },

    // ── Quote
    quoteCard: {
      backgroundColor: t.card2, borderRadius: 20,
      padding: 20, marginBottom: 14,
    },
    quoteText: {
      fontSize: 15, fontStyle: 'italic', color: t.textPrimary,
      lineHeight: 24, marginBottom: 10,
    },
    quoteAuthor: { fontSize: 15, fontWeight: '600', color: t.purple },

    // ── AI Coach card
    coachCard: {
      backgroundColor: t.card,
      borderRadius: 20,
      padding: 20,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.purple + '55',
      shadowColor: t.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 16,
      elevation: 3,
    },
    coachHeader:   { marginBottom: 14 },
    coachTitle:    { fontSize: 17, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.2 },
    coachSubtitle: { fontSize: 15, color: t.textSecondary, marginTop: 2, fontStyle: 'italic' },

    generateBtn: {
      backgroundColor: t.purple,
      borderRadius: 14,
      paddingVertical: 15,
      alignItems: 'center',
    },
    generateBtnDisabled: { opacity: 0.6 },
    generateBtnInner:    { flexDirection: 'row', alignItems: 'center' },
    generateBtnText:     { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

    coachMsgWrap: {},
    coachMsgText: {
      fontSize: 16, color: t.textPrimary, lineHeight: 26,
      fontStyle: 'italic', marginBottom: 14,
    },
    regenBtn: {
      alignSelf: 'flex-end',
      paddingVertical: 7, paddingHorizontal: 16,
      borderRadius: 100, backgroundColor: t.card2,
    },
    regenBtnText: { fontSize: 14, fontWeight: '600', color: t.purple },

    coachErrorText: { fontSize: 14, color: '#EF4444', marginTop: 10, textAlign: 'center' },

    // ── Discipline list
    section:      { marginBottom: 20 },
    sectionLabel: {
      fontSize: 22, fontWeight: '700', color: t.textPrimary,
      letterSpacing: -0.4, marginBottom: 12,
    },
    habitRow: {
      backgroundColor: t.card, borderRadius: 16,
      paddingVertical: 13, paddingHorizontal: 16, marginBottom: 8,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: t.border,
    },
    habitRowTop:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    habitEmojiWrap: {
      width: 36, height: 36, borderRadius: 10,
      backgroundColor: t.card2,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    habitEmoji:   { fontSize: 18 },
    habitName:    { flex: 1, fontSize: 17, fontWeight: '600', color: t.textPrimary, letterSpacing: -0.2 },
    habitStreak:  { fontSize: 15, color: t.textSecondary, fontWeight: '600' },
    habitConsistRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    habitTrack: {
      flex: 1, height: 5, backgroundColor: t.track,
      borderRadius: 100, overflow: 'hidden',
    },
    habitFill:  { height: '100%', backgroundColor: t.purple, borderRadius: 100 },
    habitPct:   { fontSize: 13, fontWeight: '700', color: t.purple, width: 38, textAlign: 'right' },
  });
}
