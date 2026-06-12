import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../context/HabitsContext';
import { useTheme, Theme } from '../context/ThemeContext';

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
  const [viewYear, setViewYear]     = useState(today.getFullYear());
  const [viewMonth, setViewMonth]   = useState(today.getMonth());

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  // Calendar grid
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

  // Tab data
  const streak = calcStreak(completedDays);

  const daysActiveThisMonth = Object.keys(completedDays).filter(k => {
    const d = new Date(k);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  }).length;
  const daysElapsed = today.getDate(); // days that have passed including today
  const monthPct = daysElapsed > 0 ? daysActiveThisMonth / daysElapsed : 0;

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Your War Log</Text>

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
              <View
                style={[
                  styles.miniFill,
                  { width: `${Math.round(monthPct * 100)}%` as any },
                ]}
              />
            </View>
            <Text style={styles.tabPct}>{Math.round(monthPct * 100)}% consistency</Text>
          </View>
        </View>

        {/* ── Calendar (smaller) ── */}
        <View style={styles.calCard}>
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
                const key      = toKey(viewYear, viewMonth, day);
                const isLogged  = !!completedDays[key];
                const isToday   = key === todayKey;
                const isFuture  = new Date(viewYear, viewMonth, day) > today;
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
              <Text style={styles.legendText}>No log</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: theme.purple }]} />
              <Text style={styles.legendText}>Habit logged</Text>
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

        {/* ── Active disciplines ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Active Disciplines</Text>
          {habits.map(h => {
            const pct = habitMonthConsistency(h.id, habitDays, today);
            return (
              <View key={h.id} style={styles.habitRow}>
                <View style={styles.habitRowTop}>
                  <Text style={styles.habitEmoji}>{h.emoji}</Text>
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

    pageTitle: {
      fontSize: 28, fontWeight: '800', color: t.textPrimary,
      paddingTop: 16, marginBottom: 16,
    },

    // ── Stats row
    statsRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      backgroundColor: t.card,
      borderRadius: 18,
      paddingVertical: 20,
      paddingHorizontal: 14,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statEmoji: { fontSize: 22, marginBottom: 6 },
    bigNum: { fontSize: 44, fontWeight: '900', color: t.purple, lineHeight: 48 },
    bigUnit: { fontSize: 12, fontWeight: '600', color: t.textSecondary, marginTop: 2, marginBottom: 8, textAlign: 'center' },
    tabMsg: {
      fontSize: 11, color: t.textSecondary, textAlign: 'center',
      lineHeight: 17, fontStyle: 'italic',
    },
    miniTrack: {
      height: 5, width: '100%', backgroundColor: t.track,
      borderRadius: 3, overflow: 'hidden', marginTop: 10,
    },
    miniFill: { height: '100%', backgroundColor: t.purple, borderRadius: 3 },
    tabPct: { fontSize: 11, color: t.textSecondary, fontWeight: '600', marginTop: 5 },

    // ── Calendar
    calCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 10,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    monthNav: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 8,
    },
    navBtn: {
      width: 26, height: 26, borderRadius: 7,
      backgroundColor: t.emojiBtnBg,
      alignItems: 'center', justifyContent: 'center',
    },
    navBtnText:  { fontSize: 15, color: t.textPrimary, fontWeight: '600' },
    monthLabel:  { fontSize: 13, fontWeight: '700', color: t.textPrimary },

    dowRow: { flexDirection: 'row', marginBottom: 3 },
    dowLabel: {
      flex: 1, textAlign: 'center',
      fontSize: 9, fontWeight: '700', color: t.textSecondary,
    },

    weekRow: { flexDirection: 'row', marginBottom: 2 },

    dayCell: {
      flex: 1, aspectRatio: 1.3, margin: 1,
      borderRadius: 5,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: t.track,
    },
    dayCellLogged: { backgroundColor: t.purple },
    dayCellToday:  { backgroundColor: 'transparent', borderWidth: 2, borderColor: t.purple },
    dayCellFuture: { backgroundColor: 'transparent' },

    dayNum:       { fontSize: 9, fontWeight: '600', color: t.textSecondary },
    dayNumLogged: { color: '#fff' },
    dayNumToday:  { color: t.purple },
    dayNumFuture: { color: t.border },

    legend: {
      flexDirection: 'row', justifyContent: 'center', gap: 12,
      marginTop: 8, paddingTop: 8,
      borderTopWidth: 1, borderTopColor: t.border,
    },
    legendItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot:     { width: 8, height: 8, borderRadius: 2 },
    legendDotToday:{ backgroundColor: 'transparent', borderWidth: 2 },
    legendText:    { fontSize: 9, color: t.textSecondary, fontWeight: '500' },

    // ── Quote
    quoteCard: {
      backgroundColor: t.card, borderRadius: 16,
      padding: 18, marginBottom: 16,
      borderLeftWidth: 4, borderLeftColor: t.purple,
    },
    quoteText: {
      fontSize: 13, fontStyle: 'italic', color: t.textPrimary,
      lineHeight: 21, marginBottom: 8,
    },
    quoteAuthor: { fontSize: 12, fontWeight: '700', color: t.purple },

    // ── Discipline list
    section:      { marginBottom: 20 },
    sectionLabel: {
      fontSize: 11, fontWeight: '700', color: t.textSecondary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8,
    },
    habitRow: {
      backgroundColor: t.card, borderRadius: 12,
      paddingVertical: 11, paddingHorizontal: 14, marginBottom: 8,
    },
    habitRowTop:  { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    habitEmoji:   { fontSize: 18, marginRight: 12 },
    habitName:    { flex: 1, fontSize: 14, fontWeight: '600', color: t.textPrimary },
    habitStreak:  { fontSize: 13, color: t.textSecondary, fontWeight: '600' },
    habitConsistRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    habitTrack: {
      flex: 1, height: 5, backgroundColor: t.track,
      borderRadius: 3, overflow: 'hidden',
    },
    habitFill:  { height: '100%', backgroundColor: t.purple, borderRadius: 3 },
    habitPct:   { fontSize: 11, fontWeight: '700', color: t.purple, width: 34, textAlign: 'right' },
  });
}
