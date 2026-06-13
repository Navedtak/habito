import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../context/HabitsContext';
import { useTheme, Theme } from '../context/ThemeContext';

const EMOJI_OPTIONS = [
  // Exercise
  '🏃', '🚶', '🏋️', '🚴', '🏊', '🧘', '🤸', '🥊', '⛹️',
  // Health
  '💧', '🥗', '🍎', '🥦', '💊', '🛌', '🫀',
  // Mind & learning
  '📚', '✍️', '📝', '💻', '🎓', '🧠',
  // Creative
  '🎸', '🎹', '🎨', '📸',
  // Wellness
  '🌿', '🙏', '☀️',
  // Productivity & finance
  '⏰', '📋', '🎯', '✅', '💰', '💬',
];
const DAY_ABBR   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DATE_RANGE = 14;

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

function stripDays(): Date[] {
  return Array.from({ length: DATE_RANGE }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (DATE_RANGE - 1 - i));
    return d;
  });
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === toDateStr(now))       return `Today, ${MONTH_ABBR[now.getMonth()]} ${now.getDate()}`;
  if (dateStr === toDateStr(yesterday)) return 'Yesterday';
  return `${DAY_ABBR[date.getDay()]}, ${MONTH_ABBR[date.getMonth()]} ${date.getDate()}`;
}

