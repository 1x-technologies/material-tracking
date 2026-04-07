# Phase 05: Scan Processing & Status Workflow — Research

**Researched:** 2026-04-01  
**Domain:** Firestore-backed scan workflow, tRPC API, React scan UX (RF wedge + camera), derived shipment status  
**Confidence:** HIGH (codebase + CONTEXT + Firebase docs); MEDIUM (exact shipment-status precedence edge cases — specify in plan tests)

## Summary

Phase 5 replaces `ScanStubPage` with a real scan experience: **action-first** UX (D-03), **keyboard-wedge** primary input (D-01), optional **camera** decode (D-02), **strict sequential** piece transitions (D-04), **any authenticated role** on the API route (D-05). All writes stay **server-side** (Admin SDK / existing `firestore.rules` — no client writes). Piece lookup is a **`collectionGroup('pieces')` query** on `qrCode` (equals piece document ID from Phase 4). Each successful scan appends a **`PieceEvent`** to the piece’s `events` array (D-10), updates piece status and timestamps as needed, then **recomputes and writes parent shipment status** (D-06). The web app must **widen `/scan` route access** from `driver`+`admin` to **any signed-in user** (D-05). **Sonner** and **html5-qrcode** are named in STACK.md but are **not yet** in `apps/web/package.json` — add them (or explicitly choose native toast / zxing-wasm per discretion).

**Primary recommendation:** Implement `shipment.processScan` (or `scan.process`) as a **`protectedProcedure`** using **`db.runTransaction`**: collection-group lookup by `qrCode` → validate shipment not `cancelled` → validate transition → update piece (status + `FieldValue.arrayUnion` event + `updatedAt`; set `deliveredAt` / `completedAt` when applicable) → fetch sibling pieces for that shipment → derive shipment fields → update shipment. Mirror contracts in `processScanSchema` / `ScanResult`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

From **Phase 5 CONTEXT — Implementation Decisions (D-01 … D-11)**:

- **D-01:** Auto-focused text input on the scan page; RF scanner types QR value + Enter → auto-submit; clear input after submission.
- **D-02:** “Scan with Camera” button opens viewfinder overlay (`html5-qrcode` or `zxing-wasm`); on decode, same path as RF; dismiss closes overlay.
- **D-03:** User selects action **before** scanning: In Transit / Delivered / Completed; session applies selected action to all scans.
- **D-04:** Strict sequential lifecycle — no skipping (Created → In Transit → Delivered → Completed); API rejects invalid skips.
- **D-05:** **Any authenticated user** may scan (not Driver-only); Staff and Admin included.
- **D-06:** Derived shipment status: all Created → `created`; any In Transit → `in_transit`; mixed Delivered/other → `partially_delivered` (e.g. “Partially Delivered 3/5”); all Delivered → `delivered`; all Completed → `completed`; `cancelled` overrides all.
- **D-07:** Toast + inline card list on success; list accumulates for the session.
- **D-08:** Inline red error below input on failure; clear on next attempt.
- **D-09:** Audio success beep / error buzz (e.g. Web Audio API).
- **D-10:** Events in piece document `events[]` as `PieceEvent` (action, timestamp, userId, userName, optional location); no subcollection.
- **D-11:** Basic chronological events list on shipment detail (`ShipmentFormPage`) — piece number, action, who, when; rich timeline deferred to Phase 9.

### Claude's Discretion

- Camera library: `html5-qrcode` vs `zxing-wasm`
- Action selector UI: radio / segmented / dropdown
- Toast: Sonner vs native
- Audio: files vs oscillators
- Scan count on selector (“In Transit — 5 scanned”): optional
- Derived status: synchronous in API vs Firestore trigger
- `location` on `PieceEvent`: profile `locationId`, prompt, or omit in Phase 5

### Deferred Ideas (OUT OF SCOPE)

