# Phase 9: History, Search & Audit - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Searchable shipment history page with filters (date range, sender, receiver, status, description keyword), full visual timeline per shipment showing all events (creation, scans, edits, cancellations), and audit trail. History retained indefinitely with no auto-purge. Phase 9 does NOT include admin reports/exports (Phase 10) or advanced analytics.

</domain>

<decisions>
## Implementation Decisions

### Search and filters (HIST-01)

- **D-01:** **Dedicated History page** at `/history` — separate from dashboard (which shows active shipments). History shows all shipments including completed and cancelled.
- **D-02:** **Filter bar** at the top with: date range picker (from/to), status dropdown (all statuses), sender text input, receiver text input, description keyword search. Filters combine with AND logic.
- **D-03:** **Firestore queries** for filtering — use composite queries on `status`, `createdAt` range. For sender/receiver/description text search, use **client-side filtering** on the loaded result set (Firestore doesn't support full-text search natively). Paginate with cursor-based loading (load 50 at a time, "Load More" button).
- **D-04:** **No external search service** (Algolia, Typesense) for v1 — client-side filtering is sufficient for the expected volume (20-100 shipments/day). Add search index in v2 if needed.

### Timeline view (HIST-03)

- **D-05:** **Visual timeline** on shipment detail page — replaces/enhances the basic `PieceEventsList` from Phase 5. Vertical timeline with connected dots, color-coded by action type (created=neutral, in_transit=blue, delivered=green, completed=purple, cancelled=red).
- **D-06:** Timeline includes **all event types**: creation, each scan event (with piece number, who, when), edits (if tracked), cancellation. Events sorted chronologically.
- **D-07:** Each timeline entry shows: **action icon**, **timestamp** (relative + absolute), **user name**, **piece number** (for scan events), and optional **signature/photo indicators**.

### Data retention (HIST-02)

- **D-08:** **No auto-purge** — all shipment data retained indefinitely in Firestore. No TTL, no archival. HIST-02 is satisfied by default (Firestore doesn't auto-delete).

### Audit trail (ADMN-05)

- **D-09:** **Derive audit data from existing sources** — scan events are already in `Piece.events[]`, creation metadata in `Shipment.createdBy` + `createdAt`, cancellation in status change. No separate audit collection needed for v1.
- **D-10:** The timeline view (D-05) effectively serves as the visual audit trail — shows who did what and when for each shipment.

### Claude's Discretion

- Date range picker implementation (native HTML date inputs vs library)
- Pagination strategy (cursor vs offset)
- Timeline animation/transitions
- Whether to add a sidebar nav link for History
- Empty state for search with no results
- Export/download search results (defer to Phase 10)

### Folded Todos

None.

</decisions>

<canonical_refs>
## Canonical References

### Requirements and roadmap

- `.planning/REQUIREMENTS.md` — HIST-01, HIST-02, HIST-03, ADMN-05
- `.planning/ROADMAP.md` — Phase 9 goal, success criteria

### Prior phases

- `.planning/phases/05-scan-processing-status-workflow/05-CONTEXT.md` — PieceEventsList, scan events
- `.planning/phases/07-real-time-dashboard/07-CONTEXT.md` — dashboard for active shipments (history is the complement)

### Shared contracts

- `packages/shared/src/types/shipment.ts` — Shipment, CreatedBy
- `packages/shared/src/types/piece.ts` — Piece, PieceEvent
- `packages/shared/src/enums.ts` — ShipmentStatus, PieceStatus, ScanAction

### Web integration

- `apps/web/src/App.tsx` — add `/history` route
- `apps/web/src/components/layout/Sidebar.tsx` — add History nav link
- `apps/web/src/pages/ShipmentFormPage.tsx` — enhance detail view with timeline
- `apps/web/src/components/shipment/PieceEventsList.tsx` — replace with timeline

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- `PieceEventsList` component — basic events list to evolve into timeline
- `useShipmentsSubscription` hook — adapt pattern for history (use tRPC query instead of onSnapshot for non-realtime)
- `StatusBadge`, `PriorityBadge` — reuse on history table
- `shipment.getById` + `shipment.listPieces` tRPC queries

### Integration points

- New `/history` route in App.tsx
- New Sidebar nav item "History"
- Replace PieceEventsList with visual timeline on detail page
- May need new tRPC query `shipment.search` for filtered listing with pagination

</code_context>

<specifics>
## Specific Ideas

- History table similar to dashboard ShipmentTable but with all statuses and date range filter
- Timeline dots connected by vertical line, action-colored
- Pagination: Firestore `startAfter(lastDoc)` cursor-based

</specifics>

<deferred>
## Deferred Ideas

- **Full-text search service** (Algolia/Typesense) — v2 if volume demands it
- **Export/download** search results as CSV — Phase 10 reports
- **Separate audit collection** — derive from existing data for now

### Reviewed Todos (not folded)

None.

</deferred>

---

*Phase: 09-history-search-audit*
*Context gathered: 2026-04-01*
