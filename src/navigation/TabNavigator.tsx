import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import ChallengesScreen from '../screens/ChallengesScreen';
import StatsScreen from '../screens/StatsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../context/ThemeContext';

const Tab = createBottomTabNavigator();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home:       { active: 'home',      inactive: 'home-outline' },
  Challenges: { active: 'trophy',    inactive: 'trophy-outline' },
  Stats:      { active: 'bar-chart', inactive: 'bar-chart-outline' },
  Settings:   { active: 'settings',  inactive: 'settings-outline' },
};

export default function TabNavigator() {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color }) => {
          const icon = ICONS[route.name];
          return (
            <View style={[styles.iconWrap, focused && { backgroundColor: theme.purple + '22' }]}>
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={22}
                color={color}
              />
            </View>
          );
        },
        tabBarActiveTintColor: theme.purple,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -2,
          letterSpacing: 0.1,
        },
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.border,
          height: 83,
          paddingBottom: 20,
          paddingTop: 10,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Challenges" component={ChallengesScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 28,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
