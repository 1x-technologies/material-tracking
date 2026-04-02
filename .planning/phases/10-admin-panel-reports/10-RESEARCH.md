# Phase 10: Admin Panel & Reports - Research

**Researched:** 2026-04-02
**Domain:** Admin CRUD, system settings, operational reporting, Recharts, Firestore aggregation
**Confidence:** HIGH

## Summary

Phase 10 builds the admin-only management interface covering four CRUD domains (users, locations, settings, audit log) and three operational reports with CSV export. The entire stack is already established -- tRPC with Zod validation on the API, React + Tailwind on the web, Firestore as the datastore, Sonner for toasts. The only new dependency is Recharts for charting.

The primary technical challenge is the report data aggregation. Firestore lacks server-side GROUP BY or AVG operations, so reports must either aggregate on the API server by fetching all matching shipments within a date range, or use pre-computed aggregation documents. Given the expected volume (20-100 shipments/day), server-side in-memory aggregation of the raw shipments collection is feasible and simple. No pre-aggregation pipeline is needed for v1.

The pending user flow requires a modification to the auth middleware and the AuthContext. Currently, new users are auto-provisioned with `role: "staff"` in `context.ts`. Per D-01/D-02, this must change to `role: null` (pending), and the auth middleware must reject pending users from protected routes while still allowing them to see the pending approval page.

**Primary recommendation:** Use the existing tRPC + adminProcedure pattern for all admin CRUD endpoints. Add Recharts ^3.8.0 for charts. Aggregate report data server-side in tRPC queries. Change user auto-provision from `role: "staff"` to no role (pending state).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Auto-provision on first Google SSO login. Anyone with a company Google account can sign in; a Firestore user document is created automatically on first auth. Admin assigns role afterward.
- **D-02:** New users get no role (pending status). They see an "approval pending" page until an admin assigns a role. Auth middleware rejects pending users from all protected routes.
- **D-03:** User list displayed as table + detail panel. Table shows name, email, role, location, status. Click a row to open side panel with full details and edit controls (role assignment, location assignment, deactivation).
- **D-04:** Soft deactivation for users. Set `active: false` on user doc. Auth middleware rejects inactive users. Admin can reactivate. All historical data preserved.
- **D-05:** Bulk operations supported via checkbox selection + bulk role assign. Select multiple users from table, assign role in one action.
- **D-06:** Table + side panel pattern, matching user management. Table lists all locations including inactive ones.
- **D-07:** Printer configuration nested within location detail panel.
- **D-08:** Configurable settings: aging threshold, stalled threshold, overdue threshold, and default notification preferences. These replace hardcoded constants in Phase 7/8 code.
- **D-09:** Single Firestore document at `settings/global` stores all configuration values.
- **D-10:** Three pre-built report cards: (1) Avg delivery time by location (bar chart), (2) Shipment volume over time (line chart), (3) Driver activity -- scans per driver in period (table).
- **D-11:** CSV-only export. Each report has an "Export CSV" button.
- **D-12:** Recharts library for chart rendering.
- **D-13:** Single `/admin` route with tab navigation: Users | Locations | Settings | Reports.
- **D-14:** Pending users see a clean "approval pending" page with sign-out button.
- **D-15:** Admin actions logged to `admin_audit_log` Firestore collection. Each entry: who, what changed, old value, new value, timestamp.
- **D-16:** User table supports checkbox selection with bulk role assignment.

