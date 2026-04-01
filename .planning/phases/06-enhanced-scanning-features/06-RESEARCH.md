# Phase 6: Enhanced Scanning Features - Research

**Researched:** 2026-04-01  
**Domain:** Batch scanning (tRPC), signature capture (canvas + Storage + tokenized public flow), camera-only photo attachments  
**Confidence:** HIGH (stack + codebase); MEDIUM (email delivery scope, multi-photo schema)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Batch scan mode (SCAN-07)**

- **D-01:** **"Batch Mode" toggle** on the scan page — when enabled, scans queue up in a visible list below the input instead of processing immediately. A "Confirm All" button processes the entire batch.
- **D-02:** **Partial success** on confirm — apply scans that succeed, show inline errors for failures (e.g., "Piece 3/5: already at Delivered"). Does not roll back successful scans.
- **D-03:** Each queued scan has a **remove (X) button** — user can cherry-pick which scans to confirm before submitting the batch.

**Signature capture (SCAN-08)**

- **D-04:** Signature is requested at **delivery** — when the receiver confirms receipt of a package.
- **D-05:** Three signature paths, all in Phase 6:
  - **Receiver scan detect:** When the receiver scans the QR code at the destination, the system detects they are the receiver (by matching `ctx.user.uid` or `ctx.user.email` to `shipment.receiver.uid` or `shipment.receiver.email`) and auto-shows the signature dialog.
  - **Email signature link:** Driver or system sends a link to the receiver's email. The link opens a standalone signature page (no auth required — signed via a token/hash in the URL) where the receiver signs on their device.
  - **Admin send link:** Admin can trigger a signature request link from the shipment detail page at any time.
- **D-06:** Signatures stored as **PNG uploaded to Firebase Storage** — URL stored on `Piece.deliverySignatureUrl` and/or `PieceEvent.signatureUrl`. Storage path: `signatures/{shipmentId}/{pieceId}/{timestamp}.png`.

**Photo attachments (SCAN-09)**

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

### Deferred Ideas (OUT OF SCOPE)

- **Photo at shipment creation** — D-07 scopes photos to scan points only; creation-time photos can be added later
- **Thumbnail generation** — Cloud Function to resize uploaded photos; not in Phase 6
- **Gallery/file upload** — D-09 is camera-only; file picker can be added in a future phase
- **Signature at pickup** — D-04 focuses on delivery; pickup signature can be added similarly
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **SCAN-07** | Driver can use batch scan mode to scan multiple pieces and confirm all at once | `batchScanSchema` (max 50) + `scan.process` transaction pattern → add `processBatch` or client `Promise.allSettled` with shared core; partial success = no all-or-nothing transaction across items |
| **SCAN-08** | Signature can be captured at delivery and pickup scan points | **Scope per CONTEXT:** delivery only in Phase 6; pickup signature deferred. Implement `Piece.deliverySignatureUrl` + `PieceEvent.signatureUrl`, three UX paths (receiver detect, token page, admin link). REQ text is broader than CONTEXT — align implementation with CONTEXT unless product explicitly expands scope |
| **SCAN-09** | Photo can be attached during shipment creation or at scan points | **Scope per CONTEXT:** scan points only in Phase 6; creation-time photos deferred. Camera-only upload to `photos/...`, denormalize to `Piece.photoUrls` + event |
</phase_requirements>

## Summary

Phase 6 layers batch queuing, signature capture (including a **token-based unauthenticated** signature page), and optional multi-photo capture on top of Phase 5’s `scan.process` pipeline. The shared package already exposes `batchScanSchema` and optional `signatureUrl` / `photoUrl` on each scan input; the API persists event-level URLs but **does not yet** write `Piece.deliverySignatureUrl` or `Piece.photoUrls` on the piece document—those writes are required work for D-06/D-10.

