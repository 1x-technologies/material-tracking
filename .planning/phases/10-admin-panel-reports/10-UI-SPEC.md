---
phase: 10
slug: admin-panel-reports
status: draft
shadcn_initialized: false
preset: none
created: 2026-04-02
---

# Phase 10 -- UI Design Contract

> Visual and interaction contract for the admin panel: user management, location management, system settings, operational reports with charts, and admin audit log. Inherits design system, typography, color, and spacing from Phase 1 (`01-UI-SPEC.md`). Introduces the table + side panel pattern, Recharts charts, CSV export, bulk operations, and the pending-approval page.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (no shadcn / no Untitled UI CLI) |
| Preset | not applicable |
| Component library | Custom Tailwind components (project pattern) |
| Icon library | Unicode emoji (project pattern, see Sidebar.tsx) |
| Font | Inter via `--font-sans` CSS variable |
| Charts | Recharts (new dependency -- declarative React chart components) |
| Styling | Tailwind CSS v4.2 with `@theme` tokens in `globals.css` |

### New Dependency

```
recharts (^2.15.0)
```

No other new dependencies required. Date range inputs use native HTML `<input type="date">` (established pattern from HistoryPage).

---

## Spacing Scale

Inherited from Phase 1 -- 8-point grid, Tailwind default `--spacing: 4px`.

| Token | Value | Tailwind Class | Phase 10 Usage |
|-------|-------|----------------|----------------|
| xs | 4px | `gap-1`, `p-1` | Icon gaps, checkbox padding, inline badge margins |
| sm | 8px | `gap-2`, `p-2` | Table cell internal padding, tab gaps |
| md | 16px | `gap-4`, `p-4` | Card padding, filter bar padding, detail panel section spacing |
| lg | 24px | `gap-6`, `p-6` | Main content padding (inherited from AppLayout), report card padding |
| xl | 32px | `gap-8`, `p-8` | Gap between report cards in grid |
| 2xl | 48px | `gap-12`, `p-12` | Empty state vertical padding |
| 3xl | 64px | `gap-16`, `p-16` | Not used in Phase 10 |

Exceptions:
- Detail side panel width: 400px (`w-[400px]`) on lg+ screens, full-width overlay on < lg
- Touch target minimum: 44px (`size-11`) on all interactive elements in the admin panel (tablet usage)

---

## Typography

Inherited from Phase 1. Phase 10 active subset uses **4 sizes** and **2 weights only**.

| Role | Token | Size | Weight | Line Height | Usage |
|------|-------|------|--------|-------------|-------|
| Caption | text-xs | 12px | 400 (regular) | 18px (1.5) | Table column headers, audit log timestamps, chart axis labels, printer badges |
| Body | text-sm | 14px | 400 (regular) | 20px (1.43) | Table cells, form labels, detail panel field values |
| Subheading | text-lg | 18px | 600 (semibold) | 28px (1.56) | Tab content headings ("User Management", "Locations"), detail panel section titles, report card titles |
| Page Title | text-2xl | 24px | 600 (semibold) | 32px (1.33) | "Admin" page heading |

Weight usage: **400 (regular)** for body text, captions, and table data. **600 (semibold)** for headings, active tab labels, report card titles, and section titles. Do not use font-medium (500) in custom code.

---

## Color

Inherited from Phase 1. Phase 10 additions for report charts and admin-specific states.

### Surface Roles (unchanged)

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `white` | Page background, main content area, detail panel background |
| Secondary (30%) | `neutral-50` | Table header row background, settings card backgrounds, filter bar |
| Accent (10%) | `brand-600` | Primary CTA buttons, active tab indicator, chart accent color |
| Destructive | `red-600` | Deactivate user button, deactivate location button |

### Accent Reserved For (Phase 10 specific)

- "Save Changes" buttons (settings, detail panel edits)
- "Assign Role" bulk action button
- Active tab underline in admin tab navigation
- Primary chart color in bar and line charts
- "Export CSV" button

### Chart Color Palette (Recharts)

