---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: verifying
stopped_at: Phase 10 context gathered
last_updated: "2026-04-02T20:13:12.657Z"
last_activity: 2026-04-01
progress:
  total_phases: 10
  completed_phases: 9
  total_plans: 30
  completed_plans: 30
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-31)

**Core value:** Every non-inventory package is trackable end-to-end — from creation to pickup confirmation — with zero manual data entry after the initial shipment creation.
**Current focus:** Phase 08 — notifications-aged-reports

## Current Position

Phase: 9
Plan: Not started
Status: Phase complete — ready for verification
Last activity: 2026-04-01

Progress: [███░░░░░░░] Phase 3 planned; execution not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**

- Last 5 plans: -
- Trend: -

*Updated after each plan completion*
| Phase 01 P02 | 0.5min | 2 tasks | 5 files |
| Phase 01 P01 | 32min | 2 tasks | 19 files |
| Phase 01 P04 | 2min | 2 tasks | 13 files |
| Phase 01 P03 | 2min | 2 tasks | 15 files |
| Phase 01 P05 | 2min | 2 tasks | 20 files |
| Phase 01 P06 | 4min | 2 tasks | 42 files |
| Phase 02 P01 | 1min | 3 tasks | 6 files |
| Phase 02 P02 | 2min | 3 tasks | 4 files |
| Phase 02 P03 | 1min | 3 tasks | 9 files |
| Phase 03 P01 | 1min | 3 tasks | 3 files |
| Phase 03 P02 | 3min | 6 tasks | 12 files |
| Phase 03 P03 | 2min | 5 tasks | 10 files |
| Phase 04 P01 | 1min | 2 tasks | 2 files |
| Phase 04 P02 | 1min | 3 tasks | 8 files |
| Phase 04 P03 | 1min | 2 tasks | 4 files |
| Phase 05 P01 | 1min | 2 tasks | 4 files |
| Phase 05 P03 | 1min | 2 tasks | 2 files |
| Phase 05 P02 | 2min | 2 tasks | 9 files |
| Phase 06 P01 | 2min | 2 tasks | 7 files |
| Phase 06 P02 | 1min | 2 tasks | 4 files |
| Phase 06 P04 | 2min | 2 tasks | 5 files |
| Phase 06 P03 | 2min | 2 tasks | 4 files |
| Phase 07 P01 | 1min | 2 tasks | 5 files |
| Phase 07 P02 | 1min | 3 tasks | 4 files |
| Phase 07 P03 | 1min | 2 tasks | 2 files |
| Phase 08 P01 | 1min | 2 tasks | 5 files |
| Phase 08 P02 | 1min | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: 10-phase structure derived from 44 v1 requirements with fine granularity
- [Roadmap]: Phases 7-10 are independent after Phase 5/6 — can be reordered if priorities shift
- [Phase 01]: Phase 1 minimal security rules — block all client writes, no role-based get() calls
- [Phase 01]: Firebase Hosting Cloud Run rewrite for /api/** eliminates CORS in production
- [Phase 01]: Biome 2.4.10 config adapted: organizeImports moved to assist.actions, files.ignore to files.includes negation
- [Phase 01]: firebase SDK added as shared pkg devDependency for Timestamp type references
- [Phase 01]: Const object enum pattern for all enums — tree-shaking safe, runtime-inspectable
- [Phase 01]: secret-manager bumped from ^5.7.0 to ^6.1.1 — v5.7.0 never published
- [Phase 01]: Removed tsconfig project references for functions — shared lacks composite:true, tsup noExternal handles bundling
- [Phase 01]: Removed tsconfig project references — pnpm workspace resolution handles shared imports without composite flag
- [Phase 01]: Updated @google-cloud/pubsub to ^5.3.0 — v4 series no longer published in npm registry
- [Phase 01]: Renamed trpc.ts to trpc.tsx — file contains JSX requiring tsx extension
- [Phase 01]: Web tsconfig: disabled declaration/declarationMap, added DOM lib, removed project references — consumer app pattern
- [Phase 01]: Added AppRouter type re-export from api/index.ts for web tRPC client consumption
- [Phase 01]: Biome dist exclusion pattern changed from !dist to !**/dist to cover nested app dist directories
- [Phase 01]: Tailwind CSS parser directives enabled in Biome to support @theme syntax
- [Phase 02]: Firestore create() for lazy provision — fails on ALREADY_EXISTS to avoid clobbering admin docs (D-03)
- [Phase 02]: requireRole factory function takes UserRole[] for flexible role combinations per procedure
- [Phase 02]: Kept user as Firebase User and added appUser for Firestore profile — minimal disruption
- [Phase 02]: One-shot getDoc for profile over onSnapshot — profile rarely changes mid-session
- [Phase 02]: RequireRole renders AccessDeniedPage inline rather than redirect — preserves URL for debugging
- [Phase 03]: Discriminated union on isExternal for receiver — compile-time enforcement of company+email for external contacts
- [Phase 03]: Extracted Zod sub-schemas (sender, receiver, notificationPrefs) for reuse across create and update
- [Phase 03]: pieceCount omitted from updateShipmentInputSchema — immutable after creation per Phase 3 spec
- [Phase 03]: protectedProcedure for locations.list — any authenticated user can list locations
- [Phase 03]: Shipment number format SH-YYYYMMDD-NNNN via Firestore transaction counter at counters/shipments
- [Phase 03]: pieceCount immutable after creation — excluded from update mutation in Phase 3
- [Phase 03]: Directory stub returns 3 deterministic users; PRECONDITION_FAILED when DIRECTORY_STUB not set
- [Phase 03]: Controlled form state with useState per field — no form library overhead
- [Phase 03]: ShipmentFormPage handles create+edit via useParams shipmentId presence
- [Phase 03]: Inline double-confirm pattern: armed state with 5s auto-reset for destructive cancel
- [Phase 04]: qrCode uses Firestore auto-generated doc ID (pieceRef.id) — stable, unique, available before tx.set()
- [Phase 04]: listPieces uses protectedProcedure — drivers need piece data for scanning in Phase 5
- [Phase 04]: fluent-zpl QRErrorCorrection.H for ZPL QR — native support in 1.0.0, no raw ZPL needed
- [Phase 04]: Pure fetch wrapper for Browser Print — no vendor SDK, localhost:9100 with AbortController timeouts
- [Phase 04]: LabelData interface in LabelPreviewCard — imported by ZPL builder for single source of truth
- [Phase 04]: Inline modal dialog pattern (fixed overlay) — no external dialog library
- [Phase 04]: Expanded label array for per-piece copies — flatMap each selected piece by copy count before buildBatchZpl
- [Phase 04]: Detail route reuses ShipmentFormPage with isEditRoute pathname detection
- [Phase 05]: Pure function extraction for validateTransition and deriveShipmentStatus — testable without Firestore
- [Phase 05]: Collection group lookup outside transaction for pieceRef, transaction for read-modify-write
- [Phase 05]: Optimistic status mapping in allStatuses array — use newStatus for current piece since tx.update hasn't flushed
- [Phase 05]: Flattened events across all pieces into single reverse-chronological list rather than per-piece grouping
- [Phase 05]: Fragment wrapper for read-only detail view to support sibling sections in ternary
- [Phase 05]: Module-level AudioContext reuse — single instance avoids per-call creation overhead
- [Phase 05]: Removed RequireRole wrapper from /scan — any authenticated user can scan per D-05
- [Phase 05]: ScanAction cast in mutation call — selectedAction state is string, tRPC input needs literal union
- [Phase 06]: Mock processOneScan in router tests — isolates batch logic from Firestore internals
- [Phase 06]: photoUrls replaces photoUrl everywhere — clean break, no backward compat needed
- [Phase 06]: Signed URL with 2099 expiry for signature storage — avoids token refresh complexity for display
- [Phase 06]: Route restructure: AuthenticatedRoutes wrapper so public routes are siblings to AuthGate
- [Phase 06]: Admin button targets first unsigned delivered piece — simplified MVP without piece picker
- [Phase 06]: Signature prompt before mutation — delivery scans pause for optional signature before firing
- [Phase 06]: Receiver auto-detect deferred — ScanResult lacks receiver fields; isReceiver utility ready for future wiring
- [Phase 06]: Batch signature is single capture — one signature covers all items in a delivery batch
- [Phase 07]: Client-side status filtering for showCompleted — avoids Firestore not-in + inequality compound query limitation
- [Phase 07]: Exception thresholds as inline constants — stalled 4h, overdue 24h, aged 24h per D-07
- [Phase 07]: showCompleted: true on dashboard hook — dashboard needs all statuses, client-side tabs handle filtering
- [Phase 07]: sortShipments exported as utility — DashboardPage applies sorting in useMemo for filtered+sorted pipeline
- [Phase 07]: My Tasks tab prepended (first position) for drivers — their primary view
- [Phase 07]: DriverTripView receives full shipments and filters internally via useMemo
- [Phase 08]: Firestore mail collection pattern — write to mail/{auto-id} for Firebase Trigger Email extension
- [Phase 08]: notificationPrefs gating per status type — each status checks its own pref flag
- [Phase 08]: Deduplication via Set for sender/receiver — handles case where sender equals receiver
- [Phase 08]: Shipment-level query (not piece-level) for aged detection — receiver email and lastAgedReminderAt live on shipment doc
- [Phase 08]: FieldValue.serverTimestamp for lastAgedReminderAt update — consistent server-side time

### Pending Todos

None yet.

### Blockers/Concerns

- [Research]: Zebra Browser Print requires local desktop app — validate on shared tablets during Phase 4 planning
- [Research]: html5-qrcode in maintenance mode — monitor during development, zxing-wasm as migration target
- [Research]: Google Workspace Directory API may need IT approval — validate during Phase 3 planning

## Session Continuity

Last session: 2026-04-02T20:13:12.646Z
Stopped at: Phase 10 context gathered
Resume file: .planning/phases/10-admin-panel-reports/10-CONTEXT.md
