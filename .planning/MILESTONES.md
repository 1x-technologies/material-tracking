# Milestones

## v1.0 Material Tracking MVP (Shipped: 2026-04-07)

**Phases completed:** 11 phases, 36 plans, 86 tasks

**Key accomplishments:**

- pnpm monorepo with TypeScript 6, Biome 2.4.10, and @material-tracking/shared exporting all Firestore data model types + Zod validation schemas
- Multi-environment Firebase config with Firestore read-only security rules, four composite indexes, and Storage size-limited upload rules
- tRPC Express server with Firebase Auth context, role-based middleware, Pub/Sub publisher, and Cloud Run Dockerfile
- Firestore triggers (piece status derivation, shipment creation, storage upload), scheduled functions (aged report hourly, cleanup daily) with v2 object syntax, Secret Manager access, and tsup CJS bundling for deployment
- React 19 app with Vite 8, Tailwind CSS v4 design tokens, Firebase Auth SSO, tRPC client with per-request token injection, and responsive layout shell (sidebar + topbar)
- GitHub Actions CI/CD pipelines for dev/staging/prod with test gates, Workload Identity Federation auth, and automated Firebase + Cloud Run deployment
- 1. [Rule 1 - Bug] Zod v4 default value for nested object
- Six-category ShipmentCategory enum, discriminated union receiver schema with external company+email rules, and update/cancel input schemas for API consumption
- Shipment CRUD router with transactional counter, locations list, directory search stub, and Vitest test suite — all via Firebase Admin SDK
- Tablet-friendly shipment form with directory autocomplete, priority visual distinction, create/edit/cancel flows wired to tRPC API
- qrCode set to Firestore doc ID at piece creation, new listPieces query returns ordered pieces for label preview
- QR label preview component, ZPL builder with fluent-zpl (EC H, 812x609 at 203 DPI), and Zebra Browser Print fetch wrapper
- Print and reprint dialogs with Zebra printer discovery, label preview grid, per-piece copy selection, and detail route wiring
- Transactional scan.process mutation with collection group QR lookup, sequential lifecycle validation, PieceEvent recording, and deterministic shipment status derivation
- Scan page with RF scanner auto-focus input, html5-qrcode camera overlay, action selector, audio feedback, and Sonner toast notifications
- Chronological scan events list component with Firestore Timestamp handling, color-coded action badges, and shipment detail page integration
- Extended scan API with photoUrls array, extracted processOneScan, piece-level field writes, and processBatch mutation with partial success semantics
- Batch scan queue with toggle/remove/confirm-all UI, camera photo capture component, and Firebase Storage upload helpers integrated into ScanPage
- SignatureDialog with react-signature-canvas, delivery scan interception, and optional signature upload to Firebase Storage
- Token-based unauthenticated signature capture via standalone /sign/:token page with Admin SDK Storage upload and admin copy-to-clipboard link generation
- Firestore onSnapshot subscription hook with 30-day window, exception classification (stalled/overdue/aged), and three reusable badge components
- Real-time dashboard with FilterTabs, sortable ShipmentTable, exception highlighting, and configurable time range via onSnapshot
- DriverTripView component with Pickup/Deliver sections and conditional My Tasks tab for driver role users
- Firestore mail collection email utility, four template builders, and onDocumentUpdated trigger for status change notifications gated by notificationPrefs
- Hourly scheduled function detecting 24h+ delivered shipments, sending daily throttled reminder emails to receivers, with 28 unit tests covering templates, decisions, and throttle logic
- Cursor-paginated shipment.search tRPC query with optional status and date-range filters, 50-item pages, and HIST-02 indefinite retention verified
- Searchable history page with five-dimension filter bar, ShipmentTable reuse, cursor-based Load More pagination, and /history route with sidebar navigation
- Vertical connected-dot timeline replacing flat event list, showing creation, piece scans with signature/photo indicators, and cancellation as a visual audit trail
- Admin tRPC router with 12 endpoints covering user/location CRUD, system settings, report aggregation, and audit logging, plus pending-user auth flow
- Admin page with hash-based tab navigation, user management table with bulk role assignment and detail side panel, plus pending approval page for null-role users
- LocationTable.tsx
- Slack WebClient wrapper with email-to-user resolution, 5 Block Kit message builders, and @slack/web-api externalized in tsup build
- Email-to-Slack migration in onShipmentStatusChange and agedReport with full email code removal
- Auto-complete shipment pieces on signature submission via Firestore batch write, with Slack DM containing Sign Now button sent on signature request

---
