import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../context/ThemeContext';

// Web: localStorage. Native: session-only until AsyncStorage is wired up.
const Storage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  },
};

const STORAGE_KEY = 'habito_onboarding_done';

const STEPS = [
  {
    emoji: '🪖',
    title: 'Welcome to Habito',
    body: "Build unbreakable habits. This is your daily mission log — track what you do, own what you don't.",
  },
  {
    emoji: '🏠',
    title: 'Your Daily Missions',
    body: 'Each habit is a mission. Tap a card to mark it complete. Long-press a card to delete it. The progress bar fills as you conquer each one.',
  },
  {
    emoji: '➕',
    title: 'Build Your Arsenal',
    body: 'Tap "+ Add Habit" at the bottom of the Home screen. Pick an emoji, name your discipline, and lock it in.',
  },
  {
    emoji: '🏆',
    title: 'Enter the Battleground',
    body: "The Challenges tab pushes you further. Pick a battle, commit to a number of days, and mark each day you show up.",
  },
  {
    emoji: '📊',
    title: 'Your War Log',
    body: 'Stats tracks your streak, monthly consistency, and each habit\'s completion rate. The calendar shows every day you showed up.',
  },
  {
    emoji: '⚙️',
    title: 'Command Center',
    body: "Toggle dark mode in Settings. Now stop reading — it's time to get to work. Stay hard.",
  },
];

export default function OnboardingOverlay() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Storage.getItem(STORAGE_KEY) !== 'true') {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    Storage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  const goToStep = (next: number) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    });
  };

  const handleNext = () => {
    if (step === STEPS.length - 1) {
      dismiss();
    } else {
      goToStep(step + 1);
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe}>
          <TouchableOpacity style={styles.skipBtn} onPress={dismiss} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
              <Text style={styles.emoji}>{current.emoji}</Text>
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.body}>{current.body}</Text>
            </Animated.View>

            <View style={styles.dots}>
              {STEPS.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => goToStep(i)} activeOpacity={0.7}>
                  <View style={[styles.dot, i === step && styles.dotActive]} />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.btnRow}>
              {step > 0 && (
                <TouchableOpacity style={styles.backBtn} onPress={() => goToStep(step - 1)} activeOpacity={0.8}>
                  <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.nextBtn, step === 0 && styles.nextBtnFull]}
                onPress={handleNext}
                activeOpacity={0.85}
              >
                <Text style={styles.nextText}>{isLast ? "Let's Go  🚀" : 'Next  →'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.stepCount}>{step + 1} of {STEPS.length}</Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.78)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    safe: {
      flex: 1,
      justifyContent: 'center',
    },
    skipBtn: {
      position: 'absolute',
      top: 8,
      right: 0,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    skipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.55)' },

    card: {
      backgroundColor: t.card,
      borderRadius: 28,
      paddingTop: 36,
      paddingBottom: 28,
      paddingHorizontal: 28,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.35,
      shadowRadius: 28,
      elevation: 10,
    },

    emoji: { fontSize: 68, marginBottom: 20 },
    title: {
      fontSize: 22,
      fontWeight: '900',
      color: t.textPrimary,
      textAlign: 'center',
      marginBottom: 12,
      letterSpacing: 0.2,
    },
    body: {
      fontSize: 15,
      color: t.textSecondary,
      textAlign: 'center',
      lineHeight: 23,
      marginBottom: 28,
    },

    dots: { flexDirection: 'row', gap: 6, marginBottom: 24 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.track },
    dotActive: { width: 22, backgroundColor: t.purple },

    btnRow: { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 14 },
    backBtn: {
      paddingVertical: 13,
      paddingHorizontal: 18,
      borderRadius: 14,
      backgroundColor: t.emojiBtnBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: { color: t.textSecondary, fontSize: 14, fontWeight: '700' },
    nextBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: t.purple,
      alignItems: 'center',
    },
    nextBtnFull: { flex: 1 },
    nextText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    stepCount: { fontSize: 11, color: t.textSecondary, fontWeight: '500' },
  });
}
