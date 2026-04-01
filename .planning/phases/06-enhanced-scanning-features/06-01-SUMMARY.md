---
phase: 06-enhanced-scanning-features
plan: 01
subsystem: api
tags: [trpc, firestore, zod, batch-processing, scan]

requires:
  - phase: 05-scan-processing-status-tracking
    provides: "scan.process mutation, validateTransition, deriveShipmentStatus"
provides:
  - "processOneScan extracted function for reuse in batch and single scan"
  - "scan.processBatch mutation with partial success semantics"
  - "photoUrls array support (max 10) on scan schema"
  - "Piece-level deliverySignatureUrl and photoUrls field writes"
affects: [07-real-time-dashboard, 08-notifications-aged-report]

tech-stack:
  added: []
  patterns:
    - "Promise.allSettled for batch operations with per-item error handling"
    - "Extracted processOneScan for single-scan transaction reuse"
    - "FieldValue.arrayUnion for accumulating photoUrls"

key-files:
  created:
    - apps/api/src/lib/scan-process.ts
    - apps/api/tests/scan-router.test.ts
  modified:
    - packages/shared/src/schemas/scan.ts
    - packages/shared/src/schemas/piece.ts
    - packages/shared/src/types/scan.ts
    - packages/shared/src/types/piece.ts
    - apps/api/src/routers/scan.ts

key-decisions:
  - "Mock processOneScan in router tests — isolates batch logic from Firestore internals"
  - "photoUrls replaces photoUrl everywhere (schemas, types, events) — clean break, no backward compat needed"

patterns-established:
  - "Extracted transaction function pattern: processOneScan(db, user, input) for testable reuse"
  - "Batch result shape: { index, ok, data?, error? }[] with never-throw semantics"

requirements-completed: [SCAN-07, SCAN-09]

duration: 2min
completed: 2026-04-01
---

# Phase 06 Plan 01: Batch Scan API + Multi-Photo Support Summary

**Extended scan API with photoUrls array, extracted processOneScan, piece-level field writes, and processBatch mutation with partial success semantics**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T19:14:23Z
- **Completed:** 2026-04-01T19:16:12Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Replaced singular `photoUrl` with `photoUrls` array (max 10) across all schemas and types
- Extracted `processOneScan` function from inline scan.process mutation body for reuse
- Added piece-level `deliverySignatureUrl` write on delivered+signatureUrl and `photoUrls` arrayUnion on every scan with photos
- Added `scan.processBatch` mutation using Promise.allSettled for partial success
- Created comprehensive scan-router.test.ts with 6 test cases (188 lines)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend schemas + extract processOneScan + piece-level field writes** - `8315cef` (feat)
2. **Task 2: Add scan.processBatch mutation + scan router tests** - `efdfda2` (feat)

## Files Created/Modified
- `apps/api/src/lib/scan-process.ts` - Extracted processOneScan transaction function with piece-level field writes
- `apps/api/tests/scan-router.test.ts` - 6 test cases: status advance, signature write, photo write, unknown QR, batch mixed results, auth rejection
- `apps/api/src/routers/scan.ts` - Refactored to delegate to processOneScan, added processBatch mutation
- `packages/shared/src/schemas/scan.ts` - photoUrl → photoUrls array (max 10)
- `packages/shared/src/schemas/piece.ts` - pieceEventSchema photoUrl → photoUrls array
- `packages/shared/src/types/scan.ts` - ScanInput photoUrl → photoUrls
- `packages/shared/src/types/piece.ts` - PieceEvent photoUrl → photoUrls

## Decisions Made
- Mocked processOneScan in router tests to isolate batch logic from Firestore internals — avoids concurrency issues with shared transaction mocks
- Clean break from photoUrl to photoUrls everywhere — no backward compatibility needed since no production data exists yet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated pieceEventSchema in piece.ts schema**
- **Found during:** Task 1
- **Issue:** `packages/shared/src/schemas/piece.ts` had `photoUrl` field that would be inconsistent with updated PieceEvent type
- **Fix:** Changed `photoUrl: z.string().url().optional()` to `photoUrls: z.array(z.string().url()).max(10).optional()`
- **Files modified:** packages/shared/src/schemas/piece.ts
- **Verification:** TypeScript compilation passes
- **Committed in:** 8315cef (Task 1 commit)

**2. [Rule 1 - Bug] Removed unused ScanResult import**
- **Found during:** Task 2
- **Issue:** Unused `ScanResult` type import in scan.ts caused TS6133 error
- **Fix:** Removed the unused import
- **Files modified:** apps/api/src/routers/scan.ts
- **Verification:** TypeScript compilation passes clean
- **Committed in:** efdfda2 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- processOneScan is ready for use by future scan UI components
- processBatch endpoint available for batch scanning feature in Plan 02
- photoUrls and deliverySignatureUrl fields wired through to Firestore

---
*Phase: 06-enhanced-scanning-features*
*Completed: 2026-04-01*
