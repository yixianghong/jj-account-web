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
```

No test runner is configured.

## Architecture

This is a **real-time collaborative accounting/bookkeeping app** built with Nuxt 3 + Firebase, deployed to Firebase Hosting.

### Stack
- **Frontend**: Nuxt 3, Vue 3, TypeScript, Tailwind CSS v4, Nuxt UI (Emerald color scheme)
- **Backend**: Firebase (Firestore, Auth, Cloud Messaging, Cloud Functions)
- **PWA**: `@vite-pwa/nuxt` with service worker and push notification support

### Key Architectural Patterns

**Source layout**: All frontend code lives under `src/client/`. Firebase Cloud Functions are in `functions/`.

**Routing**: File-based Nuxt auto-routing under `src/client/pages/`. The `auth.ts` middleware protects all routes except the root login page.

**State management**: No Pinia/Vuex — state lives in composables (`src/client/composables/`). Key composables:
- `useAuth.ts` — Firebase Auth (email + Google OAuth)
- `useFirebase.ts` — Firestore CRUD primitives
- `useAccountBooks.ts` — Real-time account book list via `onSnapshot`
- `useTransactions.ts` — Transaction CRUD and real-time sync
- `useMonthlyTransactions.ts` / `useYearlyTransactions.ts` — Aggregated views
- `useFcm.ts` — FCM token management and push notification setup

**Firebase initialization**: Done once in `src/client/plugins/firebase.client.ts` (client-only plugin). Access Firebase services via composables, not directly.

### Firestore Data Model

```
accountBooks/{bookId}
  name, userId (owner), sharedUsers (emails[]), createdAt, updatedAt
  transactions/{transactionId}
    type: "income"|"expense", amount, category, description,
    date, recorder, paymentStatus: "pending"|"paid", createdAt, updatedAt

users/{userId}
  email, displayName, fcmTokens[], createdAt, updatedAt
```

### Cloud Functions

`functions/index.js` — single function `notifyOnNewTransaction`:
- Triggered on Firestore write to `accountBooks/{bookId}/transactions/{txId}`
- Sends FCM push notifications to account book owner + all shared users
- Region: `asia-east1`, Node.js 20 runtime

### Environment Variables

Stored in `.env` (not committed). Required variables: Firebase config (`NUXT_PUBLIC_FIREBASE_*`), `NUXT_PUBLIC_VAPID_KEY` for web push. The `nuxt.config.ts` maps these to `runtimeConfig.public`.

### TypeScript Path Aliases
- `~types` → `./types`
- `~server` → `./src/server`
