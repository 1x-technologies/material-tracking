# Roadmap: Material Tracking System

## Overview

Transform the manual sticker-and-drive-log process into a QR-scanned digital tracking system. The build follows the physical workflow: establish infrastructure → authenticate users → create shipments → print labels → scan at each handoff → display real-time status → notify stakeholders → enable history search → empower admins. Each phase delivers a coherent, verifiable slice of the end-to-end tracking capability.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Project Scaffolding & Firebase Infrastructure** - Three Firebase environments, CI/CD, Firestore schema, GCP services provisioned
- [ ] **Phase 2: Authentication & User Roles** - Google Workspace SSO with three-role access control
- [x] **Phase 3: Shipment Creation** - Tablet-optimized shipment creation form with directory lookup and lifecycle management (completed 2026-04-01)
- [x] **Phase 4: QR Code Generation & Label Printing** - QR generation, label preview, and Zebra printer integration (completed 2026-04-01)
- [x] **Phase 5: Scan Processing & Status Workflow** - RF scanner and camera-based scanning with four-stage status lifecycle (completed 2026-04-01)
- [x] **Phase 6: Enhanced Scanning Features** - Batch scan mode, signature capture, and photo attachments (completed 2026-04-01)
- [ ] **Phase 7: Real-Time Dashboard** - Live status board with exception alerts and driver trip view
- [ ] **Phase 8: Notifications & Aged Reports** - Status change notifications and automated aged package reminders
- [ ] **Phase 9: History, Search & Audit** - Searchable shipment history with full event timeline and audit trail
- [ ] **Phase 10: Admin Panel & Reports** - User, location, and settings management with operational reporting

## Phase Details

### Phase 1: Project Scaffolding & Firebase Infrastructure
**Goal**: Development infrastructure is fully configured with three Firebase environments, CI/CD pipeline, Firestore schema, and all GCP services provisioned
**Depends on**: Nothing (first phase)
**Requirements**: INFR-01, INFR-02, INFR-04, INFR-05, INFR-06, INFR-07, INFR-08
**Success Criteria** (what must be TRUE):
  1. Developer can deploy code to dev, staging, and production Firebase environments from a single CI/CD pipeline
  2. Firestore collections and subcollections are created with proper indexes and security rules
  3. Cloud Run, Pub/Sub, Cloud Scheduler, and Secret Manager services are provisioned and accessible
  4. Base React app loads at the Firebase Hosting URL with routing configured
**Plans**: 6 plans
Plans:
- [x] 01-01-PLAN.md — Root monorepo scaffold + shared types package
- [x] 01-02-PLAN.md — Firebase configuration + Firestore schema
- [x] 01-03-PLAN.md — tRPC API server on Cloud Run
- [x] 01-04-PLAN.md — Cloud Functions scaffold + GCP service patterns
- [x] 01-05-PLAN.md — React frontend scaffold with layout shell
- [x] 01-06-PLAN.md — CI/CD pipeline + build verification
**UI hint**: no

### Phase 2: Authentication & User Roles
**Goal**: Users can sign in with their company Google account and the system enforces role-based access
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can sign in with Google Workspace SSO and access is restricted to company domain
  2. User session persists across browser refresh without requiring re-login
  3. Users are assigned one of three roles (Admin, Driver, Staff) and see only role-appropriate UI
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — API: Firestore `users/{uid}` context, lazy Staff provision, role middleware, Vitest
- [x] 02-02-PLAN.md — Web: `hd: 1x.tech`, profile load, session restore UX, SignIn UI-SPEC, Vitest for `hd`
- [ ] 02-03-PLAN.md — Web: role routes, Access denied, nav chrome; API: staff/driver procedure examples
**UI hint**: yes

### Phase 3: Shipment Creation
**Goal**: Users can create, edit, and cancel shipments with full details on a tablet-optimized interface
**Depends on**: Phase 2
**Requirements**: SHIP-01, SHIP-02, SHIP-03, SHIP-04, SHIP-05, INFR-03
**Success Criteria** (what must be TRUE):
  1. User can create a shipment with sender, receiver, description, category, priority, origin, destination, and piece count
  2. User can search the company directory for sender/receiver or type a freeform name for external contacts
  3. Priority levels (Urgent, Standard, Low) are visually distinct on shipment views
  4. User can edit shipment details before the first scan and cancel a shipment before pickup
  5. Adding a new location requires configuration only — no code changes
**Plans**: 3 plans
Plans:
- [x] 03-01-PLAN.md — Shared: ShipmentCategory, create/update/cancel Zod, receiver union (D-03/D-05)
- [x] 03-02-PLAN.md — API: shipment CRUD + counter + pieces, locations.list, directory stub, seed HA/SC, Vitest
- [x] 03-03-PLAN.md — Web: single-page form, autocomplete, priority visuals, edit/cancel routes, locationId profile
**UI hint**: yes

### Phase 4: QR Code Generation & Label Printing
**Goal**: Users can generate, preview, and print QR code labels via Zebra printers for every piece in a shipment
**Depends on**: Phase 3
**Requirements**: QRPR-01, QRPR-02, QRPR-03, QRPR-04
**Success Criteria** (what must be TRUE):
  1. System generates a unique QR code for each piece in a shipment
  2. User can preview labels before printing, showing all label details and multi-piece notation (1/5, 2/5, etc.)
  3. Labels print correctly on networked Zebra printers
  4. User can reprint labels for any existing shipment
**Plans**: 3 plans
Plans:
- [x] 04-01-PLAN.md — API: Fix qrCode = pieceRef.id in create transaction + add listPieces query
- [x] 04-02-PLAN.md — Web: Label infrastructure (formatters, preview card, ZPL builder, Zebra wrapper)
- [x] 04-03-PLAN.md — Web: Print/Reprint dialogs + detail route + button wiring
**UI hint**: yes

