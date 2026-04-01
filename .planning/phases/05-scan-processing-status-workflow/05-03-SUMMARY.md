---
phase: 05-scan-processing-status-workflow
plan: 03
subsystem: ui
tags: [react, tailwind, firestore-timestamp, scan-history]

requires:
  - phase: 04-qr-code-generation-label-printing
    provides: listPieces query and piece data with events arrays
provides:
  - PieceEventsList component for chronological scan event display
  - Scan History section on shipment detail page
affects: [09-history-search-audit]

tech-stack:
  added: []
  patterns: [firestore-timestamp-parsing, flattened-cross-piece-events, action-color-badge-map]

key-files:
  created:
    - apps/web/src/components/shipment/PieceEventsList.tsx
  modified:
    - apps/web/src/pages/ShipmentFormPage.tsx

key-decisions:
  - "Flattened events across all pieces into single reverse-chronological list rather than per-piece grouping"
  - "Fragment wrapper for read-only detail view to support sibling sections in ternary"

patterns-established:
  - "Firestore Timestamp parsing: toDate() → _seconds → Date fallback for flexible deserialization"
  - "Action color badge map: const objects for label text and Tailwind classes per ScanAction"

requirements-completed: [SCAN-06]

duration: 1min
completed: 2026-04-01
---

# Phase 5 Plan 3: Shipment Detail Events List Summary

**Chronological scan events list component with Firestore Timestamp handling, color-coded action badges, and shipment detail page integration**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-01T18:43:56Z
- **Completed:** 2026-04-01T18:44:57Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- PieceEventsList component flattens events across all pieces and sorts reverse-chronologically
- Each event displays piece number badge, color-coded action badge, user name, and formatted timestamp
- Scan History section integrated into shipment detail page for all read-only views
- Empty state "No scan events recorded yet" when no events exist

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PieceEventsList component** - `3f4dfc5` (feat)
2. **Task 2: Integrate events list into ShipmentFormPage** - `e34d571` (feat)

## Files Created/Modified
- `apps/web/src/components/shipment/PieceEventsList.tsx` - Chronological events list with Firestore Timestamp parsing, action badges, and empty state
- `apps/web/src/pages/ShipmentFormPage.tsx` - Added PieceEventsList import and Scan History section in read-only detail view

## Decisions Made
- Flattened all piece events into a single sorted list for unified timeline view (per-piece grouping deferred to Phase 9 rich timeline)
- Used fragment wrapper `<>...</>` for read-only detail view to support the events section as a sibling of the detail fields div within the ternary
- Firestore Timestamp parsing uses triple fallback: `toDate()` method → `_seconds` field → `new Date()` constructor

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed JSX ternary requiring single expression**
- **Found during:** Task 2 (ShipmentFormPage integration)
- **Issue:** The read-only branch of the ternary operator had two sibling elements (detail fields div + events section), which is invalid JSX
- **Fix:** Wrapped both in a React fragment `<>...</>`
- **Files modified:** apps/web/src/pages/ShipmentFormPage.tsx
- **Verification:** `pnpm --filter @material-tracking/web build` passes
- **Committed in:** e34d571

**2. [Rule 1 - Bug] Fixed TypeScript type mismatch for events array mapping**
- **Found during:** Task 2 (ShipmentFormPage integration)
- **Issue:** `Record<string, unknown>[]` not assignable to `EventEntry[]` — plan's cast was too loose
- **Fix:** Added explicit per-event mapping with proper field extraction and casting
- **Files modified:** apps/web/src/pages/ShipmentFormPage.tsx
- **Verification:** `pnpm --filter @material-tracking/web build` passes with zero errors
- **Committed in:** e34d571

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both fixes necessary for compilation. No scope creep.

## Issues Encountered
None beyond the auto-fixed build errors.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Scan History section is ready to display events once scan.process mutation (Plan 01) creates event records
- Phase 9 rich timeline will enhance this with expanded detail, filtering, and pagination

## Self-Check: PASSED

- FOUND: apps/web/src/components/shipment/PieceEventsList.tsx
- FOUND: apps/web/src/pages/ShipmentFormPage.tsx
- FOUND: 3f4dfc5 (Task 1)
- FOUND: e34d571 (Task 2)
- BUILD: passes (`pnpm --filter @material-tracking/web build`)

---
*Phase: 05-scan-processing-status-workflow*
*Completed: 2026-04-01*
