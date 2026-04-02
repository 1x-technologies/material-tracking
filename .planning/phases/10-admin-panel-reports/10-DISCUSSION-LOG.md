# Phase 10: Admin Panel & Reports - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 10-admin-panel-reports
**Areas discussed:** User Management, Location Management, System Settings, Reports & Export, Pending User Experience, Charting Approach, Admin Audit Log, Bulk Operations

---

## User Management

### How should admins add new users?

| Option | Description | Selected |
|--------|-------------|----------|
| Manual creation | Admin fills in name, email, role, location -- user profile created in Firestore | |
| Email invite flow | Admin enters email + role, system sends invite link | |
| Auto-provision on first login | Anyone with company Google account can sign in, admin assigns role after | Yes |

**User's choice:** Auto-provision on first login
**Notes:** Simplest onboarding -- leverages existing Google SSO.

### How should the user list be presented?

| Option | Description | Selected |
|--------|-------------|----------|
| Table with inline actions | Role change and deactivate via dropdown/button in row | |
| Table + detail panel | Table for browsing, click row to open side panel | Yes |
| Card grid | User cards with avatar, name, role badge | |

**User's choice:** Table + detail panel

### Default role for new users?

| Option | Description | Selected |
|--------|-------------|----------|
| No role (pending) | Pending approval screen until admin assigns role | Yes |
| Driver by default | Auto-assigned driver role | |
| Staff by default | Auto-assigned staff access | |

**User's choice:** No role (pending)
**Notes:** Safest approach -- no access until explicit admin action.

### How should deactivation work?

| Option | Description | Selected |
|--------|-------------|----------|
| Soft deactivate | Set active=false, auth rejects, admin can reactivate | Yes |
| Hard delete | Remove user document entirely | |
| Role removal | Set role to 'none', user can sign in but sees nothing | |

**User's choice:** Soft deactivate

---

## Location Management

### How should location CRUD work?

| Option | Description | Selected |
|--------|-------------|----------|
| Table + side panel | Same pattern as user management | Yes |
| Inline table editing | Edit fields directly in table cells | |
| Dedicated form page | Separate /admin/locations/:id page | |

**User's choice:** Table + side panel

### Should printer config be part of location management?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, nested in location detail | Printers managed in location detail panel | Yes |
| Separate printer section | Dedicated printer management page | |
| Keep out of Phase 10 | Defer to future phase | |

**User's choice:** Yes, nested in location detail

---

## System Settings

### Which settings should be configurable?

| Option | Description | Selected |
|--------|-------------|----------|
| Aging + notification thresholds | Aged (24h), stalled (4h), overdue (24h), default notification prefs | Yes |
| Thresholds + branding | Above plus company name, logo, email footer | |
| Minimal -- thresholds only | Just numeric thresholds | |

**User's choice:** Aging + notification thresholds

### Where should settings be stored?

| Option | Description | Selected |
|--------|-------------|----------|
| Single Firestore doc | settings/global with all config | Yes |
| Firestore collection | settings/{category} per category | |
| Environment variables | Cloud Run env vars | |

**User's choice:** Single Firestore doc (settings/global)

---

## Reports & Export

### What type of reports?

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-built dashboards | Fixed report cards with date range filter | Yes |
| Configurable reports | Admin picks dimensions and metrics | |
| Export-only | No charts, raw CSV export | |

**User's choice:** Pre-built dashboards

### Export format?

| Option | Description | Selected |
|--------|-------------|----------|
| CSV only | Simple, universal format | Yes |
| CSV + PDF | CSV for data, PDF for formatted reports | |
| CSV + Excel (.xlsx) | Native Excel with formatting | |

**User's choice:** CSV only

### Which specific reports?

| Option | Description | Selected |
|--------|-------------|----------|
| 3 core reports | Avg delivery time, volume over time, driver activity | Yes |
| 5 reports with exceptions | Above 3 + exception rate + location flow heatmap | |
| You decide | Claude picks based on data and requirements | |

**User's choice:** 3 core reports

### Admin navigation structure?

| Option | Description | Selected |
|--------|-------------|----------|
| /admin with tabs | Single route, tabbed: Users, Locations, Settings, Reports | Yes |
| Separate routes | Individual sidebar items per section | |
| Settings + reports split | Two sidebar entries | |

**User's choice:** /admin with tabs

---

## Pending User Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Approval pending page | Clean page with message and sign-out button | Yes |
| Request role form | User requests specific role, admin approves | |
| Redirect to sign-in | Bounce back with message | |

**User's choice:** Approval pending page

---

## Charting Approach

| Option | Description | Selected |
|--------|-------------|----------|
| Recharts | Popular React charting library, declarative | Yes |
| Simple HTML/CSS charts | No dependency, CSS-based bars | |
| You decide | Claude picks based on stack | |

**User's choice:** Recharts

---

## Admin Audit Log

| Option | Description | Selected |
|--------|-------------|----------|
| Firestore log, visible in admin | admin_audit_log collection + Recent Activity UI | Yes |
| Firestore log, no UI | Log to Firestore, check console manually | |
| Skip audit logging | No logging in Phase 10 | |

**User's choice:** Firestore log, visible in admin

---

## Bulk Operations

| Option | Description | Selected |
|--------|-------------|----------|
| One-at-a-time only | Individual management via detail panel | |
| Checkbox + bulk role assign | Select multiple users, assign role in bulk | Yes |
| You decide | Claude decides based on team size | |

**User's choice:** Checkbox + bulk role assign

---

## Claude's Discretion

- Chart styling, color palette, responsive breakpoints
- Detail panel width and animation
- Date range picker component choice for reports
- Table pagination approach
- Audit log retention policy and display limit

## Deferred Ideas

None -- discussion stayed within phase scope
