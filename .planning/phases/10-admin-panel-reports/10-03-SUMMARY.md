---
phase: 10-admin-panel-reports
plan: 03
subsystem: web
tags: [react, recharts, admin, location-management, settings, reports, csv-export, audit-log, exception-thresholds]

# Dependency graph
requires:
  - phase: 10-admin-panel-reports
    plan: 01
    provides: Admin tRPC router with location CRUD, settings, reports, audit log procedures
  - phase: 10-admin-panel-reports
    plan: 02
    provides: SidePanel, StatusPill, AdminTabs, UserTable shell components
  - phase: 07-dashboard
    provides: Exception classifier (classifyExceptions, classifyAllExceptions)
  - phase: 08-notifications
    provides: agedReport Cloud Function with hardcoded thresholds
provides:
  - LocationTable with full CRUD via side panel
  - LocationDetailPanel with printer management and deactivate/reactivate
  - PrinterList with inline add/edit/remove and default toggle
  - SettingsForm for exception thresholds and notification defaults
  - Parameterized exception thresholds (backward compatible)
  - agedReport reads configurable threshold from settings/global
  - ReportsView with Recharts charts and CSV export
  - AuditLog collapsible section with formatted action descriptions
  - Complete admin panel with all four tabs fully wired
affects:
  - apps/web/src/utils/exceptions.ts (added optional thresholds parameter)
  - apps/functions/src/scheduled/agedReport.ts (reads settings/global)
  - apps/web/src/pages/AdminPage.tsx (all tabs wired)

# Tech stack
added:
  - recharts: ^3.8.0 (data visualization for admin reports)
patterns:
  - Recharts ResponsiveContainer + ComposedChart for area+line overlay
  - Client-side CSV export via Blob + URL.createObjectURL
  - Toggle switch UI pattern for boolean settings
  - Collapsible audit log with chevron rotation
  - Inline printer CRUD nested inside location detail panel
  - Armed state double-confirm for destructive deactivation (same as UserDetailPanel)
  - Optional parameter with defaults for backward compatible API extension

# Key files
created:
  - apps/web/src/components/admin/LocationTable.tsx
  - apps/web/src/components/admin/LocationDetailPanel.tsx
  - apps/web/src/components/admin/PrinterList.tsx
  - apps/web/src/components/admin/SettingsForm.tsx
  - apps/web/src/components/admin/ReportsView.tsx
  - apps/web/src/components/admin/charts/DeliveryTimeChart.tsx
  - apps/web/src/components/admin/charts/VolumeChart.tsx
  - apps/web/src/components/admin/charts/DriverActivityTable.tsx
  - apps/web/src/components/admin/AuditLog.tsx
  - apps/web/src/lib/exportCsv.ts
modified:
  - apps/web/src/utils/exceptions.ts
  - apps/functions/src/scheduled/agedReport.ts
  - apps/web/src/pages/AdminPage.tsx
  - apps/web/package.json
  - pnpm-lock.yaml

# Decisions
decisions:
  - ComposedChart for volume chart: Used Recharts ComposedChart instead of separate LineChart+AreaChart to combine area fill with line overlay in a single component
  - ExceptionThresholds as optional param: Added optional thresholds parameter with inline defaults so existing callers (DashboardPage) continue to work without changes
  - Inline printer editing: Printers are edited inline within the printer list rather than in a separate panel, keeping the UI compact for nested CRUD
  - Toggle switches for notifications: Used custom toggle switches (button with role=switch) instead of checkboxes for a more polished settings UI

# Metrics
metrics:
  duration: 5min
  completed: "2026-04-02T22:18:00Z"
  tasks: 2
  files: 15
---

# Phase 10 Plan 03: Admin Panel Frontend - Locations, Settings, Reports, Audit Log Summary

Complete admin panel with Location Management (CRUD with printer management), System Settings (configurable exception thresholds and notification defaults), Reports (Recharts bar/line/area charts with CSV export), and Audit Log (collapsible recent activity). Exception classifier and aged report Cloud Function now use configurable thresholds from settings/global.

## What Was Built

### Task 1: Location Management, Settings, and Configurable Thresholds

**LocationTable.tsx** -- Location list with "Add Location" button, status pills, printer count badges, and row click to open detail panel.

**LocationDetailPanel.tsx** -- Side panel for creating/editing locations with name, full name, address fields. Deactivate/reactivate with armed-state double-confirm pattern (matching UserDetailPanel). Embeds PrinterList for managing printers within the location context.

**PrinterList.tsx** -- Inline printer CRUD with add/edit/remove. Each printer shows name, IP, model, and "Default" badge. Edit replaces the row with inline form fields. Add expands a new form at the bottom. All changes are local until parent saves.

**SettingsForm.tsx** -- Two cards: Exception Thresholds (stalled/overdue/aged hours as number inputs in 3-column grid) and Default Notification Preferences (delivery/pickup/in-transit toggle switches). Reads from `trpc.admin.getSettings`, writes via `trpc.admin.updateSettings`. Dirty tracking prevents no-op saves.

**exceptions.ts** -- Added `ExceptionThresholds` interface and optional `thresholds` parameter to `classifyExceptions` and `classifyAllExceptions`. Existing callers (DashboardPage) continue to work unchanged with default values (4h stalled, 24h overdue, 24h aged).

**agedReport.ts** -- Cloud Function now reads `settings/global` doc at the start of each run and uses `agedThresholdHours` (default 24) instead of hardcoded value. Throttle interval remains at 24h.

**AdminPage.tsx** -- Wired LocationTable for "locations" tab and SettingsForm for "settings" tab.

### Task 2: Reports, CSV Export, and Audit Log

**Recharts installed** -- `recharts@^3.8.0` added to web package for data visualization.

**exportCsv.ts** -- Client-side CSV export utility that handles comma/quote/newline escaping, creates a Blob, and triggers download via programmatic anchor click.

**DeliveryTimeChart.tsx** -- Recharts BarChart with brand-colored bars, CartesianGrid, XAxis by location name, YAxis labeled "Hours", styled Tooltip. Empty state when no data.

**VolumeChart.tsx** -- Recharts ComposedChart with Area fill (brand-50) overlaid with Line stroke (brand-600). Shows shipment count over time by date. Empty state when no data.

**DriverActivityTable.tsx** -- HTML table with sortable "Total Scans" column (click toggles asc/desc). Columns: Driver Name, Total Scans, Pickups, Deliveries, Avg Scans/Day.

**ReportsView.tsx** -- Date range filter (defaults to last 30 days) with "Apply Filter" button. Three report cards in a 2-column grid (delivery time, volume, driver activity full-width). Each card has a "Export CSV" button. Uses three tRPC queries with applied date range.

**AuditLog.tsx** -- Collapsible section with "Recent Activity" heading and chevron toggle. Formats action descriptions based on action type (update_user, create_location, update_settings, etc.). Shows admin name, action description, and relative timestamp.

**AdminPage.tsx** -- Fully wired with all four tabs (Users, Locations, Settings, Reports) plus AuditLog below tab content.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None -- all components are wired to live tRPC queries. No placeholder data or hardcoded values.

## Verification Results

- `pnpm --filter web exec tsc --noEmit` -- exits 0
- `pnpm --filter functions exec tsc --noEmit` -- exits 0
- `pnpm --filter web build` -- exits 0 (Recharts bundles correctly, 1.6MB total JS)
- recharts present in apps/web/package.json dependencies

## Self-Check: PASSED

All 13 files verified present. Both commit hashes (7c41a52, e4a3406) found in git log.