- Batch scan confirm-all (Phase 6 / SCAN-07)
- Signature at scan (Phase 6 / SCAN-08)
- Photo at scan (Phase 6 / SCAN-09)
- Full timeline (Phase 9)
- Offline scan queue (out of scope per PROJECT.md)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SCAN-01 | RF scanner (keyboard wedge) | D-01: auto-focus `input`, `onKeyDown` Enter submit; trim QR string |
| SCAN-02 | Camera fallback | D-02: add `html5-qrcode@2.3.8` or `zxing-wasm@3.0.2`; HTTPS/localhost for `getUserMedia` |
| SCAN-03 | Four-stage lifecycle | D-04: map `action` → next `PieceStatus`; reject wrong current status |
| SCAN-04 | Per-piece tracking in multi-piece | Single piece updated per request; shipment derived from **all** pieces under parent |
| SCAN-05 | Derived shipment status + partial label | D-06: deterministic aggregation after each scan; store `status` + optional `deliveredCount`/`pieceCount` for label |
| SCAN-06 | Who / what / when | D-10: `PieceEvent` + ctx.user; Firestore `Timestamp` for event time |
</phase_requirements>

## Project Constraints (from `.cursor/rules/`)

- **Stack:** React 19 + Vite 8 + Tailwind; Firestore nested `pieces` under `shipments`; Firebase Auth (Google Workspace); Cloud Functions v2 + Cloud Run per PROJECT.md (this phase implements via existing **Node tRPC API** + Admin SDK — align with “no client writes”).
- **Model:** Pieces as subcollections; denormalized fields where already established; status lifecycle Created → In Transit → Delivered → Completed.
- **Roles:** Admin, Driver, Staff — Phase 5 scan uses **auth only**, not Driver-only (D-05).

## Standard Stack

### Core

| Library | Version (verified 2026-04-01) | Purpose | Why Standard |
|---------|----------------------------------|---------|--------------|
| `@trpc/server` / client | ^11.16.0 (repo) | Scan mutation + types | Already used; shared `AppRouter` typing |
| `firebase-admin` | repo | Transactional writes, collection group | Bypasses rules; single authority for scans |
| `zod` + `processScanSchema` | shared | Input validation | Already defines `qrCode` + `action` |
| `html5-qrcode` | **2.3.8** (npm) | Camera QR | STACK.md; maintenance mode but stable for v1 |
| `zxing-wasm` | **3.0.2** (npm) | Camera QR alt | Actively maintained; discretion choice |
| `sonner` | **2.0.7** (npm) | Toasts (D-07) | STACK.md; **not installed in web yet** |

### Supporting

| Library | Purpose | When |
|---------|---------|------|
| Web Audio API (built-in) | Beep/buzz (D-09) | No extra deps; CONTEXT suggests oscillators |
| `date-fns` | Format times in lists | Optional; match existing app patterns |

### Alternatives Considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Synchronous derive in API | Firestore trigger | Trigger adds latency/complexity for “immediate” UI; CONTEXT lists as discretion — **default: synchronous** for simpler E2E |
| `html5-qrcode` | `zxing-wasm` | WASM bundle + API differences; better long-term maintenance |
| Sonner | Native / inline | Less dep; more UI code |

**Installation (web):**

```bash
pnpm --filter @material-tracking/web add html5-qrcode sonner
# optional alternative camera path:
# pnpm --filter @material-tracking/web add zxing-wasm
```

**Version verification:** `npm view html5-qrcode version` → 2.3.8; `npm view zxing-wasm version` → 3.0.2; `npm view sonner version` → 2.0.7.

## Architecture Patterns

### Recommended flow

1. **Router:** Add `shipment.processScan` (or dedicated `scanRouter` merged in `appRouter`) as **`protectedProcedure`** with `processScanSchema`.
2. **Lookup:** `db.collectionGroup('pieces').where('qrCode', '==', trimmedQr).limit(2)` — assert exactly one doc; path gives `shipmentId` from parent.
3. **Transaction:** Read piece + shipment + (after update) all pieces under `shipments/{id}/pieces` for derivation, or re-query pieces inside transaction (watch read/write limits).
4. **Transition table (D-04):**

