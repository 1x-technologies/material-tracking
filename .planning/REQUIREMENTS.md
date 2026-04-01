# Requirements: Material Tracking System

**Defined:** 2026-03-31
**Core Value:** Every non-inventory package is trackable end-to-end — from creation to pickup confirmation — with zero manual data entry after the initial shipment creation.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication & Users

- [x] **AUTH-01**: User can sign in with Google Workspace SSO restricted to company domain
- [x] **AUTH-02**: User session persists across browser refresh
- [x] **AUTH-03**: System supports three roles: Admin (full access), Driver (scan + view), Staff (create + view)

### Shipment Creation

- [ ] **SHIP-01**: User can create shipment with sender, receiver, description, category, priority, origin, destination, and piece count
- [ ] **SHIP-02**: User can search company directory for sender/receiver with free text fallback for external contacts
- [ ] **SHIP-03**: User can set priority level on shipment (Urgent, Standard, Low) with visual indicators
- [ ] **SHIP-04**: User can edit shipment details after creation (before first scan)
- [ ] **SHIP-05**: User can cancel a shipment (before pickup)

### QR Code & Printing

- [ ] **QRPR-01**: System generates unique QR code for each piece in a shipment
- [ ] **QRPR-02**: User can preview labels before printing
- [ ] **QRPR-03**: Labels print to networked Zebra printers with multi-piece notation (1/5, 2/5, etc.)
- [ ] **QRPR-04**: User can reprint labels for existing shipments

### Scanning & Status

- [ ] **SCAN-01**: Driver can scan QR code via RF scanner (keyboard wedge input)
- [ ] **SCAN-02**: Driver can scan QR code via phone camera as fallback
- [ ] **SCAN-03**: Each piece follows four-stage lifecycle: Created → In Transit → Delivered → Picked Up
- [ ] **SCAN-04**: Each piece is tracked individually within multi-piece shipments
- [ ] **SCAN-05**: Shipment status is derived from piece statuses (e.g., "Partially Delivered 3/5")
- [ ] **SCAN-06**: Every scan records who scanned, what piece was scanned, and timestamp
- [ ] **SCAN-07**: Driver can use batch scan mode to scan multiple pieces and confirm all at once
- [ ] **SCAN-08**: Signature can be captured at delivery and pickup scan points
- [ ] **SCAN-09**: Photo can be attached during shipment creation or at scan points

### Dashboard & Visibility

- [ ] **DASH-01**: Real-time dashboard shows all active shipments with live status updates
- [ ] **DASH-02**: Dashboard highlights exceptions: stalled shipments, overdue deliveries, aged packages
- [ ] **DASH-03**: Driver trip view shows grouped pickup and delivery tasks for the current day

### Notifications

- [ ] **NOTF-01**: Sender and receiver are notified when shipment is delivered
- [ ] **NOTF-02**: Sender and receiver are notified when shipment is picked up by receiver
- [ ] **NOTF-03**: Users can opt in to receive in-transit stage notifications
- [ ] **NOTF-04**: System auto-reminds receiver for packages sitting 24+ hours post-delivery (aged report)

### History & Search

- [ ] **HIST-01**: User can search shipment history by date range, sender, receiver, status, and description
- [ ] **HIST-02**: Shipment history is retained indefinitely with no auto-purge
- [ ] **HIST-03**: User can view full timeline of a shipment including all scan events with who/when

### Admin

- [ ] **ADMN-01**: Admin can manage users (create, assign roles, deactivate)
- [ ] **ADMN-02**: Admin can manage locations (add, edit, deactivate)
- [ ] **ADMN-03**: Admin can configure system settings (aging threshold, notification preferences)
- [ ] **ADMN-04**: Admin can generate and export reports: delivery times, volume trends, driver performance
- [ ] **ADMN-05**: System logs all actions as an audit trail (creation, scans, edits, cancellations)

### Infrastructure

- [x] **INFR-01**: Three Firebase/GCP environments: dev, staging, production
- [x] **INFR-02**: GitHub repository under 1x-technologies org (ERP Team) with CI/CD pipeline
- [ ] **INFR-03**: Location model supports adding new locations via configuration without code changes
- [x] **INFR-04**: Firestore data model with nested subcollections (pieces under shipments)
- [x] **INFR-05**: Cloud Run for containerized backend services (report generation/export, bulk operations)
- [x] **INFR-06**: Secret Manager for API keys and credentials management
- [x] **INFR-07**: Pub/Sub for event-driven async processing between services
- [x] **INFR-08**: Cloud Scheduler for aged report cron jobs and scheduled maintenance tasks

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced UX

