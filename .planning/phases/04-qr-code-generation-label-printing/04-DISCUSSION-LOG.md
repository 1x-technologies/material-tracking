# Phase 4: QR Code Generation & Label Printing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 04-qr-code-generation-label-printing
**Areas discussed:** QR content & format, Label layout & content, Print workflow & Zebra integration, Reprint & label lifecycle

---

## 1. QR content & format

### What data should the QR code encode?

| Option | Description | Selected |
|--------|-------------|----------|
| Piece document ID only | e.g., "abc123" — scanner resolves to Firestore path; smallest QR, fastest scan | ✓ |
| App URL | e.g., "https://app.1x.tech/p/abc123" — scannable by any phone camera | |
| Structured string | e.g., "MT:shipmentId:pieceNumber" — self-describing, works offline for ID parsing | |

**User's choice:** Piece document ID only

### QR error correction level?

| Option | Description | Selected |
|--------|-------------|----------|
| High (H) | 30% damage tolerance; best for warehouse/logistics labels | ✓ |
| Medium (Q) | 25% damage tolerance; good balance | |
| Low (M/L) | Smaller QR but less damage tolerance | |

**User's choice:** High (H)

### When should the piece's qrCode field be updated?

| Option | Description | Selected |
|--------|-------------|----------|
| At shipment creation | Replace placeholder in create transaction — QR ready immediately | ✓ |
| When labels are first generated | Separate API call — decouples create from QR logic | |
| Claude's discretion | | |

**User's choice:** At shipment creation

---

## 2. Label layout & content

### Label size

| Option | Description | Selected |
|--------|-------------|----------|
| 4×6" | Standard shipping label — lots of room | |
| 4×3" | Medium, common for internal logistics | ✓ |
| 2×1" | Compact, QR + minimal text | |
| Other | Not sure yet | |

**User's choice:** 4×3"

### Label information

| Option | Description | Selected |
|--------|-------------|----------|
| Full | Shipment #, piece notation, sender, receiver, origin → destination, priority, category, description | ✓ |
| Medium | Shipment #, piece notation, sender/receiver names, origin → destination, priority | |
| Minimal | Shipment #, piece notation, origin → destination | |
| Claude's discretion | Based on label size | |

**User's choice:** Full information

### Multi-piece notation style

| Option | Description | Selected |
|--------|-------------|----------|
| Fraction | "1/5", "2/5" — clear and standard | ✓ |
| Spelled out | "Piece 1 of 5" | |
| Claude's discretion | | |

**User's choice:** Fraction notation

---

## 3. Print workflow & Zebra integration

### Print trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Auto after create | Redirect to preview + print screen | |
| Separate button | "Print Labels" button on detail/edit page | ✓ |
| Both | Auto-redirect after create + reprint button | |

**User's choice:** Separate "Print Labels" button

### Label preview

| Option | Description | Selected |
|--------|-------------|----------|
| HTML/CSS preview | On-screen rendering showing what label looks like | ✓ |
| PDF preview | Generate PDF for preview and optional download | |
| Both | HTML preview + PDF download button | |

**User's choice:** HTML/CSS preview

### No Zebra agent fallback

| Option | Description | Selected |
|--------|-------------|----------|
| PDF fallback | Download PDF, print from OS dialog | |
| Error | Show error with installation/start instructions | ✓ |
| Both | Error + offer PDF download | |

**User's choice:** Error with instructions only

### Print scope

| Option | Description | Selected |
|--------|-------------|----------|
| All at once | Print all labels for shipment in one batch | ✓ |
| Individual | Print one at a time, choose pieces | |
| Default all + select | Default all, user can deselect | |

**User's choice:** All labels in one batch

---

## 4. Reprint & label lifecycle

### Reprint location

| Option | Description | Selected |
|--------|-------------|----------|
| Detail page | Accessible from dashboard/history | |
| Edit page only | | |
| Both pages | Detail and edit | ✓ |

**User's choice:** Both detail and edit pages

### Reprint visual distinction

| Option | Description | Selected |
|--------|-------------|----------|
| No mark | Identical to original | |
| Watermark | Add "REPRINT" text | |
| Custom | User specifies how many labels to print | ✓ |

**User's choice:** User can specify how many labels to print (select pieces + copy count per piece)
**Notes:** Clarified as both: select which pieces to reprint AND specify number of copies of each. No visual watermark — reprints identical to originals.

### Reprint status restriction

| Option | Description | Selected |
|--------|-------------|----------|
| Any status | Labels might be damaged/lost at any stage | ✓ |
| Created only | Simpler but limits use | |
| Not cancelled | Any except Cancelled | |

**User's choice:** Any shipment status

---

## Claude's Discretion

- ZPL command construction approach (fluent-zpl vs raw templates)
- QR size and text positioning on 4×3" label
- Whether `labelUrl` is populated or labels generated on-demand
- Zebra printer discovery vs Location.printers[] configuration
- Preview layout (grid vs list)
- Copy count input UX in reprint dialog

## Deferred Ideas

- PDF label generation as fallback/download
- Printer management admin UI (Phase 10)
- Label template customization
