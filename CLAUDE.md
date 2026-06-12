# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

**Before writing any Expo-related code**, consult the versioned docs at https://docs.expo.dev/versions/v54.0.0/ — this project uses Expo SDK 54 (`"expo": "~54.0.35"`).

## Commands

```bash
# Start dev server
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web

# Type-check
npx tsc --noEmit
```

No test suite or lint script is configured.

## Architecture

Four-screen tab app. `App.tsx` is a thin shell that composes providers and the navigator — all meaningful logic lives elsewhere.

**Provider tree** (outermost → innermost):
```
ThemeProvider → HabitsProvider → SafeAreaProvider → NavigationContainer → TabNavigator
```
`OnboardingOverlay` is rendered as a sibling of `NavigationContainer` inside `SafeAreaProvider` so it can use `SafeAreaView` and appears above the tab UI.

**Contexts** (`src/context/`):
- `HabitsContext` — owns the `Habit[]` list, `completedDays` heatmap (`Record<string, number>`, keyed `'YYYY-MM-DD'`), and `habitDays` (`Record<habitId, Record<'YYYY-MM-DD', boolean>>`). Exposes `toggleHabit`, `addHabit`, `deleteHabit`. State is in-memory only — resets on app restart. Seeds fake historical data via `seedDays()` and `seedHabitDays()` so Stats screens aren't empty on first launch.
- `ThemeContext` — owns light/dark mode. Exposes the full `Theme` token object and a `toggle()` function. `isDark` defaults to `false`.

**Screens** (`src/screens/`):
- `HomeScreen` — habit list with progress bar, FAB → bottom-sheet Modal to add a habit, long-press to delete.
- `StatsScreen` — side-by-side streak + monthly consistency cards, navigable calendar heatmap, per-habit consistency bars (uses `habitDays` from context).
- `ChallengesScreen` — enroll in predefined challenges, mark daily progress, animated celebration overlay.
- `SettingsScreen` — dark/light mode toggle; "Coming Soon" placeholder rows.

**Component** (`src/components/`):
- `OnboardingOverlay` — 6-step first-launch walkthrough rendered as a transparent `Modal`. Persists completion in `localStorage` on web (session-only on native until `@react-native-async-storage/async-storage` is installed). To reset it in the browser, clear `habito_onboarding_done` from localStorage. Uses a local `Storage` shim instead of AsyncStorage.

**Styling pattern**: every screen defines a `makeStyles(t: Theme)` function at the bottom that returns a `StyleSheet.create({})`. Styles are never defined at module level — always call `makeStyles(theme)` inside the component. The primary brand color is `t.purple` (`#7C3AED` light / `#9061F9` dark).

**`Habit` type** (defined in `HabitsContext.tsx`):
- `id`: string (`Date.now().toString()` for new habits, numeric string literals for defaults)
- `name`, `emoji`: display fields
- `completed`: toggled by tap; drives progress bar and strikethrough
- `streak`: increments on complete, decrements on uncomplete (floor 0)

**Known limitation**: `npm install` fails due to root-owned files in `~/.npm/_cacache/tmp`. Fix with `sudo chown -R $(whoami) ~/.npm` before adding new packages.
