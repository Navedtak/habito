import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import TabNavigator from './src/navigation/TabNavigator';
import { HabitsProvider } from './src/context/HabitsContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import OnboardingOverlay from './src/components/OnboardingOverlay';

function Root() {
  const { isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <TabNavigator />
      </NavigationContainer>
      <OnboardingOverlay />
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <HabitsProvider>
        <Root />
      </HabitsProvider>
    </ThemeProvider>
  );
}
