import React, { useState, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  ScrollView,
  Animated,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../context/ThemeContext';

type Challenge = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  what: string;
  isCustom?: boolean;
};

type Enrollment = {
  enrollId: string;
  challenge: Challenge;
  durationDays: number;
  daysCompleted: number;
};

const DURATION_OPTIONS = [7, 14, 21, 30];

const CUSTOM_EMOJI_OPTIONS = [
  '🏃', '🚶', '🏋️', '🚴', '🏊', '🧘', '🤸', '🥊', '⛹️',
  '💧', '🥗', '🍎', '🥦', '💊', '🛌', '🫀',
  '📚', '✍️', '📝', '💻', '🎓', '🧠',
  '🎸', '🎹', '🎨', '📸',
  '🌿', '🙏', '☀️',
  '⏰', '📋', '🎯', '✅', '💰', '💬',
];

const CHALLENGES: Challenge[] = [
  {
    id: 'c1', emoji: '🪖', name: 'Carry the Boats',
    description: 'Do the hardest task on your list first — no excuses.',
    what: 'Every day, identify your most uncomfortable task and do it first thing. No avoiding it, no pushing it to tomorrow. Own the weight others refuse to carry.',
  },
  {
    id: 'c2', emoji: '⏰', name: '4AM Club',
    description: 'Wake up at 4AM every day and attack before the world wakes.',
    what: 'Set your alarm for 4AM. Use those first hours to train, plan, read, or build. While everyone else is sleeping, you are getting ahead.',
  },
  {
    id: 'c3', emoji: '🚿', name: 'Embrace the Suck',
    description: 'Start every morning with a cold shower — no warm-up.',
    what: 'The moment you wake up, step straight into a cold shower. No easing in. Train your nervous system to handle discomfort before the day even begins.',
  },
  {
    id: 'c4', emoji: '💪', name: '40% Rule',
    description: "When you want to quit, you're only 40% done. Keep going.",
    what: "Each day, push one effort — a workout, a work session, or a run — past the first point your brain says stop. That wall is only 40% of what you're capable of.",
  },
  {
    id: 'c5', emoji: '🏃', name: 'No Days Off',
    description: 'Run every single day for the full duration. Zero exceptions.',
    what: "Lace up and run every day. Distance doesn't matter — showing up does. Rain, tired, sore — none of it is an excuse. Consistency is the whole point.",
  },
  {
    id: 'c6', emoji: '🪞', name: 'Accountability Mirror',
    description: 'Look yourself in the eye each morning and own your truth.',
    what: "Each morning, stand in front of a mirror and say out loud what you need to do and what you've been avoiding. Write your goal on the mirror with a dry-erase marker. No sugarcoating.",
  },
];