| Index | Color | Hex | Usage |
|-------|-------|-----|-------|
| 0 | brand-600 | `#7F56D9` | Primary bar/line, first location in delivery time chart |
| 1 | blue-500 | `#3B82F6` | Second data series, volume line chart fill |
| 2 | green-500 | `#22C55E` | Third data series (if needed) |
| 3 | amber-500 | `#F59E0B` | Fourth data series (if needed) |
| 4 | neutral-400 | `#A3A3A3` | Grid lines, axis lines |

Charts use `neutral-700` for axis tick labels and `neutral-400` for grid lines.

### Admin-Specific Status Colors

| State | Background | Text | Usage |
|-------|-----------|------|-------|
| Active user/location | `green-100` | `green-700` | Active status pill |
| Inactive/Deactivated | `neutral-100` | `neutral-500` | Inactive status pill |
| Pending (no role) | `amber-100` | `amber-700` | Pending approval status pill |

---

## Screens & States

### Focal Point

The User table is the focal point on the default Users tab. When the admin page loads, the Users tab is active and the user table is the primary content area. All other tabs are secondary views reached by explicit tab selection.

### 1. Admin Page Shell (`/admin`)

| Element | Spec |
|---------|------|
| Page heading | "Admin" at `text-2xl` semibold, `text-neutral-900` |
| Subtitle | "Manage users, locations, settings, and reports" at `text-sm`, `text-neutral-500`, `mt-1` |
| Tab navigation | Horizontal tabs: Users, Locations, Settings, Reports |
| Tab style | Reuse FilterTabs pattern: `border-b border-neutral-200`, active tab gets `border-b-2 border-brand-600 text-brand-700 font-semibold`, inactive `text-neutral-500 hover:text-neutral-700` |
| Tab counts | Users tab shows total count, Locations tab shows total count. Settings and Reports have no count. |
| Layout | Tabs sit below heading. Content area below tabs fills remaining viewport height. |

### 2. Users Tab

#### User Table

| Element | Spec |
|---------|------|
| Toolbar | Row above table: left side has bulk action button ("Assign Role" -- disabled until checkboxes selected), right side has search input |
| Search input | `w-64`, placeholder "Search users...", `rounded-md border border-neutral-300 px-3 py-2 text-sm`, filters table client-side by name/email |
| Checkbox column | First column, `w-10`, header checkbox for select-all, row checkbox for individual select |
| Columns | Checkbox, Name, Email, Role, Location, Status, Last Active |
| Name cell | `text-sm font-semibold text-neutral-900` with user avatar (32px circle, initials fallback with `bg-brand-600 text-white`) |
| Role cell | Capitalized text: "Admin", "Driver", "Staff", or "Pending" (italic, `text-neutral-400`) |
| Status cell | Pill badge using admin status colors above |
| Row click | Opens detail side panel for that user. Row gets `bg-brand-50` when panel is open for that row. |
| Empty state | Centered: "No users yet. Users appear here after signing in with Google." at `text-sm text-neutral-500` with person icon |

#### User Detail Side Panel

| Element | Spec |
|---------|------|
| Width | `w-[400px]` on lg+ screens. Full-screen overlay with slide-in from right on < lg. |
| Animation | `transition-transform duration-200 ease-out` slide in from right |
| Background | `bg-white` with `border-l border-neutral-200`, `shadow-lg` |
| Close button | Top-right, "X" icon, `size-11` touch target, `aria-label="Close panel"` |
| Header | User display name at `text-lg font-semibold`, email below at `text-sm text-neutral-500` |
| Avatar | 64px circle at top, Google photo or initials fallback |
| Sections | Separated by `border-b border-neutral-100 py-4` |
| Role assignment | `<select>` dropdown: Admin, Driver, Staff. Shows current role pre-selected. |
| Location assignment | `<select>` dropdown using existing locations list. Shows current location pre-selected. |
| Status toggle | "Deactivate User" button (destructive) or "Reactivate User" button (secondary). See destructive confirmation pattern below. |
| Save | "Save Changes" button, `bg-brand-600 text-white`, full-width at bottom of panel. Disabled until a field changes. |

