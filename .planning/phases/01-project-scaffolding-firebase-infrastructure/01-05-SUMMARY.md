---
phase: 01-project-scaffolding-firebase-infrastructure
plan: 05
subsystem: ui
tags: [react, vite, tailwindcss, firebase-auth, trpc-client, react-router]

requires:
  - phase: 01-01
    provides: "@material-tracking/shared package with enum types"
  - phase: 01-03
    provides: "AppRouter type from tRPC server for client type inference"

provides:
  - React 19 frontend app at apps/web with Vite 8 dev server
  - Environment-aware Firebase client SDK initialization (dev/staging/prod)
  - tRPC client with httpBatchLink and per-request Firebase Auth token injection
  - AuthContext with Google SSO (signInWithPopup, onAuthStateChanged)
  - Auth-gated routing (unauthenticated → sign-in, authenticated → layout shell)
  - Responsive layout shell (sidebar 256px/72px/hidden, topbar 64px)
  - Tailwind CSS v4 design tokens (brand colors, Inter font, container width)

affects: [phase-02, phase-03, phase-04, phase-05]

tech-stack:
  added: [react@19, react-dom@19, react-router@7, firebase@12, "@trpc/client@11", "@trpc/react-query@11", "@tanstack/react-query@5", tailwindcss@4, "@tailwindcss/vite@4", vite@8, "@vitejs/plugin-react@4", tailwind-merge@3]
  patterns: [css-first-tailwind-config, per-request-auth-token, env-aware-firebase-config, auth-gated-routing]

key-files:
  created:
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/vite.config.ts
    - apps/web/vitest.config.ts
    - apps/web/index.html
    - apps/web/src/main.tsx
    - apps/web/src/App.tsx
    - apps/web/src/firebase.ts
    - apps/web/src/trpc.tsx
    - apps/web/src/styles/globals.css
    - apps/web/src/context/AuthContext.tsx
    - apps/web/src/hooks/useAuth.ts
    - apps/web/src/components/layout/AppLayout.tsx
    - apps/web/src/components/layout/Sidebar.tsx
    - apps/web/src/components/layout/TopBar.tsx
    - apps/web/src/components/ui/Spinner.tsx
    - apps/web/src/pages/DashboardPage.tsx
    - apps/web/src/pages/SignInPage.tsx
    - apps/web/src/pages/NotFoundPage.tsx
  modified:
    - apps/api/src/index.ts

key-decisions:
  - "Renamed trpc.ts to trpc.tsx — file contains JSX (TRPCProvider component) requiring tsx extension"
  - "Removed tsconfig project references for web — matches existing pattern (api/functions have none), pnpm workspace resolution handles imports"
  - "Added DOM/DOM.Iterable lib to web tsconfig — base config only has ES2023, browser app needs DOM APIs"
  - "Disabled declaration/declarationMap in web tsconfig — consumer app not a library, avoids non-portable type inference errors with tRPC"
  - "Exported AuthContextValue interface — needed for useAuth hook return type inference"
  - "Added AppRouter type re-export from api index.ts — web tRPC client imports from package root"

patterns-established:
  - "CSS-first Tailwind v4: design tokens in @theme block within globals.css, no tailwind.config.js"
  - "Per-request Firebase Auth token: getIdToken() called in httpBatchLink headers(), never cached as string"
  - "Environment-aware Firebase config: VITE_FIREBASE_ENV selects dev/staging/prod project IDs at build time"
  - "Auth-gated routing: AuthGate component wraps all routes, redirects to SignInPage when unauthenticated"

requirements-completed: [INFR-01]

duration: 2min
completed: 2026-03-31
---

# Phase 01 Plan 05: React Frontend Scaffold Summary

**React 19 app with Vite 8, Tailwind CSS v4 design tokens, Firebase Auth SSO, tRPC client with per-request token injection, and responsive layout shell (sidebar + topbar)**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T23:13:42Z
- **Completed:** 2026-03-31T23:16:02Z
- **Tasks:** 2
- **Files modified:** 20

## Accomplishments