export default function ChallengesScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [customChallenges, setCustomChallenges] = useState<Challenge[]>([]);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [selected, setSelected]     = useState<Challenge | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('habito_hidden_challenges').then(raw => {
      if (raw) setHiddenIds(new Set(JSON.parse(raw) as string[]));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('habito_hidden_challenges', JSON.stringify([...hiddenIds])).catch(() => {});
  }, [hiddenIds]);
  const [pickedDays, setPickedDays] = useState(DURATION_OPTIONS[1]);
  const [celebrating, setCelebrating]       = useState(false);
  const [celebrationName, setCelebrationName] = useState<string | null>(null);
  const [celebrationEmoji, setCelebrationEmoji] = useState('🎊');

  // Extend challenge state
  const [extendEnrollId, setExtendEnrollId] = useState<string | null>(null);
  const [extendDays, setExtendDays]         = useState(DURATION_OPTIONS[0]);

  // Create challenge state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [customName, setCustomName]   = useState('');
  const [customEmoji, setCustomEmoji] = useState(CUSTOM_EMOJI_OPTIONS[0]);
  const [customWhat, setCustomWhat]   = useState('');

  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Fires ONLY when the last day of a challenge is marked
  const celebrate = (name: string, emoji: string) => {
    setCelebrationName(name);
    setCelebrationEmoji(emoji);
    setCelebrating(true);
    scaleAnim.setValue(0.85);
    opacityAnim.setValue(0);

    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 9, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(opacityAnim, { toValue: 0, duration: 280, useNativeDriver: true })
        .start(() => { setCelebrating(false); setCelebrationName(null); });
    }, 2000);
  };

  const enrolledIds = new Set(enrollments.map(e => e.challenge.id));

  const enroll = () => {
    if (!selected) return;
    setEnrollments(prev => [
      ...prev,
      { enrollId: Date.now().toString(), challenge: selected, durationDays: pickedDays, daysCompleted: 0 },
    ]);
    setSelected(null);
    setPickedDays(DURATION_OPTIONS[1]);
  };

  const markDay = (enrollId: string) => {
    let completedName: string | null = null;
    let completedEmoji = '🎊';
    setEnrollments(prev =>
      prev.map(e => {
        if (e.enrollId === enrollId && e.daysCompleted < e.durationDays) {
          const next = e.daysCompleted + 1;
          if (next === e.durationDays) {
            completedName  = e.challenge.name;
            completedEmoji = e.challenge.emoji;
          }
          return { ...e, daysCompleted: next };
        }
        return e;
      })
    );
    if (completedName) celebrate(completedName, completedEmoji);
  };

  const withdraw = (enrollId: string) => {
    setEnrollments(prev => prev.filter(e => e.enrollId !== enrollId));
  };

  const extendChallenge = () => {
    if (!extendEnrollId) return;
    setEnrollments(prev => prev.map(e =>
      e.enrollId === extendEnrollId
        ? { ...e, durationDays: e.durationDays + extendDays }
        : e
    ));
    setExtendEnrollId(null);
    setExtendDays(DURATION_OPTIONS[0]);
  };

  const openChallenge = (c: Challenge) => {
    setPickedDays(DURATION_OPTIONS[1]);
    setSelected(c);
  };

  const deleteChallenge = (challenge: Challenge) => {
    if (challenge.isCustom) {
      setCustomChallenges(prev => prev.filter(c => c.id !== challenge.id));
    } else {
      setHiddenIds(prev => new Set(prev).add(challenge.id));
    }
    setEnrollments(prev => prev.filter(e => e.challenge.id !== challenge.id));
  };

  const createCustomChallenge = () => {
    if (!customName.trim()) return;
    const newChallenge: Challenge = {
      id: `custom_${Date.now()}`,
      emoji: customEmoji,
      name: customName.trim(),
      description: customWhat.trim() || 'Your personal challenge. No excuses.',
      what: customWhat.trim() || 'Your personal challenge. Show up every day and get it done.',
      isCustom: true,
    };
    setCustomChallenges(prev => [...prev, newChallenge]);
    setCustomName('');
    setCustomEmoji(CUSTOM_EMOJI_OPTIONS[0]);
    setCustomWhat('');
    setShowCreateModal(false);
  };

  const closeCreateModal = () => {
    setCustomName('');
    setCustomEmoji(CUSTOM_EMOJI_OPTIONS[0]);
    setCustomWhat('');
    setShowCreateModal(false);
  };

  const allChallenges = [...CHALLENGES, ...customChallenges].filter(c => !hiddenIds.has(c.id));

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.tabHeader}>
          <View style={styles.tabHeaderRow}>
            <View style={styles.tabIconWrap}>
              <Text style={styles.tabIcon}>⚔️</Text>
            </View>
            <View style={styles.tabHeaderText}>
              <Text style={styles.tabLogo}>Challenges</Text>
              <Text style={styles.tabSubtitle}>Enroll yourself in the below challenges</Text>
            </View>
          </View>
        </View>

        {/* ── Active enrollments ── */}
        {enrollments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>In Progress</Text>
            {enrollments.map(e => {
              const pct  = e.durationDays ? e.daysCompleted / e.durationDays : 0;
              const done = e.daysCompleted >= e.durationDays;
              return (
                <View key={e.enrollId} style={styles.activeCard}>
                  <View style={styles.activeCardHeader}>
                    <Text style={styles.activeEmoji}>{e.challenge.emoji}</Text>
                    <View style={styles.activeCardMeta}>
                      <Text style={styles.activeCardName}>{e.challenge.name}</Text>
                      {!done && (
                        <Text style={styles.activeCardDays}>
                          Day {e.daysCompleted} of {e.durationDays} — don't stop now
                        </Text>
                      )}
                    </View>
                    {!done && (
                      <TouchableOpacity style={styles.markBtn} onPress={() => markDay(e.enrollId)}>
                        <Text style={styles.markBtnText}>✓</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` as any }]} />
                  </View>

                  {done && (
                    <View style={styles.completedRow}>
                      <Text style={styles.completedText}>🏆 Challenge complete!</Text>
                      <TouchableOpacity
                        style={styles.extendBtn}
                        onPress={() => { setExtendEnrollId(e.enrollId); setExtendDays(DURATION_OPTIONS[0]); }}
                      >
                        <Text style={styles.extendBtnText}>Push further →</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => withdraw(e.enrollId)}>
                    <Text style={styles.withdrawText}>Quit (coward's way out)</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Available challenges ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Available Challenges</Text>
          {allChallenges.map(c => {
            const isEnrolled = enrolledIds.has(c.id);
            return (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.challengeCard,
                  isEnrolled && styles.challengeCardEnrolled,
                  pressed && !isEnrolled && { opacity: 0.75 },
                ]}
                onPress={() => { if (!isEnrolled) openChallenge(c); }}
                onLongPress={() => deleteChallenge(c)}
                delayLongPress={500}
              >
                <Text style={styles.challengeEmoji}>{c.emoji}</Text>
                <View style={styles.challengeMeta}>
                  <Text style={styles.challengeName}>{c.name}</Text>
                  <Text style={styles.challengeDesc} numberOfLines={2}>{c.description}</Text>
                </View>
                {isEnrolled ? (
                  <View style={styles.enrolledBadge}>
                    <Text style={styles.enrolledBadgeText}>Enrolled</Text>
                  </View>
                ) : (
                  <Text style={styles.joinArrow}>›</Text>
                )}
              </Pressable>
            );
          })}

          {/* Create custom challenge card */}
          <TouchableOpacity
            style={styles.createCard}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.75}
          >
            <Text style={styles.createCardPlus}>+</Text>
            <View style={styles.challengeMeta}>
              <Text style={styles.createCardTitle}>Create Your Own Challenge</Text>
              <Text style={styles.createCardSub}>Set your own goal, your own rules</Text>
            </View>
            <Text style={styles.joinArrow}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Premium celebration overlay (only on challenge completion) ── */}
      {celebrating && (
        <Animated.View style={[styles.celebrationOverlay, { opacity: opacityAnim }]}>
          <Animated.View style={[styles.celebrationCard, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.celebrationBigEmoji}>{celebrationEmoji}</Text>
            <Text style={styles.celebrationTitle}>Congratulations!</Text>
            <Text style={styles.celebrationSub}>
              You completed{'\n'}
              <Text style={styles.celebrationChallengeName}>{celebrationName}</Text>
            </Text>
          </Animated.View>
        </Animated.View>
      )}

      {/* ── Enrollment modal ── */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.overlay} onPress={() => setSelected(null)} />
        {selected && (
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetEmoji}>{selected.emoji}</Text>
            <Text style={styles.sheetName}>{selected.name}</Text>
            <Text style={styles.sheetDesc}>{selected.what}</Text>
            <Text style={styles.durationLabel}>Choose your commitment</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.durationChip, pickedDays === d && styles.durationChipActive]}
                  onPress={() => setPickedDays(d)}
                >
                  <Text style={[styles.durationChipText, pickedDays === d && styles.durationChipTextActive]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.enrollBtn} onPress={enroll}>
              <Text style={styles.enrollBtnText}>I'm in. {pickedDays} days. No excuses.</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* ── Extend challenge modal ── */}
      <Modal visible={!!extendEnrollId} transparent animationType="slide" onRequestClose={() => setExtendEnrollId(null)}>
        <Pressable style={styles.overlay} onPress={() => setExtendEnrollId(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetEmoji}>🔥</Text>
          <Text style={styles.sheetName}>Extend Your Challenge</Text>
          <Text style={styles.sheetDesc}>
            You've proved yourself. How many more days do you want to commit?
          </Text>
          <Text style={styles.durationLabel}>Additional days</Text>
          <View style={styles.durationRow}>
            {DURATION_OPTIONS.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.durationChip, extendDays === d && styles.durationChipActive]}
                onPress={() => setExtendDays(d)}
              >
                <Text style={[styles.durationChipText, extendDays === d && styles.durationChipTextActive]}>
                  +{d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.enrollBtn} onPress={extendChallenge}>
            <Text style={styles.enrollBtnText}>Extend by {extendDays} days</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* ── Create custom challenge modal ── */}
      <Modal visible={showCreateModal} transparent animationType="slide" onRequestClose={closeCreateModal}>
        <Pressable style={styles.overlay} onPress={closeCreateModal} />
        <View style={styles.createSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.createSheetTitle}>Create Your Challenge</Text>
          <Text style={styles.createSheetSub}>Define what you're committing to</Text>

          <Text style={styles.fieldLabel}>Pick an emoji</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
            {CUSTOM_EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, customEmoji === e && styles.emojiBtnActive]}
                onPress={() => setCustomEmoji(e)}
              >
                <Text style={styles.emojiBtnText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.fieldLabel}>Challenge name</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Morning Pages, No Sugar..."
            placeholderTextColor={theme.textSecondary}
            value={customName}
            onChangeText={setCustomName}
            returnKeyType="next"
          />

          <Text style={styles.fieldLabel}>What will you do each day?</Text>
          <TextInput
            style={[styles.textInput, styles.textInputMulti]}
            placeholder="Describe the daily action you're committing to..."
            placeholderTextColor={theme.textSecondary}
            value={customWhat}
            onChangeText={setCustomWhat}
            multiline
            numberOfLines={3}
            returnKeyType="done"
          />

          <TouchableOpacity
            style={[styles.enrollBtn, !customName.trim() && styles.enrollBtnDisabled]}
            onPress={createCustomChallenge}
            disabled={!customName.trim()}
          >
            <Text style={styles.enrollBtnText}>Add to My Challenges</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    tabHeader:     { paddingTop: 18, marginBottom: 24 },
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

    section:      { marginBottom: 24 },
    sectionLabel: {
      fontSize: 22, fontWeight: '700', color: t.textPrimary,
      letterSpacing: -0.4, marginBottom: 12,
    },

    activeCard: {
      backgroundColor: t.card, borderRadius: 20, padding: 18, marginBottom: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: t.isDark ? 4 : 2 },
      shadowOpacity: t.isDark ? 0.4 : 0.07, shadowRadius: t.isDark ? 16 : 10, elevation: 3,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0, borderColor: t.border,
    },
    activeCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    activeEmoji:      { fontSize: 28, marginRight: 14 },
    activeCardMeta:   { flex: 1 },
    activeCardName:   { fontSize: 17, fontWeight: '600', color: t.textPrimary, letterSpacing: -0.2 },
    activeCardDays:   { fontSize: 15, color: t.textSecondary, marginTop: 3 },
    markBtn: {
      width: 38, height: 38, borderRadius: 100,
      backgroundColor: t.purple, alignItems: 'center', justifyContent: 'center',
    },
    markBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
    progressTrack: {
      height: 6, backgroundColor: t.track,
      borderRadius: 100, overflow: 'hidden', marginBottom: 12,
    },
    progressFill:  { height: '100%', backgroundColor: t.purple, borderRadius: 100 },

    completedRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    completedText: { fontSize: 15, fontWeight: '600', color: t.textPrimary },
    extendBtn: {
      paddingVertical: 6, paddingHorizontal: 14,
      borderRadius: 100, backgroundColor: t.purple + '20',
    },
    extendBtnText: { fontSize: 14, fontWeight: '600', color: t.purple },

    withdrawText: { fontSize: 13, color: t.textSecondary, textAlign: 'right' },

    challengeCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.card, borderRadius: 20, padding: 16, marginBottom: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: t.isDark ? 4 : 2 },
      shadowOpacity: t.isDark ? 0.4 : 0.07, shadowRadius: t.isDark ? 16 : 10, elevation: 3,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0, borderColor: t.border,
    },
    challengeCardEnrolled: { opacity: 0.45 },
    challengeEmoji:        { fontSize: 26, marginRight: 14 },
    challengeMeta:         { flex: 1 },
    challengeName:         { fontSize: 17, fontWeight: '600', color: t.textPrimary, letterSpacing: -0.2 },
    challengeDesc:         { fontSize: 15, color: t.textSecondary, marginTop: 3, lineHeight: 21 },
    enrolledBadge: {
      backgroundColor: t.pillBg, paddingVertical: 5, paddingHorizontal: 12, borderRadius: 100,
    },
    enrolledBadgeText: { fontSize: 12, fontWeight: '600', color: t.pillText },
    joinArrow: { fontSize: 22, color: t.textSecondary, fontWeight: '300' },

    createCard: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 20, padding: 16, marginBottom: 10,
      borderWidth: 1.5, borderColor: t.purple + '70', borderStyle: 'dashed',
    },
    createCardPlus:  { fontSize: 28, marginRight: 14, color: t.purple, fontWeight: '200' },
    createCardTitle: { fontSize: 17, fontWeight: '600', color: t.purple, letterSpacing: -0.2 },
    createCardSub:   { fontSize: 15, color: t.textSecondary, marginTop: 2 },

    // ── Premium celebration overlay
    celebrationOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.70)',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 99,
    },
    celebrationCard: {
      backgroundColor: t.card,
      borderRadius: 28,
      paddingVertical: 40, paddingHorizontal: 36,
      alignItems: 'center',
      marginHorizontal: 28,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.5,
      shadowRadius: 40,
      elevation: 20,
    },
    celebrationBigEmoji:     { fontSize: 72, marginBottom: 20 },
    celebrationTitle:        {
      fontSize: 26, fontWeight: '800', color: t.textPrimary,
      letterSpacing: -0.5, marginBottom: 10,
    },
    celebrationSub:          {
      fontSize: 16, color: t.textSecondary, textAlign: 'center', lineHeight: 24,
    },
    celebrationChallengeName: { color: t.purple, fontWeight: '700' },

    // ── Modals
    overlay: { flex: 1, backgroundColor: t.overlay },
    sheet: {
      backgroundColor: t.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 48, alignItems: 'center',
    },
    sheetHandle: {
      width: 36, height: 4, borderRadius: 100,
      backgroundColor: t.track, alignSelf: 'center', marginBottom: 20,
    },
    sheetEmoji: { fontSize: 56, marginBottom: 10 },
    sheetName: {
      fontSize: 22, fontWeight: '700', color: t.textPrimary,
      marginBottom: 8, textAlign: 'center', letterSpacing: -0.4,
    },
    sheetDesc: {
      fontSize: 15, color: t.textSecondary,
      textAlign: 'center', lineHeight: 23, marginBottom: 28,
    },
    durationLabel: {
      fontSize: 13, fontWeight: '600', color: t.textSecondary, marginBottom: 12,
    },
    durationRow:          { flexDirection: 'row', gap: 10, marginBottom: 28 },
    durationChip: {
      width: 64, height: 46, borderRadius: 100,
      backgroundColor: t.card2, alignItems: 'center', justifyContent: 'center',
    },
    durationChipActive:     { backgroundColor: t.purple },
    durationChipText:       { fontSize: 15, fontWeight: '600', color: t.textSecondary },
    durationChipTextActive: { color: '#fff' },
    enrollBtn: {
      backgroundColor: t.purple, paddingVertical: 16, paddingHorizontal: 32,
      borderRadius: 16, width: '100%', alignItems: 'center',
    },
    enrollBtnDisabled: { opacity: 0.35 },
    enrollBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },

    // ── Create sheet
    createSheet: {
      backgroundColor: t.card,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 48,
    },
    createSheetTitle: {
      fontSize: 22, fontWeight: '700', color: t.textPrimary,
      marginBottom: 4, letterSpacing: -0.4,
    },
    createSheetSub: { fontSize: 14, color: t.textSecondary, marginBottom: 22 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: t.textSecondary, marginBottom: 8 },
    emojiRow: { marginBottom: 20 },
    emojiBtn: {
      width: 46, height: 46, borderRadius: 14, alignItems: 'center',
      justifyContent: 'center', marginRight: 8, backgroundColor: t.card2,
    },
    emojiBtnActive: { backgroundColor: t.pillBg, borderWidth: 2, borderColor: t.purple },
    emojiBtnText:   { fontSize: 22 },
    textInput: {
      borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 16, fontSize: 15,
      color: t.textPrimary, backgroundColor: t.card2, marginBottom: 18,
    },
    textInputMulti: { height: 88, textAlignVertical: 'top' },
  });
}
