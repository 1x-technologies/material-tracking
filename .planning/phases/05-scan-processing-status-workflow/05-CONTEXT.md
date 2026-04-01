# Phase 5: Scan Processing & Status Workflow - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Drivers scan QR codes (printed in Phase 4) to advance pieces through the four-stage status lifecycle: Created → In Transit → Delivered → Picked Up. Two scan methods: RF scanner (keyboard wedge input into auto-focused text field) and phone camera fallback (button-triggered viewfinder). Driver selects the target action before scanning. Shipment-level status auto-derives from piece statuses. Every scan is recorded with who, what, and when. A basic events list shows on the shipment detail page. Phase 5 does NOT include batch scan mode (Phase 6), signature/photo capture (Phase 6), or full timeline view (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Scan input method

- **D-01:** **Auto-focused text input** on the scan page — page loads with cursor in the scan field. RF scanner (keyboard wedge) types the QR code value followed by Enter, which auto-submits the scan. Input clears after submission, ready for the next scan.
- **D-02:** **"Scan with Camera" button** opens a camera viewfinder overlay using `html5-qrcode` (or `zxing-wasm`). On successful decode, the QR value is processed the same as RF input. Viewfinder closes after scan or on manual dismiss.
- **D-03:** Driver **selects the action first** (In Transit / Delivered / Picked Up) via a selector at the top of the scan page, then scans one or more pieces. All scans in the session apply the selected action. This is batch-friendly — driver knows what operation they're performing.

### Status lifecycle rules

- **D-04:** **Strict sequential lifecycle** — no skipping stages. Created → In Transit → Delivered → Picked Up only. API rejects scans that would skip a stage (e.g., Created → Delivered returns an error).
- **D-05:** **Any authenticated user** can perform scans — not restricted to Driver role. Staff and Admin can also scan (useful when drivers are unavailable or for testing).
- **D-06:** **Standard derived shipment status** from piece statuses:
  - All pieces Created → Shipment `created`
  - Any piece In Transit → Shipment `in_transit`
  - Mixed Delivered/other → Shipment `partially_delivered` (e.g., "Partially Delivered 3/5")
  - All pieces Delivered → Shipment `delivered`
  - All pieces Picked Up → Shipment `picked_up`
  - Cancelled overrides all → Shipment `cancelled`

### Scan feedback and confirmation

- **D-07:** **Toast + inline card list** on successful scan — brief toast notification ("Piece 2/5 → In Transit") plus an accumulating list of scanned pieces below the input showing piece info and new status. List persists during the scan session.
- **D-08:** **Inline error message** (red text below scan input) for scan failures — invalid QR code, wrong stage, piece already at target status, shipment cancelled, etc. Clears on next scan attempt.
- **D-09:** **Audio feedback** — success beep on valid scan, error buzz on failed scan. Important for warehouse environments where drivers aren't looking at the screen. Use Web Audio API or short audio files.

### Scan event recording

- **D-10:** Scan events stored in the **piece document's `events` array** — each entry is a `PieceEvent` with `action`, `timestamp`, `userId`, `userName`, and optional `location`. No separate subcollection.
- **D-11:** **Basic events list** on the shipment detail page — shows scan history for all pieces in the shipment. Simple chronological list with piece number, action, who, and when. Full timeline UI deferred to Phase 9.

### Claude's Discretion

- Camera scanning library choice: `html5-qrcode` (already in STACK.md) vs `zxing-wasm` (newer, actively maintained)
- Exact action selector UI: radio buttons, segmented control, or dropdown
- Toast library: existing Sonner (in STACK.md) or native
- Audio file format and specific sounds for success/error
- Whether to show scan count on the action selector ("In Transit — 5 scanned")
- Derived status computation: done in API on each scan (synchronous) vs Cloud Function trigger (async)
- Location tracking on scan events: use scanner's `locationId` from profile, or prompt, or omit in Phase 5

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — SCAN-01 through SCAN-06
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, dependency on Phase 4
- `.planning/PROJECT.md` — stack constraints, Firestore model, tablet assumption