### Claude's Discretion
- Chart styling, color palette, responsive breakpoints
- Detail panel width and animation
- Date range picker component choice for reports
- Table pagination approach (cursor vs offset -- small datasets expected)
- Audit log retention policy and display limit

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADMN-01 | Admin can manage users (create, assign roles, deactivate) | User CRUD via new `admin.listUsers`, `admin.updateUser`, `admin.bulkAssignRole` tRPC procedures using `adminProcedure` middleware. User docs already exist in Firestore `users` collection. Schema changes: add `active` field, allow `role: null` for pending. |
| ADMN-02 | Admin can manage locations (add, edit, deactivate) | Location CRUD via new `admin.listAllLocations`, `admin.createLocation`, `admin.updateLocation` tRPC procedures. Existing `locations` collection and `Location` type with `Printer[]` already defined. |
| ADMN-03 | Admin can configure system settings (aging threshold, notification preferences) | New `settings/global` Firestore doc with `admin.getSettings` and `admin.updateSettings` procedures. Exception thresholds in `apps/web/src/utils/exceptions.ts` and `apps/functions/src/scheduled/agedReport.ts` currently hardcoded -- must be updated to read from settings. |
| ADMN-04 | Admin can generate and export reports: delivery times, volume trends, driver performance | Server-side aggregation queries over `shipments` collection (has `createdAt`, `deliveredAt`, `origin`, `destination`) and `pieces` subcollections (have `events[]` with `userId`, `action`, `timestamp`). Recharts for visualization, client-side CSV via Blob. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^3.8.0 | Declarative React chart components (BarChart, LineChart, Area) | 24M+ weekly downloads, MIT license, React 19 compatible, removed react-smooth/recharts-scale deps in v3 |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @trpc/server | ^11.16.0 | API procedures with Zod validation | All admin CRUD and report endpoints |
| @trpc/react-query | ^11.16.0 | React hooks for tRPC queries/mutations | All admin UI data fetching |
| sonner | ^2.0.7 | Toast notifications | Success/error feedback for admin actions |
| zod | ^4.3.6 | Input validation schemas | All new admin schemas |
| tailwind-merge | ^3.3.0 | Conditional class merging | Side panel and table styling |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Recharts | Nivo, Chart.js | Recharts is more React-idiomatic (JSX components vs imperative API). Already decided (D-12). |
| Client-side CSV generation | Papa Parse, server-side CSV | Client-side Blob is simpler for small datasets. Papa Parse adds unnecessary dependency for generating (not parsing) CSV. |
| Native `<input type="date">` | react-datepicker, date-fns-based picker | Native inputs are the established project pattern (HistoryPage). No new dependency needed. |

**Installation:**
```bash
pnpm --filter web add recharts@^3.8.0
```

**Version verification:** Recharts latest stable is 3.8.1 (verified via `npm view recharts version`). The UI-SPEC mentions `^2.15.0` but Recharts 3.x is current. The v3 API is backward compatible for standard chart usage (BarChart, LineChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer). Use `^3.8.0`.

## Architecture Patterns

### Recommended Project Structure
```
apps/api/src/routers/
  admin.ts                    # All admin procedures (user CRUD, location CRUD, settings, reports, audit log)

apps/web/src/
  pages/
    AdminPage.tsx             # Page shell with tab navigation
    PendingApprovalPage.tsx   # Full-page pending state for role-less users
  components/admin/
    AdminTabs.tsx             # Tab navigation (hash-based)
    UserTable.tsx             # User list with checkbox selection
    UserDetailPanel.tsx       # User edit slide-in panel
    LocationTable.tsx         # Location list
    LocationDetailPanel.tsx   # Location edit + printer management
    PrinterList.tsx           # Nested printer CRUD
    SettingsForm.tsx          # Threshold + notification settings
    ReportsView.tsx           # Date filter + report card grid
    AuditLog.tsx              # Collapsible recent activity
    SidePanel.tsx             # Reusable slide-in panel wrapper
    StatusPill.tsx            # Active/inactive/pending badge
    charts/
      DeliveryTimeChart.tsx   # Recharts BarChart
      VolumeChart.tsx         # Recharts LineChart + Area
      DriverActivityTable.tsx # HTML table for driver stats

packages/shared/src/
  schemas/
    admin.ts                  # Zod schemas for admin inputs (updateUser, createLocation, updateSettings, etc.)
  types/
    settings.ts               # GlobalSettings interface
```

