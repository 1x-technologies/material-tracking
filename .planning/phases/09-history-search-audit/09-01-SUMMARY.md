---
phase: 09-history-search-audit
plan: 01
subsystem: api
tags: [trpc, firestore, zod, pagination, cursor, search]

# Dependency graph
requires:
  - phase: 03-shipment-creation
    provides: shipment Firestore documents and Zod schemas
  - phase: 07-real-time-dashboard
    provides: existing shipments collection with status + createdAt fields
provides:
  - "shipment.search tRPC query with status filter, date range, and cursor pagination"
  - "shipmentSearchInputSchema Zod schema for search input validation"
  - "SearchCursor type for stable pagination across pages"
  - "Composite Firestore index for status + createdAt + __name__"
affects: [09-02-PLAN (history UI consumes shipment.search), 10-reports]

# Tech tracking
tech-stack:
  added: []
  patterns: ["cursor-based pagination with limit(51) detect-hasMore pattern", "FieldPath.documentId() for stable cursor ordering"]

key-files:
  created:
    - packages/shared/src/schemas/shipment-search.ts
  modified:
    - apps/api/src/routers/shipment.ts
    - apps/api/tests/shipment-router.test.ts
    - packages/shared/src/index.ts
    - firestore.indexes.json

key-decisions:
  - "Cursor carries createdAt ISO + docId for stable startAfter across pages"
  - "orderBy createdAt desc + documentId desc for deterministic pagination"
  - "No sender/receiver/keyword server filter per D-03 -- client-side only"
  - "HIST-02 satisfied by policy: no TTL/purge code exists in codebase"

patterns-established:
  - "limit(N+1) pagination: request one extra doc to detect hasMore, slice to N for response"
  - "SearchCursor opaque object: client passes nextCursor back unchanged for next page"

requirements-completed: [HIST-01, HIST-02]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 9 Plan 1: Shipment Search API Summary

**Cursor-paginated shipment.search tRPC query with optional status and date-range filters, 50-item pages, and HIST-02 indefinite retention verified**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T15:24:17Z
- **Completed:** 2026-04-02T15:27:52Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added `shipment.search` staffProcedure with Firestore-backed filtering: optional status enum, dateFrom/dateTo range, cursor-based pagination
- Shared Zod schema (`shipmentSearchInputSchema`) validates ISO datetime strings, status enum, and cursor shape
- 15 new tests covering pagination edge cases, filter combinations, cursor round-trip, auth enforcement, and query chain wiring
- Verified HIST-02: no TTL/expireAt/scheduled-delete exists for shipments; retention comment in schema file

## Task Commits

Each task was committed atomically:

1. **Task 1: shipment.search schema and procedure** - `75f59f2` (feat)
2. **Task 2: Tests and HIST-02 retention check** - `e6dd1a5` (test)

## Files Created/Modified
- `packages/shared/src/schemas/shipment-search.ts` - Zod input schema + SearchCursor type with HIST-02 retention comment
- `packages/shared/src/index.ts` - Re-exports shipment-search schema
- `apps/api/src/routers/shipment.ts` - New search procedure with Firestore query builder
- `apps/api/tests/shipment-router.test.ts` - 15 new search tests (pagination, filters, auth, cursors)
- `firestore.indexes.json` - Added composite index for status + createdAt + __name__

## Decisions Made
- Cursor carries `createdAt` (ISO string) + `id` (document ID) for stable `startAfter` positioning across pages with deterministic ordering
- Added `orderBy(FieldPath.documentId(), 'desc')` as secondary sort to prevent duplicate/skipped items at page boundaries when multiple docs share the same `createdAt`
- Composite index with `__name__` field added to `firestore.indexes.json` for queries that combine status filter with dual orderBy
- Sender/receiver/keyword filtering intentionally excluded from server query per D-03; handled client-side in Plan 09-02
- HIST-02 retention policy satisfied by absence of any purge/TTL logic; documented with code comment for auditors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added FieldPath and Timestamp to firebase-admin mock**
- **Found during:** Task 1 (running tests after adding search procedure)
- **Issue:** Existing `firebase-admin/firestore` mock only exported `FieldValue`; new search procedure uses `FieldPath.documentId()` and `Timestamp.fromDate()`
- **Fix:** Extended mock to include `FieldPath.documentId` and `Timestamp.fromDate` implementations
- **Files modified:** `apps/api/tests/shipment-router.test.ts`
- **Verification:** All 27 tests pass
- **Committed in:** 75f59f2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Mock extension was necessary to test the new Firestore query features. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all data paths are wired to Firestore queries; no placeholder data.

## Next Phase Readiness
- `shipment.search` is ready for consumption by the History page UI (Plan 09-02)
- The `SearchCursor` type is exported from shared for use in the web tRPC client
- Composite index in `firestore.indexes.json` should be deployed to Firestore before production use

## Self-Check: PASSED

All files verified present:
- packages/shared/src/schemas/shipment-search.ts
- packages/shared/src/index.ts
- apps/api/src/routers/shipment.ts
- apps/api/tests/shipment-router.test.ts
- firestore.indexes.json
All commits verified: 75f59f2, e6dd1a5

---
*Phase: 09-history-search-audit*
*Completed: 2026-04-02*
