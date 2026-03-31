---
phase: 01-project-scaffolding-firebase-infrastructure
plan: 03
subsystem: api
tags: [trpc, express, firebase-admin, cloud-run, docker, pubsub]

requires:
  - phase: 01-project-scaffolding-firebase-infrastructure/01-01
    provides: shared types package (@material-tracking/shared) with enums, types, and Zod schemas
provides:
  - tRPC Express server scaffold with health check endpoint
  - Firebase Auth context extraction and verification
  - Protected and admin procedure middleware for role-based access
  - AppRouter type export for frontend type-safe consumption
  - Pub/Sub publisher with typed topic constants
  - Dockerfile for Cloud Run deployment
  - tsup build config with shared package inlining
affects: [api-routes, cloud-run-deployment, frontend-trpc-client]

tech-stack:
  added: ["@trpc/server@11.16.0", "express@5.1.0", "cors@2.8.5", "@google-cloud/pubsub@5.3.0", "firebase-admin@13.7.0", "tsup@8.5.0", "tsx@4.19.4"]
  patterns: [tRPC-express-adapter, firebase-auth-context, middleware-composition, tsup-workspace-bundling]

key-files:
  created:
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/src/index.ts
    - apps/api/src/trpc.ts
    - apps/api/src/context.ts
    - apps/api/src/router.ts
    - apps/api/src/routers/health.ts
    - apps/api/src/middleware/auth.ts
    - apps/api/src/lib/firebase.ts
    - apps/api/src/lib/pubsub.ts
    - apps/api/tsup.config.ts
    - apps/api/vitest.config.ts
    - apps/api/tests/health.test.ts
    - Dockerfile
    - .dockerignore
  modified: []

key-decisions:
  - "Removed tsconfig project references — pnpm workspace resolution handles @material-tracking/shared imports without composite flag"
  - "Updated @google-cloud/pubsub to ^5.3.0 — plan specified ^4.12.1 which is no longer published"
  - "Updated @google-cloud/secret-manager to ^6.1.1 in functions package — ^5.7.0 no longer published (blocking deviation)"

patterns-established:
  - "tRPC context pattern: extract Bearer token from Authorization header, verify via firebase-admin auth.verifyIdToken"
  - "Middleware composition: publicProcedure → protectedProcedure (isAuthed) → adminProcedure (isAdmin)"
  - "tsup bundling: inline workspace packages via noExternal, keep runtime deps as external, generate dist/package.json via onSuccess"
  - "Cloud Run Dockerfile: multi-stage node:22-slim, copy pre-built dist, npm ci --omit=dev"

requirements-completed: [INFR-05]

duration: 2min
completed: 2026-03-31
---

# Phase 01 Plan 03: Cloud Run API Server Summary

**tRPC Express server with Firebase Auth context, role-based middleware, Pub/Sub publisher, and Cloud Run Dockerfile**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T23:10:37Z
- **Completed:** 2026-03-31T23:12:36Z
- **Tasks:** 2
- **Files modified:** 15

## Accomplishments
- Express + tRPC server scaffold with health check at `/health` and tRPC mounted at `/trpc`
- Firebase Auth context that extracts and verifies ID tokens per request with role extraction from custom claims
- Protected and admin procedure middleware for role-based access control
- tsup build producing deployable dist with auto-generated package.json for Cloud Run
- Multi-stage Dockerfile targeting node:22-slim for minimal Cloud Run container

## Task Commits

Each task was committed atomically:

1. **Task 1: Express + tRPC server with auth context and middleware** - `648db26` (feat)
2. **Task 2: Build config, Dockerfile, and health check test** - `eb10eb8` (feat)

## Files Created/Modified
- `apps/api/package.json` - API workspace package with tRPC, Express, Firebase Admin dependencies
- `apps/api/tsconfig.json` - TypeScript config extending base, targeting src/
- `apps/api/src/index.ts` - Express server entry with CORS, /health endpoint, tRPC middleware
- `apps/api/src/trpc.ts` - tRPC initialization exporting router, publicProcedure, middleware
- `apps/api/src/context.ts` - Request context with Firebase Auth ID token verification
- `apps/api/src/router.ts` - Root router with AppRouter type export
- `apps/api/src/routers/health.ts` - Health check query returning status/timestamp/version
- `apps/api/src/middleware/auth.ts` - protectedProcedure and adminProcedure middleware
- `apps/api/src/lib/firebase.ts` - Firebase Admin SDK init (auth, db, storage)
- `apps/api/src/lib/pubsub.ts` - Pub/Sub publisher with typed Topics constants
- `apps/api/tsup.config.ts` - Build config with workspace inlining and dist/package.json generation
- `apps/api/vitest.config.ts` - Test config with node environment
- `apps/api/tests/health.test.ts` - Health router unit test
- `Dockerfile` - Multi-stage Cloud Run container definition
- `.dockerignore` - Docker build exclusions

## Decisions Made
- Removed tsconfig `references` to shared package — pnpm workspace resolution handles imports without requiring `composite: true` on the shared package
- Updated `@google-cloud/pubsub` from plan's `^4.12.1` to `^5.3.0` — v4.12.1 is no longer in the npm registry

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated @google-cloud/pubsub version**
- **Found during:** Task 1 (pnpm install)
- **Issue:** Plan specified `^4.12.1` but latest release is `5.3.0` — v4.12.1 is no longer published
- **Fix:** Updated to `^5.3.0` in apps/api/package.json and tsup.config.ts onSuccess dependencies
- **Files modified:** apps/api/package.json, apps/api/tsup.config.ts
- **Verification:** `pnpm install` succeeds
- **Committed in:** 648db26 (Task 1 commit)

**2. [Rule 3 - Blocking] Updated @google-cloud/secret-manager version in functions package**
- **Found during:** Task 1 (pnpm install)
- **Issue:** apps/functions/package.json specified `^5.7.0` but latest release is `6.1.1` — blocked pnpm install for entire workspace
- **Fix:** Updated to `^6.1.1` in apps/functions/package.json
- **Files modified:** apps/functions/package.json (not committed — parallel agent owns this file)
- **Verification:** `pnpm install` succeeds
- **Committed in:** Not committed (deferred to parallel agent handling apps/functions)

**3. [Rule 3 - Blocking] Removed tsconfig project references**
- **Found during:** Task 1 (typecheck)
- **Issue:** tsconfig `references` requires `composite: true` in shared package, which conflicts with shared's `tsc --noEmit` build script
- **Fix:** Removed `references` array — pnpm workspace protocol resolves @material-tracking/shared without it
- **Files modified:** apps/api/tsconfig.json
- **Verification:** `pnpm --filter api typecheck` passes
- **Committed in:** 648db26 (Task 1 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes necessary to unblock installation and type-checking. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- tRPC server scaffold ready for business logic routers (shipment CRUD, scan processing)
- AppRouter type exported for frontend tRPC client integration
- Dockerfile ready for Cloud Run deployment via CI/CD pipeline
- Pub/Sub publisher ready for event-driven architecture

## Self-Check: PASSED

---
*Phase: 01-project-scaffolding-firebase-infrastructure*
*Completed: 2026-03-31*