- Scaffolded complete React 19 + Vite 8 frontend workspace with TypeScript, Tailwind CSS v4, and all dependencies
- Configured environment-aware Firebase client SDK supporting three environments via VITE_FIREBASE_ENV
- Wired tRPC client with httpBatchLink and dynamic Firebase Auth token injection (per-request via getIdToken, avoiding Pitfall 3)
- Built responsive layout shell matching UI-SPEC: 64px topbar, 256px/72px/hidden sidebar, content with Outlet
- Implemented auth flow: AuthContext with Google SSO, AuthGate for route protection, sign-in/dashboard/404 pages

## Task Commits

Each task was committed atomically:

1. **Task 1: Vite + React app with Firebase client, tRPC client, routing, and auth context** - `334c9df` (feat)
2. **Task 2: Layout shell and placeholder pages per UI-SPEC** - `1d95c50` (feat)

## Files Created/Modified

- `apps/web/package.json` - Web workspace package with React 19, Firebase, tRPC, Tailwind dependencies
- `apps/web/tsconfig.json` - TypeScript config extending base with JSX, DOM lib, Vite types
- `apps/web/vite.config.ts` - Vite 8 config with React and Tailwind CSS plugins
- `apps/web/vitest.config.ts` - Vitest config with jsdom environment
- `apps/web/index.html` - Entry HTML with Inter font preconnect
- `apps/web/src/main.tsx` - React DOM root render with StrictMode
- `apps/web/src/App.tsx` - Route definitions with AuthGate, BrowserRouter, AppLayout
- `apps/web/src/firebase.ts` - Environment-aware Firebase SDK init (dev/staging/prod project IDs)
- `apps/web/src/trpc.tsx` - tRPC client with React Query integration and auth token headers
- `apps/web/src/styles/globals.css` - Tailwind CSS v4 with brand color tokens and Inter font
- `apps/web/src/context/AuthContext.tsx` - Firebase Auth state listener with Google SSO
- `apps/web/src/hooks/useAuth.ts` - Convenience hook wrapping AuthContext
- `apps/web/src/components/layout/AppLayout.tsx` - Persistent layout with sidebar + topbar + Outlet
- `apps/web/src/components/layout/Sidebar.tsx` - Responsive sidebar (256px lg, 72px md, hidden sm)
- `apps/web/src/components/layout/TopBar.tsx` - 64px topbar with app name and user display
- `apps/web/src/components/ui/Spinner.tsx` - Loading spinner with brand color
- `apps/web/src/pages/DashboardPage.tsx` - Authenticated empty state per UI-SPEC copy
- `apps/web/src/pages/SignInPage.tsx` - Sign-in page with Google SSO CTA
- `apps/web/src/pages/NotFoundPage.tsx` - 404 page with dashboard link
- `apps/api/src/index.ts` - Added AppRouter type re-export for web tRPC client

## Decisions Made

- **trpc.ts → trpc.tsx rename:** Plan specified `.ts` but file contains JSX (TRPCProvider component). TypeScript requires `.tsx` for JSX syntax.
- **Removed tsconfig project references:** Plan included `references: [{ "path": "../../packages/shared" }]` but shared package lacks `composite: true`. Matches existing pattern — api and functions tsconfigs have no references. pnpm workspace resolution handles cross-package imports.
- **Added DOM lib override:** Base tsconfig only has `"lib": ["ES2023"]`. Web app needs `DOM` and `DOM.Iterable` for browser APIs like `document.getElementById`.
- **Disabled declaration/declarationMap:** Web app is the final consumer (Vite builds it), not a library. Prevents "inferred type cannot be named" errors from tRPC's deep type inference chain.
- **Exported AuthContextValue:** Made the interface public so `useAuth` hook return type can be inferred without TS4058 error.
- **Added AppRouter re-export to api/index.ts:** The api package's `exports` field maps `"."` to `./src/index.ts`, so `import type { AppRouter } from '@material-tracking/api'` requires the type to be re-exported from index.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] trpc.ts contains JSX but uses .ts extension**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** `TRPCProvider` component returns JSX (`<trpc.Provider>`, `<QueryClientProvider>`), but TypeScript rejects JSX in `.ts` files
- **Fix:** Renamed `trpc.ts` to `trpc.tsx`
- **Files modified:** `apps/web/src/trpc.tsx`
- **Verification:** `pnpm --filter web typecheck` passes
- **Committed in:** 334c9df (Task 1 commit)

