# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important

**Before writing any Expo-related code**, consult the versioned docs at https://docs.expo.dev/versions/v54.0.0/ — this project uses Expo SDK 54 (`"expo": "~54.0.35"`).

**Installing packages**: always use `npm install --legacy-peer-deps` (plain `npm install` fails due to peer-dependency conflicts with Expo SDK 54).

## Commands

```bash
# Start dev server
npx expo start

# Run on specific platform
npx expo start --ios
npx expo start --android
npx expo start --web

# Type-check (run after every change)
npx tsc --noEmit
```

No test suite or lint script is configured.

## Architecture

Four-screen tab app backed by Supabase (auth + database). `App.tsx` is a thin shell that gates on auth state and composes providers.

**Full provider tree** (outermost → innermost):
```
AuthProvider → ThemeProvider → HabitsProvider → SafeAreaProvider → NavigationContainer → TabNavigator
```
`App.tsx` renders `AuthScreen` when `session` is null, otherwise renders the provider tree above. `OnboardingOverlay` is a sibling of `NavigationContainer` inside `SafeAreaProvider`.

**Auth** (`src/context/AuthContext.tsx`, `src/lib/supabase.ts`):
- Supabase project: `oqumowdcsjbsmhquxnpk.supabase.co`
- `AuthContext` exposes `session`, `user`, `loading`, `signIn`, `signUp`, `signOut`
- `HabitsProvider` must be inside `AuthProvider` — it reads `user.id` on mount

**Habits data flow** (`src/context/HabitsContext.tsx`):
- On mount: loads from `AsyncStorage` cache instantly, then fetches Supabase in the background and merges
- `Habit[]` persisted to Supabase table `habits`; completions to `habit_completions`
- `habitDays: Record<habitId, Record<'YYYY-MM-DD', boolean>>` is the source of truth for all streak and calendar calculations — never use the `streak` column from the DB, it's stale
- `calcHabitStreak(habitId, habitDays)`: counts backwards from today; if today isn't logged yet, starts from yesterday so the maintained streak is visible before the user logs
- Cache keys are user-scoped: `habito_habits_{userId}`, `habito_completions_{userId}`

**Theme** (`src/context/ThemeContext.tsx`):
- `isDark` defaults to `true` (dark is the out-of-box experience)
- Dark palette: bg `#000000`, card `#1C1C1E`, card2 `#2C2C2E`, purple `#BF5AF2`, textSecondary `#8E8E93`
- Light palette: bg `#F2F2F7`, card `#FFFFFF`, card2 `#F2F2F7`, purple `#AF52DE`
- All tokens: `bg`, `card`, `card2`, `textPrimary`, `textSecondary`, `border`, `track`, `purple`, `pillBg`, `pillText`, `emojiBtnBg`, `overlay`, `tabBar`, `isDark`, `toggle`

**Styling pattern**: every screen defines `makeStyles(t: Theme)` at the bottom, returning `StyleSheet.create({})`. Styles are **never** at module level — always call `makeStyles(theme)` inside the component body. Use `t.purple`, `t.card2`, `t.border`, etc. — never hardcode colors.

**Tab bar** (`src/navigation/TabNavigator.tsx`):
- `@expo/vector-icons` Ionicons: `home`/`home-outline`, `trophy`/`trophy-outline`, `bar-chart`/`bar-chart-outline`, `settings`/`settings-outline`
- Active tab: purple pill chip background `purple + '22'` opacity; `tabBar` token for background
- Height 83px to clear iPhone home indicator

**Screens**:
- `HomeScreen` — date-strip (14 days), progress bar, habit list. Long-press deletes. Streak shown as amber "at-risk" when today not yet logged.
- `StatsScreen` — streak + monthly stat cards; calendar heatmap with per-habit filter chips; AI Coach card (Supabase Edge Function `ai-coach`, Gemini 2.5 Flash); Active Disciplines list.
- `ChallengesScreen` — predefined + custom challenges; enroll, mark days, animated celebration on final day only; extend timeline after completion; long-press to delete any challenge. Deleted predefined challenges persisted in `AsyncStorage` under key `habito_hidden_challenges`.
- `SettingsScreen` — dark/light toggle; coming-soon placeholders; sign out.
- `AuthScreen` — email/password sign-in and sign-up; single toggle between modes.

**ChallengesScreen local state** (not in Supabase):
- `enrollments`, `customChallenges`, `hiddenIds` — all in-memory, reset on refresh except `hiddenIds` which is persisted via AsyncStorage.

**AI Coach** (`supabase/functions/ai-coach/index.ts`):
- Deno edge function, Gemini 2.5 Flash, `thinkingBudget: 0`
- TypeScript errors in this file are expected (Deno types) — ignore them in `tsc --noEmit` output
