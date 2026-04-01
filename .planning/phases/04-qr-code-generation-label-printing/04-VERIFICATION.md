---
phase: 04-qr-code-generation-label-printing
verified: 2026-04-01T16:30:00Z
status: passed
score: 10/10 checklist items verified
re_verification: false
---

# Phase 4: QR Code Generation & Label Printing — Verification Report

**Phase goal:** Users can generate, preview, and print QR code labels via Zebra printers for every piece in a shipment.

**Verified:** 2026-04-01 (initial verification; no prior `*-VERIFICATION.md` in phase directory).

**Status:** **passed** — All ten requested checks and automated tests pass. End-to-end printing against a live Zebra agent and printer remains human-verifiable (ROADMAP success criterion 3).

## Checklist (user-requested)

| # | Check | Result | Evidence |
|---|--------|--------|----------|
| 1 | `qrCode = pieceRef.id` in shipment create; no `pending:` placeholders | **PASS** | `shipment.ts` L87 `qrCode: pieceRef.id`; `grep pending:` on file — no matches |
| 2 | `listPieces` query exists; returns pieces ordered by `pieceNumber` | **PASS** | `shipment.ts` L180–197: `listPieces` + `.orderBy("pieceNumber", "asc")` |
| 3 | `LabelPreviewCard` renders `QRCodeSVG` with `level="H"` | **PASS** | `LabelPreviewCard.tsx` L34–38 |
| 4 | `buildLabelZpl` generates ZPL for 4×3" @ 203 DPI | **PASS** | `buildLabelZpl.ts` L10 `Label.create({ w: 812, h: 609, dpi: 203 })`; ZPL contains `^PW812` / `^LL609` |
| 5 | `browserPrint.ts`: `checkAgent`, `discoverPrinters`, `sendZpl`; `agent_unavailable` error type | **PASS** | `browserPrint.ts` L19–118; `BrowserPrintError` includes `agent_unavailable` |
| 6 | `PrintLabelsDialog` and `ReprintLabelsDialog` exist | **PASS** | Both components under `apps/web/src/components/shipment/` with named exports |
| 7 | `ShipmentFormPage` has Print Labels / Reprint Labels buttons | **PASS** | `ShipmentFormPage.tsx` L265–280 |
| 8 | Detail route `/shipments/:shipmentId` in `App.tsx` | **PASS** | `App.tsx` L59–65; `/edit` route above for specificity |
| 9 | `ReprintLabelsDialog` copy count functionality | **PASS** | `PieceSelection.copies`, `setCopies` (clamp 1–10), `totalCopies`, `expandedLabels` loop + `buildBatchZpl` |
| 10 | TypeScript compiles for `api` and `web` | **PASS** | `cd apps/api && npx tsc --noEmit` and `cd apps/web && npx tsc --noEmit` — exit code 0 |

**Score:** 10/10

### Key code references

```82:94:apps/api/src/routers/shipment.ts
      for (let i = 1; i <= input.pieceCount; i++) {
        const pieceRef = db.collection(`shipments/${shipmentId}/pieces`).doc();
        tx.set(pieceRef, {
          shipmentId,
          pieceNumber: i,
          qrCode: pieceRef.id,
          status: "created",
          events: [],
          currentLocation: origin,
          photoUrls: [],
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
```

```180:197:apps/api/src/routers/shipment.ts
  listPieces: protectedProcedure
    .input(z.object({ shipmentId: z.string().min(1) }))
    .query(async ({ input }) => {
      const shipmentSnap = await db.doc(`shipments/${input.shipmentId}`).get();
      if (!shipmentSnap.exists) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Shipment not found" });
      }

      const piecesSnap = await db
        .collection(`shipments/${input.shipmentId}/pieces`)
        .orderBy("pieceNumber", "asc")
        .get();

      return piecesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }),
```

```34:39:apps/web/src/components/shipment/LabelPreviewCard.tsx
        <QRCodeSVG
          value={label.qrCode}
          level="H"
          size={120}
          marginSize={2}
        />
```

## Goal achievement (ROADMAP success criteria)

| # | Criterion | Automated status | Notes |
|---|-----------|------------------|-------|
| 1 | Unique QR per piece | ✓ VERIFIED | Firestore doc ID as `qrCode` at create |
| 2 | Preview labels with details and 1/N notation | ✓ VERIFIED | `LabelPreviewCard` + dialog grids; `pieceFraction` |
| 3 | Labels print on networked Zebra printers | ? HUMAN | Code path: `buildBatchZpl` → `sendZpl` → `POST` localhost:9100; physical/agent success not exercised here |
| 4 | Reprint for existing shipments | ✓ VERIFIED | `ReprintLabelsDialog` + `listPieces`-backed `labels` on `ShipmentFormPage` |

## Requirements (QRPR-01 — QRPR-04)

| ID | Status | Evidence |
|----|--------|----------|
| QRPR-01 | ✓ SATISFIED | `qrCode: pieceRef.id`; unique per piece doc |
| QRPR-02 | ✓ SATISFIED | Pre-print preview in `PrintLabelsDialog` / `ReprintLabelsDialog` via `LabelPreviewCard` |
| QRPR-03 | ✓ SATISFIED (code) | ZPL 4×3 @ 203 DPI; batch print; fraction in ZPL; Browser Print integration |
| QRPR-04 | ✓ SATISFIED | Selective reprint with per-piece copy counts |

## Key links (Plan 03)

| Link | Status |
|------|--------|
| `PrintLabelsDialog` → `buildBatchZpl` + `sendZpl` | ✓ WIRED |
| `ReprintLabelsDialog` → `buildBatchZpl` + `sendZpl` | ✓ WIRED |
| `ShipmentFormPage` → `trpc.shipment.listPieces` | ✓ WIRED |
| `App.tsx` → `ShipmentFormPage` at `shipments/:shipmentId` | ✓ WIRED |

## Behavioral spot-checks

| Check | Command / action | Result |
|-------|------------------|--------|
| API tests | `pnpm --filter @material-tracking/api exec vitest run` | PASS (35 tests) |
| Web tests | `pnpm --filter @material-tracking/web exec vitest run` | PASS (16 tests) |
| API `tsc` | `cd apps/api && npx tsc --noEmit` | PASS |
| Web `tsc` | `cd apps/web && npx tsc --noEmit` | PASS |
| ZPL dimensions | `buildLabelZpl` output contains `^PW812` and `^LL609` | PASS |

## Anti-patterns

No blocking TODO/FIXME/placeholder patterns found in `PrintLabelsDialog.tsx` scan. Shipment router has no `pending:` QR placeholder.

## Human verification recommended

1. **Zebra Browser Print + physical print**  
   **Test:** Install/run Browser Print, connect printer, open a shipment, Print All / Reprint with copies.  
   **Expected:** Labels emerge with correct QR, text, and 1/N.  
   **Why human:** Requires local agent, printer, and media; not validated in CI.

2. **Agent unavailable UX**  
   **Test:** With agent stopped, open Print Labels.  
   **Expected:** Red alert with `agent_unavailable` message and installation instructions.  
   **Why human:** UI copy and layout judgment.

---

_Verifier: Claude (gsd-verifier)_  
_No `gaps:` frontmatter — status passed._
