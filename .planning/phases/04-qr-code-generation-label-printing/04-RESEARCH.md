# Phase 04: QR Code Generation & Label Printing - Research

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**QR content and format**

- **D-01:** QR code encodes **piece document ID only** (e.g., `"abc123"`) — the scanning app (Phase 5) resolves this to the Firestore path `shipments/{shipmentId}/pieces/{pieceId}`. Minimal payload = smallest QR = fastest scan.
- **D-02:** QR **error correction level H** (High — 30% damage tolerance) — labels live in warehouse/vehicle environments where dirt and damage are likely.
- **D-03:** The `qrCode` field on each piece document is set to the **final piece document ID at creation time** inside the shipment create transaction — no placeholder `"pending:..."` values. The Phase 3 create procedure must be updated to use the auto-generated Firestore document ID as the QR value (or if piece IDs are auto-generated, capture them and write back).

**Label layout and content**

- **D-04:** Label size is **4×3 inches** — medium format, fits networked Zebra printers at both HA and SC locations.
- **D-05:** Labels include **full information**: shipment number, piece notation (fraction), sender name, receiver name, origin → destination, priority, category, and description (truncated if needed to fit).
- **D-06:** Multi-piece notation uses **fraction style**: `1/5`, `2/5`, etc. Single-piece shipments show `1/1`.

**Print workflow and Zebra integration**

- **D-07:** Printing is triggered via a **separate "Print Labels" button** on the shipment detail/edit page — NOT automatically after creation. User navigates to the shipment and explicitly chooses to print.
- **D-08:** Label preview uses **HTML/CSS rendering** on screen showing what the label will look like — no server-side PDF generation. Preview displays all labels in a scrollable grid or list before the user confirms print.
- **D-09:** If Zebra Browser Print agent is **not running**, show an **error message with installation/start instructions** — no PDF download fallback in this phase.
- **D-10:** Print sends **all labels for the shipment in one batch** to the Zebra printer by default.

**Reprint and label lifecycle**

