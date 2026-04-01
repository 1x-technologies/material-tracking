---
phase: 03-shipment-creation
plan: 02
subsystem: api
tags: [trpc, firestore, firebase-admin, vitest, shipment, locations, directory]

requires:
  - phase: 02-authentication-user-roles
    provides: "staffProcedure, protectedProcedure, AuthUser, createContext"
  - phase: 03-shipment-creation-01
    provides: "Shared schemas (createShipmentSchema, updateShipmentInputSchema, cancelShipmentInputSchema), enums (ShipmentCategory, ShipmentStatus, PieceStatus), types (Shipment, LocationRef)"
provides:
  - "shipment.create mutation with Firestore transaction counter and piece subcollection"
  - "shipment.getById, shipment.update, shipment.cancel endpoints"
  - "locations.list query for active locations"
  - "directory.search stub procedure with DIRECTORY_STUB env toggle"
  - "seed-locations script for HA/SC location documents"
  - "locationId on AuthUser and user.me response"
affects: [03-shipment-creation-03, 04-qr-label-printing, 05-scan-workflow, 10-admin-panel]

tech-stack:
  added: [tsx (root devDependency)]
  patterns: [Firestore transaction for counter-based IDs, staffProcedure for mutations, protectedProcedure for reads, vi.hoisted for mock state in Vitest]

key-files:
  created:
    - apps/api/src/routers/shipment.ts
    - apps/api/src/routers/locations.ts
    - apps/api/src/routers/directory.ts
    - apps/api/tests/shipment-router.test.ts
    - apps/api/tests/locations-router.test.ts
    - scripts/seed-locations.ts
  modified:
    - apps/api/src/context.ts
    - apps/api/src/routers/user.ts
    - apps/api/src/router.ts
    - apps/api/tests/middleware.test.ts
    - apps/api/tests/auth-context.test.ts
    - package.json

key-decisions:
  - "protectedProcedure for locations.list — any authenticated user can list locations for dropdowns"
  - "staffProcedure for all shipment mutations and directory search"
  - "PRECONDITION_FAILED error when Directory API not configured — clear operational signal"
  - "Shipment number format SH-YYYYMMDD-NNNN via Firestore transaction counter"
  - "pieceCount not allowed in update mutation — immutable after creation per Phase 3 spec"
  - "Pieces created in same transaction as shipment with pending QR codes"

patterns-established:
  - "Router file per domain entity under apps/api/src/routers/"
  - "Firestore transaction counter at counters/{collection} for sequential numbering"
  - "vi.hoisted() pattern for shared mock state in Vitest test files"
  - "Location resolution with active check before shipment write"

requirements-completed: [SHIP-01, SHIP-02, SHIP-04, SHIP-05, INFR-03]

duration: 3min
completed: 2026-04-01
---

# Phase 3 Plan 2: tRPC Routers Summary

**Shipment CRUD router with transactional counter, locations list, directory search stub, and Vitest test suite — all via Firebase Admin SDK**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-01T15:47:41Z
- **Completed:** 2026-04-01T15:50:37Z
- **Tasks:** 6
- **Files modified:** 12

## Accomplishments
- Full shipment lifecycle API (create with counter + pieces, getById, update with status guard, cancel with status guard)
- Locations list endpoint reading active Firestore documents with Timestamp serialization
- Directory search stub with deterministic mock data for dev/test environments
- 32 passing Vitest tests across 5 test files covering all new routers
- Seed script for bootstrapping HA and SC location documents

## Task Commits

Each task was committed atomically:

1. **Task 1: AuthUser + user.me expose locationId** - `5261cad` (feat)
2. **Task 2: locations.list router** - `827635d` (feat)
3. **Task 3: directory.search stub procedure** - `cf09ecc` (feat)
4. **Task 4: shipment router — create, get, update, cancel** - `d7ef2a5` (feat)
5. **Task 5: Vitest — shipment and locations routers** - `6f1579a` (test)
6. **Task 6: seed-locations script (HA, SC)** - `ded04f3` (chore)

## Files Created/Modified
- `apps/api/src/routers/shipment.ts` - Shipment CRUD router with transaction-based create
- `apps/api/src/routers/locations.ts` - Active locations list query
- `apps/api/src/routers/directory.ts` - Directory search with DIRECTORY_STUB toggle
- `apps/api/src/router.ts` - AppRouter composition with all new routers
- `apps/api/src/context.ts` - AuthUser extended with locationId
- `apps/api/src/routers/user.ts` - user.me returns locationId
- `apps/api/tests/shipment-router.test.ts` - Tests for shipment, cancel, getById, and directory
- `apps/api/tests/locations-router.test.ts` - Tests for locations list
- `apps/api/tests/middleware.test.ts` - Updated makeUser helper for locationId
- `apps/api/tests/auth-context.test.ts` - Updated expectations for locationId
- `scripts/seed-locations.ts` - Firebase Admin seed script for HA and SC
- `package.json` - Added seed:locations script and tsx devDependency

## Decisions Made
- Used `protectedProcedure` for locations.list so any authenticated user (including future drivers) can read locations for dropdowns
- Used `staffProcedure` for all shipment mutations and directory search per plan spec
- Shipment number format `SH-YYYYMMDD-NNNN` generated via Firestore transaction counter at `counters/shipments`
- `pieceCount` excluded from update mutation — immutable after creation to avoid piece row adjustment complexity in Phase 3
- Directory stub returns 3 deterministic users (Ada Lovelace, Grace Hopper, Alan Turing) for consistent testing
- `PRECONDITION_FAILED` error thrown when `DIRECTORY_STUB` not set — clear signal for operators

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed auth-context test expectations for locationId**
- **Found during:** Task 4 (shipment router)
- **Issue:** Adding locationId to AuthUser broke 2 existing auth-context tests that expected exact object match without locationId
- **Fix:** Added `locationId: ""` to test expectations (Zod default for missing field)
- **Files modified:** apps/api/tests/auth-context.test.ts
- **Verification:** All 20 existing tests pass
- **Committed in:** d7ef2a5 (Task 4 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Necessary fix for test compatibility after AuthUser change. No scope creep.

## Issues Encountered
- Vitest `vi.mock` factory hoisting prevented referencing variables defined after the mock call — resolved by using `vi.hoisted()` for shared mock state
- `db.doc` mock implementation from create test leaked into cancel test via persistent `mockImplementation` — resolved by re-setting mock return value in `beforeEach`

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — all endpoints are fully functional. The directory.search stub is intentional and documented (DIRECTORY_STUB=1 env toggle).

## Next Phase Readiness
- All shipment API endpoints ready for web form integration (Plan 03)
- Locations list endpoint ready for origin/destination dropdowns
- Directory search stub ready for sender/receiver autocomplete
- user.me returns locationId for origin pre-selection (D-11)

## Self-Check: PASSED

All 6 files verified present. All 6 commits verified in git log.

---
*Phase: 03-shipment-creation*
*Completed: 2026-04-01*