#### Bulk Role Assignment

| Element | Spec |
|---------|------|
| Trigger | "Assign Role" button in toolbar, enabled when >= 1 checkbox selected |
| Button state | Disabled: `bg-neutral-100 text-neutral-400 cursor-not-allowed`. Enabled: `bg-brand-600 text-white` |
| Interaction | Click opens inline dropdown (not a dialog) below button with role options: Admin, Driver, Staff |
| Selection count | Button label shows count: "Assign Role (3)" |
| Confirmation | After selecting role from dropdown, show toast: "Role updated for 3 users" |

### 3. Locations Tab

#### Location Table

| Element | Spec |
|---------|------|
| Toolbar | Left: "Add Location" button (`bg-brand-600 text-white`). Right: no search (small dataset). |
| Columns | Name, Address, Printers, Status |
| Printers cell | Count badge: "2 printers" at `text-xs` in `neutral-100` pill |
| Status cell | Same active/inactive pills as user table |
| Row click | Opens detail side panel |
| Empty state | "No locations configured yet. Use 'Add Location' to create one." at `text-sm text-neutral-500` with building icon |

#### Location Detail Side Panel

| Element | Spec |
|---------|------|
| Structure | Same 400px side panel pattern as user detail |
| Fields | Name (text input), Address (text input), Status toggle |
| Printer section | Nested list below location fields, separated by `border-t border-neutral-100 pt-4` |
| Printer row | Name, IP, Model in a compact row. "Default" badge on default printer. Edit/Remove icon buttons with `aria-label="Edit {printer name}"` and `aria-label="Remove {printer name}"` respectively. |
| Add printer | "Add Printer" link-button at bottom of printer list: `text-brand-600 hover:text-brand-700 text-sm font-semibold` |
| Printer form | Inline form that expands below "Add Printer": Name, IP, Model inputs in a row, "Save" mini-button |
| Save | "Save Changes" full-width button at bottom, same style as user panel |

#### Add Location Flow

| Element | Spec |
|---------|------|
| Trigger | "Add Location" button in toolbar |
| Behavior | Opens the same side panel with empty fields, heading "New Location" |
| Save button | "Create Location" instead of "Save Changes" |

### 4. Settings Tab

| Element | Spec |
|---------|------|
| Layout | Single-column form, max-width `max-w-xl`, left-aligned |
| Sections | Two settings cards, stacked vertically with `gap-6` |

#### Threshold Settings Card

| Element | Spec |
|---------|------|
| Container | `rounded-lg border border-neutral-200 bg-white p-6` |
| Card title | "Exception Thresholds" at `text-lg font-semibold text-neutral-900` |
| Card description | "Configure when shipments are flagged as stalled, overdue, or aged" at `text-sm text-neutral-500 mt-1` |
| Fields | Three number inputs in a grid (`grid-cols-1 sm:grid-cols-3 gap-4 mt-4`) |
| Stalled input | Label: "Stalled (hours)", placeholder: "4", type: number, min: 1 |
| Overdue input | Label: "Overdue (hours)", placeholder: "24", type: number, min: 1 |
| Aged input | Label: "Aged (hours)", placeholder: "24", type: number, min: 1 |

#### Notification Defaults Card

| Element | Spec |
|---------|------|
| Container | Same card style as thresholds |
| Card title | "Default Notification Preferences" |
| Card description | "Set default email notification preferences for new users" |
| Fields | Three toggle rows: "Delivery notifications" (on by default), "Pickup notifications" (on by default), "In-transit notifications" (off by default) |
| Toggle style | Simple checkbox with label text, or custom toggle switch: `w-10 h-6 rounded-full` track with `w-4 h-4` knob |

#### Save Action

| Element | Spec |
|---------|------|
| Button | "Save Settings" at bottom of settings section, `bg-brand-600 text-white`, disabled until a value changes |
| Feedback | Success toast: "Settings saved" via Sonner |

### 5. Reports Tab