- **D-11:** "Print Labels" / "Reprint Labels" action available on **both** shipment detail and edit pages.
- **D-12:** Reprint dialog allows users to **select which pieces** to reprint AND specify **number of copies** per piece (e.g., print 3 copies of piece 2/5 only). No visual "REPRINT" watermark — reprints are identical to originals.
- **D-13:** Reprint allowed at **any shipment status** (Created, In Transit, Delivered, Completed) — labels may be lost/damaged at any stage. Only `Cancelled` shipments may optionally hide the action (Claude's discretion).

### Claude's Discretion

- ZPL command construction approach: whether to use `@schie/fluent-zpl` library or raw ZPL template strings
- Exact QR size on 4×3" label and positioning of text fields around QR
- Whether `labelUrl` field on `Piece` is populated (with a stored image/PDF URL) or left empty (labels generated on-demand from piece data)
- Zebra Browser Print discovery flow: auto-discover printers vs manual IP entry vs use `Location.printers[]` configuration
- Preview layout: grid of label cards vs vertical list
- Copy count input UX in reprint dialog (stepper vs dropdown vs text input)

### Deferred Ideas (OUT OF SCOPE)

- **PDF label generation** — server-side PDF via Cloud Functions for email/download; currently HTML preview only per D-08/D-09
- **Printer management admin UI** — Phase 10 admin panel for configuring printers per location
- **Label template customization** — configurable label layouts beyond the fixed 4×3" format

### Reviewed Todos (not folded)

None.

</user_constraints>

**Researched:** 2026-04-01  
**Domain:** Client QR rendering, ZPL label generation, Zebra Browser Print integration, Firestore piece `qrCode`  
**Confidence:** MEDIUM-HIGH (library APIs verified on npm/README; Browser Print behavior depends on local agent — validate on target tablets)

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **QRPR-01** | System generates unique QR code for each piece in a shipment | D-01/D-02/D-03: store `pieceId` in `qrCode` at create; preview/print use same value; `qrcode.react` `level="H"` for on-screen QR; ZPL `^BQ` (or `@schie/fluent-zpl` `.qr()`) for printed QR |
| **QRPR-02** | User can preview labels before printing | D-08: HTML/CSS cards sized to 4×3 aspect ratio; `QRCodeSVG`/`QRCodeCanvas` + typography; scrollable grid/list |
| **QRPR-03** | Labels print to networked Zebra printers with multi-piece notation (1/5, 2/5, etc.) | D-04–D-06, D-10: ZPL at 203 DPI `^PW812` × `^LL609`; fraction string; Zebra Browser Print `send` raw ZPL; batch concatenate jobs per D-10 |
| **QRPR-04** | User can reprint labels for existing shipments | D-07, D-11–D-13: reprint UI (piece selection + copies); works whenever shipment not hidden (e.g. non-cancelled); same ZPL/HTML builders as first print |

</phase_requirements>

## Summary

Phase 04 is a **dual-output** problem: **HTML/CSS** for faithful on-screen preview (D-08) and **ZPL** for physical labels via **Zebra Browser Print** (D-09, D-10). The **source of truth** for “what to encode in the QR” is the Firestore piece document ID, persisted in `Piece.qrCode` at creation (D-03), replacing the current `pending:${shipmentId}:${i}` placeholder in `shipment.create` (see `apps/api/src/routers/shipment.ts`). Phase 5 will treat `qrCode` as an opaque ID and resolve `shipments/{shipmentId}/pieces/{pieceId}` — planners must keep the payload minimal (D-01).

**Zebra Browser Print** is not a pure npm dependency: it is a **browser JS SDK** plus a **locally installed service** that bridges the browser to USB/network/BT printers. **STATE.md** flags this as a blocker to validate on shared tablets during Phase 4. There is **no PDF fallback** in scope (deferred).

**Primary recommendation:** Implement **one shared TypeScript “label model”** (piece + denormalized shipment fields) consumed by (1) a React preview component using **`qrcode.react`** with `level="H"`, and (2) a **ZPL builder** using **`@schie/fluent-zpl`** (or raw ZPL with a single helper), then send the concatenated ZPL through Browser Print with clear agent-missing UX (D-09).

## Project Constraints (from .cursor/rules/)

From `gsd-project.mdc` (Material Tracking):

- **Frontend:** React 19 + Vite 8 + Tailwind CSS + Untitled UI React components.
- **Data:** Cloud Firestore; pieces as **nested subcollections** under shipments; **no client writes** to shipments/pieces (tRPC API + Admin SDK).
- **Auth:** Firebase Auth + Google Workspace SSO; roles include **Staff** (create/print), **Driver**, **Admin**.
- **Backend split:** Cloud Functions v2 + Cloud Run for heavy work; this phase is primarily **web + API reads/writes** already established.
- **Real-time:** Firestore `onSnapshot` for dashboard later — printing can use **tRPC queries** (`getById` + pieces query).

Planners must **not** rely on client-side Firestore writes for label data; any mutation stays in **`staffProcedure`** patterns.

## Standard Stack

### Core

| Library | Version (verified) | Purpose | Why Standard |
|---------|-------------------|---------|--------------|
| **qrcode.react** | **4.2.0** (npm, published 2024-12-11) | SVG/Canvas QR in React | Official README documents `level: 'L' \| 'M' \| 'Q' \| 'H'` — satisfies **D-02** via `level="H"` |
| **@schie/fluent-zpl** | **1.0.0** (npm, published 2026-03-19) | Type-safe ZPL (`Label`, `.qr()`, `.text()`, DPI/units) | STACK.md cited **0.13.0** — **superseded**; use **^1.0.0** or latest 1.x |
| **Zebra Browser Print** | **1.0.x** (vendor JS + local agent) | Discover printers, `send()` raw ZPL | Official Zebra path for browser → Zebra; **requires local app** |
| **qrcode** (Node) | **1.5.4** (npm) | Server-side QR buffers/data URLs | **Optional for Phase 4** — D-08 is HTML-only; use if you add server-generated assets later |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Existing **tRPC + Zod** | workspace | `getById`, new `listPieces` / `getLabelPayload` | Fetch shipment + ordered pieces for preview/print |
| **Vitest** | ^4.1.2 | Unit tests | ZPL string snapshots, fraction formatter, create-transaction `qrCode` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| fluent-zpl | Raw ZPL templates | Faster to prototype; easier to get wrong (^PW/^LL, escaping); discretion per CONTEXT |
| Browser Print | Zebra **SendFileToPrinter** cloud API | Needs cloud + API keys; **offline / IT pushback** — forum guidance says Browser Print fits local fleet |
| HTML preview | pdf-lib / server PDF | **Explicitly deferred** |

**Installation (web + optional shared):**

```bash
pnpm --filter web add qrcode.react
pnpm add @schie/fluent-zpl --filter @material-tracking/shared   # if ZPL built in shared; else --filter web
```

**Browser Print:** bundle or copy **BrowserPrint.js** (and optional **BrowserPrint-Zebra-*.js**) from Zebra’s distribution; load before calling `BrowserPrint.getDefaultDevice` / `getLocalDevices` patterns (see Zebra user guide PDFs). **Do not assume** a single canonical GitHub URL — use vendor package tied to tested agent version.

**Version verification commands used:**

```bash
npm view qrcode.react version   # 4.2.0
npm view qrcode version         # 1.5.4
npm view @schie/fluent-zpl version  # 1.0.0
```

## Architecture Patterns

### Recommended layout

```
apps/web/src/
├── components/shipment/
│   ├── LabelPreviewCard.tsx      # HTML/CSS 4×3 aspect, qrcode.react, fields D-05
│   ├── PrintLabelsDialog.tsx     # preview grid + printer select + confirm
│   └── ReprintLabelsDialog.tsx   # piece checkboxes + copy counts D-12
├── lib/
│   ├── zebra/
│   │   ├── browserPrint.ts       # load SDK, detect agent, sendZpl, user-facing errors D-09
│   │   └── buildShipmentZpl.ts   # Piece[] + Shipment → ZPL string(s)
│   └── labelModel.ts             # shared formatters: fraction, truncate description

apps/api/src/routers/
└── shipment.ts                   # create: set qrCode = pieceRef.id; add listPieces query
```

### Pattern 1: Persist `qrCode` at creation (D-03)

**What:** For each piece in the transaction, `const pieceRef = db.collection(\`shipments/${shipmentId}/pieces\`).doc();` then `tx.set(pieceRef, { ..., qrCode: pieceRef.id, ... })`. Firestore auto-IDs are available **before** `set`.

**When to use:** Always for new pieces — eliminates placeholder and matches D-01 (encode ID only).

**Example:**

```typescript
// Pattern: Firebase Admin transaction (project code style)
const pieceRef = db.collection(`shipments/${shipmentId}/pieces`).doc();
tx.set(pieceRef, {
  shipmentId,
  pieceNumber: i,
  qrCode: pieceRef.id,
  status: "created",
  // ...
});
```

### Pattern 2: Preview QR with error correction H (D-02)

**What:** Use `qrcode.react` `QRCodeSVG` with explicit `level="H"` and `value={piece.qrCode}`.

**Example:**

```tsx
// Source: https://www.npmjs.com/package/qrcode.react
import { QRCodeSVG } from "qrcode.react";

<QRCodeSVG value={piece.qrCode} level="H" size={128} marginSize={4} />
```

### Pattern 3: ZPL label with fluent-zpl

**What:** Build `Label.create({ w: 812, h: 609, dpi: 203 })` (4×3 at 203 DPI per CONTEXT), chain `.text()` / `.qr({ text: piece.qrCode, ... })`, `.toZPL()`. Concatenate multiple labels for batch (D-10) or loop `send` per copy for reprint.

**Example:**

```typescript
// Source: https://www.npmjs.com/package/@schie/fluent-zpl
import { Label, FontFamily } from "@schie/fluent-zpl";

const zpl = Label.create({ w: 812, h: 609, dpi: 203 })
  .text({ at: { x: 20, y: 20 }, text: shipmentNumber, font: { family: FontFamily.B, h: 28, w: 28 } })
  .qr({ at: { x: 500, y: 80 }, text: piece.qrCode, module: 4 })
  .toZPL();
```

### Anti-Patterns to Avoid

- **Encoding full Firestore paths or URLs in the QR:** Violates D-01 and bloats symbols.
- **Generating different content for preview vs print:** Users will distrust preview; keep field set identical (layout may differ slightly due to CSS vs ZPL fonts).
- **Silent fallback when the agent is missing:** D-09 requires explicit error + install/start instructions.
- **Client-side Firestore writes** to fix `qrCode:** Use a **one-time Admin migration** or API fix, not web SDK.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| QR rasterization in React | Canvas math | **qrcode.react** | Spec-compliant masking, EC levels, versions |
| ZPL coordinate/escape rules | String concat only | **@schie/fluent-zpl** (or minimal raw + tests) | `^FH`, UTF-8 `^CI28`, `^PW`/`^LL` errors are easy |
| Printer discovery / raw socket from browser | WebUSB hacks | **Zebra Browser Print** | Browsers cannot talk to LAN printers safely without helper |
| Piece listing for labels | Ad hoc client Firestore queries | **tRPC + staffProcedure** | Matches security model (`firestore.rules` blocks client writes) |

**Key insight:** The hard part is **operational** (agent installed, printer reachable), not the QR string.

## Common Pitfalls

### Pitfall 1: Browser Print agent not installed or blocked

**What goes wrong:** `getLocalDevices` returns empty or connection errors; staff cannot print.  
**Why it happens:** IT image omits agent; tablet OS restrictions; HTTPS certificate trust (Safari/Firefox noted in vendor docs).  
**How to avoid:** D-09 messaging; document install steps per OS; UAT on **actual** warehouse tablets (STATE.md).  
**Warning signs:** Works on dev laptop, fails on floor.

### Pitfall 2: `qrCode` still placeholder for old shipments

**What goes wrong:** Phase 5 scans fail or resolve wrong doc.  
**Why it happens:** Only new `create` path fixed; existing docs still `pending:...`.  
**How to avoid:** Migration script or backfill job; or detect placeholder in scan UI (Phase 5) — prefer data fix in Phase 4.  
**Warning signs:** grep `pending:` in Firestore export.

### Pitfall 3: ZPL ^PW/^LL mismatch with physical media

**What goes wrong:** Cut position wrong, clipped text, or printer errors.  
**Why it happens:** Wrong DPI assumption (203 vs 300) or wrong label size.  
**How to avoid:** Lock **203 DPI** and **812×609** with printer team; test on both HA and SC models.  
**Warning signs:** First line prints, rest off-page.

### Pitfall 4: EC level H in ZPL vs HTML

**What goes wrong:** Preview uses H but ZPL defaults to lower EC; scan reliability differs.  
**Why it happens:** ZPL `^BQ` model parameter controls QR version/EC — may differ from `qrcode.react`.  
**How to avoid:** After choosing fluent-zpl vs raw, **verify** printed QR uses **high EC** (consult ZPL `^BQ` docs + library output); add **scan smoke test** with dirt/scuff if possible.

### Pitfall 5: Missing pieces API

**What goes wrong:** `getById` returns shipment only; UI cannot render per-piece labels.  
**Why it happens:** Current router has no `pieces` query (see `shipment.ts`).  
**How to avoid:** Add `shipment.listPieces` or `getShipmentForLabels` returning ordered pieces with `qrCode`, `pieceNumber`.

## Code Examples

### Fraction notation (D-06)

```typescript
function pieceFraction(pieceNumber: number, pieceCount: number): string {
  return `${pieceNumber}/${pieceCount}`;
}
```

### Batch ZPL jobs (D-10)

Concatenate `^XA...^XZ` blocks or use `ZPLProgram` multi-label patterns from fluent-zpl docs — single `send()` payload reduces round-trips.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| STACK pins fluent-zpl **0.13.0** | npm **1.0.0** (Mar 2026) | 2026 | Planner should align `package.json` to 1.x |
| Placeholder `qrCode` at create | Real doc ID in transaction | Phase 4 | Required for QRPR-01 + Phase 5 |

**Deprecated/outdated:**

- Relying on **pdf-lib** for Phase 4 labels — deferred per CONTEXT (HTML preview only).

## Open Questions

1. **Does `@schie/fluent-zpl` `.qr()` expose Zebra QR error correction equivalent to level H?**
   - *What we know:* README shows `.qr({ text, module })` only.
   - *What's unclear:* Mapping to `^BQ` EC/model parameters.
   - *Recommendation:* Inspect library types/output once installed; if EC not configurable, use `.raw()` for `^BQ` or raw ZPL fragment with documented EC.

2. **Exact shipment “detail” route vs edit-only URL (D-11)?**
   - *What we know:* `App.tsx` only registers `shipments/:shipmentId/edit` — no dedicated detail page.
   - *What's unclear:* Whether “detail” means read-only view + print, or the same page in read-only mode.
   - *Recommendation:* Add `shipments/:shipmentId` read-only detail **or** show Print/Reprint on edit page even when form is read-only (`isReadOnly` already true after status ≠ created).

3. **Printer selection source of truth**
   - *What we know:* `Location.printers[]` exists but seed arrays may be empty; Browser Print can discover devices.
   - *Recommendation:* Per discretion — start with Browser Print discovery + optional override from `printers[]` when populated.

## Environment Availability

**Step 2.6 note:** Sandbox probe did not confirm `docker` in PATH; **Node** and **pnpm** were available in workspace (`node v25.x`, `pnpm 10` during research). Re-run on target machines for CI and tablets.

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node.js | Vite, API, tests | ✓ (dev) | ≥22 per repo | — |
| pnpm | Workspace | ✓ | 10.x | — |
| Zebra Browser Print **agent** | Physical print (QRPR-03) | **TBD on tablets** | Match JS SDK | None — D-09 UX only |
| Networked Zebra printer | QRPR-03 | **Per site** | — | Labelary-style **online** ZPL render for dev only (not user-facing fallback) |
| Docker | Optional local stack | Not verified | — | Use Firebase emulators without Docker if needed |

**Missing dependencies with no fallback:**

- **Browser Print agent** on staff machines/tablets — blocks real printing until installed; plan UAT checklist.

**Missing dependencies with fallback:**

- Physical printer during dev — use ZPL file inspection / Labelary (developer-only) — **do not** expose as product fallback (D-09).

## Validation Architecture

`workflow.nyquist_validation` is **true** in `.planning/config.json` — include tests in plan.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.2 |
| Config | `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts` |
| Quick run | `pnpm --filter api test` / `pnpm --filter web test` |
| Full suite | `pnpm test` (workspace `-r`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| QRPR-01 | Each new piece gets `qrCode === pieceDocId` | unit (caller + mocked TX) | `pnpm --filter api test` | Extend `apps/api/tests/shipment-router.test.ts` ❌ |
| QRPR-01 | QR payload is piece id string | unit | assert on `set` payload | ❌ |
| QRPR-02 | Preview component renders QR + fields | component | `pnpm --filter web test` | ❌ new `LabelPreviewCard.test.tsx` |
| QRPR-03 | ZPL contains shipment #, fraction, ^BQ | unit (snapshot) | `pnpm --filter web test` or shared pkg | ❌ |
| QRPR-04 | Reprint selection produces N× ZPL blocks | unit | same | ❌ |

### Sampling Rate

- **Per task commit:** package-scoped `vitest run` for touched app.
- **Per wave merge:** `pnpm test`.
- **Phase gate:** full suite green before `/gsd-verify-work`.

### Wave 0 Gaps

- [ ] Extend **`shipment-router.test.ts`** — assert `qrCode` matches generated piece id (adjust mocks so `doc()` returns stable predictable ids).
- [ ] Add **pure function tests** for ZPL builder (recommended in `packages/shared` or `apps/web/src/lib`) — deterministic snapshots.
- [ ] **Mock `BrowserPrint`** global in web tests — avoid real agent.
- [ ] Optional Playwright later — **not** required for Phase 4 gate if unit coverage suffices.

## Sources

### Primary (HIGH confidence)

- [qrcode.react npm README](https://www.npmjs.com/package/qrcode.react) — props `level` `'H'`, `marginSize`, published **4.2.0**
- [@schie/fluent-zpl npm README](https://www.npmjs.com/package/@schie/fluent-zpl) — `Label.create`, `.qr()`, `.toZPL()`, published **1.0.0**
- Project: `apps/api/src/routers/shipment.ts`, `packages/shared/src/types/piece.ts`, `04-CONTEXT.md`

### Secondary (MEDIUM confidence)

- [Zebra — Printing from browsers with Browser Print SDK](https://developer.zebra.com/content/printing-browsers-windows-osx-and-android-zebras-browser-print-sdk) — agent + JS workflow (page fetch timed out; URL recorded for planner)
- [Zebra Browser Print user guide PDF](https://www.zebra.com/content/dam/zebra_dam/en/guide/portfolio/zebra-browser-print-user-guide-v1-3-en-us.pdf) — cited in ecosystem search
- `.planning/research/STACK.md` — stack intent (verify versions against npm)

### Tertiary (LOW confidence)

- Community JSDoc mirrors / forum threads for `BrowserPrint.getLocalDevices` — **validate** against your shipped SDK file.

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** for qrcode.react; **HIGH** for fluent-zpl existence/API shape from npm; **MEDIUM** for Zebra agent edge cases
- Architecture: **HIGH** (aligned with CONTEXT + codebase)
- Pitfalls: **MEDIUM** (operations-dependent)

**Research date:** 2026-04-01  
**Valid until:** ~2026-05-01 (re-check fluent-zpl + Browser Print if upgrading)
