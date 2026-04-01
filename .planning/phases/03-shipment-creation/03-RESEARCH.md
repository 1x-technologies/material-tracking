# Phase 3: Shipment Creation — Research

**Date:** 2026-04-01  
**Question:** What do we need to know to plan shipment creation well?

## Stack alignment

- **Mutations:** Firestore rules deny all client writes to `shipments`, `pieces`, `locations`, `counters`. All creates/updates/cancels go through **Cloud Run tRPC** with Firebase Admin SDK (`apps/api/src/lib/firebase.ts`).
- **Auth:** `staffProcedure` / `adminProcedure` from `apps/api/src/middleware/auth.ts`; `ctx.user` has `uid`, `email`, `name`, `role` — **not** yet `locationId`. Firestore `users/{uid}` already stores `locationId` (`firestoreUserProfileSchema`). Expose `locationId` via `user.me` (or extend `AuthUser`) for server-side defaults and parity with web profile reads.
- **Web profile:** `AuthContext` loads `users/{uid}` but `AppUser` omits `locationId`; extend for D-11 origin default without an extra round trip.

## Shipment document shape

- **Source of truth:** `packages/shared/src/types/shipment.ts` + Zod in `schemas/shipment.ts`. Align enum literals with CONTEXT D-05: `documents`, `parts`, `samples`, `equipment`, `personal`, `other`.
- **Receiver (D-03):** External = `isExternal: true` with required **name, company, email** (all non-empty strings, valid email). Internal = `isExternal: false` with **uid** (directory user id), name/email from directory; company optional or omitted.
- **Shipment number:** No existing generator. Use Firestore transaction on `counters/shipments` field `last` (or `seq`) increment → format `SH-{YYYYMMDD}-{seqPadded}` (concrete format locked in implementation; must be unique and human-readable).

## Pieces at create time

- **Phase 4** needs one doc per piece under `shipments/{id}/pieces/{pieceId}`. Create **N** piece docs in the same batch/transaction as the shipment: `pieceNumber` 1..N, `status: "created"`, `qrCode` placeholder **`pending:{shipmentId}:{pieceNumber}`** (exact prefix documented so Phase 4 can replace), minimal `events` / `currentLocation` per `Piece` type — adjust if type requires fields; use origin `LocationRef` for `currentLocation` at create.

## Locations (INFR-03)

- **Read:** Authenticated clients may read `locations/{id}` per rules. Prefer **`locations.list` tRPC** (Admin SDK) so the web app does not need composite queries or indexes for v1.
- **Seed:** Two documents `HA` and `SC` (ids = stable `locationId` values) with fields matching `Location` in shared types: `name`, `fullName`, `address`, `active: true`, `printers: []`, timestamps. Deliver a **script** under `scripts/` or `packages/db-seed/` runnable with `GOOGLE_APPLICATION_CREDENTIALS` / Firebase admin, documented in plan tasks.

## Directory search (SHIP-02)

- **Preferred eventual:** Google Workspace Directory API (People/Directory) with service account — may need IT approval (STATE blocker).
- **Phase 3 default:** **`directory.search` tRPC** backed by a **stub** returning a static short list of test users **when** env `DIRECTORY_STUB=1` (or `NODE_ENV=test`), else call a thin **Admin SDK Directory** client if credentials exist; if credentials missing, return `TRPCError` `FAILED_PRECONDITION` with message containing **`DIRECTORY_NOT_CONFIGURED`**. Log clearly for operators. Document follow-up task “Wire real Directory API” in PLAN must_haves / deferred.

## Edit / cancel rules (D-07–D-09, SHIP-04/05)

- **Update shipment:** Allow only when `shipment.status === "created"` (no scans in Phase 3; forward-compatible comment for “no piece left `created`” later).
- **Cancel:** Set `status` to `"cancelled"`; reject if already `cancelled` or `picked_up`. Until scanning exists, also require `status === "created"` for simplicity **or** document one rule: cancel allowed if **no piece** has status other than `created` — choose **created-only** for minimal scope in Phase 3 API (executor can add piece-level check if pieces always exist).

## Priority visuals (SHIP-03)

- Map `urgent` | `standard` | `low` to **concrete** Tailwind classes on form and detail row (e.g. `border-l-4 border-red-500` urgent, `border-neutral-300` standard, `border-slate-400` low) — specify in web plan, no subjective “distinct” wording in acceptance criteria.

## Testing

- **API:** Vitest + mocked Firestore (existing pattern in `apps/api/tests`) for create/update/cancel/list locations.
- **Web:** `pnpm --filter @material-tracking/web exec tsc --noEmit` after changes; optional RTL test for one form validation path (follow `AuthContext.test.tsx`).

---

## Validation Architecture

Phase 3 validation uses **Vitest** on the API package and **TypeScript compile** on the web package.

| Dimension | Approach |
|-----------|----------|
| Unit | Vitest tests for shipment router procedures with mocked `db` / transaction |
| Contract | Shared Zod schemas exported from `@material-tracking/shared`; API imports same schemas as web |
| Integration | Manual: create shipment in dev UI + verify Firestore console |
| CI | `pnpm exec biome check` + `pnpm --filter @material-tracking/api test` + `tsc` for api and web |

**Quick command:** `pnpm --filter @material-tracking/api exec vitest run`  
**Full command:** `pnpm --filter @material-tracking/api exec vitest run && pnpm --filter @material-tracking/api exec tsc --noEmit && pnpm --filter @material-tracking/web exec tsc --noEmit`

**Wave 0:** No new framework — extend existing `apps/api/vitest.config.ts` and tests.

---

## RESEARCH COMPLETE
