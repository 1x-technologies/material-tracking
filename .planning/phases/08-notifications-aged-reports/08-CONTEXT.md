# Phase 8: Notifications & Aged Reports - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend notification system: Cloud Functions v2 triggers send email notifications to sender and receiver on delivery and pickup status changes, with opt-in for in-transit notifications. A Cloud Scheduler job runs every hour to detect aged packages (24+ hours post-delivery without pickup) and sends reminder emails to receivers. Phase 8 does NOT include push notifications, in-app notification center, or configurable thresholds (Phase 10 admin).

</domain>

<decisions>
## Implementation Decisions

### Notification channel

- **D-01:** **Email only** for v1 — use the **Firebase Admin SDK + a transactional email service** (SendGrid or similar). If SendGrid is not yet configured, use **Firestore `mail` collection + Firebase Extensions (Trigger Email)** as a zero-config alternative — write a doc to `mail/{id}` and the extension sends it.
- **D-02:** Email content: simple text/HTML with shipment number, status, piece count, sender/receiver names, and a link to the shipment detail page.

### Trigger mechanism

- **D-03:** **Cloud Functions v2 Firestore trigger** on `shipments/{shipmentId}` document update — fires when status field changes. Function checks old vs new status and sends appropriate notifications.
- **D-04:** Notification logic checks `shipment.notificationPrefs` for opt-in gates: `onDelivery` (default true), `onPickup` (default true), `onTransit` (default false per NOTF-03 opt-in).
- **D-05:** Recipient resolution: sender email from `shipment.sender.email`, receiver email from `shipment.receiver.email`. Skip notification if email is missing (external receivers without email).

### Aged report (NOTF-04)

- **D-06:** **Cloud Scheduler** triggers a Cloud Function every hour that queries `shipments` with `status === "delivered"` and `deliveredAt` older than 24 hours. Sends reminder email to receiver.
- **D-07:** **One reminder per day** — track last reminder timestamp on the shipment (`lastAgedReminderAt`) to avoid hourly spam. Only send if 24+ hours since last reminder (or no reminder sent yet).
- **D-08:** Aged threshold: **24 hours** post-delivery (hardcoded for now; Phase 10 admin makes it configurable).

### Claude's Discretion

- Email template design (plain text vs HTML)
- SendGrid vs Firebase Extensions vs nodemailer
- Whether to store notification history in Firestore for audit
- Exact Cloud Scheduler cron expression (e.g., `0 * * * *` for hourly)
- Error handling for failed email sends (retry, dead-letter)
- Whether the Firestore trigger uses `onDocumentUpdated` or a Pub/Sub intermediary
- Email "from" address configuration

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — NOTF-01 through NOTF-04
- `.planning/ROADMAP.md` — Phase 8 goal, success criteria
- `.planning/PROJECT.md` — Cloud Functions v2, Cloud Scheduler, Pub/Sub

### Prior phases

- `.planning/phases/03-shipment-creation/03-CONTEXT.md` — NotificationPrefs on shipments
- `.planning/phases/05-scan-processing-status-workflow/05-CONTEXT.md` — scan triggers status changes

### Shared contracts

- `packages/shared/src/types/shipment.ts` — `Shipment`, `NotificationPrefs` (onTransit, onDelivery, onPickup)
- `packages/shared/src/types/user.ts` — `User.notificationPrefs`
- `packages/shared/src/enums.ts` — `ShipmentStatus`

### Infrastructure

- `apps/functions/src/triggers/onShipmentCreate.ts` — existing Cloud Function pattern
- `apps/functions/package.json` — firebase-functions SDK
- `firebase.json` — functions config
- Cloud Scheduler + Pub/Sub — provisioned in Phase 1

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `apps/functions/src/triggers/onShipmentCreate.ts` — pattern for Firestore triggers
- `firebase-functions/v2/firestore` — `onDocumentUpdated` for status change detection
- `firebase-functions/v2/scheduler` — `onSchedule` for aged report cron
- `ShipmentStatus` enum for status comparison

### Established patterns

- Cloud Functions v2 with region `us-central1`
- Firestore Admin SDK for server-side queries
- Pub/Sub integration for async processing

### Integration points

- New trigger on `shipments/{shipmentId}` update for notification dispatch
- New scheduled function for aged package detection
- May need `lastAgedReminderAt` field added to Shipment type or stored separately

</code_context>

<specifics>
## Specific Ideas

- Firebase Extensions "Trigger Email from Firestore" — write to `mail/{id}` with `to`, `message.subject`, `message.html` and the extension handles SMTP
- Aged query: `where("status", "==", "delivered").where("deliveredAt", "<", twentyFourHoursAgo)`
- Cron: `every 1 hours` or `0 * * * *`

</specifics>

<deferred>
## Deferred Ideas

- **Push notifications** — PWA push via FCM; requires service worker setup
- **In-app notification center** — bell icon with unread count; separate UI feature
- **Configurable thresholds** — Phase 10 admin panel (aged hours, reminder frequency)
- **Notification history/audit log** — store sent notifications for debugging
- **Escalation** — notify admin after 48h aged; beyond v1 scope

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 08-notifications-aged-reports*
*Context gathered: 2026-04-01*
