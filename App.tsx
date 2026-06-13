import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TabNavigator from './src/navigation/TabNavigator';
import { HabitsProvider } from './src/context/HabitsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthScreen from './src/screens/AuthScreen';
import OnboardingOverlay from './src/components/OnboardingOverlay';

function AppGate() {
  const { session, loading } = useAuth();
  const { isDark, bg, purple } = useTheme();

  // Brief wait while AsyncStorage restores the session (~100ms)
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={purple} size="large" />
      </View>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <AuthScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <HabitsProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <TabNavigator />
        </NavigationContainer>
        <OnboardingOverlay />
      </SafeAreaProvider>
    </HabitsProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
