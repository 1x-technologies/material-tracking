# Phase 3: Shipment Creation - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Staff and Admin can create shipments with full details (sender, receiver, description, category, priority, origin, destination, piece count) on a tablet-friendly single-page form. They can search the company directory for sender/receiver or enter external contacts with name, company, and email. Priority is visually distinct. Users can edit any shipment fields until the first scan (status remains Created) and cancel before pickup via soft delete with inline confirmation. Locations are read from Firestore `locations/{id}` and new sites are added by configuration only (no code deploy). Phase 3 does not include QR labels, scanning, or full admin UI for locations (Phase 4+ / Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Sender / receiver lookup

- **D-01:** Use **autocomplete** text fields for directory search — user types; matching results appear as they type (tablet-friendly, fast for repeat use).
- **D-02:** **Sender defaults to the signed-in user** — pre-filled from `appUser` / Firebase profile, user can change to another directory person.
- **D-03:** **External (non-directory) contacts** require **name + company + email** — all three fields mandatory when user chooses external flow or when no directory match is selected.

### Form layout and tablet optimization

- **D-04:** **Single-page form** — all fields on one scrollable page with a primary submit action at the bottom (or sticky footer); no multi-step wizard for v1.
- **D-05:** **Category set:** Documents, Parts, Samples, Equipment, Personal, Other — UI labels and validation must align with shared `ShipmentCategory` and `createShipmentSchema` after enum/schema update (current code uses a different subset; planner must reconcile).
- **D-06:** **Piece count** — simple **numeric input with +/- stepper** (min 1, max per existing schema e.g. 99 unless product changes).

### Edit and cancel

- **D-07:** **All fields editable** until the **first scan** — treat as “while shipment status is Created” (or equivalent gate); once any piece leaves Created via scan, lock editing per SHIP-04.
- **D-08:** **Cancel = soft delete** — set shipment status to `cancelled` (see `ShipmentStatus.CANCELLED`); retain document for history and audit (SHIP-05).
- **D-09:** **Cancel confirmation** — **inline double-confirm**: first click arms a destructive state (e.g. button turns red); second click within a short window performs cancel.

### Location model (INFR-03)

- **D-10:** **Locations live in Firestore** collection `locations/{locationId}` — documents are the source of truth; adding/editing locations is **configuration** (Console, seed script, or future admin UI in Phase 10), not app code changes.
- **D-11:** **Origin** pre-selects from the current user’s Firestore profile **`locationId`** when it matches an active location; user can change destination and origin freely.
- **D-12:** **Initial seed (two sites):** **HA** — Hayward; **SC** — San Carlos — seed or create these documents before UAT; stable `locationId` values should be chosen for `originId` / `destinationId`.

### Claude's Discretion

- Exact debounce timing and minimum query length for directory autocomplete
- Whether directory search is stubbed (mock list) vs Google Workspace Directory API in Phase 3 — **SHIP-02** requires real behavior eventually; if API is deferred, stub must be clearly flagged for a follow-up task
- Receiver `createShipmentSchema` shape: extend for `company` on external receiver and required email when `isExternal` (align with D-03)
- Visual treatment of priority (badge colors, border) — must satisfy SHIP-03 “visually distinct”
- Sticky vs static submit bar on long forms

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — SHIP-01 through SHIP-05, INFR-03
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria, dependency on Phase 2
- `.planning/PROJECT.md` — stack constraints, Firestore model, tablet assumption

### Prior phase

- `.planning/phases/02-authentication-user-roles/02-CONTEXT.md` — roles, tRPC + Bearer token, Firestore `users/{uid}`

### Shared contracts

- `packages/shared/src/schemas/shipment.ts` — `createShipmentSchema`, `CreateShipmentInput`
- `packages/shared/src/enums.ts` — `ShipmentCategory`, `Priority`, `ShipmentStatus`
- `packages/shared/src/types/shipment.ts` — `Shipment`, `ShipmentSender`, `ShipmentReceiver`, `LocationRef`
- `packages/shared/src/types/location.ts` — `Location`

### Security and hosting

- `firestore.rules` — client read patterns; **no client writes** to `shipments`; mutations via API Admin SDK

### Web integration

- `apps/web/src/App.tsx` — `/shipments/new` + `RequireRole` for staff/admin
- `apps/web/src/components/layout/Sidebar.tsx` — nav to New Shipment
- `apps/web/src/pages/ShipmentCreateStubPage.tsx` — replace with real create/edit UI

### Functions (downstream consistency)

- `apps/functions/src/triggers/onShipmentCreate.ts` — expectations when `shipments` documents are created

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- [`packages/shared/src/schemas/shipment.ts`](packages/shared/src/schemas/shipment.ts) — create payload schema; **update** category enum literals and receiver fields for D-03 / D-05
- [`packages/shared/src/enums.ts`](packages/shared/src/enums.ts) — `ShipmentCategory`, `Priority`; **align** with D-05 (add samples, personal; remove or map supplies if unused)
- [`apps/web/src/components/layout/AppLayout.tsx`](apps/web/src/components/layout/AppLayout.tsx) — shell for shipment pages
- [`apps/web/src/components/ui/Spinner.tsx`](apps/web/src/components/ui/Spinner.tsx) — loading states
- [`apps/api/src/middleware/auth.ts`](apps/api/src/middleware/auth.ts) — `staffProcedure` for create/update/cancel mutations
- [`apps/api/src/context.ts`](apps/api/src/context.ts) — `ctx.user` for `createdBy` and default sender

### Established patterns

- tRPC routers under `apps/api/src/routers/`; mount new `shipment` router in [`apps/api/src/router.ts`](apps/api/src/router.ts)
- Web uses [`apps/web/src/trpc.tsx`](apps/web/src/trpc.tsx) for authenticated requests

### Integration points

- Replace [`ShipmentCreateStubPage.tsx`](apps/web/src/pages/ShipmentCreateStubPage.tsx) with create form; add edit/cancel routes or same page with `shipmentId` param per planner
- List/query `locations` via read-only Firestore client or `locations.list` tRPC — rules allow authenticated read on `locations`

</code_context>

<specifics>
## Specific Ideas

- Two launch locations: **HA (Hayward)** and **SC (San Carlos)**.
- Categories for product copy: **Documents, Parts, Samples, Equipment, Personal, Other**.

</specifics>

<deferred>
## Deferred Ideas

- **Full admin CRUD for locations** — Phase 10 (ADMN-02 area); Phase 3 uses Console/seed only per D-10
- **Per-piece descriptions at creation** — deferred; D-06 is count-only at create (detail in later phases)
- **Google Workspace Directory API** — may need IT approval; if not in Phase 3, document stub vs live API in RESEARCH/PLAN

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 03-shipment-creation*
*Context gathered: 2026-04-01*