### Phase 5: Scan Processing & Status Workflow
**Goal**: Drivers can scan QR codes to advance pieces through the four-stage status lifecycle with full traceability
**Depends on**: Phase 4
**Requirements**: SCAN-01, SCAN-02, SCAN-03, SCAN-04, SCAN-05, SCAN-06
**Success Criteria** (what must be TRUE):
  1. Driver can scan a QR code via RF scanner (keyboard wedge input) and the piece status advances to the next stage
  2. Driver can scan a QR code via phone camera as a fallback
  3. Each piece follows the lifecycle: Created → In Transit → Delivered → Picked Up
  4. Shipment status automatically derives from piece statuses (e.g., "Partially Delivered 3/5")
  5. Every scan records who scanned, which piece, and timestamp
**Plans**: 3 plans
Plans:
- [x] 05-01-PLAN.md — API: scan.process mutation with collection group lookup, transition validation, event recording, shipment status derivation
- [x] 05-02-PLAN.md — Web: ScanPage with RF input, camera overlay, action selector, audio/toast feedback, route wiring
- [x] 05-03-PLAN.md — Web: Shipment detail events list (D-11) for scan history visibility
**UI hint**: yes

### Phase 6: Enhanced Scanning Features
**Goal**: Drivers can scan multiple pieces at once and capture signatures and photos at scan points
**Depends on**: Phase 5
**Requirements**: SCAN-07, SCAN-08, SCAN-09
**Success Criteria** (what must be TRUE):
  1. Driver can enter batch scan mode, scan multiple pieces, and confirm all at once
  2. Signature can be captured at delivery and pickup scan points
  3. Photos can be attached during shipment creation or at scan points
**Plans**: 4 plans
Plans:
- [x] 06-01-PLAN.md — API: Schema extension, scan core extraction, batch endpoint, piece-level field writes, tests
- [x] 06-02-PLAN.md — Web: Batch scan mode UI + photo capture + ScanPage integration
- [x] 06-03-PLAN.md — Web: Authenticated signature capture with react-signature-canvas + receiver detection
- [x] 06-04-PLAN.md — API + Web: Unauthenticated signature link flow (token + standalone page + admin button)
**UI hint**: yes

### Phase 7: Real-Time Dashboard
**Goal**: Users can monitor all active shipments in real-time with live updates and exception alerts
**Depends on**: Phase 5
**Requirements**: DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. Dashboard shows all active shipments with live status updates — changes appear without page refresh
  2. Dashboard highlights exceptions: stalled shipments, overdue deliveries, and aged packages
  3. Driver trip view shows grouped pickup and delivery tasks for the current day
**Plans**: 3 plans
Plans:
- [x] 07-01-PLAN.md — Data hooks (onSnapshot subscription), exception classification utils, badge components
- [x] 07-02-PLAN.md — Dashboard status board with filter tabs, sortable table, exception highlights
- [x] 07-03-PLAN.md — Driver trip view (My Tasks tab) with grouped pickup/deliver sections
**UI hint**: yes

### Phase 8: Notifications & Aged Reports
**Goal**: Users receive timely notifications on shipment status changes and the system proactively flags aged packages
**Depends on**: Phase 5
**Requirements**: NOTF-01, NOTF-02, NOTF-03, NOTF-04
**Success Criteria** (what must be TRUE):
  1. Sender and receiver are notified when a shipment is delivered
  2. Sender and receiver are notified when a shipment is picked up by receiver
  3. Users can opt in to receive in-transit stage notifications
  4. System automatically flags packages sitting 24+ hours post-delivery and sends reminders to receiver
**Plans**: 2 plans
Plans:
- [x] 08-01-PLAN.md — Notification infrastructure + status change email trigger (NOTF-01/02/03)
- [x] 08-02-PLAN.md — Aged package reminders + notification unit tests (NOTF-04)
**UI hint**: no

### Phase 9: History, Search & Audit
**Goal**: Users can search and review complete shipment history with full audit trail
**Depends on**: Phase 5
**Requirements**: HIST-01, HIST-02, HIST-03, ADMN-05
**Success Criteria** (what must be TRUE):
  1. User can search shipment history by date range, sender, receiver, status, and description
  2. Shipment history is retained indefinitely with no auto-purge
  3. User can view the full timeline of a shipment including all scan events with who/when
  4. All actions (creation, scans, edits, cancellations) are logged as a searchable audit trail
**Plans**: TBD
**UI hint**: yes

### Phase 10: Admin Panel & Reports
**Goal**: Admins can manage users, locations, and system settings, and generate operational reports
**Depends on**: Phase 2
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. Admin can create users, assign roles, and deactivate accounts
  2. Admin can add, edit, and deactivate locations
  3. Admin can configure system settings (aging threshold, notification preferences)
  4. Admin can generate and export reports: delivery times, volume trends, driver performance
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Scaffolding & Firebase Infrastructure | 0/? | Not started | - |
| 2. Authentication & User Roles | 0/? | Not started | - |
| 3. Shipment Creation | 3/3 | Complete   | 2026-04-01 |
| 4. QR Code Generation & Label Printing | 3/3 | Complete   | 2026-04-01 |
| 5. Scan Processing & Status Workflow | 3/3 | Complete   | 2026-04-01 |
| 6. Enhanced Scanning Features | 4/4 | Complete   | 2026-04-01 |
| 7. Real-Time Dashboard | 0/? | Not started | - |
| 8. Notifications & Aged Reports | 0/? | Not started | - |
| 9. History, Search & Audit | 0/? | Not started | - |
| 10. Admin Panel & Reports | 0/? | Not started | - |