export default function HomeScreen() {
  const { habits, habitDays, toggleHabit, addHabit, deleteHabit } = useHabits();
  const theme = useTheme();
  const styles = makeStyles(theme);

  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(EMOJI_OPTIONS[0]);

  const handleAdd = () => {
    if (!newName.trim()) return;
    addHabit(newName.trim(), newEmoji);
    setNewName('');
    setNewEmoji(EMOJI_OPTIONS[0]);
    setShowModal(false);
  };

  const closeModal = () => {
    setNewName('');
    setNewEmoji(EMOJI_OPTIONS[0]);
    setShowModal(false);
  };

  const displayHabits = habits.map(h => ({
    ...h,
    completed: !!(habitDays[h.id]?.[selectedDate]),
  }));
  const completedCount = displayHabits.filter(h => h.completed).length;
  const progress = displayHabits.length ? completedCount / displayHabits.length : 0;
  const isToday = selectedDate === today;

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>🪖 Habito</Text>
          <Text style={styles.subtitle}>Let's start creating habits.</Text>
        </View>
        <Text style={styles.progressLabel}>{completedCount}/{displayHabits.length} done</Text>
      </View>

      {/* Date grid */}
      <View style={styles.dateGrid}>
        {stripDays().map(d => {
          const ds = toDateStr(d);
          const isSelected = ds === selectedDate;
          const isTodayCell = ds === today;
          return (
            <TouchableOpacity
              key={ds}
              style={[styles.dateCell, isSelected && styles.dateCellActive]}
              onPress={() => setSelectedDate(ds)}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateCellNum, isSelected && styles.dateCellTextActive]}>
                {d.getDate()}
              </Text>
              <Text style={[styles.dateCellDay, isSelected && styles.dateCellTextActive]}>
                {isTodayCell ? 'Today' : DAY_ABBR[d.getDay()]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Date banner — always visible */}
      <View style={styles.pastBanner}>
        <Text style={styles.pastBannerText}>📅 {formatDateLabel(selectedDate)}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>

      {/* Habit list */}
      <FlatList
        data={displayHabits}
        keyExtractor={h => h.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.completed && styles.cardDone]}
            onPress={() => toggleHabit(item.id, selectedDate)}
            onLongPress={() => deleteHabit(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.cardEmojiWrap}>
              <Text style={styles.cardEmoji}>{item.emoji}</Text>
            </View>
            <Text style={[styles.cardName, item.completed && styles.cardNameDone]}>
              {item.name}
            </Text>
            {item.completed ? (
              <View style={styles.checkBadge}><Text style={styles.checkMark}>✓</Text></View>
            ) : item.streak > 0 && isToday ? (
              <Text style={styles.streakAtRisk}>🔥 {item.streak}</Text>
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🪖</Text>
            <Text style={styles.emptyText}>No discipline on record.{'\n'}Stop being soft.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+ Add Habit</Text>
      </TouchableOpacity>

      {/* Add habit modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>New Discipline</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
            {EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, newEmoji === e && styles.emojiBtnActive]}
                onPress={() => setNewEmoji(e)}
              >
                <Text style={styles.emojiBtnText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput
            style={styles.input}
            placeholder="What are you going to conquer?"
            placeholderTextColor={theme.textSecondary}
            value={newName}
            onChangeText={setNewName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            autoFocus
          />
          <TouchableOpacity
            style={[styles.addBtn, !newName.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
          >
            <Text style={styles.addBtnText}>Lock It In</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },

    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12,
    },
    logo:          { fontSize: 26, fontWeight: '800', color: t.textPrimary, letterSpacing: -0.5 },
    subtitle:      { fontSize: 15, color: t.textSecondary, marginTop: 3 },
    progressLabel: { fontSize: 15, fontWeight: '600', color: t.textSecondary },

    // ── Date grid
    dateGrid: {
      flexDirection: 'row', flexWrap: 'wrap',
      paddingHorizontal: 10, paddingBottom: 10,
    },
    dateCell: {
      width: '14.285714%',
      alignItems: 'center', justifyContent: 'center',
      paddingVertical: 6, borderRadius: 10,
    },
    dateCellActive:     { backgroundColor: t.purple },
    dateCellNum:        { fontSize: 16, fontWeight: '700', color: t.textPrimary, letterSpacing: -0.3 },
    dateCellDay:        { fontSize: 11, fontWeight: '500', color: t.textSecondary, marginTop: 2 },
    dateCellTextActive: { color: '#fff' },

    // ── Past-date banner
    pastBanner: {
      marginHorizontal: 20, marginBottom: 10,
      backgroundColor: t.pillBg, borderRadius: 100,
      paddingVertical: 5, paddingHorizontal: 14, alignSelf: 'flex-start',
    },
    pastBannerText: { fontSize: 13, fontWeight: '600', color: t.pillText },

    progressTrack: {
      height: 4, backgroundColor: t.track,
      marginHorizontal: 20, borderRadius: 100, overflow: 'hidden', marginBottom: 18,
    },
    progressFill: { height: '100%', backgroundColor: t.purple, borderRadius: 100 },

    list: { paddingHorizontal: 20, paddingBottom: 100 },

    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.card, borderRadius: 20,
      paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: t.isDark ? 4 : 2 },
      shadowOpacity: t.isDark ? 0.4 : 0.07,
      shadowRadius: t.isDark ? 16 : 10,
      elevation: 3,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: t.border,
    },
    cardDone: { opacity: 0.45 },
    cardEmojiWrap: {
      width: 42, height: 42, borderRadius: 12,
      backgroundColor: t.card2,
      alignItems: 'center', justifyContent: 'center',
      marginRight: 14,
    },
    cardEmoji:    { fontSize: 22 },
    cardName:     { flex: 1, fontSize: 17, fontWeight: '600', color: t.textPrimary, letterSpacing: -0.2 },
    cardNameDone: { textDecorationLine: 'line-through', color: t.textSecondary },
    streakAtRisk: { fontSize: 14, fontWeight: '600', color: '#FF9F0A', opacity: 0.75 },
    checkBadge: {
      width: 28, height: 28, borderRadius: 100,
      backgroundColor: '#22C55E',
      alignItems: 'center', justifyContent: 'center',
    },
    checkMark: { color: '#fff', fontSize: 14, fontWeight: '800' },

    empty:      { alignItems: 'center', marginTop: 60, gap: 10 },
    emptyEmoji: { fontSize: 56 },
    emptyText:  { fontSize: 17, color: t.textSecondary, textAlign: 'center', lineHeight: 26 },

    fab: {
      position: 'absolute', bottom: 28, alignSelf: 'center',
      backgroundColor: t.purple, paddingVertical: 15, paddingHorizontal: 36,
      borderRadius: 100,
      shadowColor: t.purple,
      shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45,
      shadowRadius: 20, elevation: 8,
    },
    fabText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },

    overlay: { flex: 1, backgroundColor: t.overlay },
    sheet: {
      backgroundColor: t.card, borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 44,
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 100,
      backgroundColor: t.track, alignSelf: 'center', marginBottom: 20,
    },
    sheetTitle: {
      fontSize: 22, fontWeight: '700', color: t.textPrimary,
      letterSpacing: -0.4, marginBottom: 18,
    },

    emojiRow: { marginBottom: 18 },
    emojiBtn: {
      width: 46, height: 46, borderRadius: 14, alignItems: 'center',
      justifyContent: 'center', marginRight: 8, backgroundColor: t.card2,
    },
    emojiBtnActive: { backgroundColor: t.pillBg, borderWidth: 2, borderColor: t.purple },
    emojiBtnText:   { fontSize: 22 },

    input: {
      borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 16, fontSize: 17,
      color: t.textPrimary, backgroundColor: t.card2, marginBottom: 18,
    },
    addBtn:         { backgroundColor: t.purple, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    addBtnDisabled: { opacity: 0.35 },
    addBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  });
}
