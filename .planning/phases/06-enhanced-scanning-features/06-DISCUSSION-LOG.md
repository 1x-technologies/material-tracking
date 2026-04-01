# Phase 6: Enhanced Scanning Features - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 06-enhanced-scanning-features
**Areas discussed:** Batch scan mode, Signature capture, Photo attachments

---

## 1. Batch scan mode

### How batch mode works

| Option | Description | Selected |
|--------|-------------|----------|
| Toggle | "Batch Mode" switch on scan page; scans queue, "Confirm All" processes | ✓ |
| Always batch | Every scan queues; explicit confirm always needed | |
| Claude's discretion | | |

**User's choice:** Toggle-based batch mode

### Confirm behavior

| Option | Description | Selected |
|--------|-------------|----------|
| All-or-nothing | If any fails, none applied (transaction) | |
| Partial success | Apply what works, show errors for failures | ✓ |
| Claude's discretion | | |

**User's choice:** Partial success

### Batch editing

| Option | Description | Selected |
|--------|-------------|----------|
| Individual remove | Each queued scan has X button | ✓ |
| Clear all only | No individual removal | |
| Claude's discretion | | |

**User's choice:** Individual remove buttons

---

## 2. Signature capture

### Signature flow

**User's vision (free text):** Signature is requested at delivery. Three paths:
1. Receiver scans QR at destination → system detects they're the receiver → auto-shows signature dialog
2. Send a link to the receiver's email to sign remotely
3. Admin can always click a button to send a signature request link

All three paths in Phase 6.

### Signature storage

| Option | Description | Selected |
|--------|-------------|----------|
| Firebase Storage | Upload PNG, store URL on piece document | ✓ |
| Base64 in Firestore | Store data URL directly | |
| Claude's discretion | | |

**User's choice:** Firebase Storage PNG upload

---

## 3. Photo attachments

### When photos can be attached

| Option | Description | Selected |
|--------|-------------|----------|
| Scan points only | Driver takes photo at delivery/pickup | ✓ |
| Creation and scan | Both at shipment creation and scans | |
| Anytime | Shipment detail + scan points | |

**User's choice:** Scan points only

### Photo count

**User's response (free text):** Photos are optional, users can choose to add photos anytime — no fixed limit.

### Photo capture method

| Option | Description | Selected |
|--------|-------------|----------|
| Camera only | Phone/tablet camera | ✓ |
| Camera + upload | Camera + gallery file picker | |
| Claude's discretion | | |

**User's choice:** Camera capture only

---

## Claude's Discretion

- Batch mode UI styling and animations
- Signature pad library choice
- Signature canvas dimensions
- Email signature link token/expiry/page design
- Photo compression before upload
- Mixed actions in batch mode
- Admin vs driver "Send Signature Link" button placement

## Deferred Ideas

- Photo at shipment creation
- Thumbnail generation (Cloud Function)
- Gallery/file upload
- Signature at pickup
