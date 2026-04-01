---
phase: 06-enhanced-scanning-features
plan: 04
subsystem: api, ui
tags: [signature, firebase-storage, admin-sdk, crypto-token, react-signature-canvas, trpc]

requires:
  - phase: 06-01
    provides: "scan router with process + processBatch procedures"
  - phase: 01
    provides: "Firebase Admin SDK storage export"
provides:
  - "Token-based signature request generation (requestSignatureLink)"
  - "Unauthenticated signature submission via Admin SDK upload (submitSignatureByToken)"
  - "Standalone /sign/:token page outside AuthGate"
  - "Admin 'Send Signature Link' button on shipment detail"
affects: [07-real-time-dashboard, 08-notifications]

tech-stack:
  added: [react-signature-canvas]
  patterns: [public-route-outside-authgate, crypto-token-lifecycle, admin-sdk-storage-upload]

key-files:
  created:
    - apps/web/src/pages/SignPiecePage.tsx
  modified:
    - apps/api/src/routers/scan.ts
    - apps/web/src/App.tsx
    - apps/web/src/pages/ShipmentFormPage.tsx

key-decisions:
  - "Signed URL with 2099 expiry for signature storage — avoids token refresh complexity for display"
  - "Route restructure: AuthenticatedRoutes wrapper so public routes are siblings to AuthGate"
  - "Admin button targets first unsigned delivered piece — simplified MVP without piece picker"

patterns-established:
  - "Public route pattern: Route outside AuthenticatedRoutes in App.tsx for unauthenticated pages"
  - "Token lifecycle: signatureRequests collection with createdAt/expiresAt/consumedAt fields"
  - "Admin SDK upload pattern: server-side Storage upload bypassing client auth rules"

requirements-completed: [SCAN-08]

duration: 2min
completed: 2026-04-01
---

# Phase 06 Plan 04: Signature Link Flow Summary

**Token-based unauthenticated signature capture via standalone /sign/:token page with Admin SDK Storage upload and admin copy-to-clipboard link generation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-01T19:16:59Z
- **Completed:** 2026-04-01T19:49:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- API procedures for signature token generation (crypto randomBytes, 7-day expiry) and unauthenticated submission (validates token, uploads PNG via Admin SDK, sets deliverySignatureUrl)
- Standalone SignPiecePage at /sign/:token rendered outside AuthGate with react-signature-canvas pad
- Admin "Send Signature Link" button on ShipmentFormPage copies tokenized URL to clipboard for delivered pieces without signatures

## Task Commits

Each task was committed atomically:

1. **Task 1: API — Signature token generation and unauthenticated submission** - `8ae0ea4` (feat)
2. **Task 2: Standalone /sign/:token page + admin button** - `4c2219b` (feat)

## Files Created/Modified
- `apps/api/src/routers/scan.ts` - Added requestSignatureLink and submitSignatureByToken mutations
- `apps/web/src/pages/SignPiecePage.tsx` - Standalone unauthenticated signature page with signature canvas
- `apps/web/src/App.tsx` - Route restructured with SignPiecePage outside AuthGate
- `apps/web/src/pages/ShipmentFormPage.tsx` - Admin "Send Signature Link" button with clipboard copy
- `apps/web/package.json` - Added react-signature-canvas dependency

## Decisions Made
- Used signed URL with far-future expiry (2099) for signature storage URLs to avoid token refresh complexity
- Restructured App.tsx routing: extracted AuthenticatedRoutes component so public routes are siblings to AuthGate wrapper
- Admin button targets first unsigned delivered piece automatically — no piece picker for MVP

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 06 complete — all 4 plans executed
- All three D-05 signature paths operational: receiver detect (Plan 03), email link, admin send (Plan 04)
- Ready for Phase 07 (real-time dashboard) or next phase

## Self-Check: PASSED

---
*Phase: 06-enhanced-scanning-features*
*Completed: 2026-04-01*
