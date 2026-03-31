---
phase: 01-project-scaffolding-firebase-infrastructure
plan: 04
subsystem: infra
tags: [cloud-functions, firebase, firestore-triggers, scheduled-functions, secret-manager, tsup]

requires:
  - phase: 01-project-scaffolding-firebase-infrastructure (plan 01)
    provides: "@material-tracking/shared package with types and enums"
provides:
  - Cloud Functions package with Firestore triggers (onPieceStatusChange, onShipmentCreated, onStorageFileUploaded)
  - Scheduled functions (checkAgedShipments hourly, cleanupStaleData daily) with v2 object syntax
  - Secret Manager access pattern via SecretManagerServiceClient
  - tsup build producing self-contained CJS dist with generated package.json
  - Status derivation logic (deriveShipmentStatus) with 5 test cases
affects: [phase-05-scan-processing, phase-06-notifications, phase-07-reports]

tech-stack:
  added: [firebase-functions@^7.2.2, firebase-admin@^13.7.0, "@google-cloud/secret-manager@^6.1.1", tsup@^8.5.0, vitest@^4.1.2]
  patterns: [v2-onSchedule-object-syntax, tsup-noExternal-workspace-bundling, firestore-trigger-document-paths]

key-files:
  created:
    - apps/functions/package.json
    - apps/functions/tsconfig.json
    - apps/functions/tsup.config.ts
    - apps/functions/vitest.config.ts
    - apps/functions/src/index.ts
    - apps/functions/src/lib/firebase.ts
    - apps/functions/src/triggers/onPieceUpdate.ts
    - apps/functions/src/triggers/onShipmentCreate.ts
    - apps/functions/src/triggers/onStorageUpload.ts
    - apps/functions/src/scheduled/agedReport.ts
    - apps/functions/src/scheduled/cleanupStale.ts
    - apps/functions/tests/triggers.test.ts
  modified: [pnpm-lock.yaml]

key-decisions:
  - "secret-manager bumped from ^5.7.0 to ^6.1.1 — v5.7.0 never published"
  - "Removed tsconfig references to shared package — shared lacks composite:true, tsup noExternal handles bundling"
  - "tsup onSuccess generates dist/package.json with ^6.1.1 for secret-manager to match actual installed version"

patterns-established:
  - "Cloud Functions v2 object syntax for onSchedule — avoids PERMISSION_DENIED bug with string syntax"
  - "tsup CJS bundling with noExternal for workspace packages — resolves workspace: protocol for Firebase deploy"
  - "Firebase Admin SDK singleton init pattern with getApps() guard"
  - "Secret Manager runtime access via SecretManagerServiceClient with project ID from env"

requirements-completed: [INFR-06, INFR-07, INFR-08]

duration: 2min
completed: 2026-03-31
---

# Phase 01 Plan 04: Cloud Functions Scaffolding Summary

**Firestore triggers (piece status derivation, shipment creation, storage upload), scheduled functions (aged report hourly, cleanup daily) with v2 object syntax, Secret Manager access, and tsup CJS bundling for deployment**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-31T23:10:37Z
- **Completed:** 2026-03-31T23:12:15Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- Cloud Functions package with 3 Firestore/Storage triggers wired to correct document paths
- 2 scheduled functions using v2 object syntax (avoids PERMISSION_DENIED bug) with America/Chicago timezone
- Secret Manager access pattern established for runtime secret retrieval
- tsup bundles workspace packages into self-contained CJS dist with generated deployment package.json
- 5 passing tests covering all status derivation lifecycle states (created, in_transit, partially_delivered, delivered, picked_up)

## Task Commits

Each task was committed atomically:

1. **Task 1: Cloud Functions package with trigger and scheduled stubs** - `8ccb34e` (feat)
2. **Task 2: tsup build config and basic test** - `f1c2cf4` (chore)

## Files Created/Modified
- `apps/functions/package.json` - Cloud Functions workspace package with firebase-admin, firebase-functions, secret-manager deps
- `apps/functions/tsconfig.json` - TypeScript config extending base
- `apps/functions/tsup.config.ts` - CJS bundler config with noExternal for workspace packages, generates dist/package.json
- `apps/functions/vitest.config.ts` - Test runner config
- `apps/functions/src/index.ts` - Barrel export of all 5 Cloud Functions
- `apps/functions/src/lib/firebase.ts` - Admin SDK init + SecretManagerServiceClient + getSecret helper
- `apps/functions/src/triggers/onPieceUpdate.ts` - Firestore trigger on piece updates, derives parent shipment status
- `apps/functions/src/triggers/onShipmentCreate.ts` - Firestore trigger on shipment creation (logging stub)
- `apps/functions/src/triggers/onStorageUpload.ts` - Storage trigger on file upload (image filtering stub)
- `apps/functions/src/scheduled/agedReport.ts` - Hourly scheduled function to find 24h+ aged pieces
- `apps/functions/src/scheduled/cleanupStale.ts` - Daily scheduled cleanup task
- `apps/functions/tests/triggers.test.ts` - 5 test cases for status derivation logic

## Decisions Made
- **secret-manager ^6.1.1:** Plan specified ^5.7.0 but that version was never published. Latest 5.x is 5.6.0, used ^6.1.1 (latest) instead.
- **Removed tsconfig project references:** The shared package doesn't have `composite: true`. Since tsup's `noExternal` handles workspace resolution at build time, project references are unnecessary.
- **dist/package.json version alignment:** Updated the generated dist/package.json to use ^6.1.1 for secret-manager to match the actual installed version.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] @google-cloud/secret-manager version fix**
- **Found during:** Task 1 (pnpm install)
- **Issue:** Plan specified `^5.7.0` but no version 5.7.0+ exists; latest 5.x is 5.6.0, latest is 6.1.1
- **Fix:** Used `^6.1.1` (latest) — API is compatible, major version bump is safe for new project
- **Files modified:** apps/functions/package.json
- **Verification:** pnpm install succeeds, typecheck passes
- **Committed in:** 8ccb34e (Task 1 commit)

**2. [Rule 3 - Blocking] Removed tsconfig project references**
- **Found during:** Task 1 (typecheck)
- **Issue:** `tsc --noEmit` failed with TS6306 because shared package lacks `composite: true`
- **Fix:** Removed `references` array from functions tsconfig — tsup noExternal handles workspace dep resolution
- **Files modified:** apps/functions/tsconfig.json
- **Verification:** typecheck passes, build succeeds with shared package inlined
- **Committed in:** 8ccb34e (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes required for build/typecheck to succeed. No scope creep. Functionality identical to plan intent.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Cloud Functions package ready for Firebase deployment configuration
- Trigger stubs wired to correct Firestore paths, ready for business logic in Phase 5
- Scheduled functions ready for notification/reporting logic in Phase 6-7
- tsup build produces deployable dist folder for CI/CD pipeline

## Self-Check: PASSED

- All 12 created files verified present on disk
- Commit 8ccb34e (Task 1) verified in git log
- Commit f1c2cf4 (Task 2) verified in git log

---
*Phase: 01-project-scaffolding-firebase-infrastructure*
*Completed: 2026-03-31*
