---
phase: 01-project-scaffolding-firebase-infrastructure
plan: 06
subsystem: infra
tags: [github-actions, ci-cd, workload-identity-federation, firebase-deploy, cloud-run, biome]

requires:
  - phase: 01-project-scaffolding-firebase-infrastructure (plans 01-05)
    provides: monorepo structure, Firebase config, Firestore rules, Cloud Functions, Cloud Run API, web app
provides:
  - GitHub Actions CI/CD workflows for dev, staging, and prod environments
  - Full test gate (lint + typecheck + tests) before every deployment
  - Automated Firebase and Cloud Run deployment on branch push
affects: [all future phases - CI/CD runs on every push]

tech-stack:
  added: [github-actions, google-github-actions/auth, google-github-actions/setup-gcloud, jsdom]
  patterns: [branch-to-environment mapping, test-gate-before-deploy, workload-identity-federation]

key-files:
  created:
    - .github/workflows/deploy-dev.yml
    - .github/workflows/deploy-staging.yml
    - .github/workflows/deploy-prod.yml
  modified:
    - biome.json
    - apps/api/tsup.config.ts
    - apps/functions/tsup.config.ts
    - apps/web/src/main.tsx
    - apps/web/src/components/layout/TopBar.tsx
    - apps/web/src/pages/SignInPage.tsx
    - apps/web/vitest.config.ts
    - apps/web/package.json

key-decisions:
  - "Biome dist exclusion pattern changed from !dist to !**/dist to cover nested app dist directories"
  - "Tailwind CSS parser directives enabled in Biome to support @theme syntax"
  - "CSS linting/formatting delegated to Tailwind — Biome only parses CSS for Tailwind directives"

patterns-established:
  - "CI/CD pattern: test job (lint→typecheck→test) gates deploy job via needs dependency"
  - "GCP auth pattern: Workload Identity Federation via google-github-actions/auth — no service account key JSON"
  - "Environment mapping: dev branch→dev project, staging branch→staging project, main branch→prod project"

requirements-completed: [INFR-02]

duration: 4min
completed: 2026-03-31
---

# Phase 01 Plan 06: CI/CD Workflows Summary

**GitHub Actions CI/CD pipelines for dev/staging/prod with test gates, Workload Identity Federation auth, and automated Firebase + Cloud Run deployment**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-31T23:17:29Z
- **Completed:** 2026-03-31T23:21:21Z
- **Tasks:** 2
- **Files modified:** 42

## Accomplishments
- Three GitHub Actions workflows mapping branches to Firebase projects (dev→dev, staging→staging, main→prod)
- Full test gate (lint + typecheck + tests) runs before every deployment
- Workload Identity Federation for GCP auth — no service account key JSON files
- Full local build pipeline validated: install → lint → typecheck → test → build with all dist artifacts

## Task Commits

Each task was committed atomically:

1. **Task 1: GitHub Actions workflows for dev, staging, and prod** - `1fdec1c` (feat)
2. **Task 2: Verify full build pipeline locally** - `b41f032` (fix)

## Files Created/Modified
- `.github/workflows/deploy-dev.yml` - CI/CD for dev branch → 1xtech-material-tracking-dev
- `.github/workflows/deploy-staging.yml` - CI/CD for staging branch → 1xtech-material-tracking-staging
- `.github/workflows/deploy-prod.yml` - CI/CD for main branch → 1xtech-material-tracking-prod (min 1 Cloud Run instance)
- `biome.json` - Fixed dist exclusion glob, enabled Tailwind CSS parser directives
- `apps/api/tsup.config.ts` - Fixed node:fs import protocol
- `apps/functions/tsup.config.ts` - Fixed node:fs import protocol
- `apps/web/vitest.config.ts` - Added passWithNoTests for empty test suite
- `apps/web/package.json` - Added jsdom devDependency
- `apps/web/src/main.tsx` - Added biome-ignore for root element non-null assertion
- `apps/web/src/components/layout/TopBar.tsx` - Added button type attribute
- `apps/web/src/pages/SignInPage.tsx` - Added button type attribute
- 28 additional source files auto-formatted (double quotes, import ordering)

## Decisions Made
- Biome `!dist` → `!**/dist` to properly exclude nested dist directories
- Enabled `tailwindDirectives: true` in Biome CSS parser for `@theme` syntax support
- Added `jsdom` devDependency to web package for vitest environment
- Added `passWithNoTests: true` to web vitest config since no tests exist yet

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Biome dist exclusion pattern only matched top-level dist**
- **Found during:** Task 2 (lint step)
- **Issue:** `!dist` in biome.json only excluded the root `dist/`, not `apps/*/dist/` directories — causing 4000+ lint errors from compiled output
- **Fix:** Changed to `!**/dist` glob pattern
- **Files modified:** biome.json
- **Verification:** `pnpm run lint` passes
- **Committed in:** b41f032

**2. [Rule 3 - Blocking] Tailwind @theme syntax not recognized by Biome CSS parser**
- **Found during:** Task 2 (lint step)
- **Issue:** Biome CSS parser rejected `@theme` directive in globals.css
- **Fix:** Added `css.parser.tailwindDirectives: true` to biome.json
- **Files modified:** biome.json
- **Verification:** CSS parsing succeeds without errors
- **Committed in:** b41f032

**3. [Rule 1 - Bug] Source files had formatting/lint issues from previous plans**
- **Found during:** Task 2 (lint step)
- **Issue:** Single quotes, unsorted imports, missing node: protocol, missing button type attributes, non-null assertion
- **Fix:** Auto-formatted via `biome check --write`, manual fixes for unsafe suggestions
- **Files modified:** 36 source files across api, functions, and web packages
- **Verification:** `pnpm run lint` exits cleanly
- **Committed in:** b41f032

**4. [Rule 3 - Blocking] Missing jsdom dependency and no passWithNoTests for web tests**
- **Found during:** Task 2 (test step)
- **Issue:** Web vitest config referenced jsdom environment but dependency not installed; vitest exits with code 1 when no test files found
- **Fix:** Added jsdom devDependency, set `passWithNoTests: true`
- **Files modified:** apps/web/package.json, apps/web/vitest.config.ts, pnpm-lock.yaml
- **Verification:** `pnpm run test` exits 0 across all packages
- **Committed in:** b41f032

---

**Total deviations:** 4 auto-fixed (1 bug, 3 blocking)
**Impact on plan:** All fixes necessary for build pipeline to pass. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required

**External services require manual configuration.** GitHub repository, Firebase projects, and GCP services must be configured before the CI/CD pipeline can run:

- **GitHub:** Create repository under 1x-technologies org, add `WIF_PROVIDER` and `SA_EMAIL` as repository secrets
- **Firebase:** Create three projects (dev/staging/prod), upgrade to Blaze plan, enable Firestore/Auth/Storage/Hosting
- **GCP:** Enable Cloud Run/Pub/Sub/Scheduler/Secret Manager/Artifact Registry APIs, create Workload Identity Pool and deployment service account

See plan frontmatter `user_setup` section for detailed steps.

## Next Phase Readiness
- Phase 01 scaffolding complete — all 6 plans executed
- Full CI/CD pipeline ready to deploy on branch push once GitHub secrets are configured
- All workspace packages build cleanly with deployable artifacts

---
*Phase: 01-project-scaffolding-firebase-infrastructure*
*Completed: 2026-03-31*