The highest-risk integration is **Firebase Storage security rules**: current rules allow read/write under `photos/` and `signatures/` only when `request.auth != null`. Authenticated flows (scan page, admin) can use the **Firebase JS SDK** after sign-in. The **email signature link** explicitly has **no Firebase Auth**; those users **cannot** use client-side Storage writes under the present rules. The standard fix is **server-side upload** (Admin SDK `getStorage().bucket()` / `file().save()` or stream) via a **public** HTTP or tRPC procedure that validates a short-lived token, or **v4 signed URLs** generated by the backend for a one-shot upload. See [Firebase Admin Cloud Storage](https://firebase.google.com/docs/storage/admin/start) (HIGH confidence).

**Primary recommendation:** Extract single-scan transaction logic into a reusable internal function; implement `scan.processBatch` returning per-index results; add `react-signature-canvas` for signed-in flows; implement `/sign/:token` standalone page posting PNG to a **token-gated API upload**; extend `processScanSchema` (or parallel fields) if D-08 “multiple photos per event” cannot be represented by a single `photoUrl`.

## Project Constraints (from .cursor/rules/)

- **Stack:** React 19 + Vite 8 + Tailwind; Firestore nested `pieces` under `shipments`; Firebase Auth (Google Workspace SSO); Cloud Functions v2 + Cloud Run; Firebase Storage; three roles (Admin, Driver, Staff).
- **Data:** Denormalized piece fields; status lifecycle Created → In Transit → Delivered → Picked Up.
- **Planning:** Decisions live in `.planning/PROJECT.md`, requirements in `.planning/REQUIREMENTS.md`.

## Standard Stack

### Core

| Library | Version (verified 2026-04-01) | Purpose | Why Standard |
|---------|-------------------------------|---------|--------------|
| `react-signature-canvas` | **1.1.0-alpha.2** | React wrapper around `signature_pad`; export PNG/data URL | Matches STACK.md; touch/stylus support; widely used |
| `signature_pad` | **5.1.3** (transitive/peer) | Canvas signature engine | Underpins `react-signature-canvas`; CONTEXT allows “or alternative” but this is the default path |
| `firebase` (JS SDK) | ^12.11.0 (app) | `uploadBytes` / `getDownloadURL` for **authenticated** client uploads | Already in `apps/web` |
| `firebase-admin` | ^13.7.0 (api) | Server writes to Storage, token validation, Firestore for request docs | Already in `apps/api` |
| Existing `batchScanSchema` | — | Validates `scans[]` 1–50 | Avoid custom batch validation |

### Supporting (discretion)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `browser-image-compression` | **2.0.2** | Client-side resize before upload | Large phone photos; optional per CONTEXT discretion |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `react-signature-canvas` | Raw `signature_pad` + `useRef` | Less React glue; more manual lifecycle |
| Client upload (token page) | Signed PUT URL from Admin SDK | More moving parts; good if you want direct-to-GCS and avoid large bodies on API |

**Installation (web):**

```bash
pnpm --filter @material-tracking/web add react-signature-canvas
```

**Version verification:** `npm view react-signature-canvas version` → 1.1.0-alpha.2; `npm view signature_pad version` → 5.1.3; `npm view browser-image-compression version` → 2.0.2.

## Architecture Patterns

### Recommended flow layout

```
apps/web/src/pages/ScanPage.tsx       → batch toggle, queue UI, photo capture, signature modal (auth)
apps/web/src/pages/SignPiecePage.tsx  → new route /sign/:token (no auth), posts to API
apps/api/src/routers/scan.ts          → processBatch + (optional) submitSignatureByToken
apps/api/src/lib/scan-process.ts      → extracted transaction body from current process()
Firestore: signatureRequests/{token}  → { pieceId, shipmentId, expiresAt, createdBy, consumedAt? }
```

### Pattern 1: Partial-success batch

**What:** Call the same logical “process one scan” operation N times; aggregate results with `Promise.allSettled` or a dedicated mutation that loops and collects `{ index, ok, error?, data? }`.

**When to use:** D-02 forbids rolling back successful scans—never wrap the whole batch in one Firestore transaction.

**Example (shape only):**

```typescript
// Conceptual — planner should extract real transaction from scanRouter.process
const results = await Promise.allSettled(
  inputs.map((input, i) => processOneScan(ctx, input).then((data) => ({ i, data }))),
);
// Map to inline errors: failures keep index + message for UI
```

### Pattern 2: Authenticated Storage upload → then `scan.process`

**What:** Client `uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg' })` then pass `downloadURL` in mutation input.

**When to use:** Scan page and any signed-in user; satisfies `storage.rules` auth requirement.

### Pattern 3: Unauthenticated signature completion

**What:** Standalone page collects PNG; **POST** to API with token in header or body; API verifies Firestore `signatureRequests` doc (not expired, not consumed); Admin SDK writes to `signatures/{shipmentId}/{pieceId}/{timestamp}.png`; updates piece `deliverySignatureUrl` and optionally appends event—or only finalizes if tied to a pending delivery step per product rules.

**When to use:** Email/admin link paths (D-05).

### Anti-patterns to avoid

- **Unauthenticated `uploadBytes` to Firebase Storage:** Will fail under current `storage.rules`.
- **One giant Firestore transaction for batch:** Conflicts and size limits; contradicts partial-success semantics.
- **Trusting client-supplied URLs without validation:** Prefer Storage paths you control or verify token before binding URL to piece.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signature stroke smoothing / touch handling | Raw canvas mouse events | `signature_pad` / `react-signature-canvas` | Edge cases on tablets, pen pressure, resize |
| Batch input validation | Ad-hoc arrays | `batchScanSchema` from `@material-tracking/shared` | Single source of truth with Zod + max 50 |
| Public signature page auth | Fake “anonymous” Firebase users for Storage | Token + server upload or signed URL | Matches security model; rules stay strict |
| Multi-step status machine | Inline strings in router | Existing `validateTransition` / `deriveShipmentStatus` | Already tested patterns in Phase 5 |

**Key insight:** The “magic link” flow is primarily an **authz** problem (token store + expiry), not a canvas problem.

## Common Pitfalls

### Pitfall 1: Storage rules vs unauthenticated signature page

**What goes wrong:** Signature page uses client Storage SDK; uploads reject with permission denied.

**Why it happens:** `storage.rules` require `request.auth != null` for `photos/` and `signatures/` writes.

**How to avoid:** Server-side write after token check, or GCS signed upload URL.

**Warning signs:** Works in emulator only when rules loosened; fails in staging/prod.

### Pitfall 2: `processScanSchema` single `photoUrl` vs D-08 multiple photos

**What goes wrong:** Product expects several URLs per scan event; schema only allows one.

**Why it happens:** Current Zod has `photoUrl?: z.string().url()` only.

**How to avoid:** Add `photoUrls: z.array(z.string().url()).max(N).optional()` (pick N in discretion) **or** multiple sequential uploads merged client-side into one composite (usually worse).

**Warning signs:** PM asks for “second photo” on same scan.

### Pitfall 3: Omitting `Piece`-level fields

**What goes wrong:** Event has `signatureUrl` but `Piece.deliverySignatureUrl` never set; downstream reporting/UI expects piece-level field (D-06).

**Why it happens:** Current `scan.ts` only merges optional URLs into the **event** object.

**How to avoid:** On `delivered` + `signatureUrl`, set `deliverySignatureUrl`; on any scan with photos, `arrayUnion` into `photoUrls`.

### Pitfall 4: Receiver detection false positives

**What goes wrong:** Email comparison without normalization (case, whitespace); external receiver without `uid`.

**Why it happens:** `shipment.receiver` shape differs for company vs external contacts.

**How to avoid:** Normalize emails to lowercase; clear UX when receiver cannot be matched (fall back to link flow).

### Pitfall 5: Token replay and leakage

**What goes wrong:** Token reused indefinitely or logged in referrer.

**Why it happens:** Weak token lifecycle.

**How to avoid:** Cryptographically random token (e.g. 32+ bytes hex), `expiresAt`, optional `consumedAt`; serve sign page with `Referrer-Policy` considerations; HTTPS only.

## Code Examples

### Batch schema (existing)

```typescript
// packages/shared/src/schemas/scan.ts
export const batchScanSchema = z.object({
  scans: z.array(processScanSchema).min(1).max(50),
});
```

### Current single-scan event merge (extend for piece-level fields)

```62:69:apps/api/src/routers/scan.ts
        const event = {
          action: input.action,
          timestamp: Timestamp.now(),
          userId: ctx.user.uid,
          userName: ctx.user.name ?? ctx.user.email ?? "",
          ...(input.signatureUrl && { signatureUrl: input.signatureUrl }),
          ...(input.photoUrl && { photoUrl: input.photoUrl }),
        };
```

### Storage rules excerpt (auth required for client writes)

```5:17:storage.rules
    match /photos/{shipmentId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 10 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }

    match /signatures/{shipmentId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
                   && request.resource.size < 2 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base64 blobs only in Firestore | Storage URL + metadata on piece/event | Project baseline | Avoids document size limits |
| Single scan only | Batched validation via shared Zod | Already in shared | Planner wires API + UI |

**Deprecated/outdated:** None identified for this phase beyond monitoring `html5-qrcode` (STACK.md — unrelated to Phase 6 core).

## Open Questions

1. **SCAN-08 / SCAN-09 wording vs CONTEXT**
   - What we know: REQUIREMENTS mention pickup signatures and creation-time photos; CONTEXT defers both.
   - What's unclear: Whether traceability matrix should be updated after Phase 6 or implementation satisfies REQ by partial coverage.
   - Recommendation: Ship per CONTEXT; note gap in verification doc or adjust REQ checkbox notes.

2. **Actual email delivery**
   - What we know: CONTEXT describes a link that can be emailed; Phase 8 is notifications.
   - What's unclear: Whether Phase 6 includes SendGrid/SES vs copy-to-clipboard + manual paste.
   - Recommendation: MVP = generate URL + toast/copy; optional thin email if infra already exists.

3. **Mixed actions in batch mode**
   - What we know: Discretion allows same-action-only or mixed; `processScanSchema` includes per-item `action`.
   - What's unclear: UX if mixed actions enabled.
   - Recommendation: Default single global action (matches current `ScanPage` selector); allow per-row override only if low complexity.

4. **Signature link binding to “delivery” transition**
   - What we know: D-04 ties signature to delivery confirmation.
   - What's unclear: Whether token flow only attaches file to existing delivered piece or also drives status transition.
   - Recommendation: Define explicit state machine: e.g. piece must be `in_transit`, token marks pending signature, completing upload runs same transition as `delivered` scan—or piece already delivered and signature is amendment only (simpler but weaker audit).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | API, web, tooling | ✓ | v25.x probed (project engines >=22) | Use 22+ LTS in CI if team standardizes |
| pnpm | Workspace | ✓ | 10.0.0 | — |
| Firebase CLI | Emulators / deploy | ✓ | 15.12.0 | — |
| Firebase Emulator | Local Storage rules testing | ✓ | bundled | Manual staging test if emulator skipped |

**Missing dependencies with no fallback:** None identified for planning.

**Missing dependencies with fallback:** None.

*Step 2.6 note:* External **email provider** only if implementing automated send in Phase 6 — treat as optional until confirmed.

## Validation Architecture

> `workflow.nyquist_validation` is enabled in `.planning/config.json`.

### Test framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 |
| Config | `apps/api/vitest.config.ts` (node), `apps/web/vitest.config.ts` (jsdom) |
| Quick run (API) | `pnpm --filter @material-tracking/api test` |
| Full suite | `pnpm test` (root) |

### Phase requirements → test map

| Req ID | Behavior | Test Type | Automated command | File exists? |
|--------|----------|-----------|-------------------|--------------|
| SCAN-07 | Batch partial success / per-item errors | unit + integration | `pnpm --filter @material-tracking/api test -- tests/scan-router.test.ts` | ❌ Wave 0 — create |
| SCAN-08 | Receiver match helper; token validation | unit | same file or `tests/signature-token.test.ts` | ❌ |
| SCAN-09 | Zod accepts photo URL list (if schema extended) | unit | `pnpm --filter @material-tracking/shared test` (if tests added) or API tests | ❌ shared tests today |
| Regression | `validateTransition` / batch doesn’t break shipment derive | unit | API tests importing `shipment-status` | ⚠️ Partial — functions tests cover derive only |

### Sampling rate

- **Per task commit:** `pnpm --filter @material-tracking/api test` (fast subset once files exist)
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 gaps

- [ ] `apps/api/tests/scan-router.test.ts` — covers `process`, future `processBatch`, piece field updates
- [ ] Firestore emulator or heavy mocking strategy for transaction tests — document in plan
- [ ] Optional: `packages/shared` tests for extended `processScanSchema` / batch schema
- [ ] Optional: web component test for batch queue UI (lower priority than API)

## Sources

### Primary (HIGH confidence)

- `.planning/phases/06-enhanced-scanning-features/06-CONTEXT.md` — locked decisions, deferred scope
- `.planning/research/STACK.md` — `react-signature-canvas`, Firebase Storage usage
- `packages/shared/src/schemas/scan.ts`, `packages/shared/src/types/piece.ts` — contracts
- `apps/api/src/routers/scan.ts`, `storage.rules` — current behavior + security
- [Firebase Admin Cloud Storage](https://firebase.google.com/docs/storage/admin/start) — server-side Storage access

### Secondary (MEDIUM confidence)

- Web search cross-check for Admin SDK upload patterns (aligned with official Admin Storage docs)

### Tertiary (LOW confidence)

- None blocking

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — npm registry versions verified; aligns with STACK.md and repo dependencies
- Architecture: **HIGH** — codebase paths and rules inspected directly
- Pitfalls: **HIGH** for Storage/auth mismatch; **MEDIUM** for token-flow edge cases pending product choice

**Research date:** 2026-04-01  
**Valid until:** ~2026-05-01 (review if Firebase Storage rules or `react-signature-canvas` release channel changes)
