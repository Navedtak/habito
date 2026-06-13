import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, Theme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const styles = makeStyles(theme);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.scroll}>
        <View style={styles.tabHeader}>
          <Text style={styles.tabLogo}>⚙️ Settings</Text>
          <Text style={styles.tabSubtitle}>Your rules. Your discipline.</Text>
        </View>

        {/* ── Appearance ── */}
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.group}>
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
        </View>

        {/* ── Coming soon ── */}
        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Coming Soon</Text>
        <View style={styles.group}>
          {[
            { emoji: '🔔', title: 'Daily Reminders',    sub: 'No one will wake you up. Set your own alarm.' },
            { emoji: '🎯', title: 'Daily Goal',          sub: 'How many habits per day defines you?' },
            { emoji: '📤', title: 'Export War Log',      sub: 'Proof you showed up. Share it.' },
          ].map((item, idx, arr) => (
            <View key={item.title}>
              <View style={[styles.row, styles.rowDisabled]}>
                <Text style={styles.rowEmoji}>{item.emoji}</Text>
                <View style={styles.rowMeta}>
                  <Text style={[styles.rowTitle, { color: theme.textSecondary }]}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.sub}</Text>
                </View>
              </View>
              {idx < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* ── Account ── */}
        <Text style={[styles.sectionLabel, { marginTop: 32 }]}>Account</Text>
        <View style={styles.group}>
          <View style={styles.row}>
            <Text style={styles.rowEmoji}>👤</Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowTitle}>Signed in as</Text>
              <Text style={styles.rowSub} numberOfLines={1}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={[styles.row, styles.signOutRow]} onPress={signOut} activeOpacity={0.75}>
            <Text style={styles.rowEmoji}>🚪</Text>
            <View style={styles.rowMeta}>
              <Text style={[styles.rowTitle, styles.signOutText]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>

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

    tabHeader:   { paddingTop: 18, marginBottom: 24 },
    tabLogo:     { fontSize: 26, fontWeight: '800', color: t.textPrimary, letterSpacing: -0.5 },
    tabSubtitle: { fontSize: 15, color: t.textSecondary, marginTop: 3 },

    sectionLabel: {
      fontSize: 13, fontWeight: '600', color: t.textSecondary,
      letterSpacing: 0.2, marginBottom: 8, marginLeft: 4,
    },

    group: {
      backgroundColor: t.card,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: t.isDark ? 4 : 2 },
      shadowOpacity: t.isDark ? 0.35 : 0.07,
      shadowRadius: t.isDark ? 16 : 10,
      elevation: 3,
      borderWidth: t.isDark ? StyleSheet.hairlineWidth : 0,
      borderColor: t.border,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.border,
      marginLeft: 60,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    rowDisabled: { opacity: 0.45 },
    rowEmoji:    { fontSize: 22, marginRight: 16, width: 26, textAlign: 'center' },
    rowMeta:     { flex: 1 },
    rowTitle:    { fontSize: 17, fontWeight: '600', color: t.textPrimary },
    rowSub:      { fontSize: 15, color: t.textSecondary, marginTop: 2, lineHeight: 22 },

    toggle: {
      width: 51,
      height: 31,
      borderRadius: 100,
      backgroundColor: t.track,
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    toggleOn:   { backgroundColor: t.purple },
    toggleKnob: {
      width: 25,
      height: 25,
      borderRadius: 100,
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    toggleKnobOn: { alignSelf: 'flex-end' },

    quoteCard: {
      marginTop: 32,
      backgroundColor: t.card2,
      borderRadius: 20,
      padding: 20,
    },
    quoteText: {
      fontSize: 15, fontStyle: 'italic', color: t.textPrimary,
      lineHeight: 24, marginBottom: 10,
    },
    quoteAuthor: { fontSize: 14, fontWeight: '600', color: t.purple },

    signOutRow:  {},
    signOutText: { color: '#FF453A' },
  });
}
