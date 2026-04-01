# Phase 4: QR Code Generation & Label Printing - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

After a shipment is created (Phase 3), the system generates a unique QR code for each piece and lets staff preview and print labels via networked Zebra printers. Labels include full shipment details with multi-piece fraction notation (1/5, 2/5). Users can reprint any subset of labels with custom copy counts at any shipment status. Phase 4 does NOT include scanning QR codes (Phase 5), signature/photo capture (Phase 6), or dashboard views (Phase 7).

</domain>

<decisions>
## Implementation Decisions

### QR content and format

- **D-01:** QR code encodes **piece document ID only** (e.g., `"abc123"`) — the scanning app (Phase 5) resolves this to the Firestore path `shipments/{shipmentId}/pieces/{pieceId}`. Minimal payload = smallest QR = fastest scan.
- **D-02:** QR **error correction level H** (High — 30% damage tolerance) — labels live in warehouse/vehicle environments where dirt and damage are likely.
- **D-03:** The `qrCode` field on each piece document is set to the **final piece document ID at creation time** inside the shipment create transaction — no placeholder `"pending:..."` values. The Phase 3 create procedure must be updated to use the auto-generated Firestore document ID as the QR value (or if piece IDs are auto-generated, capture them and write back).

### Label layout and content

- **D-04:** Label size is **4×3 inches** — medium format, fits networked Zebra printers at both HA and SC locations.
- **D-05:** Labels include **full information**: shipment number, piece notation (fraction), sender name, receiver name, origin → destination, priority, category, and description (truncated if needed to fit).
- **D-06:** Multi-piece notation uses **fraction style**: `1/5`, `2/5`, etc. Single-piece shipments show `1/1`.

### Print workflow and Zebra integration

- **D-07:** Printing is triggered via a **separate "Print Labels" button** on the shipment detail/edit page — NOT automatically after creation. User navigates to the shipment and explicitly chooses to print.
- **D-08:** Label preview uses **HTML/CSS rendering** on screen showing what the label will look like — no server-side PDF generation. Preview displays all labels in a scrollable grid or list before the user confirms print.
- **D-09:** If Zebra Browser Print agent is **not running**, show an **error message with installation/start instructions** — no PDF download fallback in this phase.
- **D-10:** Print sends **all labels for the shipment in one batch** to the Zebra printer by default.

### Reprint and label lifecycle

- **D-11:** "Print Labels" / "Reprint Labels" action available on **both** shipment detail and edit pages.
- **D-12:** Reprint dialog allows users to **select which pieces** to reprint AND specify **number of copies** per piece (e.g., print 3 copies of piece 2/5 only). No visual "REPRINT" watermark — reprints are identical to originals.
- **D-13:** Reprint allowed at **any shipment status** (Created, In Transit, Delivered, Picked Up) — labels may be lost/damaged at any stage. Only `Cancelled` shipments may optionally hide the action (Claude's discretion).

### Claude's Discretion

- ZPL command construction approach: whether to use `@schie/fluent-zpl` library or raw ZPL template strings
- Exact QR size on 4×3" label and positioning of text fields around QR
- Whether `labelUrl` field on `Piece` is populated (with a stored image/PDF URL) or left empty (labels generated on-demand from piece data)
- Zebra Browser Print discovery flow: auto-discover printers vs manual IP entry vs use `Location.printers[]` configuration
- Preview layout: grid of label cards vs vertical list
- Copy count input UX in reprint dialog (stepper vs dropdown vs text input)

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — QRPR-01 through QRPR-04
- `.planning/ROADMAP.md` — Phase 4 goal, success criteria, dependency on Phase 3
- `.planning/PROJECT.md` — stack constraints, Firestore model, tablet assumption

### Research

- `.planning/research/STACK.md` — QR libraries (`qrcode.react`, `qrcode` node), Zebra libraries (`Zebra Browser Print`, `@schie/fluent-zpl`), scanning libraries (Phase 5 context)
- `.planning/research/FEATURES.md` — QR generation + Zebra printing feature analysis, MVP priority P0

### Prior phase

- `.planning/phases/03-shipment-creation/03-CONTEXT.md` — shipment creation flow, piece creation at create time, form patterns

### Shared contracts

- `packages/shared/src/types/piece.ts` — `Piece` (has `qrCode`, `labelUrl`, `pieceNumber`, `shipmentId`)
- `packages/shared/src/types/shipment.ts` — `Shipment` (has `shipmentNumber`, `pieceCount`, `sender`, `receiver`, `origin`, `destination`, `priority`, `category`, `description`)
- `packages/shared/src/types/location.ts` — `Location` (has `printers: Printer[]` with `name`, `ip`, `model`, `isDefault`)
- `packages/shared/src/enums.ts` — `ShipmentStatus`, `ShipmentCategory`, `Priority`

### Security

- `firestore.rules` — authenticated read on `shipments`, `pieces`; no client writes

### Web integration

- `apps/web/src/App.tsx` — existing routes; need shipment detail route with print action
- `apps/web/src/pages/ShipmentFormPage.tsx` — edit page where print button also appears
- `apps/api/src/routers/shipment.ts` — `getById` returns shipment data for label rendering

### Functions

- `apps/functions/src/triggers/onShipmentCreate.ts` — may need update if QR generation moves server-side

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `apps/api/src/routers/shipment.ts` — `getById` already returns full shipment; extend or add `getPieces` for label data
- `apps/web/src/trpc.tsx` — tRPC client for fetching shipment + pieces
- `packages/shared/src/types/piece.ts` — `Piece.qrCode` field (currently set to placeholder in Phase 3 create)
- `packages/shared/src/types/location.ts` — `Printer` interface with `ip`, `name`, `model`, `isDefault`

### Established patterns

- tRPC routers under `apps/api/src/routers/`; new label/print endpoints follow same pattern
- Web components under `apps/web/src/components/shipment/`; label components fit here
- `staffProcedure` for mutations, `protectedProcedure` for reads

### Integration points

- Phase 3 `shipment.create` procedure currently sets piece `qrCode` to `"pending:{shipmentId}:{pieceNumber}"` — D-03 requires changing this to use the actual piece document ID
- `ShipmentFormPage` (edit mode) needs "Print Labels" button added
- New shipment detail page (or extend edit page to show detail mode) for label access
- `Location.printers[]` already seeded in `locations/HA` and `locations/SC` (empty arrays — need printer data)

</code_context>

<specifics>
## Specific Ideas

- Label size: **4×3 inches** (exact ZPL dimensions: `^PW812` for 4" at 203 DPI, `^LL609` for 3")
- Fraction notation: `1/5`, `2/5` — not "Piece 1 of 5"
- Full label info: shipment #, piece fraction, sender name, receiver name, origin → destination, priority badge, category, description (truncated)
- Reprint with piece selection + copy count per piece

</specifics>

<deferred>
## Deferred Ideas

- **PDF label generation** — server-side PDF via Cloud Functions for email/download; currently HTML preview only per D-08/D-09
- **Printer management admin UI** — Phase 10 admin panel for configuring printers per location
- **Label template customization** — configurable label layouts beyond the fixed 4×3" format

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 04-qr-code-generation-label-printing*
*Context gathered: 2026-04-01*
