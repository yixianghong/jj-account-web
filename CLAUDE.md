# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server on http://localhost:3010

# Build & Deploy
npm run build        # Nuxt build
npm run generate     # Static site generation (used for Firebase Hosting)
npm run preview      # Preview production build
bash deploy.sh       # Build + deploy to Firebase Hosting & Functions

# Firebase Functions (from functions/ directory)
npm run deploy       # Deploy only Cloud Functions

# E2E Testing (Playwright + Firebase Emulator)
npm run emulator:start   # Start Firebase Auth (9099) + Firestore (8080) emulators
npm run test:e2e         # Run Playwright tests (also starts dev server on port 3011)
npm run test:e2e:ui      # Playwright interactive UI mode
```

E2E tests require Firebase emulators running first. `npm run test:e2e` auto-starts a dev server on port 3011 with `NUXT_PUBLIC_USE_EMULATOR=true` injected.

## Architecture

Real-time collaborative accounting app built with Nuxt 3 + Firebase, deployed to Firebase Hosting.

### Stack
- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS v4, Nuxt UI (Emerald color scheme)
- **Backend**: Firebase (Firestore, Auth, Cloud Messaging, Cloud Functions)
- **PWA**: `@vite-pwa/nuxt` with service worker and push notifications

### Source Layout

```
src/client/
  pages/          # File-based routing (index.vue = login, accounts.vue, account/[id].vue)
  composables/    # All state management (no Pinia/Vuex)
  components/     # Shared UI components
  layouts/        # blank (login page), default (with Navbar), empty
  plugins/        # firebase.client.ts — Firebase init (client-only)
  types/          # accounting.ts — all shared TypeScript types
  middleware/     # auth.ts — redirects unauthenticated users to /
functions/        # Firebase Cloud Functions (Node.js 20)
e2e/              # Playwright tests
  tests/          # spec files (auth/, accounts/, transactions/)
  fixtures/       # auth.fixture.ts — logged-in page fixture
  helpers/        # emulator.ts — clearFirestoreData()
  global-setup.ts # creates test user in emulator before all tests
```

### Firebase Initialization

`src/client/plugins/firebase.client.ts` initializes Firebase once and provides `$firebase` globally via `useNuxtApp().$firebase`. When `NUXT_PUBLIC_USE_EMULATOR=true`, it calls `connectAuthEmulator` / `connectFirestoreEmulator` before any auth operations. `getMessaging()` is wrapped in try/catch because the emulator doesn't support FCM.

Access Firebase services only via composables, never import from `firebase/app` directly in components.

### State Management: Composables

Each composable call creates **new local state** (non-singleton). Key behaviors:

- **`useAuth()`** — Registers a new `onAuthStateChanged` listener on every call. `loading` starts as `true`, becomes `false` after first auth state resolution. Called in multiple files; all instances listen to the same Firebase Auth but hold separate refs.

- **`useAccountBooks()`** — Sets up two `onSnapshot` listeners (owned books + shared books). Merges results sorted by `createdAt` desc. Must call `loadAccountBooks()` explicitly; `cleanup()` cancels listeners on `onUnmounted`.

- **`useTransactions(bookId)`** — Takes a `bookId` param. Uses `onSnapshot` limited to 50 most recent transactions (`orderBy('date', 'desc'), limit(50)`). Call `setupRealtimeListener()` to start. Caches book permission for 10 minutes.

- **`useMonthlyTransactions()`** — Uses one-time `getDocs` (not realtime), cached for 10 minutes per `accountId+month`. Provides `autoGeneratePreviousBalance()` and `monthlySummary` computed. Injected via Vue `provide`/`inject` from `account/[id].vue` to child components.

- **`useCache()`** — Creates a per-call in-memory `Map`. **Not a shared singleton** — each composable instance has its own separate cache. `removePattern()` in one composable will not affect cache in another instance.

- **`useErrorHandler()`** — `handleError()` always calls `alert()` + `toast.add()`. **All E2E tests must set up `page.on('dialog', dialog => dialog.accept())`** before any action that could error.

### Firestore Data Model

```
accountBooks/{bookId}
  name, userId (owner UID), sharedUsers (email[]), createdAt, updatedAt, lastUpdatedBy
  transactions/{transactionId}
    type: "income"|"expense", amount, category, description,
    date (YYYY-MM-DD), recorder (displayName), paymentStatus: "pending"|"paid",
    createdAt, updatedAt

users/{userId}
  email, displayName, fcmTokens[], createdAt, updatedAt
```

Types defined in `src/client/types/accounting.ts`. `Category` is a union type of fixed strings. `Recorder` is `string` (user displayName from Firestore, not Firebase Auth UID).

### Cloud Functions

`functions/index.js` — `notifyOnNewTransaction` triggered on any write to `accountBooks/{bookId}/transactions/{txId}`. Sends FCM to owner + all `sharedUsers`. Region: `asia-east1`.

### Environment Variables

`.env` (not committed). Nuxt maps `NUXT_PUBLIC_FIREBASE_*` → `runtimeConfig.public.firebase*`. `NUXT_PUBLIC_USE_EMULATOR=true` enables emulator connections. The `nuxt.config.ts` `build:before` hook generates `public/firebase-messaging-sw.js` with baked-in Firebase config.

### E2E Testing Patterns

- Tests use `e2e/fixtures/auth.fixture.ts` for the `authenticatedPage` fixture (UI login)
- After Firestore writes, `onSnapshot` fires optimistically before `addDoc` resolves — use `expect(input).toHaveValue('')` to confirm the handler completed before proceeding to next actions
- `global-setup.ts` clears emulator data and creates `test@example.com / TestPassword123!`
- `clearFirestoreData()` in `beforeEach` ensures test isolation
- Login error alerts rendered as `<UAlert data-testid="login-error">` in `index.vue`