| Element | Spec |
|---------|------|
| Layout | Date range filter bar at top, then 2-column grid of report cards on lg+, single column on < lg |
| Date range bar | `rounded-lg border border-neutral-200 bg-white p-4 mb-6`, contains "From" date input, "To" date input, "Apply Filter" button. Same input styles as HistoryPage. |
| Default range | Last 30 days |

#### Report Card: Average Delivery Time

| Element | Spec |
|---------|------|
| Container | `rounded-lg border border-neutral-200 bg-white p-6` |
| Title | "Average Delivery Time by Location" at `text-lg font-semibold text-neutral-900` |
| Chart type | Recharts `<BarChart>` |
| Bar color | `brand-600` (`#7F56D9`) |
| X-axis | Location names, `text-xs text-neutral-700` |
| Y-axis | Hours, `text-xs text-neutral-700`, label "Hours" |
| Grid | Horizontal dashed lines, `stroke: neutral-200` |
| Tooltip | White background, `shadow-md rounded-md border border-neutral-200 p-2 text-sm` |
| Export | "Export CSV" button, bottom-right of card, secondary style: `rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50` |
| Empty state | "No delivery data for selected period" centered in chart area, `text-sm text-neutral-400` |

#### Report Card: Shipment Volume Over Time

| Element | Spec |
|---------|------|
| Chart type | Recharts `<LineChart>` with `<Area>` fill |
| Line color | `brand-600` stroke, `brand-50` area fill |
| X-axis | Date labels (daily or weekly depending on range), `text-xs text-neutral-700` |
| Y-axis | Count, `text-xs text-neutral-700`, label "Shipments" |
| All other styling | Same card container, tooltip, grid, export as delivery time card |

#### Report Card: Driver Activity

| Element | Spec |
|---------|------|
| Layout | Full-width card below the 2-column grid |
| Rendering | HTML table (not chart) -- reuses project table styling |
| Columns | Driver Name, Total Scans, Pickups, Deliveries, Avg Scans/Day |
| Sorting | Sortable by Total Scans column (default descending) |
| Export | Same "Export CSV" secondary button at bottom-right |
| Empty state | "No scan activity for selected period" |

### 6. Pending Approval Page

Displayed to authenticated users who have `role: null` (no role assigned yet). This page replaces the entire AppLayout -- pending users do not see sidebar, nav, or any other content.

| Element | Spec |
|---------|------|
| Layout | Centered vertically and horizontally in viewport, max-width `max-w-md`, `p-6` |
| Icon | Clock or hourglass emoji, `text-5xl`, `text-neutral-400`, `mb-4` |
| Heading | "Account Pending Approval" at `text-lg font-semibold text-neutral-900` |
| Body | "Your account is pending approval. An administrator will assign your role shortly." at `text-sm text-neutral-600 max-w-sm text-center mt-2` |
| Sign out button | Below body, `mt-6`, secondary button style: `rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50` |
| No other actions | No refresh button, no contact admin link. Clean and minimal. |

### 7. Recent Activity Section (Audit Log)

Displayed at the bottom of the admin page, below the active tab content, as a collapsible section.

| Element | Spec |
|---------|------|
| Container | `rounded-lg border border-neutral-200 bg-white mt-6` |
| Header | "Recent Activity" at `text-lg font-semibold text-neutral-900 p-4`, with expand/collapse chevron icon on right |
| Default state | Collapsed -- only header visible |
| Expanded content | List of audit entries, max 50 shown, reverse chronological |
| Entry row | `px-4 py-3 border-b border-neutral-100 last:border-b-0` |
| Entry content | Left: admin name (`text-sm font-semibold text-neutral-900`) + action description (`text-sm text-neutral-600`). Right: relative timestamp ("2 hours ago") at `text-xs text-neutral-400`. |
| Action descriptions | "Changed role of Jane Doe from Staff to Admin", "Deactivated user John Smith", "Updated stalled threshold from 4h to 6h" |
| Empty state | "No recent activity" at `text-sm text-neutral-400 p-4` |
| Display limit | 50 most recent entries |

---

