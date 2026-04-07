# Material Tracking System

## What This Is

A QR-based shipment tracking system for non-inventory materials moving between company locations (HA and SC, with future expansion). Replaces the current manual sticker + drive log process with a digital workflow: create shipment on tablet, print QR labels via Zebra printers, scan at pickup/delivery with RF scanners or phone cameras, and monitor everything through a centralized real-time dashboard. Built on the Google Firebase stack.

## Core Value

Every non-inventory package is trackable end-to-end — from creation to pickup confirmation — with zero manual data entry after the initial shipment creation.

## Requirements

### Validated

- [x] Three Firebase environments (dev/staging/prod) with CI/CD pipeline — Validated in Phase 1
- [x] Firestore schema with security rules and composite indexes — Validated in Phase 1
- [x] Cloud Run, Pub/Sub, Cloud Scheduler, Secret Manager service patterns — Validated in Phase 1
- [x] Base React app with routing and layout shell — Validated in Phase 1
- [x] Google Workspace SSO authentication restricted to company domain — Validated in Phase 2
- [x] Session persistence across browser refresh — Validated in Phase 2
- [x] Three-role access control (Admin, Driver, Staff) with UI and API enforcement — Validated in Phase 2
- [x] Create shipments with full details (sender, receiver, description, category, priority, origin, destination, piece count) — Validated in Phase 3
- [x] Sender/receiver lookup from company directory with free text fallback for external contacts — Validated in Phase 3 (stub directory; real API deferred)
- [x] Scalable location model (HA and SC now, expandable to more) — Validated in Phase 3

- [x] Generate and print QR code labels via networked Zebra printers with multi-piece support (1/5, 2/5, etc.) — Validated in Phase 4
- [x] Label preview before printing — Validated in Phase 4

- [x] Scan QR codes via RF scanners and phone cameras to trigger status updates — Validated in Phase 5
- [x] Individual piece-level tracking within multi-piece shipments — Validated in Phase 5
- [x] Four-stage status lifecycle per piece: Created → In Transit → Delivered → Completed — Validated in Phase 5
- [x] Derived shipment status from piece statuses (e.g., "Partially Delivered 3/5") — Validated in Phase 5
- [x] Authenticated scanning — track who scanned what and when — Validated in Phase 5

- [x] One-by-one and batch scan modes for drivers — Validated in Phase 6
- [x] Signature capture at delivery/pickup — Validated in Phase 6
- [x] Package photo attachments — Validated in Phase 6
- [x] Token-based unauthenticated signature capture via standalone page — Validated in Phase 6
- [x] Real-time dashboard with live status board and exception alerts — Validated in Phase 7
- [x] Driver trip view with grouped pickup/delivery tasks — Validated in Phase 7
- [x] Notifications to sender and receiver on delivery and pickup via Slack DM — Validated in Phase 8 + 11
- [x] Opt-in in-transit notifications — Validated in Phase 8 + 11
- [x] Aged report: Slack reminder for packages 24+ hours post-delivery — Validated in Phase 8 + 11
- [x] Signature-to-complete: auto-complete shipment on signature submission — Validated in Phase 11
- [x] Unlimited searchable shipment history with cursor pagination — Validated in Phase 9
- [x] Full audit trail with connected-dot timeline visualization — Validated in Phase 9
- [x] Admin panel: user management, location management, system settings, reports — Validated in Phase 10

### Active

(No active v1 requirements remaining -- all shipped. See v2 Requirements in REQUIREMENTS archive.)

### Out of Scope

- Native mobile apps — web-first with potential PWA later
- Integration with inventory/ERP systems — standalone system for v1
- Automated routing/optimization — drivers manage their own routes
- Barcode (non-QR) support — QR only for v1
- Multi-language support — English only

## Context

**Current state (v1.0 shipped 2026-04-07):** Full digital tracking system deployed. Shipments are created on tablets, QR labels printed via Zebra printers, pieces scanned through four-stage lifecycle (Created -> In Transit -> Delivered -> Completed) via RF scanners or phone cameras, monitored on a real-time dashboard with exception alerts, and notifications delivered via Slack DMs. Signatures auto-complete shipments. Admin panel provides user/location management, reporting, and audit logging.

**Scale:** 20-100 shipments/day across two locations (HA and SC), with expandable location model.

**Codebase:** ~29,200 LOC TypeScript across 3 packages (web, api, functions) + shared types. 127 automated tests.

**Tech stack:** React 19 + Vite 8 + Tailwind v4 (web), tRPC + Express on Cloud Run (api), Cloud Functions v2 + tsup (functions), Firestore + Firebase Auth + Storage (data), Slack Web API (notifications).

**Infrastructure:**
- Networked Zebra label printers at HA and SC
- Dedicated RF scanners (phone camera fallback)
- Stationary tablets at each location
- Three Firebase environments (dev/staging/prod) with CI/CD
- Slack app "Material Tracking" for notifications

## Constraints

- **Tech Stack**: Google Firebase (Firestore, Auth, Cloud Functions, Storage, Hosting) — chosen for rapid development and managed infrastructure
- **UI Components**: Untitled UI React components (replaces shadcn/ui)
- **Data Model**: Nested Firestore subcollections (pieces as subcollection under shipments)
- **Business Logic**: Cloud Functions v2 for event-driven logic (Firestore triggers, scan processing, notifications, scheduled jobs); Cloud Run for heavier operations (report generation/export, bulk operations)
- **Authentication**: Firebase Auth with Google Workspace provider (SSO)
- **Environments**: Three Firebase projects — dev, staging, production
- **Storage**: Firebase Storage for package photos, generated QR label PDFs, and signature captures
- **Source Control**: GitHub repository under 1x-technologies org (ERP Team) with CI/CD pipeline
- **Connectivity**: Always-online assumption — no offline mode required

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Firebase full stack | Managed infrastructure, fast development, real-time capabilities built-in | Validated (Phase 1) |
| Nested subcollections for pieces | Pieces are always accessed in context of their parent shipment | Validated (Phase 1) |
| Cloud Functions v2 + Cloud Run split | Functions for triggers/events/scheduled, Cloud Run for heavy/long-running tasks | Validated (Phase 1) |
| Firestore real-time over websockets | onSnapshot listeners handle live dashboard updates, no websocket server needed | Validated (Phase 7) |
| Individual piece tracking | Supports partial delivery workflows where pieces arrive separately | Validated (Phase 1) |
| Three environments (dev/staging/prod) | Proper deployment pipeline with staging for QA | Validated (Phase 1) |
| Google SSO only | All users are company employees with Google Workspace accounts | Validated (Phase 2) |
| tRPC on Cloud Run for API layer | Typed end-to-end API, Firebase Auth middleware, Pub/Sub integration | Validated (Phase 1) |
| Biome for linting/formatting | Replaces ESLint+Prettier, single config, faster execution | Validated (Phase 1) |
| Discriminated union for receiver schema | External contacts require company + email; internal use directory uid | Validated (Phase 3) |
| Firestore locations collection | Config-based location management; no code deploy for new sites | Validated (Phase 3) |
| Directory stub with feature flag | DIRECTORY_STUB=1 for dev; real Google Directory API deferred to IT approval | Validated (Phase 3) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

| Slack DMs over email for notifications | Slack is where the team already communicates; avoids email fatigue | Validated (Phase 11) |
| Signature-to-complete auto-transition | Reduces steps for receivers; signature = acknowledgment = completion | Validated (Phase 11) |

---
*Last updated: 2026-04-07 after v1.0 milestone*
