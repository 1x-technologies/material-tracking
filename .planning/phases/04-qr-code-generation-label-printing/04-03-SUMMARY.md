---
phase: 04-qr-code-generation-label-printing
plan: 03
subsystem: ui
tags: [react, zebra, zpl, print-dialog, label-preview, modal]

requires:
  - phase: 04-qr-code-generation-label-printing (plan 01)
    provides: listPieces query, qrCode as pieceRef.id
  - phase: 04-qr-code-generation-label-printing (plan 02)
    provides: LabelPreviewCard, buildBatchZpl, browserPrint (discoverPrinters, sendZpl)
provides:
  - PrintLabelsDialog with preview grid, printer discovery, and batch print
  - ReprintLabelsDialog with piece selection and per-piece copy counts
  - Detail route /shipments/:shipmentId for read-only shipment view
  - Print/Reprint buttons on ShipmentFormPage for non-cancelled shipments
affects: [phase-05-scanning, phase-07-dashboard]

tech-stack:
  added: []
  patterns: [modal dialog with printer discovery, useEffect-based printer detection on open, expanded label array for per-piece copies]

key-files:
  created:
    - apps/web/src/components/shipment/PrintLabelsDialog.tsx
    - apps/web/src/components/shipment/ReprintLabelsDialog.tsx
  modified:
    - apps/web/src/App.tsx
    - apps/web/src/pages/ShipmentFormPage.tsx

key-decisions:
  - "Inline modal dialog pattern (fixed overlay + centered card) — no external dialog library"
  - "Expanded label array for per-piece copies — flatMap each selected piece by copy count before buildBatchZpl"
  - "Detail route at /shipments/:shipmentId reuses ShipmentFormPage with isEditRoute detection"

patterns-established:
  - "Modal dialog: fixed inset-0 overlay with z-50 centered card, Escape to close, backdrop click"
  - "Printer discovery on dialog open via useEffect, three-state printer status"

requirements-completed: [QRPR-02, QRPR-03, QRPR-04]

duration: 1min
completed: 2026-04-01
---

# Phase 4 Plan 03: Print/Reprint Dialogs & Shipment Detail Route Summary

**Print and reprint dialogs with Zebra printer discovery, label preview grid, per-piece copy selection, and detail route wiring**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-01T16:59:25Z
- **Completed:** 2026-04-01T17:00:30Z
- **Tasks:** 2 completed, 1 checkpoint (human-verify)
- **Files modified:** 4

## Accomplishments
- PrintLabelsDialog shows scrollable preview grid of all labels with printer discovery and batch print (D-08, D-10)
- ReprintLabelsDialog enables piece selection with checkboxes and per-piece copy counts (1-10) with stepper controls (D-12)
- Both dialogs handle agent_unavailable error with clear installation instructions (D-09)
- Detail route /shipments/:shipmentId renders ShipmentFormPage in read-only mode with "Shipment Details" title
- Print Labels / Reprint Labels buttons visible on both detail and edit views, hidden for cancelled shipments (D-07, D-11, D-13)

## Task Commits

Each task was committed atomically:

1. **Task 1: PrintLabelsDialog and ReprintLabelsDialog components** - `4bdc1b5` (feat)
2. **Task 2: Add detail route + wire print buttons on ShipmentFormPage** - `aeb1771` (feat)
3. **Task 3: Verify print workflow end-to-end** - checkpoint:human-verify (pending)

## Files Created/Modified
- `apps/web/src/components/shipment/PrintLabelsDialog.tsx` - Full-print dialog with preview grid, printer discovery, batch send
- `apps/web/src/components/shipment/ReprintLabelsDialog.tsx` - Selective reprint with piece checkboxes and copy count steppers
- `apps/web/src/App.tsx` - Added /shipments/:shipmentId detail route
- `apps/web/src/pages/ShipmentFormPage.tsx` - Print/Reprint buttons, pieces query, labels memo, detail page title

## Decisions Made
- Used inline modal pattern (fixed overlay) rather than external dialog library — Tailwind-only, consistent with project
- ReprintLabelsDialog expands labels array by copy count before passing to buildBatchZpl, rather than using the copies parameter — gives precise control per piece
- Detail route reuses ShipmentFormPage and detects edit vs detail via pathname.endsWith("/edit")

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 4 feature code complete pending human verification of print workflow
- Print/reprint dialogs ready for Phase 5 scanning integration
- Detail route provides read-only shipment view needed by dashboard (Phase 7)

## Self-Check: PASSED

- All 4 files exist (2 created, 2 modified)
- Commits 4bdc1b5 and aeb1771 verified in git log
- Task 3 checkpoint pending human verification

---
*Phase: 04-qr-code-generation-label-printing*
*Completed: 2026-04-01*