| `action` (input) | Required current `piece.status` | New `piece.status` |
|------------------|----------------------------------|-------------------|
| `in_transit` | `created` | `in_transit` |
| `delivered` | `in_transit` | `delivered` |
| `completed` | `delivered` | `completed` |

Reject if already at target or ahead (idempotent policy: **reject** per D-08 examples).

5. **Event payload:** `{ action, timestamp: FieldValue.serverTimestamp() or Timestamp.now(), userId, userName }` — align with `PieceEvent`; optional `location` from discretion.
6. **Shipment update:** After piece write, compute D-06. Suggested **evaluation order** (planner: encode in pure function + unit tests):

   - If `shipment.status === 'cancelled'` → reject scan (or no-op; **reject** is safer).
   - If every piece `completed` → `shipment.status = completed`.
   - Else if every piece `delivered` (none less) → `delivered`.
   - Else if **any** piece `in_transit` → `in_transit`.
   - Else if **any** piece `delivered` and not all delivered → `partially_delivered` + counts for label.
   - Else → `created`.

   *Note:* D-06 bullet list implies **“any in transit”** dominates **partially delivered** (e.g. mix of in_transit and delivered → `in_transit`). Encode explicitly in tests.

7. **API response:** Match `ScanResult` (`pieceId`, `shipmentId`, `newStatus`, `shipmentNumber`, `pieceNumber`) for the web list + toast.

### Web structure

```
apps/web/src/
├── pages/ScanPage.tsx          # replaces ScanStubPage
├── components/scan/
│   ├── ActionSelector.tsx
│   ├── ScanInput.tsx           # ref + autofocus + Enter
│   ├── CameraScanOverlay.tsx   # html5-qrcode / zxing
│   ├── ScannedPiecesList.tsx
│   └── scanSounds.ts           # Web Audio helpers
```

### Anti-patterns

- **Client-side Firestore writes for scan:** Rules forbid writes; keep all mutations in API.
- **Lookup piece by doc ID without parent:** QR encodes **piece doc id** (`qrCode`); subcollection path requires group query or two-step lookup — **collection group** is correct.
- **Non-transactional read/modify/write:** Concurrent scans on same shipment → lost updates; **use transaction** (or batched writes with careful contention handling — prefer transaction).

## Don’t Hand-Roll

| Problem | Don’t build | Use instead | Why |
|---------|-------------|-------------|-----|
| Camera access + decode | Raw `getUserMedia` + custom decoder | `html5-qrcode` or `zxing-wasm` | Browser quirks, continuous scan, torch |
| Toast stack / a11y | Custom | `sonner` (STACK) | D-07, tested patterns |
| Auth on scan route | Custom role checks scattered | `protectedProcedure` + route guard aligned with D-05 | Single source of truth |

**Key insight:** The expensive part is **correct transactional semantics** and **deterministic shipment aggregation**, not the QR string parsing.

## Common Pitfalls

### Pitfall 1: Missing collection-group index on `qrCode`

**What goes wrong:** First `collectionGroup('pieces').where('qrCode','==', x)` fails at runtime with “index required” link.  
**Why:** `firestore.indexes.json` currently has a `pieces` **collection group** index on `status` + `updatedAt`, **not** on `qrCode`.  
**How to avoid:** Add a `COLLECTION_GROUP` index on `pieces` with field `qrCode` ASC (deploy + emulator).  
**Warning signs:** Error message includes URL to create index in console.

### Pitfall 2: `arrayUnion` and object identity

