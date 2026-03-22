# StepBattle

Head-to-head step count challenges with a friend. Built with Expo (React Native) + Supabase.

## Stack

- **Expo** (bare workflow) — React Native for iOS
- **Supabase** — auth, database, realtime
- **react-native-health** — HealthKit integration for step data

---

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the contents of `supabase/schema.sql`
3. Copy your project URL and anon key from Project Settings → API

### 2. Environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install dependencies

```bash
npm install
```

### 4. iOS setup (required — must be on a Mac)

```bash
npx pod-install
```

Open `ios/StepBattle.xcworkspace` in Xcode:
- Set your Team under Signing & Capabilities
- Add the **HealthKit** capability
- Update the bundle identifier to something unique (e.g. `com.yourname.stepbattle`)

### 5. Run

```bash
npx expo run:ios
```

---

## Codespaces / Remote editing

You can edit code in GitHub Codespaces, but **you cannot run or test the iOS app there** — the simulator requires macOS and Xcode. Workflow:

1. Edit in Codespaces
2. `git push`
3. `git pull` on your Mac
4. `npx expo run:ios` on your Mac

---

## Project structure

```
src/
  App.tsx               — root component
  navigation/           — React Navigation stack
  screens/
    LoginScreen.tsx     — sign in / sign up
    HomeScreen.tsx      — list of challenges
    ChallengeScreen.tsx — head-to-head view with live steps
    NewChallengeScreen  — create a challenge
  hooks/
    useAuth.ts          — session + user state
    useChallenge.ts     — challenge data + Realtime subscription
    useStepSync.ts      — HealthKit → Supabase sync loop
  lib/
    supabase.ts         — Supabase client
    health.ts           — HealthKit wrapper
    utils.ts            — invite codes, formatting helpers
  types/
    index.ts            — shared TypeScript types
supabase/
  schema.sql            — full DB schema, RLS policies, helper functions
```

---

## How it works

1. User signs up with email + username
2. Create a challenge → get a 6-char invite code
3. Share the code (or deep link `stepbattle://join/CODE`) with a friend
4. Friend joins → both users are now participants
5. App reads steps from HealthKit on open + every ~15 min in background
6. Steps are upserted to `daily_logs` in Supabase
7. Supabase Realtime pushes updates to the opponent's device instantly
8. At end of day, winner is whoever hit the step goal (or whoever has more steps)

---

## Next steps

- [ ] Push notifications (Expo Notifications + Supabase Edge Function cron)
- [ ] Background HealthKit observer for more reliable passive sync
- [ ] End-of-day winner declaration logic
- [ ] Profile screen + avatar
- [ ] Challenge history
