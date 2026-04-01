---
phase: 03
slug: shipment-creation
status: draft
nyquist_compliant: false
wave_0_complete: true
created: 2026-04-01
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (API) |
| **Config file** | `apps/api/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @material-tracking/api exec vitest run` |
| **Full suite command** | `pnpm --filter @material-tracking/api exec vitest run && pnpm --filter @material-tracking/api exec tsc --noEmit && pnpm --filter @material-tracking/web exec tsc --noEmit` |
| **Estimated runtime** | ~30–90 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter @material-tracking/api exec vitest run` (or scoped path if task is API-only)
- **After every plan wave:** Run full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | SHIP-01 | compile | `pnpm --filter @material-tracking/shared exec tsc --noEmit` | ✅ | ⬜ pending |
| 03-02-01 | 02 | 2 | SHIP-01 | unit | `pnpm --filter @material-tracking/api exec vitest run` | ✅ | ⬜ pending |
| 03-03-01 | 03 | 3 | SHIP-03 | compile | `pnpm --filter @material-tracking/web exec tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Existing Vitest in `apps/api` covers new router tests when added
- [x] `biome check` at repo root

*No new test framework install required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Tablet single-page scroll + stepper | SHIP-01 | Layout / viewport | Open `/shipments/new` on narrow viewport; scroll to submit; tap +/- on piece count |
| Directory stub results | SHIP-02 | Env-dependent | Set `DIRECTORY_STUB=1`; type in sender field; assert mock users appear |
| Inline cancel double-click | SHIP-05 | UX timing | Arm cancel; second click within window cancels; shipment shows cancelled in Firestore |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or manual table above
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] No watch-mode flags
- [ ] `nyquist_compliant: true` set in frontmatter after execution

**Approval:** pending
