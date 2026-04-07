---
phase: 11-slack-notifications-signature-to-complete
plan: 01
subsystem: notifications
tags: [slack, block-kit, web-api, dm, notifications]

requires:
  - phase: 08-notifications-aged-reports
    provides: email notification triggers and aged report scheduler
provides:
  - Slack WebClient wrapper with lazy init from Secret Manager
  - Email-to-Slack user resolution with graceful fallback
  - DM sending with error isolation (never throws)
  - 5 Block Kit message builders (delivered, completed, in_transit, aged_reminder, signature_request)
  - shipmentDetailUrl utility
affects: [11-02, 11-03]

tech-stack:
  added: ["@slack/web-api ^7.15.0"]
  patterns: ["Lazy singleton WebClient via Secret Manager", "Fire-and-forget DM pattern with error logging"]

key-files:
  created:
    - apps/functions/src/lib/slack.ts
    - apps/functions/src/lib/slackTemplates.ts
    - apps/functions/src/__tests__/slack.test.ts
    - apps/functions/src/__tests__/slackTemplates.test.ts
  modified:
    - apps/functions/package.json
    - apps/functions/tsup.config.ts

key-decisions:
  - "KnownBlock type for chat.postMessage blocks parameter -- type safety over generic object[]"
  - "_resetClient export for test isolation of cached WebClient singleton"

patterns-established:
  - "Slack DM pattern: lookupSlackUser(email) then chat.postMessage -- null user = silent skip"
  - "Block Kit builder pattern: return { text, blocks } for fallback + rich formatting"

requirements-completed: [NOTF-01, NOTF-02, NOTF-03, NOTF-04]

duration: 3min
completed: 2026-04-07
---

# Phase 11 Plan 01: Slack Notification Infrastructure Summary

**Slack WebClient wrapper with email-to-user resolution, 5 Block Kit message builders, and @slack/web-api externalized in tsup build**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-07T19:50:28Z
- **Completed:** 2026-04-07T19:53:50Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Installed @slack/web-api and externalized in tsup build config with dist/package.json dependency
- Created slack.ts with lazy-init WebClient singleton, email-to-Slack user lookup, and fire-and-forget DM sending
- Created slackTemplates.ts with 5 Block Kit message builders covering all notification types plus signature request
- Full unit test coverage for all builders, user resolution success/failure paths, and DM error handling

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @slack/web-api, create slack.ts + slackTemplates.ts, update build config** - `41be98c` (feat)
2. **Task 2: Unit tests for Slack templates and Slack utility functions** - `5570cdc` (test)

## Files Created/Modified
- `apps/functions/src/lib/slack.ts` - WebClient singleton, lookupSlackUser, sendSlackDM with error isolation
- `apps/functions/src/lib/slackTemplates.ts` - 5 Block Kit builders (delivered, completed, in_transit, aged_reminder, signature_request) + shipmentDetailUrl
- `apps/functions/src/__tests__/slack.test.ts` - Unit tests for user lookup and DM sending with mocked WebClient
- `apps/functions/src/__tests__/slackTemplates.test.ts` - Unit tests for all 5 message builders and URL helper
- `apps/functions/package.json` - Added @slack/web-api dependency
- `apps/functions/tsup.config.ts` - Externalized @slack/web-api, added to dist dependencies

## Decisions Made
- Used KnownBlock type from @slack/web-api for chat.postMessage blocks parameter instead of generic object[] to satisfy TypeScript strict checks
- Added _resetClient() export for test isolation of the cached WebClient singleton between test runs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript type error for blocks parameter**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** chat.postMessage expects `(Block | KnownBlock)[]`, not `object[]` as specified in plan
- **Fix:** Imported KnownBlock type from @slack/web-api and used it for the message.blocks parameter type
- **Files modified:** apps/functions/src/lib/slack.ts
- **Verification:** pnpm --filter functions typecheck passes
- **Committed in:** 41be98c (Task 1 commit)

**2. [Rule 3 - Blocking] Added _resetClient for test isolation**
- **Found during:** Task 2 (tests failing due to cached WebClient singleton across test runs)
- **Issue:** Module-level slackClient variable persisted across tests, preventing mock reset
- **Fix:** Added exported _resetClient() function to null out the cached client
- **Files modified:** apps/functions/src/lib/slack.ts
- **Verification:** All 55 tests pass with proper isolation
- **Committed in:** 5570cdc (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for TypeScript compilation and test reliability. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required

Slack bot app requires manual configuration before notifications work in production. From the plan's user_setup section:
1. Create Slack App at api.slack.com/apps (Name: "Material Tracking")
2. Add bot scopes: chat:write, users:read, users:read.email
3. Install app to 1X Technologies workspace
4. Copy Bot User OAuth Token to GCP Secret Manager as "slack-bot-token"

## Known Stubs
None -- all functions are fully implemented with proper types and error handling.

## Next Phase Readiness
- slack.ts and slackTemplates.ts are ready for Plan 02 to wire into existing Firestore triggers
- All exports match the interfaces Plan 02 expects to import

## Self-Check: PASSED

All 5 created files verified on disk. Both task commits (41be98c, 5570cdc) found in git log.

---
*Phase: 11-slack-notifications-signature-to-complete*
*Completed: 2026-04-07*