- **UX-01**: PWA support with add-to-home-screen and install prompts
- **UX-02**: Bulk shipment creation via CSV upload for high-volume days
- **UX-03**: Recurring/template shipments for frequent sender/receiver pairs

### Integrations

- **INTG-01**: REST API for external system integrations
- **INTG-02**: Webhook support for third-party notifications

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| GPS/live location tracking of drivers | Massive complexity, no value for 2-location fixed routes — status-based tracking is sufficient |
| Automated route optimization | Only 2 fixed locations, one route — drivers manage their own routes |
| Offline mode / sync | Always-online assumption, reliable WiFi/cellular at both sites |
| Native mobile apps (iOS/Android) | Web-first approach, PWA gives 90% of the benefit at a fraction of the cost |
| Barcode (non-QR) support | QR-only standardizes the system and simplifies label design |
| ERP/inventory integration | Tracks non-inventory materials, coupling to ERP adds scope and delays launch |
| Complex role-based permissions | Three roles (Admin/Driver/Staff) cover 99% of use cases |
| Custom workflow builder | Fixed four-stage lifecycle maps directly to the physical process |
| Multi-language support | English only, all users are internal employees |
| Real-time chat/messaging | Duplicates existing tools (Slack, Google Chat, phone) |
| Machine learning / predictive analytics | Not enough data volume for meaningful ML with 20-100 shipments/day |
| Websocket server | Firestore real-time listeners (onSnapshot) handle all live dashboard updates natively |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2: Authentication & User Roles | Complete |
| AUTH-02 | Phase 2: Authentication & User Roles | Complete |
| AUTH-03 | Phase 2: Authentication & User Roles | Complete |
| SHIP-01 | Phase 3: Shipment Creation | Pending |
| SHIP-02 | Phase 3: Shipment Creation | Pending |
| SHIP-03 | Phase 3: Shipment Creation | Pending |
| SHIP-04 | Phase 3: Shipment Creation | Pending |
| SHIP-05 | Phase 3: Shipment Creation | Pending |
| QRPR-01 | Phase 4: QR Code Generation & Label Printing | Pending |
| QRPR-02 | Phase 4: QR Code Generation & Label Printing | Pending |
| QRPR-03 | Phase 4: QR Code Generation & Label Printing | Pending |
| QRPR-04 | Phase 4: QR Code Generation & Label Printing | Pending |
| SCAN-01 | Phase 5: Scan Processing & Status Workflow | Pending |
| SCAN-02 | Phase 5: Scan Processing & Status Workflow | Pending |
| SCAN-03 | Phase 5: Scan Processing & Status Workflow | Pending |
| SCAN-04 | Phase 5: Scan Processing & Status Workflow | Pending |
| SCAN-05 | Phase 5: Scan Processing & Status Workflow | Pending |
| SCAN-06 | Phase 5: Scan Processing & Status Workflow | Pending |
| SCAN-07 | Phase 6: Enhanced Scanning Features | Pending |
| SCAN-08 | Phase 6: Enhanced Scanning Features | Pending |
| SCAN-09 | Phase 6: Enhanced Scanning Features | Pending |
| DASH-01 | Phase 7: Real-Time Dashboard | Pending |
| DASH-02 | Phase 7: Real-Time Dashboard | Pending |
| DASH-03 | Phase 7: Real-Time Dashboard | Pending |
| NOTF-01 | Phase 8: Notifications & Aged Reports | Pending |
| NOTF-02 | Phase 8: Notifications & Aged Reports | Pending |
| NOTF-03 | Phase 8: Notifications & Aged Reports | Pending |
| NOTF-04 | Phase 8: Notifications & Aged Reports | Pending |
| HIST-01 | Phase 9: History, Search & Audit | Pending |
| HIST-02 | Phase 9: History, Search & Audit | Pending |
| HIST-03 | Phase 9: History, Search & Audit | Pending |
| ADMN-01 | Phase 10: Admin Panel & Reports | Pending |
| ADMN-02 | Phase 10: Admin Panel & Reports | Pending |
| ADMN-03 | Phase 10: Admin Panel & Reports | Pending |
| ADMN-04 | Phase 10: Admin Panel & Reports | Pending |
| ADMN-05 | Phase 9: History, Search & Audit | Pending |
| INFR-01 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |
| INFR-02 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |
| INFR-03 | Phase 3: Shipment Creation | Pending |
| INFR-04 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |
| INFR-05 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |
| INFR-06 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |
| INFR-07 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |
| INFR-08 | Phase 1: Project Scaffolding & Firebase Infrastructure | Complete |

**Coverage:**
- v1 requirements: 44 total
- Mapped to phases: 44
- Unmapped: 0

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
