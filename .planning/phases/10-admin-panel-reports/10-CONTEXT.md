# Phase 10: Admin Panel & Reports - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin-only management interface for users, locations, and system settings, plus pre-built operational reports with CSV export. Single `/admin` route with tabbed navigation (Users | Locations | Settings | Reports), restricted to admin role.

</domain>

<decisions>
## Implementation Decisions

### User Management
- **D-01:** Auto-provision on first Google SSO login. Anyone with a company Google account can sign in; a Firestore user document is created automatically on first auth. Admin assigns role afterward.
- **D-02:** New users get no role (pending status). They see an "approval pending" page until an admin assigns a role. Auth middleware rejects pending users from all protected routes.
- **D-03:** User list displayed as table + detail panel. Table shows name, email, role, location, status. Click a row to open side panel with full details and edit controls (role assignment, location assignment, deactivation).
- **D-04:** Soft deactivation for users. Set `active: false` on user doc. Auth middleware rejects inactive users. Admin can reactivate. All historical data preserved.
- **D-05:** Bulk operations supported via checkbox selection + bulk role assign. Select multiple users from table, assign role in one action. Useful for initial setup.

### Location Management
- **D-06:** Table + side panel pattern, matching user management. Table lists all locations including inactive ones. Click to open detail panel for editing name, address, active status.
- **D-07:** Printer configuration nested within location detail panel. Each printer has name, IP, model, isDefault. Admin can add/edit/remove printers for a location. (Printers already stored on location docs.)

### System Settings
- **D-08:** Configurable settings: aging threshold (currently hardcoded 24h), stalled threshold (4h), overdue threshold (24h), and default notification preferences. These replace hardcoded constants in Phase 7/8 code.
- **D-09:** Single Firestore document at `settings/global` stores all configuration values. Simple reads, atomic updates. Admin panel reads/writes this doc.

### Reports & Export
- **D-10:** Three pre-built report cards: (1) Avg delivery time by location (bar chart), (2) Shipment volume over time (line chart), (3) Driver activity -- scans per driver in period (table). Covers ADMN-04 requirements.
- **D-11:** CSV-only export. Simple, universal format. Each report has an "Export CSV" button that downloads filtered data.
- **D-12:** Recharts library for chart rendering. Declarative React components, good defaults for bar and line charts.

### Admin Navigation
- **D-13:** Single `/admin` route with tab navigation: Users | Locations | Settings | Reports. One sidebar entry labeled "Admin", visible only to admin role.

### Pending User Experience
- **D-14:** Pending users see a clean "approval pending" page: "Your account is pending approval. An administrator will assign your role shortly." with a sign-out button. No action required from user.

### Admin Audit Log
- **D-15:** Admin actions (role changes, deactivations, settings updates) logged to `admin_audit_log` Firestore collection. Each entry: who, what changed, old value, new value, timestamp. Visible in a "Recent Activity" section on the admin panel.

### Bulk Operations
- **D-16:** User table supports checkbox selection with bulk role assignment. Individual operations still available via detail panel.

### Claude's Discretion
- Chart styling, color palette, responsive breakpoints
- Detail panel width and animation
- Date range picker component choice for reports
- Table pagination approach (cursor vs offset -- small datasets expected)
- Audit log retention policy and display limit

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Authentication & Authorization
- `apps/api/src/middleware/auth.ts` -- adminProcedure, staffProcedure, role-based middleware patterns
- `apps/web/src/components/auth/RequireRole.tsx` -- Frontend role gating component
- `packages/shared/src/enums.ts` -- UserRole enum (admin, driver, staff)

### Existing Routers & Data
- `apps/api/src/routers/user.ts` -- Current user.me procedure pattern
- `apps/api/src/routers/locations.ts` -- Existing locations.list (read-only, active only)
- `apps/api/src/routers/shipment.ts` -- Shipment router patterns, Firestore query patterns

### Navigation & Layout
- `apps/web/src/App.tsx` -- Route definitions, RequireRole wrapping pattern
- `apps/web/src/components/layout/Sidebar.tsx` -- Nav item structure with role filtering

### Threshold Constants (to be replaced by settings)
- `apps/web/src/pages/DashboardPage.tsx` -- Hardcoded exception thresholds (4h stalled, 24h overdue, 24h aged)
- `apps/api/src/routers/shipment.ts` -- Any server-side threshold references

### User Profile Schema
- `packages/shared/src/types/user.ts` -- AppUser type with role, locationId
- `packages/shared/src/schemas/user.ts` -- Zod user schema

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `RequireRole` component: Wraps routes for role-based access. Use for `/admin` route.
- `adminProcedure`: Server-side middleware for admin-only tRPC endpoints. Already defined.
- `locationsRouter.list`: Returns active locations with printer data. Extend for CRUD.
- `Sidebar` nav items: Role-filtered array pattern. Add admin entry.
- `ShipmentTable` pattern: Table component with loading states. Reference for user/location tables.

### Established Patterns
- tRPC router procedures with Zod input validation
- Firestore collection patterns (query, get, set, update)
- Const object enum pattern for new enums (e.g., UserStatus if needed)
- Table + detail panel pattern (new in Phase 10, but consistent with History page table)

### Integration Points
- Auth middleware: Add pending user check (no role = rejected from protected routes, allowed to see pending page)
- User provisioning: On first Google SSO, create Firestore user doc with `role: null` and `active: true`
- Settings consumption: Phase 7/8 hardcoded thresholds must read from `settings/global` doc
- Sidebar: Add "Admin" nav item with `roles: ["admin"]`

</code_context>

<specifics>
## Specific Ideas

- Table + detail panel is the consistent UI pattern for both users and locations
- Pending approval page should be minimal and clear -- not a form, just information
- Reports are pre-built, not configurable -- 3 specific charts covering delivery times, volume, driver activity
- Audit log is lightweight -- recent activity section, not a full-blown audit system

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 10-admin-panel-reports*
*Context gathered: 2026-04-02*
