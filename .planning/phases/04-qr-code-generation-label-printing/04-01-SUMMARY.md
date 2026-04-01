---
phase: 04-qr-code-generation-label-printing
plan: 01
subsystem: api
tags: [firestore, qr-code, trpc, shipment, pieces]

requires:
  - phase: 03-shipment-creation-management
    provides: "Shipment create mutation with piece subcollections"
provides:
  - "qrCode = Firestore doc ID per piece at creation time"
  - "listPieces query returning ordered pieces by pieceNumber"
affects: [04-02, 04-03, 05-scan-to-track]

tech-stack:
  added: []
  patterns: ["protectedProcedure for cross-role read access"]

key-files:
  created: []
  modified:
    - apps/api/src/routers/shipment.ts
    - apps/api/tests/shipment-router.test.ts

key-decisions:
  - "qrCode uses Firestore auto-generated doc ID (pieceRef.id) — stable, unique, available before tx.set()"
  - "listPieces uses protectedProcedure — drivers need piece data for scanning in Phase 5"

patterns-established:
  - "protectedProcedure for endpoints shared across all authenticated roles (staff + driver)"

requirements-completed: [QRPR-01]

duration: 1min
completed: 2026-04-01
---

# Phase 04 Plan 01: Fix qrCode Assignment and Add listPieces Query Summary

**qrCode set to Firestore doc ID at piece creation, new listPieces query returns ordered pieces for label preview**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-01T16:56:51Z
- **Completed:** 2026-04-01T16:57:36Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Fixed qrCode assignment from placeholder `pending:{shipmentId}:{i}` to actual Firestore doc ID (`pieceRef.id`)
- Added `listPieces` query endpoint using `protectedProcedure` — returns pieces ordered by `pieceNumber` ascending
- Full test coverage: qrCode assignment verification, listPieces ordered results, NOT_FOUND handling, driver access

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix qrCode assignment in create + add listPieces query** - `c686c4f` (feat)
2. **Task 2: Update tests for qrCode assignment and listPieces** - `b3b7398` (test)

## Files Created/Modified
- `apps/api/src/routers/shipment.ts` - Fixed qrCode to use pieceRef.id; added listPieces query with protectedProcedure
- `apps/api/tests/shipment-router.test.ts` - Added qrCode assertion in create test; new listPieces test suite (3 tests)

## Decisions Made
- qrCode uses Firestore auto-generated document ID (`pieceRef.id`) — available before `tx.set()` since Firestore generates client-side IDs
- listPieces uses `protectedProcedure` instead of `staffProcedure` — drivers need piece data for scanning workflows in Phase 5

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pieces now have real QR code values (Firestore doc IDs) at creation time
- listPieces endpoint ready for label preview UI in Plan 02
- QR code data format ready for label generation in Plan 03

## Self-Check: PASSED

- [x] `apps/api/src/routers/shipment.ts` exists
- [x] `apps/api/tests/shipment-router.test.ts` exists
- [x] `04-01-SUMMARY.md` exists
- [x] Commit `c686c4f` found in git log
- [x] Commit `b3b7398` found in git log

---
*Phase: 04-qr-code-generation-label-printing*
*Completed: 2026-04-01*
