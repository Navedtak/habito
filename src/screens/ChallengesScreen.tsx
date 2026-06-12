import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../context/ThemeContext';

type Challenge = {
  id: string;
  emoji: string;
  name: string;
  description: string;
};

type Enrollment = {
  enrollId: string;
  challenge: Challenge;
  durationDays: number;
  daysCompleted: number;
};

const DURATION_OPTIONS = [7, 14, 21, 30];

const CHALLENGES: Challenge[] = [
  { id: 'c1', emoji: '🪖', name: 'Carry the Boats',       description: 'Someone has to do the hard thing. Every. Single. Day. Why not you?' },
  { id: 'c2', emoji: '⏰', name: '4AM Club',              description: 'While the world sleeps, you build. Wake up at 4AM and attack the day.' },
  { id: 'c3', emoji: '🚿', name: 'Embrace the Suck',      description: "Cold shower every morning. Get comfortable being uncomfortable." },
  { id: 'c4', emoji: '💪', name: '40% Rule',              description: "When your mind says quit, you're only 40% done. Push past the wall." },
  { id: 'c5', emoji: '🏃', name: 'No Days Off',           description: 'Suffering is a test. Show up, run your miles, no matter what.' },
  { id: 'c6', emoji: '🪞', name: 'Accountability Mirror', description: 'Look yourself in the eye every day. No lies. No excuses. Just truth.' },
];