### Pattern 1: Admin Router with adminProcedure
**What:** Single tRPC router file containing all admin endpoints, protected by `adminProcedure` middleware.
**When to use:** All admin CRUD and report endpoints.
**Example:**
```typescript
// Source: Existing pattern from apps/api/src/middleware/auth.ts + apps/api/src/routers/shipment.ts
import { adminProcedure } from "../middleware/auth";
import { router } from "../trpc";
import { z } from "zod";
import { db } from "../lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

export const adminRouter = router({
  listUsers: adminProcedure.query(async () => {
    const snap = await db.collection("users").get();
    return snap.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() ?? null,
      lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() ?? null,
    }));
  }),

  updateUser: adminProcedure
    .input(updateUserSchema)
    .mutation(async ({ ctx, input }) => {
      const ref = db.doc(`users/${input.uid}`);
      const before = (await ref.get()).data();
      await ref.update({ ...input.patch, updatedAt: FieldValue.serverTimestamp() });
      // Log audit entry
      await db.collection("admin_audit_log").add({
        adminUid: ctx.user.uid,
        adminName: ctx.user.name ?? ctx.user.email ?? "",
        action: "update_user",
        targetId: input.uid,
        before: { role: before?.role, active: before?.active },
        after: input.patch,
        timestamp: FieldValue.serverTimestamp(),
      });
      return { success: true };
    }),
});
```

### Pattern 2: Table + Side Panel (New UI Pattern)
**What:** Table displays list data. Clicking a row opens a slide-in panel on the right for editing. Selected row is highlighted.
**When to use:** User management, location management.
**Key implementation details:**
- State: `selectedId: string | null` controls which row is selected and whether panel is open.
- Panel: Fixed position, `translate-x` animation, 400px width on lg+, full overlay on < lg.
- Row switching: Change `selectedId` without closing panel (no close/reopen animation).
- Unsaved changes: Track dirty state, use `confirm()` dialog on close/switch.
- Escape key: Add `keydown` event listener to close panel.

### Pattern 3: Server-Side Report Aggregation
**What:** tRPC query fetches shipments within a date range and computes aggregates (avg delivery time, volume counts, driver activity) in Node.js memory.
**When to use:** All three report types.
**Why server-side:** Firestore has no GROUP BY, AVG, or COUNT operations. At 20-100 shipments/day, fetching a month of data (~3000 docs max) is fast and well within Firestore read quotas.
**Example:**
```typescript
// Delivery time report aggregation
reportDeliveryTime: adminProcedure
  .input(z.object({ dateFrom: z.string().datetime(), dateTo: z.string().datetime() }))
  .query(async ({ input }) => {
    const snap = await db.collection("shipments")
      .where("createdAt", ">=", Timestamp.fromDate(new Date(input.dateFrom)))
      .where("createdAt", "<=", Timestamp.fromDate(new Date(input.dateTo)))
      .where("deliveredAt", "!=", null)
      .get();

    // Group by destination location and compute avg delivery time
    const byLocation = new Map<string, { total: number; count: number; name: string }>();
    for (const doc of snap.docs) {
      const data = doc.data();
      const created = data.createdAt.toMillis();
      const delivered = data.deliveredAt.toMillis();
      const hours = (delivered - created) / (1000 * 60 * 60);
      const key = data.destination.locationId;
      const entry = byLocation.get(key) ?? { total: 0, count: 0, name: data.destination.name };
      entry.total += hours;
      entry.count += 1;
      byLocation.set(key, entry);
    }
    return [...byLocation.entries()].map(([locationId, { total, count, name }]) => ({
      locationId, name, avgHours: Math.round((total / count) * 10) / 10, count,
    }));
  }),
```

### Pattern 4: Client-Side CSV Export
**What:** Generate CSV string from report data, create a Blob, and trigger browser download.
**When to use:** All three report "Export CSV" buttons.
**Example:**
```typescript
function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
```

### Pattern 5: Pending User Auth Flow
**What:** Modified AuthContext and auth middleware to handle users with no role assignment.
**When to use:** The pending approval flow (D-01, D-02, D-14).
**Key changes:**
1. `apps/api/src/context.ts`: Change auto-provision from `role: "staff"` to omitting role field (or setting `role: null`).
2. `packages/shared/src/schemas/user.ts`: Update `firestoreUserProfileSchema` to allow `role` to be nullable.
3. `apps/api/src/middleware/auth.ts`: `isAuthed` middleware must allow users with null role for the pending page flow, but `requireRole` correctly rejects them since `null` won't match any role array.
4. `apps/web/src/context/AuthContext.tsx`: `AppUser` type must handle `role: null`. The `AuthGate` or route layer must check for null role and render `PendingApprovalPage`.

