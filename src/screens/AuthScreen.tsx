import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme, Theme } from '../context/ThemeContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const theme = useTheme();
  const styles = makeStyles(theme);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);
    const err = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (isSignUp) {
      setInfo('Account created! Check your email to confirm, then sign in.');
      setIsSignUp(false);
    }
  };

  const switchMode = () => {
    setIsSignUp(s => !s);
    setError(null);
    setInfo(null);
  };

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🪖</Text>
            <Text style={styles.appName}>Habito</Text>
            <Text style={styles.tagline}>
              {isSignUp ? 'Start your war today.' : 'Welcome back, soldier.'}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={theme.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder={isSignUp ? 'Choose a strong password' : 'Your password'}
              placeholderTextColor={theme.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onSubmitEditing={handleSubmit}
              returnKeyType="go"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {info  ? <Text style={styles.infoText}>{info}</Text>  : null}

            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.switchBtn} onPress={switchMode} activeOpacity={0.7}>
            <Text style={styles.switchText}>
              {isSignUp
                ? 'Already have an account?  Sign in →'
                : "No account?  Create one — it's free →"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root:  { flex: 1, backgroundColor: t.bg },
    inner: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 28, paddingVertical: 40 },

    header: { alignItems: 'center', marginBottom: 48 },
    logo:    { fontSize: 72, marginBottom: 10 },
    appName: {
      fontSize: 42, fontWeight: '700', color: t.textPrimary,
      letterSpacing: -1.5,
    },
    tagline: { fontSize: 17, color: t.textSecondary, marginTop: 8, fontStyle: 'italic' },

    form:  { marginBottom: 20 },
    label: {
      fontSize: 13, fontWeight: '600', color: t.textSecondary,
      marginBottom: 8, marginTop: 20,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
      fontSize: 17,
      color: t.textPrimary,
      backgroundColor: t.card,
    },

    errorText: { color: '#FF453A', fontSize: 15, marginTop: 14, textAlign: 'center', lineHeight: 22 },
    infoText:  { color: '#30D158', fontSize: 15, marginTop: 14, textAlign: 'center', lineHeight: 22 },

    submitBtn: {
      backgroundColor: t.purple,
      paddingVertical: 17,
      borderRadius: 16,
      alignItems: 'center',
      marginTop: 28,
      shadowColor: t.purple,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.38,
      shadowRadius: 16,
      elevation: 5,
    },
    submitBtnDisabled: { opacity: 0.55 },
    submitText: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },

    switchBtn:  { alignItems: 'center', paddingVertical: 12 },
    switchText: { fontSize: 15, color: t.purple, fontWeight: '600' },
  });
}