## Interaction Rules

### Table + Side Panel Pattern

1. Click a table row to open the side panel on the right. The panel slides in with `translate-x` animation over 200ms.
2. While the panel is open, the table remains visible and scrollable behind it. The selected row is highlighted with `bg-brand-50`.
3. Clicking a different row switches the panel content immediately (no close/reopen animation).
4. Clicking the close button (X) or pressing Escape closes the panel.
5. On screens < lg (1024px), the panel becomes a full-screen overlay with a semi-transparent backdrop (`bg-black/20`).
6. Unsaved changes: if the user has modified a field and tries to close the panel or switch rows, show a browser `confirm()` dialog: "You have unsaved changes. Discard?"

### Tab Navigation

1. Active tab persists in URL hash: `/admin#users`, `/admin#locations`, `/admin#settings`, `/admin#reports`. Default is `#users`.
2. Tab switching does not trigger a full page reload -- content swaps inline.
3. Tab state is preserved when switching between tabs (form values, scroll position within tables).

### Bulk Operations

1. Header checkbox in user table toggles all visible rows.
2. When checkboxes are selected, the toolbar updates to show selection count and bulk action button.
3. Bulk role assignment applies immediately on role selection from dropdown. No separate confirm step (low-risk action, easily reversible).
4. After bulk action completes, checkboxes are cleared and a success toast is shown.

### Destructive Actions

1. "Deactivate User" and "Deactivate Location" use the inline double-confirm pattern established in Phase 3 (CancelShipmentButton): first click arms the button (text changes to "Confirm Deactivate?", background changes to `red-600 text-white`), second click executes. 5-second auto-reset.
2. "Reactivate" is not destructive and executes on single click.

### CSV Export

1. "Export CSV" buttons generate and download the file client-side using `Blob` + `URL.createObjectURL`.
2. File naming: `delivery-times-{YYYY-MM-DD}.csv`, `shipment-volume-{YYYY-MM-DD}.csv`, `driver-activity-{YYYY-MM-DD}.csv`.
3. CSV includes all data for the selected date range, not just what is visible on screen.

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Page heading | Admin |
| Page subtitle | Manage users, locations, settings, and reports |
| Users tab label | Users |
| Locations tab label | Locations |
| Settings tab label | Settings |
| Reports tab label | Reports |
| Primary CTA (user detail) | Save Changes |
| Primary CTA (new location) | Create Location |
| Primary CTA (settings) | Save Settings |
| Bulk action button | Assign Role ({count}) |
| Add location button | Add Location |
| Export button | Export CSV |
| Date range apply | Apply Filter |
| User search placeholder | Search users... |
| User table empty state | No users yet. Users appear here after signing in with Google. |
| Location table empty state | No locations configured yet. Use 'Add Location' to create one. |
| Report empty state (delivery) | No delivery data for selected period |
| Report empty state (volume) | No shipment data for selected period |
| Report empty state (activity) | No scan activity for selected period |
| Settings save success | Settings saved |
| User save success | User updated |
| Bulk role success | Role updated for {count} users |
| Location save success | Location saved |
| Location create success | Location created |
| Deactivate user (armed) | Confirm Deactivate? |
| Deactivate user (initial) | Deactivate User |
| Reactivate user | Reactivate User |
| Deactivate location (armed) | Confirm Deactivate? |
| Deactivate location (initial) | Deactivate Location |
| Pending approval heading | Account Pending Approval |
| Pending approval body | Your account is pending approval. An administrator will assign your role shortly. |
| Pending approval sign out | Sign Out |
| Audit log heading | Recent Activity |
| Audit log empty | No recent activity |
| Error state (generic) | Something went wrong. Please try again or contact your administrator. |
| Error state (save failed) | Failed to save changes. Please try again. |
| Error state (load failed) | Failed to load data. Please refresh the page. |

---

## Component Inventory

### New Components (Phase 10)

