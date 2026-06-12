import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../context/ThemeContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.scroll}>
        <Text style={styles.pageTitle}>War Room</Text>

        {/* ── Appearance ── */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.row}>
          <Text style={styles.rowEmoji}>{theme.isDark ? '🌙' : '☀️'}</Text>
          <View style={styles.rowMeta}>
            <Text style={styles.rowTitle}>{theme.isDark ? 'Night Mode' : 'Day Mode'}</Text>
            <Text style={styles.rowSub}>
              {theme.isDark ? 'Dark. Like your will to quit.' : 'Light. Like your future.'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.toggle, theme.isDark && styles.toggleOn]}
            onPress={theme.toggle}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleKnob, theme.isDark && styles.toggleKnobOn]} />
          </TouchableOpacity>
        </View>

        {/* ── Coming soon ── */}
        <Text style={[styles.sectionLabel, { marginTop: 28 }]}>Coming Soon</Text>

        {[
          { emoji: '🔔', title: 'Daily Reminders',    sub: 'No one will wake you up. Set your own alarm.' },
          { emoji: '🎯', title: 'Daily Goal',          sub: 'How many habits per day defines you?' },
          { emoji: '📤', title: 'Export War Log',      sub: 'Proof you showed up. Share it.' },
        ].map(item => (
          <View key={item.title} style={[styles.row, styles.rowDisabled]}>
            <Text style={styles.rowEmoji}>{item.emoji}</Text>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowTitle, { color: theme.textSecondary }]}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.sub}</Text>
            </View>
          </View>
        ))}

        {/* ── Quote ── */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>
            "Discipline over motivation. Motivation is a lie. Discipline is everything."
          </Text>
          <Text style={styles.quoteAuthor}>— David Goggins</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: t.bg },
    scroll: { flex: 1, paddingHorizontal: 20, paddingBottom: 40 },

    pageTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: t.textPrimary,
      paddingTop: 16,
      marginBottom: 20,
    },

    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: t.textSecondary,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 10,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: t.isDark ? 0.3 : 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    rowDisabled: { opacity: 0.55 },
    rowEmoji:    { fontSize: 24, marginRight: 14 },
    rowMeta:     { flex: 1 },
    rowTitle:    { fontSize: 15, fontWeight: '700', color: t.textPrimary },
    rowSub:      { fontSize: 12, color: t.textSecondary, marginTop: 2 },

    toggle: {
      width: 50,
      height: 28,
      borderRadius: 14,
      backgroundColor: t.track,
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    toggleOn:      { backgroundColor: t.purple },
    toggleKnob:    {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    toggleKnobOn:  { alignSelf: 'flex-end' },

    quoteCard: {
      marginTop: 28,
      backgroundColor: t.card,
      borderRadius: 16,
      padding: 20,
      borderLeftWidth: 4,
      borderLeftColor: t.purple,
    },
    quoteText: {
      fontSize: 14,
      fontStyle: 'italic',
      color: t.textPrimary,
      lineHeight: 22,
      marginBottom: 8,
    },
    quoteAuthor: { fontSize: 13, fontWeight: '700', color: t.purple },
  });
}
