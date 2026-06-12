# Habito

A habit-tracking mobile app built with Expo and React Native. Habito helps you build unbreakable daily disciplines — track habits, view streaks, join challenges, and monitor your consistency over time.

## Screenshots

| Home | Stats | Challenges | Settings |
|------|-------|------------|----------|
| Daily habit list with progress bar | Streak, consistency cards & calendar heatmap | Enroll in predefined challenges | Dark/light mode toggle |

## Features

- **Daily Habit Tracking** — tap to complete, long-press to delete
- **Streak & Consistency Stats** — current streak, monthly active days, per-habit consistency bars, and a navigable calendar heatmap
- **Challenges** — commit to predefined multi-day challenges and mark daily progress
- **Dark / Light Mode** — toggle in Settings
- **First-Launch Onboarding** — 6-step walkthrough for new users

## Tech Stack

- [Expo](https://expo.dev/) SDK 54
- React Native 0.81
- TypeScript
- React Navigation (Bottom Tabs)
- React Native Safe Area Context

## Getting Started

```bash
# Install dependencies
npm install

# Start the dev server
npx expo start

# Run on a specific platform
npx expo start --ios
npx expo start --android
npx expo start --web
```

## Architecture

All state lives in two React contexts:

- **`HabitsContext`** — habit list, per-day completion counts (`completedDays`), and per-habit daily history (`habitDays`). State is in-memory and resets on app restart.
- **`ThemeContext`** — light/dark theme tokens, toggled via Settings.

The tab navigator (`src/navigation/TabNavigator.tsx`) renders four screens: Home, Challenges, Stats, and Settings. A first-launch `OnboardingOverlay` component sits above the navigator and persists its "done" state via `localStorage` on web.

## Project Structure

```
App.tsx                        # Provider shell + Root component
src/
  context/
    HabitsContext.tsx           # Habit state & per-habit history
    ThemeContext.tsx             # Theme tokens & dark mode toggle
  navigation/
    TabNavigator.tsx            # Bottom tab navigator
  screens/
    HomeScreen.tsx              # Habit list, FAB, add-habit modal
    StatsScreen.tsx             # Streak, consistency, calendar
    ChallengesScreen.tsx        # Challenge enrollment & progress
    SettingsScreen.tsx          # Dark mode & coming-soon items
  components/
    OnboardingOverlay.tsx       # First-launch walkthrough modal
```

## Type Check

```bash
npx tsc --noEmit
```

No test suite or lint script is configured.

## License

MIT
