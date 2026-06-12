import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../context/HabitsContext';
import { useTheme, Theme } from '../context/ThemeContext';

const EMOJI_OPTIONS = ['🏃', '📚', '💧', '🧘', '🍎', '💪', '🎯', '✍️', '🎸', '🌿', '😴', '🚴'];

export default function HomeScreen() {
  const { habits, toggleHabit, addHabit, deleteHabit } = useHabits();
  const theme = useTheme();
  const styles = makeStyles(theme);

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

  const completed = habits.filter(h => h.completed).length;
  const progress = habits.length ? completed / habits.length : 0;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.heading}>Stay Hard.</Text>
        <Text style={styles.progressLabel}>{completed}/{habits.length} missions done</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
      </View>

      <FlatList
        data={habits}
        keyExtractor={h => h.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, item.completed && styles.cardDone]}
            onPress={() => toggleHabit(item.id)}
            onLongPress={() => deleteHabit(item.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.cardEmoji}>{item.emoji}</Text>
            <Text style={[styles.cardName, item.completed && styles.cardNameDone]}>
              {item.name}
            </Text>
            <Text style={styles.streak}>🔥 {item.streak}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🪖</Text>
            <Text style={styles.emptyText}>No discipline on record.{'\n'}Stop being soft.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+ Add Habit</Text>
      </TouchableOpacity>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <Pressable style={styles.overlay} onPress={closeModal} />
        <View style={styles.sheet}>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 8,
    },
    heading: { fontSize: 28, fontWeight: '800', color: t.textPrimary },
    progressLabel: { fontSize: 14, fontWeight: '600', color: t.textSecondary },

    progressTrack: {
      height: 6,
      backgroundColor: t.track,
      marginHorizontal: 20,
      borderRadius: 3,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressFill: { height: '100%', backgroundColor: t.purple, borderRadius: 3 },

    list: { paddingHorizontal: 20, paddingBottom: 100 },

    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    cardDone: { opacity: 0.5 },
    cardEmoji: { fontSize: 26, marginRight: 14 },
    cardName: { flex: 1, fontSize: 16, fontWeight: '600', color: t.textPrimary },
    cardNameDone: { textDecorationLine: 'line-through', color: t.textSecondary },
    streak: { fontSize: 13, fontWeight: '600', color: t.textSecondary },

    empty: { alignItems: 'center', marginTop: 60, gap: 8 },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 15, color: t.textSecondary, textAlign: 'center', lineHeight: 22 },

    fab: {
      position: 'absolute',
      bottom: 24,
      alignSelf: 'center',
      backgroundColor: t.purple,
      paddingVertical: 14,
      paddingHorizontal: 32,
      borderRadius: 30,
      shadowColor: t.purple,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    overlay: { flex: 1, backgroundColor: t.overlay },

    sheet: {
      backgroundColor: t.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: 40,
    },
    sheetTitle: { fontSize: 20, fontWeight: '800', color: t.textPrimary, marginBottom: 16 },

    emojiRow: { marginBottom: 16 },
    emojiBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 8,
      backgroundColor: t.emojiBtnBg,
    },
    emojiBtnActive: { backgroundColor: t.pillBg, borderWidth: 2, borderColor: t.purple },
    emojiBtnText: { fontSize: 22 },

    input: {
      borderWidth: 1.5,
      borderColor: t.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      fontSize: 15,
      color: t.textPrimary,
      marginBottom: 16,
    },

    addBtn: {
      backgroundColor: t.purple,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    addBtnDisabled: { opacity: 0.4 },
    addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}
