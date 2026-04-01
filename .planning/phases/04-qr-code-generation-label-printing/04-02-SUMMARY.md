---
phase: 04-qr-code-generation-label-printing
plan: 02
subsystem: ui
tags: [qrcode.react, fluent-zpl, zpl, zebra, label-preview, browser-print]

requires:
  - phase: 03-shipment-creation
    provides: Shipment and Piece types, shipment creation flow
provides:
  - LabelPreviewCard component with QR code (level H) and all label fields
  - buildLabelZpl / buildBatchZpl ZPL generators for 4x3 labels at 203 DPI
  - Zebra Browser Print wrapper (checkAgent, discoverPrinters, sendZpl)
  - pieceFraction and truncateDescription pure helper functions
affects: [04-03, 05-qr-scanning]

tech-stack:
  added: [qrcode.react@^4.2.0, "@schie/fluent-zpl@^1.0.0"]
  patterns: [fluent-zpl Label.create for ZPL, QRCodeSVG with level H, fetch-based Browser Print wrapper]

key-files:
  created:
    - apps/web/src/lib/labelFormatters.ts
    - apps/web/src/lib/labelFormatters.test.ts
    - apps/web/src/lib/zebra/buildLabelZpl.ts
    - apps/web/src/lib/zebra/buildLabelZpl.test.ts
    - apps/web/src/lib/zebra/browserPrint.ts
    - apps/web/src/components/shipment/LabelPreviewCard.tsx
  modified:
    - apps/web/package.json
    - pnpm-lock.yaml

key-decisions:
  - "fluent-zpl QRErrorCorrection.H for ZPL QR — native support in 1.0.0, no raw ZPL needed"
  - "Pure fetch wrapper for Browser Print — no vendor SDK dependency, localhost:9100 with AbortController timeouts"
  - "LabelData interface defined locally in LabelPreviewCard — shared between preview and ZPL builder via import"

patterns-established:
  - "Label infrastructure pattern: shared LabelData type consumed by both HTML preview and ZPL builder"
  - "Browser Print wrapper: checkAgent → discoverPrinters → sendZpl with structured error types"

requirements-completed: [QRPR-01, QRPR-02, QRPR-03]

duration: 1min
completed: 2026-04-01
---

# Phase 04 Plan 02: Label Infrastructure Summary

**QR label preview component, ZPL builder with fluent-zpl (EC H, 812x609 at 203 DPI), and Zebra Browser Print fetch wrapper**

## Performance

- **Duration:** 1 min
- **Started:** 2026-04-01T16:56:53Z
- **Completed:** 2026-04-01T16:58:16Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments
- Installed qrcode.react and @schie/fluent-zpl dependencies
- Created LabelPreviewCard with QRCodeSVG (level H), 4:3 aspect ratio, Tailwind styling, priority badges
- Built ZPL label generator using fluent-zpl with all required fields at 812x609 dots (4x3" at 203 DPI)
- Created Browser Print wrapper with agent detection, printer discovery, and ZPL send capabilities
- 16 unit tests passing for formatters and ZPL builder

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps + label formatters + LabelPreviewCard** - `aeee0e6` (feat)
2. **Task 2: ZPL builder with fluent-zpl + unit tests** - `7445a57` (feat)
3. **Task 3: Zebra Browser Print agent wrapper** - `ee12d30` (feat)

## Files Created/Modified
- `apps/web/package.json` - Added qrcode.react and @schie/fluent-zpl dependencies
- `apps/web/src/lib/labelFormatters.ts` - pieceFraction and truncateDescription pure helpers
- `apps/web/src/lib/labelFormatters.test.ts` - 8 unit tests for formatters
- `apps/web/src/components/shipment/LabelPreviewCard.tsx` - HTML/CSS label preview with QRCodeSVG
- `apps/web/src/lib/zebra/buildLabelZpl.ts` - ZPL builder using fluent-zpl (812x609, EC H)
- `apps/web/src/lib/zebra/buildLabelZpl.test.ts` - 8 unit tests for ZPL structure and batching
- `apps/web/src/lib/zebra/browserPrint.ts` - Zebra Browser Print agent wrapper via fetch

## Decisions Made
- Used fluent-zpl's native `QRErrorCorrection.H` enum instead of raw `^BQ` commands — cleaner and type-safe
- Implemented Browser Print wrapper as pure fetch calls to localhost:9100 rather than depending on vendor SDK JS file
- Defined `LabelData` interface in LabelPreviewCard.tsx and imported from ZPL builder — single source of truth for label fields

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Label infrastructure complete: preview component, ZPL builder, and printer wrapper ready for Plan 03 assembly
- Plan 03 will wire these into the print/reprint workflow on shipment pages
- Browser Print agent must be installed on target tablets for physical printing (STATE.md blocker)

## Self-Check: PASSED

---
*Phase: 04-qr-code-generation-label-printing*
*Completed: 2026-04-01*