### Anti-Patterns to Avoid
- **Fetching all users/locations client-side with onSnapshot:** Unlike the dashboard (which needs real-time), admin tables are low-frequency. Use tRPC queries with manual refetch on mutation success instead of onSnapshot subscriptions.
- **Putting report aggregation logic on the client:** Would require giving the web app direct Firestore read access to all shipments, bypassing tRPC security. Keep aggregation server-side.
- **Separate routers for each admin domain:** One `adminRouter` keeps the admin boundary clean and avoids scattering admin-only endpoints across multiple files.
- **Using Recharts `Customized` component:** Deprecated in v3, removed in v4. Use standard chart component composition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar/line charts | Custom SVG chart rendering | Recharts BarChart, LineChart, Area | Tooltips, responsive containers, axis formatting are deceptively complex |
| CSV generation | Custom escape/quote logic | Simple `join(",")` with value escaping | For this dataset (no commas in data), basic CSV generation is fine. If data could contain commas/quotes, use a small helper. |
| Toast notifications | Custom notification system | Sonner (already installed) | Consistent with existing ScanPage pattern |
| Slide-in panel animation | Custom animation library | CSS `transform: translateX()` with Tailwind `transition-transform` | Pure CSS transition handles the slide effect. No framer-motion needed. |
| Double-confirm destructive action | Custom confirmation dialog | Reuse CancelShipmentButton armed-state pattern | Already proven in Phase 3 |

**Key insight:** The admin panel is a standard CRUD interface. Every component follows patterns already established in the project (tables, forms, tRPC mutations, Sonner toasts). The only genuinely new pattern is the slide-in side panel and chart rendering.

## Common Pitfalls

### Pitfall 1: Firestore Compound Query Limitations for Reports
**What goes wrong:** Trying to filter by `createdAt` range AND `deliveredAt != null` AND `status == "delivered"` in a single Firestore query.
**Why it happens:** Firestore requires composite indexes for compound queries. Using inequality filters on multiple fields requires specific index configurations.
**How to avoid:** Keep report queries simple (one inequality filter: `createdAt` range). Apply additional filters (status, deliveredAt presence) in-memory on the server after fetching the date-range results.
**Warning signs:** `FirebaseError: The query requires an index` errors.

### Pitfall 2: User Role Schema Breaking Change
**What goes wrong:** Changing role from required `"admin" | "driver" | "staff"` to nullable breaks the `firestoreUserProfileSchema` Zod parse in `context.ts`, which throws for every pending user, preventing them from even reaching the API.
**Why it happens:** The current schema uses `z.enum(["admin", "driver", "staff"])` which does not allow null/undefined.
**How to avoid:** Update the schema to `z.enum(["admin", "driver", "staff"]).nullable()` or `.optional()`. Then update the `AuthUser` type and `Context` to carry `role: UserRole | null`. The `requireRole` middleware already rejects null roles via `allowed.includes(ctx.user.role)` which returns false for null.
**Warning signs:** 500 errors on every API call for newly-provisioned users.

### Pitfall 3: Stale Threshold Constants After Settings Migration
**What goes wrong:** Moving thresholds from hardcoded constants to `settings/global` but forgetting all consumers. The exception classifier (`apps/web/src/utils/exceptions.ts`) uses hardcoded values. The aged report Cloud Function (`apps/functions/src/scheduled/agedReport.ts`) also uses hardcoded 24h.
**Why it happens:** Thresholds are currently embedded as magic numbers in multiple files, not centralized.
**How to avoid:** Create a tRPC endpoint `admin.getSettings` that returns settings. On the web side, fetch settings once and pass to exception classifier. On the functions side, read `settings/global` doc at cron execution time. Identify ALL threshold consumers before starting implementation.
**Warning signs:** Dashboard showing different exception thresholds than what the admin configured.

### Pitfall 4: Recharts ResponsiveContainer Height Zero
**What goes wrong:** Charts render with zero height because `ResponsiveContainer` needs an explicit height or a parent with defined height.
**Why it happens:** `ResponsiveContainer` uses `width="100%" height="100%"` by default, which collapses to zero if the parent has no explicit height.
**How to avoid:** Always set explicit `height` on `ResponsiveContainer` (e.g., `height={300}`) or ensure the parent container has a fixed height.
**Warning signs:** Empty chart areas with no visible error.