**2. [Rule 1 - Bug] tsconfig project references require composite:true in target**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** Plan included `references: [{ "path": "../../packages/shared" }]` but shared tsconfig lacks `composite: true` — error TS6306
- **Fix:** Removed `references` array from web tsconfig.json, matching existing api/functions pattern
- **Files modified:** `apps/web/tsconfig.json`
- **Verification:** `pnpm --filter web typecheck` passes
- **Committed in:** 334c9df (Task 1 commit)

**3. [Rule 3 - Blocking] Missing DOM lib for browser APIs**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** Base tsconfig has `"lib": ["ES2023"]` only — `document` and other DOM APIs undefined
- **Fix:** Added `"lib": ["ES2023", "DOM", "DOM.Iterable"]` to web tsconfig
- **Files modified:** `apps/web/tsconfig.json`
- **Verification:** `pnpm --filter web typecheck` passes
- **Committed in:** 334c9df (Task 1 commit)

**4. [Rule 3 - Blocking] Non-portable tRPC type inference in declaration mode**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** With `declaration: true` (inherited from base), TypeScript cannot name tRPC's deeply inferred types — error TS2883
- **Fix:** Set `"declaration": false, "declarationMap": false` in web tsconfig (consumer app, not a library)
- **Files modified:** `apps/web/tsconfig.json`
- **Verification:** `pnpm --filter web typecheck` passes
- **Committed in:** 334c9df (Task 1 commit)

**5. [Rule 3 - Blocking] AppRouter type not exported from api package root**
- **Found during:** Task 1 (pre-flight check of api package exports)
- **Issue:** `apps/api/src/index.ts` didn't re-export `AppRouter` — web's `import type { AppRouter } from '@material-tracking/api'` would fail
- **Fix:** Added `export type { AppRouter } from './router'` to api index.ts
- **Files modified:** `apps/api/src/index.ts`
- **Verification:** `pnpm --filter web typecheck` passes
- **Committed in:** 334c9df (Task 1 commit)

**6. [Rule 2 - Missing Critical] AuthContextValue interface not exported**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** `useAuth` hook's return type references `AuthContextValue` but it was a private interface — error TS4058
- **Fix:** Changed `interface AuthContextValue` to `export interface AuthContextValue`
- **Files modified:** `apps/web/src/context/AuthContext.tsx`
- **Verification:** `pnpm --filter web typecheck` passes
- **Committed in:** 334c9df (Task 1 commit)

---

**Total deviations:** 6 auto-fixed (2 bugs, 1 missing critical, 3 blocking)
**Impact on plan:** All auto-fixes necessary for TypeScript compilation. No scope creep — all changes are minimal and targeted.

## Known Stubs

None — all components render actual UI content per UI-SPEC. No placeholder data sources needed for Phase 1 skeleton app.

## Issues Encountered

- Peer dependency warning: `@vitejs/plugin-react@4.7.0` expects `vite@^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0` but Vite 8.0.3 is installed. Build succeeds regardless. Can be resolved by upgrading to `@vitejs/plugin-react@5.x` when available or switching to `@vitejs/plugin-react-oxc` as Vite suggests.
- Vite build chunk size warning (607KB) — expected due to Firebase SDK bundle. Code splitting will be addressed in future phases.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- React frontend skeleton is complete and ready for feature development
- Layout shell provides the persistent wrapper all future pages render within
- Auth context and tRPC client are wired — future phases can add authenticated API calls immediately
- Design tokens (brand colors, typography, spacing) are established in globals.css
- Plan 01-06 (CI/CD pipeline) is the remaining plan in Phase 01

## Self-Check: PASSED

- All 19 created files verified present
- Commit 334c9df verified in git log
- Commit 1d95c50 verified in git log

---
*Phase: 01-project-scaffolding-firebase-infrastructure*
*Completed: 2026-03-31*
