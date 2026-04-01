---
phase: 04
slug: qr-code-generation-label-printing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (API + Web) |
| **Config file** | `apps/api/vitest.config.ts`, `apps/web/vitest.config.ts` |
| **Quick run command** | `pnpm --filter @material-tracking/api exec vitest run && pnpm --filter @material-tracking/web exec vitest run` |
| **Full suite command** | `pnpm --filter @material-tracking/api exec vitest run && pnpm --filter @material-tracking/api exec tsc --noEmit && pnpm --filter @material-tracking/web exec tsc --noEmit` |
| **Estimated runtime** | ~60–120 seconds |

---

## Sampling Rate

- **After every task commit:** Run scoped vitest for touched package
- **After every plan wave:** Run full suite command above
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 120 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | QRPR-01 | unit | `pnpm --filter @material-tracking/api exec vitest run` | ✅ | ⬜ pending |
| 04-02-01 | 02 | 2 | QRPR-03 | unit | `pnpm --filter @material-tracking/web exec vitest run` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | QRPR-02 | compile | `pnpm --filter @material-tracking/web exec tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Extend `apps/api/tests/shipment-router.test.ts` — assert `qrCode === pieceDocId` on create
- [ ] Add ZPL builder unit tests (snapshot-based)
- [ ] Mock `BrowserPrint` global in web tests

*Existing Vitest infra covers; no new framework install.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Label prints on Zebra printer | QRPR-03 | Hardware dependent | Connect Zebra; click Print Labels; verify physical label matches preview |
| Preview matches print | QRPR-02 | Visual fidelity | Compare HTML preview to printed label side-by-side |
| Agent-missing error | QRPR-03 | Requires agent state | Stop Zebra Browser Print agent; click Print; verify error message appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
