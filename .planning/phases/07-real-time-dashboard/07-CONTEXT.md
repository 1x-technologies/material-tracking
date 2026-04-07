# Phase 7: Real-Time Dashboard - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the placeholder DashboardPage with a live status board showing all active shipments with real-time Firestore updates, exception highlighting (stalled, overdue, aged), and a driver trip view grouping today's tasks. Phase 7 does NOT include notifications (Phase 8), full history/search (Phase 9), or admin panel (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Dashboard layout

- **D-01:** **Table-based status board** — rows per shipment with columns: shipment number, status badge, priority badge, origin → destination, piece count + progress (e.g., "3/5 delivered"), sender, receiver, created date, last activity. Sortable by priority and status. Tablet-friendly with horizontal scroll if needed.
- **D-02:** **Status filter tabs** at the top — All, In Transit, Delivered, Completed, plus an "Exceptions" tab showing only flagged shipments. Active tab highlighted.
- **D-03:** **Click row to navigate** to shipment detail page (`/shipments/{id}`).

### Real-time updates

- **D-04:** Use **Firestore `onSnapshot`** on the `shipments` collection (client SDK, not tRPC) for live updates — dashboard subscribes to active shipments (where status not in `completed`, `cancelled` unless filtered). Changes appear without page refresh.
- **D-05:** **Limit query scope** — only load shipments from the last 30 days by default (filter by `createdAt`) to avoid loading the entire history. "Show older" button or date range filter for more.
- **D-06:** **Optimistic UI** — status badge updates instantly when `onSnapshot` fires; no loading spinner per update.

### Exception alerts (DASH-02)

- **D-07:** Exception definitions:
  - **Stalled:** Shipment status hasn't changed in 4+ hours during business hours (configurable threshold later via Phase 10 admin)
  - **Overdue:** Shipment created 24+ hours ago and not yet delivered
  - **Aged:** Delivered but not picked up for 24+ hours (the "forgotten package" problem)
- **D-08:** Exceptions displayed as **colored badges on the shipment row** — red for aged (highest urgency), orange for overdue, yellow for stalled. Exception tab filters to these only.
- **D-09:** **Exception count badge** on the "Exceptions" tab showing total count.

### Driver trip view (DASH-03)

- **D-10:** **Separate tab or toggle** on the dashboard — "My Tasks" view for drivers showing shipments relevant to the current user's location.
- **D-11:** Tasks grouped by **action needed**: "Pickup" (shipments at driver's origin location in `created` status) and "Deliver" (shipments in `in_transit` where destination matches driver's location).
- **D-12:** Each task shows shipment number, piece count, priority badge, sender/receiver, and a "Scan" quick-action button linking to `/scan`.

### Claude's Discretion

- Exact table column widths and responsive breakpoints
- Whether to use Firestore client SDK directly or a React hook wrapper for `onSnapshot`
- Refresh interval for exception calculations (real-time vs periodic recompute)
- Empty state messaging per tab
- Whether driver trip view auto-filters by user's `locationId` or shows a location picker
- Activity indicator (pulsing dot, last-updated timestamp)
- Sort defaults (priority desc, then created desc)

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — DASH-01, DASH-02, DASH-03
- `.planning/ROADMAP.md` — Phase 7 goal, success criteria
- `.planning/PROJECT.md` — Firestore onSnapshot for real-time, tablet assumption

### Prior phases

- `.planning/phases/05-scan-processing-status-workflow/05-CONTEXT.md` — scan processing, status lifecycle, derived status
- `.planning/phases/03-shipment-creation/03-CONTEXT.md` — shipment creation flow, status values

### Shared contracts

- `packages/shared/src/enums.ts` — `ShipmentStatus`, `Priority`
- `packages/shared/src/types/shipment.ts` — `Shipment` type with all fields
- `packages/shared/src/types/user.ts` — `User.locationId` for driver trip filtering

### Web integration

- `apps/web/src/pages/DashboardPage.tsx` — stub to replace
- `apps/web/src/firebase.ts` — `firestore` export for client-side onSnapshot
- `apps/web/src/context/AuthContext.tsx` — `appUser.locationId` for driver filtering
- `apps/web/src/App.tsx` — `/dashboard` route

### Security

- `firestore.rules` — authenticated read on `shipments` collection

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `firestore` client SDK from `apps/web/src/firebase.ts` — use for `onSnapshot`
- `ShipmentStatus`, `Priority` enums for badge rendering
- `useAuthContext()` for user role and locationId
- Tailwind CSS for styling; existing color patterns for priority badges (red/neutral/slate from Phase 3)

### Established patterns

- Status badges already exist in `PriorityField` and `PieceEventsList` — reuse color scheme
- Navigation via `useNavigate` from react-router
- tRPC for non-realtime data; Firestore client SDK for real-time

### Integration points

- Replace `DashboardPage.tsx` placeholder
- `/dashboard` route already exists in `App.tsx`
- Sidebar already has Dashboard nav item

</code_context>

<specifics>
## Specific Ideas

- Exception thresholds: stalled 4h, overdue 24h, aged 24h (configurable in Phase 10)
- Driver trip view: filter by `appUser.locationId` against shipment `origin.locationId` (pickup) and `destination.locationId` (deliver)
- Real-time: `onSnapshot` with `where("status", "not-in", ["completed", "cancelled"])` + `where("createdAt", ">", thirtyDaysAgo)` — may need composite index

</specifics>

<deferred>
## Deferred Ideas

- **Configurable exception thresholds** — Phase 10 admin settings
- **Dashboard analytics/charts** — volume trends, average delivery times (Phase 10 reports)
- **Push notifications from dashboard** — Phase 8
- **Saved filters/views** — future enhancement

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 07-real-time-dashboard*
*Context gathered: 2026-04-01*