### Research

- `.planning/research/STACK.md` — `html5-qrcode` (maintenance mode), `zxing-wasm` (migration target), Sonner for toasts
- `.planning/research/FEATURES.md` — QR scanning feature analysis, status lifecycle patterns

### Prior phases

- `.planning/phases/03-shipment-creation/03-CONTEXT.md` — shipment creation, piece subcollection structure
- `.planning/phases/04-qr-code-generation-label-printing/04-CONTEXT.md` — QR code content (piece doc ID), label format

### Shared contracts

- `packages/shared/src/schemas/scan.ts` — `processScanSchema`, `batchScanSchema` (already defined)
- `packages/shared/src/types/scan.ts` — `ScanInput`, `ScanResult`
- `packages/shared/src/types/piece.ts` — `Piece`, `PieceEvent` (events array)
- `packages/shared/src/enums.ts` — `PieceStatus`, `ShipmentStatus`, `ScanAction`

### Security

- `firestore.rules` — authenticated read on shipments/pieces; no client writes
- `apps/api/src/middleware/auth.ts` — `protectedProcedure` for any-user scan (D-05)

### Web integration

- `apps/web/src/App.tsx` — `/scan` route with `RequireRole(["driver", "admin"])`
- `apps/web/src/pages/ScanStubPage.tsx` — stub to replace
- `apps/web/src/pages/ShipmentFormPage.tsx` — detail page where events list will be added

### API

- `apps/api/src/routers/shipment.ts` — extend with scan processing or add new scan router

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `packages/shared/src/schemas/scan.ts` — `processScanSchema` validates `qrCode` + `action` (in_transit, delivered, picked_up); `batchScanSchema` wraps array of scans
- `packages/shared/src/types/piece.ts` — `PieceEvent` with `action`, `timestamp`, `userId`, `userName`, `location?`
- `packages/shared/src/enums.ts` — `PieceStatus` (created, in_transit, delivered, picked_up), `ShipmentStatus` (includes partially_delivered)
- `apps/api/src/middleware/auth.ts` — `protectedProcedure` for D-05 (any authenticated user)

### Established patterns

- tRPC routers under `apps/api/src/routers/`; scan router follows same pattern
- `driverProcedure` exists but D-05 says use `protectedProcedure` instead (any user can scan)
- Web components under `apps/web/src/components/`; scan components fit in `components/scan/`

### Integration points

- `ScanStubPage.tsx` at `/scan` — replace with real scan page
- `ShipmentFormPage.tsx` detail view — add events list section
- `Piece.qrCode` is the document ID (set in Phase 4) — scan API looks up piece by querying all shipments' pieces subcollections for matching `qrCode`, or use a collection group query
- Shipment status derivation needs to run after each scan and update the parent shipment document
- `RequireRole` on `/scan` route currently restricts to driver+admin — D-05 says any auth user; update to include staff or use no role restriction

</code_context>

<specifics>
## Specific Ideas

- RF scanner auto-focus: `useEffect` with `inputRef.current?.focus()` on mount
- Keyboard wedge: RF scanners type characters rapidly then send Enter — detect Enter keypress to trigger submission
- Audio: Web Audio API `oscillator` for beep (440Hz, 200ms) and buzz (200Hz, 300ms) — no external audio files needed
- Scan page action selector: prominent segmented control at top with In Transit / Delivered / Picked Up
- Inline scanned-pieces list: shows piece number, shipment number, new status, timestamp — most recent at top

</specifics>

<deferred>
## Deferred Ideas

- **Batch scan mode** — Phase 6 (SCAN-07): scan multiple pieces continuously, confirm all at once
- **Signature capture at scan points** — Phase 6 (SCAN-08)
- **Photo attachments at scan points** — Phase 6 (SCAN-09)
- **Full timeline view** — Phase 9: rich timeline with filters, grouping, visual indicators
- **Offline scan queue** — Out of scope per PROJECT.md (always-online assumption)

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 05-scan-processing-status-workflow*
*Context gathered: 2026-04-01*