export default function ChallengesScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [selected, setSelected]       = useState<Challenge | null>(null);
  const [pickedDays, setPickedDays]   = useState(DURATION_OPTIONS[1]);
  const [celebrating, setCelebrating] = useState(false);

  const scaleAnim   = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const celebrate = () => {
    setCelebrating(true);
    scaleAnim.setValue(0);
    opacityAnim.setValue(1);
    Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 5, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(opacityAnim, { toValue: 0, duration: 400, useNativeDriver: true })
        .start(() => setCelebrating(false));
    }, 2600);
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
    setEnrollments(prev =>
      prev.map(e =>
        e.enrollId === enrollId && e.daysCompleted < e.durationDays
          ? { ...e, daysCompleted: e.daysCompleted + 1 }
          : e
      )
    );
    celebrate();
  };

  const withdraw = (enrollId: string) => {
    setEnrollments(prev => prev.filter(e => e.enrollId !== enrollId));
  };

  const openChallenge = (c: Challenge) => {
    setPickedDays(DURATION_OPTIONS[1]);
    setSelected(c);
  };

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Battleground</Text>

        {/* ── Active enrollments ── */}
        {enrollments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>In the Arena</Text>
            {enrollments.map(e => {
              const pct  = e.durationDays ? e.daysCompleted / e.durationDays : 0;
              const done = e.daysCompleted >= e.durationDays;
              return (
                <View key={e.enrollId} style={styles.activeCard}>
                  <View style={styles.activeCardHeader}>
                    <Text style={styles.activeEmoji}>{e.challenge.emoji}</Text>
                    <View style={styles.activeCardMeta}>
                      <Text style={styles.activeCardName}>{e.challenge.name}</Text>
                      <Text style={styles.activeCardDays}>
                        {done
                          ? '🏆 Mission Complete'
                          : `Day ${e.daysCompleted} of ${e.durationDays} — don't stop now`}
                      </Text>
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
          <Text style={styles.sectionLabel}>Pick Your Battle</Text>
          {CHALLENGES.map(c => {
            const isEnrolled = enrolledIds.has(c.id);
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.challengeCard, isEnrolled && styles.challengeCardEnrolled]}
                onPress={() => !isEnrolled && openChallenge(c)}
                activeOpacity={isEnrolled ? 1 : 0.75}
              >
                <Text style={styles.challengeEmoji}>{c.emoji}</Text>
                <View style={styles.challengeMeta}>
                  <Text style={styles.challengeName}>{c.name}</Text>
                  <Text style={styles.challengeDesc} numberOfLines={1}>{c.description}</Text>
                </View>
                {isEnrolled ? (
                  <View style={styles.enrolledBadge}>
                    <Text style={styles.enrolledBadgeText}>Enlisted</Text>
                  </View>
                ) : (
                  <Text style={styles.joinArrow}>›</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* ── Celebration overlay ── */}
      {celebrating && (
        <Animated.View style={[styles.celebrationOverlay, { opacity: opacityAnim }]}>
          <Animated.Text style={[styles.celebrationEmoji, { transform: [{ scale: scaleAnim }] }]}>
            🎉
          </Animated.Text>
          <Animated.Text style={[styles.celebrationText, { transform: [{ scale: scaleAnim }] }]}>
            STAY HARD!
          </Animated.Text>
          <Text style={styles.celebrationSub}>When you think you're done, you're only at 40%.</Text>
        </Animated.View>
      )}

      {/* ── Duration picker modal ── */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.overlay} onPress={() => setSelected(null)} />
        {selected && (
          <View style={styles.sheet}>
            <Text style={styles.sheetEmoji}>{selected.emoji}</Text>
            <Text style={styles.sheetName}>{selected.name}</Text>
            <Text style={styles.sheetDesc}>{selected.description}</Text>

            <Text style={styles.durationLabel}>How many days can you suffer?</Text>
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
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 40 },

    pageTitle: { fontSize: 28, fontWeight: '800', color: t.textPrimary, paddingTop: 16, marginBottom: 20 },

    section:      { marginBottom: 24 },
    sectionLabel: {
      fontSize: 12, fontWeight: '700', color: t.textSecondary,
      letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
    },

    activeCard: {
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    activeCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    activeEmoji:      { fontSize: 28, marginRight: 12 },
    activeCardMeta:   { flex: 1 },
    activeCardName:   { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    activeCardDays:   { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    markBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: t.purple,
      alignItems: 'center', justifyContent: 'center',
    },
    markBtnText:   { color: '#fff', fontSize: 16, fontWeight: '700' },
    progressTrack: {
      height: 6, backgroundColor: t.track,
      borderRadius: 3, overflow: 'hidden', marginBottom: 10,
    },
    progressFill:  { height: '100%', backgroundColor: t.purple, borderRadius: 3 },
    withdrawText:  { fontSize: 12, color: t.textSecondary, textAlign: 'right' },

    challengeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: t.isDark ? 0.3 : 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    challengeCardEnrolled: { opacity: 0.55 },
    challengeEmoji:        { fontSize: 26, marginRight: 14 },
    challengeMeta:         { flex: 1 },
    challengeName:         { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    challengeDesc:         { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    enrolledBadge: {
      backgroundColor: t.pillBg,
      paddingVertical: 4, paddingHorizontal: 10,
      borderRadius: 12,
    },
    enrolledBadgeText: { fontSize: 12, fontWeight: '600', color: t.pillText },
    joinArrow: { fontSize: 22, color: t.border, fontWeight: '300' },

    overlay: { flex: 1, backgroundColor: t.overlay },
    sheet: {
      backgroundColor: t.card,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 24, paddingBottom: 44,
      alignItems: 'center',
    },
    sheetEmoji: { fontSize: 52, marginBottom: 8 },
    sheetName:  { fontSize: 20, fontWeight: '800', color: t.textPrimary, marginBottom: 6 },
    sheetDesc:  { fontSize: 14, color: t.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

    durationLabel: {
      fontSize: 12, fontWeight: '700', color: t.textSecondary,
      letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 12,
    },
    durationRow:          { flexDirection: 'row', gap: 10, marginBottom: 24 },
    durationChip: {
      width: 60, height: 48, borderRadius: 14,
      backgroundColor: t.emojiBtnBg,
      alignItems: 'center', justifyContent: 'center',
    },
    durationChipActive:     { backgroundColor: t.purple },
    durationChipText:       { fontSize: 15, fontWeight: '700', color: t.textSecondary },
    durationChipTextActive: { color: '#fff' },

    enrollBtn: {
      backgroundColor: t.purple,
      paddingVertical: 14, paddingHorizontal: 32,
      borderRadius: 14, width: '100%', alignItems: 'center',
    },
    enrollBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    celebrationOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(124,58,237,0.93)',
      alignItems: 'center', justifyContent: 'center',
      gap: 12, zIndex: 99,
    },
    celebrationEmoji: { fontSize: 80 },
    celebrationText:  { fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
    celebrationSub:   { fontSize: 15, color: 'rgba(255,255,255,0.75)', fontWeight: '500', textAlign: 'center', paddingHorizontal: 32 },
  });
}
