# Phase 5: Scan Processing & Status Workflow - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 05-scan-processing-status-workflow
**Areas discussed:** Scan input method, Status lifecycle rules, Scan feedback & confirmation, Scan event recording

---

## 1. Scan input method

### RF scanner (keyboard wedge) UX

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-focused text input | Page loads with cursor in scan field, RF types + Enter, auto-submits | ✓ |
| Hidden input | No visible field, listens for rapid keystrokes | |
| Claude's discretion | | |

**User's choice:** Auto-focused text input

### Phone camera trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Button | "Scan with Camera" button opens viewfinder overlay | ✓ |
| Two tabs | Scanner tab (RF) and Camera tab (viewfinder always visible) | |
| Claude's discretion | | |

**User's choice:** Button-triggered camera overlay

### Action selection timing

| Option | Description | Selected |
|--------|-------------|----------|
| Before scanning | Driver selects action first, then scans (batch-friendly) | ✓ |
| After scanning | Scan first, then choose action | |
| Auto-advance | Automatically move to next logical status | |

**User's choice:** Select action before scanning

---

## 2. Status lifecycle rules

### Stage skipping

| Option | Description | Selected |
|--------|-------------|----------|
| No skipping | Strict sequential: Created → In Transit → Delivered → Completed | ✓ |
| Allow skipping | For edge cases like hand-delivered items | |
| Claude's discretion | | |

**User's choice:** Strict sequential, no skipping

### Who can scan

| Option | Description | Selected |
|--------|-------------|----------|
| Driver + Admin only | Staff can view but not scan | |
| Any authenticated user | All roles can scan | ✓ |
| Claude's discretion | | |

**User's choice:** Any authenticated user

### Derived shipment status

| Option | Description | Selected |
|--------|-------------|----------|
| Standard | All Created=Created, any In Transit=In Transit, mixed=Partially Delivered 3/5, all Completed=Completed | ✓ |
| Simple | Lowest status across all pieces | |
| Claude's discretion | | |

**User's choice:** Standard derived status

---

## 3. Scan feedback & confirmation

### Success feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Toast only | Brief notification, stays on scan page | |
| Inline card | Piece info + status below input, accumulates | |
| Both | Toast + inline card list | ✓ |

**User's choice:** Toast + inline card list

### Error feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Inline error | Red text below scan input | ✓ |
| Error toast | Toast notification | |
| Claude's discretion | | |

**User's choice:** Inline error message

### Audio feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Yes | Success beep + error buzz (warehouse environments) | ✓ |
| No | Visual only | |
| Claude's discretion | | |

**User's choice:** Audio feedback enabled

---

## 4. Scan event recording

### Event storage

| Option | Description | Selected |
|--------|-------------|----------|
| Piece events array | In piece document's events[] — PieceEvent type exists | ✓ |
| Separate subcollection | scanEvents under shipment | |
| Claude's discretion | | |

**User's choice:** Piece document events array

### Timeline view

| Option | Description | Selected |
|--------|-------------|----------|
| Basic | Events list on shipment detail page | ✓ |
| Defer | Phase 9 handles full timeline | |
| Claude's discretion | | |

**User's choice:** Basic events list now, full timeline in Phase 9

---

## Claude's Discretion

- Camera library choice (html5-qrcode vs zxing-wasm)
- Action selector UI (radio/segmented/dropdown)
- Toast library (Sonner vs native)
- Audio implementation (Web Audio API vs files)
- Scan count display
- Derived status computation location (API sync vs Cloud Function)
- Location on scan events

## Deferred Ideas

- Batch scan mode (Phase 6)
- Signature capture (Phase 6)
- Photo attachments (Phase 6)
- Full timeline view (Phase 9)
