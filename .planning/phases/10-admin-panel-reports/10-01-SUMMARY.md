---
phase: 10-admin-panel-reports
plan: 01
subsystem: api
tags: [trpc, zod, firestore, admin, auth, reports, audit-log]

# Dependency graph
requires:
  - phase: 02-authentication
    provides: Firebase Auth, role-based middleware, user provisioning
  - phase: 03-shipment-creation
    provides: Shipment and location Firestore collections
  - phase: 05-scan-processing
    provides: Piece events with userId and action fields for report aggregation
provides:
  - Admin tRPC router with 12 procedures (user CRUD, location CRUD, settings, reports, audit log)
  - Shared Zod schemas for all admin input validation
  - GlobalSettings type for system configuration
  - Pending-user auth flow (auto-provision with null role)
  - admin_audit_log Firestore collection for mutation tracking
affects: [10-02-PLAN, 10-03-PLAN, web-admin-panel]

# Tech tracking
tech-stack:
  added: []
  patterns: [fire-and-forget audit logging, Promise.allSettled for bulk operations, nullable role for pending users]

key-files:
  created:
    - packages/shared/src/schemas/admin.ts
    - packages/shared/src/types/settings.ts
    - apps/api/src/routers/admin.ts
    - apps/api/tests/admin-router.test.ts
  modified:
    - packages/shared/src/schemas/user.ts
    - packages/shared/src/types/user.ts
    - packages/shared/src/index.ts
    - apps/api/src/context.ts
    - apps/api/src/middleware/auth.ts
    - apps/api/src/router.ts
    - apps/api/tests/auth-context.test.ts

key-decisions:
  - "Pending users auto-provisioned with role: null instead of staff -- requireRole middleware naturally rejects null"
  - "Audit log writes are fire-and-forget (catch errors, don't throw) to avoid blocking admin mutations"
  - "Promise.allSettled for bulkAssignRole -- partial failures reported without aborting entire batch"
  - "GlobalSettings defaults inline in getSettings -- no migration needed for fresh databases"
  - "Self-referencing query chain pattern for Firestore mock -- avoids clearAllMocks breaking method chains"

patterns-established:
  - "Fire-and-forget audit: writeAuditLog helper catches errors silently, called after every admin mutation"
  - "Nullable role pattern: UserRole | null on AuthUser, null-check guard in requireRole middleware"
  - "Report aggregation: in-memory grouping after Firestore range query with Timestamp comparison"

requirements-completed: [ADMN-01, ADMN-02, ADMN-03, ADMN-04]

# Metrics
duration: 7min
completed: 2026-04-02
---

# Phase 10 Plan 01: Admin API Foundation Summary

**Admin tRPC router with 12 endpoints covering user/location CRUD, system settings, report aggregation, and audit logging, plus pending-user auth flow**

## Performance

- **Duration:** 7 min
- **Started:** 2026-04-02T21:53:34Z
- **Completed:** 2026-04-02T22:01:30Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- Created shared Zod schemas for all admin input validation (update user, bulk assign role, create/update location, update settings, report date range)
- Built admin tRPC router with 12 procedures: listUsers, updateUser, bulkAssignRole, listAllLocations, createLocation, updateLocation, getSettings, updateSettings, reportDeliveryTime, reportVolume, reportDriverActivity, listAuditLog
- Changed user auto-provisioning from role:"staff" to role:null (pending user flow) with corresponding auth middleware guard
- Added comprehensive unit test suite (21 tests) covering all CRUD, report, and authorization paths

## Task Commits

Each task was committed atomically:

1. **Task 1: Create shared admin schemas, settings type, and update user schema for nullable role** - `3d9cdad` (feat)
2. **Task 2: Update auth flow for pending users and create admin API router with all endpoints** - `064d013` (feat)
3. **Task 3: Unit tests for admin router** - `1716622` (test)

## Files Created/Modified
- `packages/shared/src/schemas/admin.ts` - Zod schemas for all admin input validation
- `packages/shared/src/types/settings.ts` - GlobalSettings interface with threshold and notification pref fields
- `packages/shared/src/schemas/user.ts` - Modified: role field now nullable and optional for pending users
- `packages/shared/src/types/user.ts` - Modified: role is UserRole | null, added active field
- `packages/shared/src/index.ts` - Modified: exports admin schemas and settings type
- `apps/api/src/context.ts` - Modified: AuthUser.role is UserRole | null, auto-provision with role: null
- `apps/api/src/middleware/auth.ts` - Modified: added null-role guard in requireRole
- `apps/api/src/routers/admin.ts` - Complete admin router with 12 procedures
- `apps/api/src/router.ts` - Modified: registered adminRouter
- `apps/api/tests/admin-router.test.ts` - 21 unit tests for admin router
- `apps/api/tests/auth-context.test.ts` - Modified: updated test to expect pending user provisioning

## Decisions Made
- Pending users get role: null (not "staff") -- the requireRole middleware naturally rejects null since `allowed.includes(null)` is false
- Audit log writes use fire-and-forget pattern (catch and log errors, never throw) per Research Pitfall 6
- Promise.allSettled for bulkAssignRole returns partial success counts rather than all-or-nothing
- getSettings returns merged defaults when settings/global doc is missing -- no migration step needed
- Report aggregation done in-memory after Firestore date range query (acceptable for current scale)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated auth-context test for pending user flow**
- **Found during:** Task 3 (unit tests)
- **Issue:** Existing auth-context.test.ts expected role:"staff" for auto-provisioned users, which contradicts the new pending-user flow
- **Fix:** Updated test to expect role: null and test name to "lazily creates pending profile"
- **Files modified:** apps/api/tests/auth-context.test.ts
- **Verification:** All 77 tests pass with no regressions
- **Committed in:** 1716622 (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary correction to align existing test with intentional auth flow change. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all endpoints implement real Firestore queries and return structured data.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin API router is complete and ready for the web UI (Plan 02)
- All shared types and schemas exported for frontend consumption
- Pending user flow tested and working -- UI can detect null-role users

## Self-Check: PASSED

All 5 created/key files verified present. All 3 task commits verified in git log.

---
*Phase: 10-admin-panel-reports*
*Completed: 2026-04-02*