### Pitfall 5: Bulk Operations Race Conditions
**What goes wrong:** Bulk role assignment for N users fires N parallel Firestore updates. If one fails (e.g., user deleted between list fetch and update), the batch is partially applied with no rollback.
**Why it happens:** Firestore does not support multi-document transactions across different documents in a scalable way for arbitrary batch sizes.
**How to avoid:** Use `Promise.allSettled` (same pattern as `scanRouter.processBatch`). Report partial failures to the admin. Each update is independent and idempotent.
**Warning signs:** "Role updated for 3 users" toast when admin selected 5.

### Pitfall 6: Admin Audit Log Write Failures Blocking Mutations
**What goes wrong:** If the audit log write fails (e.g., Firestore permissions error), the entire admin mutation fails even though the primary action (role change, deactivation) should succeed.
**Why it happens:** Sequential await on audit log write after the primary write.
**How to avoid:** Write audit log entries in a fire-and-forget pattern (catch and log errors, don't throw). Or use a Firestore batch write that includes both the primary update and the audit entry.
**Warning signs:** Admin actions intermittently failing with obscure errors.

## Code Examples

Verified patterns from the existing codebase:

### Reusable Armed-State (Double-Confirm) Pattern
```typescript
// Source: apps/web/src/components/shipment/CancelShipmentButton.tsx
// Reuse this pattern for "Deactivate User" and "Deactivate Location" buttons
const [armed, setArmed] = useState(false);
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
useEffect(() => {
  if (armed) {
    timerRef.current = setTimeout(() => setArmed(false), 5000);
  }
  return () => { if (timerRef.current) clearTimeout(timerRef.current); };
}, [armed]);
```

### tRPC Mutation with Toast Pattern
```typescript
// Source: apps/web/src/pages/ScanPage.tsx (Sonner toast usage)
import { toast } from "sonner";
const mutation = trpc.admin.updateUser.useMutation({
  onSuccess: () => {
    toast.success("User updated");
    utils.admin.listUsers.invalidate(); // refetch user list
  },
  onError: (err) => toast.error(err.message),
});
```

### Sidebar Nav Item Addition
```typescript
// Source: apps/web/src/components/layout/Sidebar.tsx
// Add this entry to the navItems array:
{ label: "Admin", path: "/admin", icon: "---", roles: ["admin"] },
// Use a gear/settings unicode character for the icon (consistent with project emoji pattern)
```

### Firestore Admin Query (List All Documents)
```typescript
// Source: Existing locations.list pattern but without the active filter
const snap = await db.collection("users").get(); // All users, including inactive
return snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
```

### Recharts Bar Chart (Verified v3 API)
```typescript
// Source: Recharts official docs + verified v3 compatible
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

function DeliveryTimeChart({ data }: { data: { name: string; avgHours: number }[] }) {
  return (
    <figure>
      <figcaption className="text-lg font-semibold text-neutral-900">
        Average Delivery Time by Location
      </figcaption>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#404040" }} />
          <YAxis tick={{ fontSize: 12, fill: "#404040" }} label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
          <Tooltip />
          <Bar dataKey="avgHours" fill="#7F56D9" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x (react-smooth dependency) | Recharts 3.x (no react-smooth, native animations) | Late 2024 | Smaller bundle, fewer transitive deps. API mostly unchanged for standard charts. |
| `Customized` component for custom rendering | Direct children composition in v3 | Recharts 3.0 | `Customized` is deprecated. Use standard component props instead. |
| Hardcoded exception thresholds | Dynamic thresholds from `settings/global` | Phase 10 (this phase) | Enables admin configurability per D-08 |
| Auto-provision users with staff role | Auto-provision with null role (pending) | Phase 10 (this phase) | Breaking change to user provisioning -- must be carefully coordinated |

## Open Questions

1. **Firestore composite index for report queries**
   - What we know: Report queries need `createdAt` range + optional `deliveredAt` presence. Simple `createdAt` range queries work with existing index.
   - What's unclear: Whether a compound index on `createdAt` + `deliveredAt` is already configured or needs to be added.
   - Recommendation: Start with `createdAt`-only queries and filter `deliveredAt != null` in-memory. Add composite index only if performance requires it.

2. **Existing user migration for pending flow**
   - What we know: Current users in Firestore already have `role: "staff"` (set at auto-provision time). The schema change to nullable role only affects new users going forward.
   - What's unclear: Whether existing users should be retroactively affected.
   - Recommendation: Existing users keep their roles. Only new users (provisioned after Phase 10 deployment) get null role. No data migration needed.

3. **Settings consumption by Cloud Functions**
   - What we know: `apps/functions/src/scheduled/agedReport.ts` hardcodes 24h threshold. It needs to read from `settings/global`.
   - What's unclear: Whether functions have access to the same Firestore instance without additional configuration.
   - Recommendation: Cloud Functions already use firebase-admin and have full Firestore access. Simply read the settings doc at the start of the scheduled function.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file (API) | `apps/api/vitest.config.ts` |
| Config file (Web) | `apps/web/vitest.config.ts` |
| Quick run command | `pnpm --filter api test` or `pnpm --filter web test` |
| Full suite command | `pnpm -r test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADMN-01 | Admin can list users, update roles, deactivate, bulk assign | unit | `pnpm --filter api exec vitest run tests/admin-router.test.ts -t "user"` | No -- Wave 0 |
| ADMN-02 | Admin can create, edit, deactivate locations | unit | `pnpm --filter api exec vitest run tests/admin-router.test.ts -t "location"` | No -- Wave 0 |
| ADMN-03 | Admin can read/write system settings | unit | `pnpm --filter api exec vitest run tests/admin-router.test.ts -t "settings"` | No -- Wave 0 |
| ADMN-04 | Report aggregation returns correct data | unit | `pnpm --filter api exec vitest run tests/admin-router.test.ts -t "report"` | No -- Wave 0 |
| ADMN-01 | Pending user rejected from protected routes | unit | `pnpm --filter api exec vitest run tests/auth-context.test.ts -t "pending"` | Partial -- auth-context.test.ts exists, needs pending user test |
| ADMN-01 | Non-admin rejected from admin endpoints | unit | `pnpm --filter api exec vitest run tests/admin-router.test.ts -t "forbidden"` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter api test && pnpm --filter web test`
- **Per wave merge:** `pnpm -r test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/tests/admin-router.test.ts` -- covers ADMN-01, ADMN-02, ADMN-03, ADMN-04 (user CRUD, location CRUD, settings, reports, audit log, authorization)
- [ ] Update `apps/api/tests/auth-context.test.ts` -- add pending user provisioning and rejection tests
- [ ] Framework install: none needed (vitest already configured)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `apps/api/src/middleware/auth.ts`, `apps/api/src/context.ts`, `apps/api/src/routers/*.ts` -- all API patterns verified by reading source
- Existing codebase: `apps/web/src/components/layout/Sidebar.tsx`, `apps/web/src/App.tsx`, `apps/web/src/context/AuthContext.tsx` -- all UI patterns verified
- Existing codebase: `packages/shared/src/schemas/user.ts`, `packages/shared/src/enums.ts` -- type system verified
- Existing codebase: `apps/web/src/utils/exceptions.ts` -- hardcoded threshold values confirmed (4h stalled, 24h overdue, 24h aged)
- Existing codebase: `apps/functions/src/scheduled/agedReport.ts` -- hardcoded 24h threshold confirmed
- npm registry: `recharts@3.8.1` -- latest stable version verified via `npm view recharts version`

### Secondary (MEDIUM confidence)
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- v3 API compatibility confirmed
- [Recharts React 19 Support](https://github.com/recharts/recharts/issues/4558) -- React 19 compatibility confirmed
- [Recharts Releases](https://github.com/recharts/recharts/releases) -- version history verified

### Tertiary (LOW confidence)
- None -- all findings verified against codebase or official sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- only one new dependency (recharts), all else existing
- Architecture: HIGH -- all patterns follow established project conventions directly observed in codebase
- Pitfalls: HIGH -- identified from actual codebase analysis (schema constraints, hardcoded values, Firestore query limits)

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable -- no fast-moving dependencies)