**What goes wrong:** Duplicate events if client retries and server uses plain push without idempotency.  
**Why:** Retries or double-submit.  
**How to avoid:** Transaction + unique `timestamp`/nonce per event, or accept rare duplicates and dedupe in UI only — prefer **idempotent scan key** (optional Phase 5+). Minimum: **one mutation per Enter** and disable button while pending.

### Pitfall 3: Type drift `PieceEvent.timestamp`

**What goes wrong:** `PieceEvent` type uses `Date`; Firestore returns `Timestamp`.  
**Why:** tRPC serialization / `listPieces` consumers.  
**How to avoid:** Serialize to ISO string in API outputs or use `superjson` if already in stack; **planner:** check existing `listPieces` response handling.

### Pitfall 4: `/scan` still role-gated

**What goes wrong:** Staff users cannot open scan page despite D-05.  
**Why:** `App.tsx` uses `RequireRole(["driver","admin"])`.  
**How to avoid:** Use `AuthGate` only or `allowedRoles={["admin","driver","staff"]}`.

### Pitfall 5: Shipment cancel vs scan

**What goes wrong:** `cancel` only when shipment `created` today — but D-08 mentions cancelled scans.  
**Why:** Defensive API should still **reject** scans when `shipment.status === 'cancelled'` for data integrity / future rules.

### Pitfall 6: Camera on non-secure origin

**What goes wrong:** `getUserMedia` fails on arbitrary HTTP hosts.  
**Why:** Browser policy.  
**How to avoid:** Dev on `localhost` or HTTPS; document for tablet deployment.

## Code Examples

### Collection group lookup (Admin SDK) — pattern

```typescript
// Pattern: Firebase Admin — collection group query (see Firebase docs / query-data)
const snap = await db
  .collectionGroup("pieces")
  .where("qrCode", "==", qrTrimmed)
  .limit(2)
  .get();
if (snap.empty) throw new TRPCError({ code: "NOT_FOUND", message: "UNKNOWN_QR" });
if (snap.size > 1) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DUPLICATE_QR" });
const pieceRef = snap.docs[0].ref;
const shipmentId = pieceRef.parent.parent!.id;
```

### Scan input (RF wedge) — pattern

```tsx
// Auto-focus + Enter to submit (D-01)
<input
  ref={inputRef}
  autoFocus
  value={buffer}
  onChange={(e) => setBuffer(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitScan(buffer);
      setBuffer("");
    }
  }}
/>
```

### Web Audio beep — pattern

```typescript
// D-09 — short success tone (browser autoplay policies: call after user gesture if needed)
const ctx = new AudioContext();
const o = ctx.createOscillator();
const g = ctx.createGain();
o.connect(g);
g.connect(ctx.destination);
o.frequency.value = 440;
g.gain.value = 0.08;
o.start();
o.stop(ctx.currentTime + 0.15);
```

