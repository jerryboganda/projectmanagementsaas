# Linear Precision — Mobile (Capacitor + Vite)

Single shared codebase with the web app. The mobile target lives in `/mobile` and imports `@/components`, `@/contexts`, `@/hooks`, `@/lib`, `@/types` from the repo root — **no duplication, no UI drift**.

## Stack
- React 19 + TypeScript 5.9
- Vite 6 (bundler)
- Capacitor 6 (iOS 15+, Android 10+)
- Tailwind CSS v4 (tokens mirrored from root `app/globals.css`)
- React Router 6 (client-side routing)
- TanStack Query 5, Motion, Lucide, Recharts, @hello-pangea/dnd
- Dexie (IndexedDB) for offline cache + mutation queue
- `capacitor-native-biometric` for Face ID / Touch ID / Android biometric

## How shared UI stays 100% identical
- Vite `resolve.alias` points `@/components/*` → `../components/*` etc.
- Next.js imports are shimmed in `src/compat/`:
  - `next/link` → react-router-dom `Link`
  - `next/navigation` → `useRouter` / `usePathname` / `useSearchParams`
  - `next/image` → plain `<img>`
  - `next/font/*` → inert font loader

## First-time setup
```pwsh
cd mobile
npm install
npx cap add ios
npx cap add android
```

## Dev (desktop browser preview)
```pwsh
npm run dev
```
Open http://localhost:5174

## Build + sync to native projects
```pwsh
npm run sync
```

## Run on device / simulator
```pwsh
npm run ios         # opens Xcode
npm run android     # opens Android Studio
npm run ios:run     # cap run ios
npm run android:run # cap run android
```

## Folder map
```
mobile/
├── capacitor.config.ts
├── index.html
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx                    route table
    ├── main.tsx                   React root + QueryClient + Router
    ├── auth/
    │   ├── AuthGate.tsx           boot-time session check
    │   ├── biometric.ts           Face ID / Touch ID
    │   └── token-store.ts         access (memory) + refresh (Preferences)
    ├── compat/                    next/link, next/navigation, next/image shims
    ├── native/
    │   └── init-native.ts         StatusBar, SplashScreen, Keyboard, back button, network
    ├── offline/
    │   ├── db.ts                  Dexie schema (cache + queue)
    │   └── sync-engine.ts         FIFO replay on network reconnect
    ├── screens/                   one file per route (bottom-tab + more-tab)
    ├── shell/
    │   ├── MobileShell.tsx        top bar + outlet + bottom tabs
    │   ├── TopBar.tsx             contextual title + back + notifications
    │   └── BottomTabs.tsx         Home / Projects / Inbox / Search / More
    └── styles/globals.css         mirrors root globals + safe-area vars
```

## Bottom tabs
Home · Projects · Inbox · Search · **More**

"More" is a native-style list screen that routes to Board, Calendar, Timeline, Goals, Portfolio, Workload, Reports, Docs, Sprints, Time Tracking, Templates, Automations, Settings.

## Phase status
| Phase | What it does | Status |
|---|---|---|
| 1 | Scaffold (Vite + Capacitor + Tailwind + aliases + shims) | ✅ this scaffold |
| 2 | Mobile shell (tabs, top bar, safe-area, splash, status bar) | ✅ this scaffold |
| 3 | Wire every screen to its shared `@/components/*` | next |
| 4 | Native plugins (push, camera, biometric enrollment, deep links, haptics) | partial (biometric, haptics, status bar, keyboard, network done) |
| 5 | Backend integration (JWT refresh, SignalR, API hooks) | not started |
| 6 | CI/CD (GitHub Actions → TestFlight + Play Internal) | not started |
| 7 | Real-device QA (Appium/Maestro) | not started |

## Known constraints the user explicitly approved
- Target: iOS 15+ / Android 10+
- Full offline with sync queue (v1)
- Auth: email + password **plus** biometric unlock (Face ID / Touch ID / Android biometric)
- 100% UI/UX parity with web — enforced by single shared component tree

## What the scaffold does NOT yet do
- Each screen currently renders a placeholder. Phase 3 swaps each placeholder body for the actual shared `@/components/<feature>` tree. This is deliberate — mounting all feature components before the native shell is verified on device risks hiding real issues.
- Backend calls are stubbed. Phase 5 wires TanStack Query hooks to the existing ASP.NET Core API.
- No CI yet. Phase 6 adds it.
