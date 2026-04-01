# Phase 6: Enhanced Scanning Features - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Three capabilities layered on Phase 5's scan infrastructure: (1) batch scan mode — toggle on scan page to queue multiple scans and confirm all at once with partial success handling; (2) signature capture with three paths — receiver auto-detect at scan, email signature link, and admin-triggered link — stored as PNG in Firebase Storage; (3) optional photo attachments at scan points via camera capture. Phase 6 does NOT include the real-time dashboard (Phase 7), notifications (Phase 8), or history search (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Batch scan mode (SCAN-07)

- **D-01:** **"Batch Mode" toggle** on the scan page — when enabled, scans queue up in a visible list below the input instead of processing immediately. A "Confirm All" button processes the entire batch.
- **D-02:** **Partial success** on confirm — apply scans that succeed, show inline errors for failures (e.g., "Piece 3/5: already at Delivered"). Does not roll back successful scans.
- **D-03:** Each queued scan has a **remove (X) button** — user can cherry-pick which scans to confirm before submitting the batch.

### Signature capture (SCAN-08)

- **D-04:** Signature is requested at **delivery** — when the receiver confirms receipt of a package.
- **D-05:** Three signature paths, all in Phase 6:
  - **Receiver scan detect:** When the receiver scans the QR code at the destination, the system detects they are the receiver (by matching `ctx.user.uid` or `ctx.user.email` to `shipment.receiver.uid` or `shipment.receiver.email`) and auto-shows the signature dialog.
  - **Email signature link:** Driver or system sends a link to the receiver's email. The link opens a standalone signature page (no auth required — signed via a token/hash in the URL) where the receiver signs on their device.
  - **Admin send link:** Admin can trigger a signature request link from the shipment detail page at any time.
- **D-06:** Signatures stored as **PNG uploaded to Firebase Storage** — URL stored on `Piece.deliverySignatureUrl` and/or `PieceEvent.signatureUrl`. Storage path: `signatures/{shipmentId}/{pieceId}/{timestamp}.png`.

### Photo attachments (SCAN-09)

- **D-07:** Photos can be attached **at scan points only** — not at shipment creation (that's deferred). The photo button appears on the scan page alongside the scan input.
- **D-08:** Photos are **optional** with **no fixed limit** — user can choose to add one or more photos at any scan event, or skip entirely.
- **D-09:** **Camera capture only** — uses device camera (`<input type="file" accept="image/*" capture="environment">`). No gallery/file upload in Phase 6.
- **D-10:** Photos stored in **Firebase Storage** — URL appended to `Piece.photoUrls[]` and `PieceEvent.photoUrl`. Storage path: `photos/{shipmentId}/{pieceId}/{timestamp}.jpg`. Thumbnail generation deferred.

### Claude's Discretion

- Batch mode UI: how the queue list looks, animations, count badge
- Signature pad library: `signature_pad` (from STACK.md) or alternative
- Signature canvas size and styling
- Email signature link: token generation, expiry, standalone page design
- Photo compression/resize before upload
- Whether batch mode supports mixed actions or requires all scans to use the same action
- How the "Send Signature Link" button appears for admin vs driver

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — SCAN-07, SCAN-08, SCAN-09
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria
- `.planning/PROJECT.md` — Firebase Storage for photos/signatures, tablet assumption

### Research

- `.planning/research/STACK.md` — `signature_pad` library, `<input type="file" capture>` for photos, Firebase Storage patterns

### Prior phases

- `.planning/phases/05-scan-processing-status-workflow/05-CONTEXT.md` — scan page, action selector, audio feedback, scan.process mutation
- `.planning/phases/05-scan-processing-status-workflow/05-01-PLAN.md` — scan.process API details

### Shared contracts

- `packages/shared/src/schemas/scan.ts` — `batchScanSchema` (array of processScanSchema, max 50)
- `packages/shared/src/types/piece.ts` — `Piece.deliverySignatureUrl`, `Piece.pickupSignatureUrl`, `Piece.photoUrls[]`, `PieceEvent.signatureUrl`, `PieceEvent.photoUrl`
- `packages/shared/src/types/scan.ts` — `ScanInput.signatureUrl`, `ScanInput.photoUrl`

### Infrastructure

- `firestore.rules` — no client writes; mutations via API
- Firebase Storage — configured in Phase 1; `apps/api/src/lib/firebase.ts` exports `storage`

### Web integration

- `apps/web/src/pages/ScanPage.tsx` — existing scan page to extend with batch mode + photo
- `apps/web/src/components/scan/` — existing scan components
- `apps/api/src/routers/scan.ts` — extend with batch endpoint + signature link generation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `batchScanSchema` already validates array of scans — use for batch endpoint
- `PieceEvent` already has `signatureUrl?` and `photoUrl?` — no type changes needed
- `Piece` already has `deliverySignatureUrl?`, `pickupSignatureUrl?`, `photoUrls: string[]`
- `processScanSchema` already accepts optional `signatureUrl` and `photoUrl`
- Firebase Storage already exported from `apps/api/src/lib/firebase.ts`

### Established patterns

- `scan.process` mutation handles single scans — extend or add `scan.processBatch`
- `ScanPage` has action selector, RF input, camera overlay — add batch toggle and photo button
- Upload pattern: upload to Storage, get download URL, pass URL to API mutation

### Integration points

- `ScanPage.tsx` needs batch mode toggle, photo capture button, signature prompt
- New standalone signature page at `/sign/{token}` for email link flow
- `scan.ts` router needs `processBatch` mutation and `requestSignature` mutation
- Admin shipment detail page needs "Send Signature Link" button

</code_context>

<specifics>
## Specific Ideas

- Receiver detection: compare `ctx.user.uid` with `shipment.receiver.uid` or `ctx.user.email` with `shipment.receiver.email`
- Signature link: generate a short-lived token (UUID stored in Firestore `signatureRequests/{token}`) with shipment/piece reference; standalone page renders signature pad, uploads PNG, updates piece
- Batch mode visual: numbered list of queued scans with piece info, remove buttons, "Confirm All (N)" button at bottom

</specifics>

<deferred>
## Deferred Ideas

- **Photo at shipment creation** — D-07 scopes photos to scan points only; creation-time photos can be added later
- **Thumbnail generation** — Cloud Function to resize uploaded photos; not in Phase 6
- **Gallery/file upload** — D-09 is camera-only; file picker can be added in a future phase
- **Signature at pickup** — D-04 focuses on delivery; pickup signature can be added similarly

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 06-enhanced-scanning-features*
*Context gathered: 2026-04-01*
