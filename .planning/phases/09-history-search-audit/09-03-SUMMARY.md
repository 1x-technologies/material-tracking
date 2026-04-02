---
phase: 09-history-search-audit
plan: 03
subsystem: ui
tags: [react, timeline, audit-trail, shipment-detail]

# Dependency graph
requires:
  - phase: 05-scan-processing-status-workflow
    provides: PieceEvent model and scan event data in Piece.events[]
  - phase: 06-signature-photo-capture
    provides: signatureUrl and photoUrls fields on scan events
provides:
  - ShipmentTimeline component with visual vertical connected-dot timeline
  - Full audit trail on shipment detail page (HIST-03, ADMN-05)
affects: [10-admin-panel-reports]

# Tech tracking
tech-stack:
  added: []
  patterns: [vertical-timeline-ui, merged-event-model, synthetic-events]

key-files:
  created:
    - apps/web/src/components/shipment/ShipmentTimeline.tsx
  modified:
    - apps/web/src/pages/ShipmentFormPage.tsx
  deleted:
    - apps/web/src/components/shipment/PieceEventsList.tsx

key-decisions:
  - "Ascending chronological order (oldest at top) for 'story from start to end' convention"
  - "Cancellation actor shown as 'System' since no dedicated cancel-actor field exists (D-09 limitation)"
  - "Section heading changed from 'Scan History' to 'Activity' to reflect broader event scope"
  - "Inline relative time formatter instead of date-fns (not in project deps)"

patterns-established:
  - "Synthetic timeline entries: derive creation and cancellation events from shipment metadata rather than storing duplicates"
  - "Merged event model: flatten piece events with shipment-level synthetic events into single sorted array"

requirements-completed: [HIST-03, ADMN-05]

# Metrics
duration: 4min
completed: 2026-04-02
---

# Phase 09 Plan 03: Shipment Timeline Summary

**Vertical connected-dot timeline replacing flat event list, showing creation, piece scans with signature/photo indicators, and cancellation as a visual audit trail**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-02T15:32:41Z
- **Completed:** 2026-04-02T15:36:49Z
- **Tasks:** 2
- **Files modified:** 3 (1 created, 1 modified, 1 deleted)

## Accomplishments
- ShipmentTimeline component with vertical line, color-coded dots per action type (D-05 palette: neutral, blue, green, purple, red)
- Merged chronological timeline: shipment created (synthetic), all piece scan events, and cancellation (synthetic from status + updatedAt)
- Signature and photo indicators on scan events per D-07
- Full enriched event payload passed through (signatureUrl, photoUrls no longer stripped)
- PieceEventsList deleted -- ShipmentTimeline fully replaces it

## Task Commits

Each task was committed atomically:

1. **Task 1: ShipmentTimeline component** - `68fde26` (feat)
2. **Task 2: Wire ShipmentFormPage detail section** - `3744f5b` (feat)

## Files Created/Modified
- `apps/web/src/components/shipment/ShipmentTimeline.tsx` - New vertical timeline component with merged event model, color-coded dots, relative + absolute timestamps, signature/photo indicators
- `apps/web/src/pages/ShipmentFormPage.tsx` - Replaced PieceEventsList with ShipmentTimeline, passes full event payload including signatureUrl and photoUrls
- `apps/web/src/components/shipment/PieceEventsList.tsx` - Deleted (no remaining consumers)

## Decisions Made
- Ascending chronological order (oldest at top) for "story from start to end" narrative
- Cancellation actor shown as "System" since no dedicated cancel-actor field exists on the shipment document (D-09 documented limitation)
- Section heading changed from "Scan History" to "Activity" to reflect broader scope (includes creation and cancellation)
- Built inline relative time formatter (formatRelative) rather than adding date-fns dependency -- keeps bundle lean and consistent with existing project approach

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing TypeScript errors in ScanPage.tsx (unused variables from Phase 6) caused tsc build to fail; these are out of scope and not related to this plan's changes. Verified by checking TypeScript output with ScanPage excluded -- zero errors from plan changes. Vite build succeeds.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Shipment detail now shows full audit trail timeline (HIST-03, ADMN-05 satisfied)
- Phase 09 complete -- all 3 plans executed
- Ready for Phase 10 (admin panel, reports)

## Self-Check: PASSED

- ShipmentTimeline.tsx: FOUND
- PieceEventsList.tsx: CONFIRMED DELETED
- 09-03-SUMMARY.md: FOUND
- Commit 68fde26: FOUND
- Commit 3744f5b: FOUND

---
*Phase: 09-history-search-audit*
*Completed: 2026-04-02*
