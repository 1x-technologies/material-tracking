---
phase: 11-slack-notifications-signature-to-complete
plan: 03
subsystem: api
tags: [slack, signature, batch-write, firestore, secret-manager, web-api]

# Dependency graph
requires:
  - phase: 06-enhanced-scanning-features
    provides: submitSignatureByToken and requestSignatureLink endpoints
  - phase: 05-scan-processing-status-workflow
    provides: piece status transitions and deriveShipmentStatus
provides:
  - Signature-to-complete flow (auto-completes all pieces and shipment after signature)
  - API-side Slack integration (lookupSlackUser, sendSlackDM)
  - getSecret() for Secret Manager access in API package
  - Slack DM with Sign Now button sent on signature request
affects: [11-01-functions-slack, 11-02-email-removal, deployment]

# Tech tracking
tech-stack:
  added: ["@slack/web-api ^7.15.0", "@google-cloud/secret-manager ^6.1.1"]
  patterns: [fire-and-forget slack DM, batch write for multi-piece completion, as-const block kit typing]

key-files:
  created:
    - apps/api/src/lib/slack.ts
    - apps/api/tests/signature-complete.test.ts
  modified:
    - apps/api/src/routers/scan.ts
    - apps/api/src/lib/firebase.ts
    - apps/api/package.json
    - apps/api/tsup.config.ts

key-decisions:
  - "Fire-and-forget Slack DM in requestSignatureLink -- non-blocking, catch handler logs errors"
  - "Batch write for piece completion -- atomic all-or-nothing update of pieces and shipment"
  - "KnownBlock type with as-const literals for type-safe Slack Block Kit messages"

patterns-established:
  - "API-side Secret Manager access via lazy-initialized getSecret()"
  - "Slack DM pattern: lookupSlackUser by email, then chat.postMessage to userId"

requirements-completed: [NOTF-01, NOTF-02]

# Metrics
duration: 4min
completed: 2026-04-07
---

# Phase 11 Plan 03: Signature-to-Complete with Slack DM Summary

**Auto-complete shipment pieces on signature submission via Firestore batch write, with Slack DM containing Sign Now button sent on signature request**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-07T19:50:47Z
- **Completed:** 2026-04-07T19:55:07Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- submitSignatureByToken now auto-completes all non-completed pieces and sets shipment to completed via atomic batch write
- requestSignatureLink sends a Slack DM to the receiver with a Sign Now button linking to the signature page
- API-side slack.ts provides lookupSlackUser and sendSlackDM, mirroring the functions package pattern
- getSecret() added to API firebase.ts for Secret Manager access
- 5 unit tests verify piece completion filtering, batch operations, and shipment status update

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend submitSignatureByToken with piece completion and add tests** - `3598033` (test: RED), `b081208` (feat: GREEN)
2. **Task 2: Install @slack/web-api, create API slack lib, add Slack DM to requestSignatureLink** - `7c7e3a9` (feat)

## Files Created/Modified
- `apps/api/src/lib/slack.ts` - API-side Slack WebClient with lookupSlackUser and sendSlackDM
- `apps/api/tests/signature-complete.test.ts` - 5 unit tests for piece completion after signature
- `apps/api/src/routers/scan.ts` - Extended submitSignatureByToken with batch completion, requestSignatureLink with Slack DM
- `apps/api/src/lib/firebase.ts` - Added SecretManagerServiceClient and getSecret()
- `apps/api/package.json` - Added @slack/web-api and @google-cloud/secret-manager dependencies
- `apps/api/tsup.config.ts` - Updated externals and dist dependencies for new packages
- `pnpm-lock.yaml` - Updated lockfile with new dependencies

## Decisions Made
- Fire-and-forget pattern for Slack DM -- sendSlackDM called without await, with .catch() error handler, so signature request response is not delayed by Slack API latency
- KnownBlock type with `as const` assertions on block type literals to satisfy @slack/web-api TypeScript types without casting
- Batch write for piece completion is atomic -- if any update fails, none are applied

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed TypeScript type error for Slack Block Kit blocks**
- **Found during:** Task 2 (typecheck)
- **Issue:** Inline block objects had `type: string` instead of literal types required by KnownBlock
- **Fix:** Added `as const` assertions to all type/style properties in block definitions; used KnownBlock import for sendSlackDM parameter
- **Files modified:** apps/api/src/routers/scan.ts, apps/api/src/lib/slack.ts
- **Verification:** pnpm --filter api typecheck passes
- **Committed in:** 7c7e3a9 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type safety fix necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None

## User Setup Required
None -- Slack bot token already stored in Secret Manager from Plan 01 setup. API Cloud Run service account needs Secret Manager accessor role (documented in Plan 01 user setup).

## Next Phase Readiness
- Signature-to-complete flow is ready for integration testing
- Slack DM requires the Slack bot token in Secret Manager (from Plan 01)
- onShipmentStatusChange trigger will fire when shipment status is set to completed, sending the completed notification via Slack (handled by Plan 01)

## Self-Check: PASSED

All files exist, all commits found, all acceptance criteria verified.

---
*Phase: 11-slack-notifications-signature-to-complete*
*Completed: 2026-04-07*