**Sources:** [Firebase — queries & collection groups](https://firebase.google.com/docs/firestore/query-data/queries#collection-group-query); project files cited below.

## State of the Art

| Old | Current | Impact |
|-----|---------|--------|
| Scan stub only | Full RF + camera + API | Core operational workflow |
| Driver-only `/scan` | Any authenticated user (D-05) | Staff can cover for drivers |

**Deprecated / caution:** `html5-qrcode` maintenance mode — monitor; `zxing-wasm` as migration path (STACK.md).

## Open Questions

1. **Partially delivered display field**  
   - *Known:* D-06 wants “Partially Delivered 3/5”.  
   - *Unclear:* Whether `shipmentNumber`-style string is stored vs computed client-side from `deliveredCount`/`pieceCount`.  
   - *Recommendation:* Store numeric `deliveredPieceCount` + `pieceCount` on shipment; format label in UI/API consistently.

2. **`shipment.getById` is `staffProcedure`**  
   - *Known:* Drivers cannot open `/shipments/:id` today.  
   - *Unclear:* Whether drivers need read-only shipment view in v1.  
   - *Recommendation:* Phase 5 scope is scan page + staff detail events (D-11); defer driver detail access unless product asks.

3. **Derived status async trigger**  
   - *Known:* Discretion allows Cloud Function.  
   - *Recommendation:* Default **synchronous** in tRPC for immediate `ScanResult` and simpler tests; revisit if write volume grows.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | API / web build | ✓ | v25.2.1 | — |
| pnpm | Monorepo | ✓ | 10.0.0 | — |
| Firebase CLI | Indexes / emulators | ✓ | 15.12.0 | Deploy index link from error |
| Physical RF scanner | UAT SCAN-01 | — | — | Manual keyboard test |
| Tablet + HTTPS | UAT SCAN-02 | — | — | localhost dev |

**Missing dependencies with no fallback:** None for coding; hardware for full UAT.

**Step 2.6 note:** No rename/migration phase — **Runtime State Inventory omitted** (greenfield feature).

## Validation Architecture

(`workflow.nyquist_validation` is **true** in `.planning/config.json`.)

### Test framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 |
| Config | Per-package default (`apps/api`, `apps/web`) |
| Quick run | `pnpm --filter @material-tracking/api test` |
| Full suite | `pnpm test` (workspace `-r`) |

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | File |
|--------|----------|-----------|-------------------|------|
| SCAN-01 | Enter submits trimmed QR | unit / component | `pnpm --filter @material-tracking/web test` | New `ScanInput` test (Wave 0) |
| SCAN-02 | Camera module loads / mock decode | integration (optional) | vitest + jsdom mocks | Deferred or mocked |
| SCAN-03 | Transition matrix + skip rejection | unit | `pnpm --filter @material-tracking/api test` | Extend `shipment-router.test.ts` or `scan-logic.test.ts` |
| SCAN-04 | One piece updated, siblings unchanged | unit (transaction mock) | same | same |
| SCAN-05 | Aggregation outputs correct `shipment.status` | unit | same | Pure function `deriveShipmentStatus(pieces, shipment)` |
| SCAN-06 | Event contains user + action | unit | same | Assert `arrayUnion` payload shape |

### Sampling rate

- Per task: `pnpm --filter @material-tracking/api test` (fastest signal for API).
- Phase gate: `pnpm test` green.

### Wave 0 gaps

- [ ] Pure function module `deriveShipmentStatus` (or equivalent) + tests — covers SCAN-05.
- [ ] `processScan` mutation tests with extended Firestore mocks (`collectionGroup`, `runTransaction`) — covers SCAN-03/04/06.
- [ ] Web: minimal `ScanInput` Enter-submit test — covers SCAN-01.

## Sources

### Primary (HIGH)

- `.planning/phases/05-scan-processing-status-workflow/05-CONTEXT.md` — D-01–D-11, scope, discretion, deferred.
- `packages/shared/src/schemas/scan.ts`, `types/scan.ts`, `types/piece.ts`, `enums.ts` — contracts.
- `apps/api/src/routers/shipment.ts` — piece shape, `qrCode`, `listPieces`.
- `apps/api/src/middleware/auth.ts` — `protectedProcedure`.
- `firestore.rules` — no client writes.
- `firestore.indexes.json` — existing `pieces` group index; gap for `qrCode`.
- [Firebase Firestore — queries / collection groups](https://firebase.google.com/docs/firestore/query-data/queries#collection-group-query).
- `.planning/research/STACK.md` — html5-qrcode, zxing-wasm, Sonner.

### Secondary (MEDIUM)

- `npm view` registry versions (2026-04-01).

### Tertiary (LOW)

- None critical.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — repo + npm verify.
- Architecture: **HIGH** — matches Firestore + Phase 4 `qrCode` model.
- Pitfalls: **MEDIUM-HIGH** — index + route gate verified in repo files.

**Research date:** 2026-04-01  
**Valid until:** ~2026-05-01 (revisit if Firestore index policy or tRPC major bump).
