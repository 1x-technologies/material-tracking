---
phase: 05-scan-processing-status-workflow
plan: 01
subsystem: api
tags: [trpc, firestore, scan, status-lifecycle, collection-group, transaction]

requires:
  - phase: 04-qr-code-generation-label-printing
    provides: "Pieces with qrCode field (auto-generated doc ID) as subcollections under shipments"
provides:
  - "scan.process tRPC mutation for QR-triggered status transitions"
  - "validateTransition pure function for lifecycle enforcement"
  - "deriveShipmentStatus pure function for shipment status derivation"
  - "Firestore collection group index on pieces.qrCode"
affects: [05-02, 05-03, 06-enhanced-scanning, 07-real-time-dashboard]

tech-stack:
  added: []
  patterns:
    - "Collection group query for cross-shipment piece lookup by qrCode"
    - "Transactional scan processing: validate → record event → update piece → derive shipment status"
    - "Pure function extraction for business logic (shipment-status.ts)"

key-files:
  created:
    - apps/api/src/lib/shipment-status.ts
    - apps/api/src/routers/scan.ts
  modified:
    - apps/api/src/router.ts
    - firestore.indexes.json

key-decisions:
  - "Pure function extraction for validateTransition and deriveShipmentStatus — testable without Firestore"
  - "Collection group lookup outside transaction for pieceRef, transaction for read-modify-write"
  - "Optimistic status mapping in allStatuses array — use newStatus for current piece since tx.update hasn't flushed"

patterns-established:
  - "Scan mutation pattern: collectionGroup lookup → transaction(validate → event → piece update → derive shipment) → return ScanResult"
  - "Status derivation counts pieces by status and applies priority: all completed > all delivered > partial > any in_transit > created"

requirements-completed: [SCAN-03, SCAN-04, SCAN-05, SCAN-06]

duration: 1min
completed: 2026-04-01
---

# Phase 5 Plan 1: Scan Processing & Status Derivation Summary

**Transactional scan.process mutation with collection group QR lookup, sequential lifecycle validation, PieceEvent recording, and deterministic shipment status derivation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-01T18:44:00Z
- **Completed:** 2026-04-01T18:46:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Pure functions for transition validation (created→in_transit→delivered→completed) and shipment status derivation from piece statuses
- Transactional scan.process mutation: QR lookup via collection group, lifecycle enforcement, PieceEvent with arrayUnion, deliveredAt/completedAt timestamps
- Shipment status auto-derives after each scan including partially_delivered with counts
- Firestore collection group index on pieces.qrCode for cross-shipment lookup

## Task Commits

Each task was committed atomically:

1. **Task 1: Status derivation logic + Firestore index** - `9100c67` (feat)
2. **Task 2: scan.process mutation + router registration** - `337908d` (feat)

## Files Created/Modified
- `apps/api/src/lib/shipment-status.ts` - Pure functions: validateTransition (lifecycle enforcement) and deriveShipmentStatus (piece→shipment status)
- `apps/api/src/routers/scan.ts` - scan.process tRPC mutation with transactional scan processing
- `apps/api/src/router.ts` - Added scanRouter registration to appRouter
- `firestore.indexes.json` - Added collection group index on pieces.qrCode

## Decisions Made
- Pure function extraction for validateTransition and deriveShipmentStatus — keeps business logic testable without Firestore dependencies
- Collection group lookup happens outside the transaction (read-only for ref resolution), transaction handles the read-modify-write for piece and shipment
- Optimistic status mapping: when building allStatuses array for derivation, use result.newStatus for the current piece since tx.update hasn't flushed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- scan.process mutation ready for the ScanPage UI (05-02) to call
- ScanResult type flows back to frontend for feedback display
- Events array on pieces ready for event history view (05-03)

---
*Phase: 05-scan-processing-status-workflow*
*Completed: 2026-04-01*