| Component | Location | Purpose |
|-----------|----------|---------|
| AdminPage | `pages/AdminPage.tsx` | Page shell with tab navigation and heading |
| AdminTabs | `components/admin/AdminTabs.tsx` | Tab bar component (reuse FilterTabs pattern) |
| UserTable | `components/admin/UserTable.tsx` | User list table with checkbox selection |
| UserDetailPanel | `components/admin/UserDetailPanel.tsx` | Slide-in panel for user editing |
| LocationTable | `components/admin/LocationTable.tsx` | Location list table |
| LocationDetailPanel | `components/admin/LocationDetailPanel.tsx` | Slide-in panel for location editing + printer management |
| PrinterList | `components/admin/PrinterList.tsx` | Nested printer CRUD within location panel |
| SettingsForm | `components/admin/SettingsForm.tsx` | Threshold and notification settings cards |
| ReportsView | `components/admin/ReportsView.tsx` | Date range filter + report card grid |
| DeliveryTimeChart | `components/admin/charts/DeliveryTimeChart.tsx` | Recharts bar chart for avg delivery time |
| VolumeChart | `components/admin/charts/VolumeChart.tsx` | Recharts area/line chart for shipment volume |
| DriverActivityTable | `components/admin/charts/DriverActivityTable.tsx` | Table for driver scan stats |
| AuditLog | `components/admin/AuditLog.tsx` | Collapsible recent activity list |
| PendingApprovalPage | `pages/PendingApprovalPage.tsx` | Full-page pending state for role-less users |
| StatusPill | `components/admin/StatusPill.tsx` | Reusable active/inactive/pending pill badge |
| SidePanel | `components/admin/SidePanel.tsx` | Reusable slide-in panel wrapper (shared by user + location) |

### Reused Components

| Component | From | Usage in Phase 10 |
|-----------|------|--------------------|
| FilterTabs | `components/dashboard/FilterTabs.tsx` | Pattern reference for AdminTabs (may fork for hash-based tabs) |
| Spinner | `components/ui/Spinner.tsx` | Loading states in tables and charts |
| RequireRole | `components/auth/RequireRole.tsx` | Route guard for `/admin` (admin only) |
| Sidebar | `components/layout/Sidebar.tsx` | Add "Admin" nav item with `roles: ["admin"]` |

---

## Responsive Behavior

| Breakpoint | Admin Layout |
|------------|-------------|
| >= 1024px (lg) | Table + side panel side-by-side. Reports in 2-column grid. Full sidebar. |
| 768px - 1023px (md) | Table full-width, side panel overlays as full-screen. Reports single column. Collapsed sidebar. |
| < 768px (sm) | Table horizontal scroll. Side panel full-screen. Reports single column. Hidden sidebar (hamburger). |

### Table Responsive Strategy

- All tables use `overflow-x-auto` wrapper for horizontal scroll on small screens
- Minimum column widths preserved (no text wrapping in table cells)
- User table: Name + Role columns are always visible; Email, Location, Last Active may scroll off

---

## Accessibility

- Tab navigation: `role="tablist"` on container, `role="tab"` on each tab, `aria-selected` on active tab
- Side panel: `role="dialog"`, `aria-label="User details"` or `"Location details"`, focus trapped inside panel when open
- Close panel button: `aria-label="Close panel"`
- Edit printer button: `aria-label="Edit {printer name}"`
- Remove printer button: `aria-label="Remove {printer name}"`
- Escape key closes side panel
- Bulk checkbox: header checkbox has `aria-label="Select all users"`, row checkboxes have `aria-label="Select {user name}"`
- Deactivate buttons: `aria-live="polite"` region to announce armed state to screen readers
- Chart components: each chart wrapped in `<figure>` with `<figcaption>` containing the chart title
- Loading states: `aria-busy="true"` on table container while loading

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| npm: recharts | BarChart, LineChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer | not required -- open source MIT, 24M+ weekly downloads |
| Third-party | None | not applicable |

No shadcn. No third-party component registries. Recharts is the only new runtime dependency.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending

---

*Phase: 10-admin-panel-reports*
*References: 01-UI-SPEC.md, 10-CONTEXT.md, REQUIREMENTS.md*
