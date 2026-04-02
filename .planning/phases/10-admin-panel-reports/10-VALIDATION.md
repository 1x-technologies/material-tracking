---
phase: 10
slug: admin-panel-reports
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | apps/api/vitest.config.ts |
| **Quick run command** | `cd apps/api && pnpm exec vitest run --reporter=dot` |
| **Full suite command** | `cd apps/api && pnpm exec vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && pnpm exec vitest run --reporter=dot`
- **After every plan:** Run full suite + TypeScript check: `pnpm exec tsc --noEmit`

---

## Validation Architecture

### API Tests (vitest)
- Admin user CRUD procedures (create role assignment, deactivation, reactivation)
- Location CRUD procedures (create, update, deactivate)
- Settings read/write procedures
- Report aggregation queries (delivery time, volume, driver activity)
- Audit log write procedures
- Auth middleware: pending user rejection

### Type Safety
- TypeScript compilation across all packages
- Zod schema validation for new input/output types

### Build Verification
- Vite build for web app (includes new admin pages)
- tRPC type inference chain (shared schemas → API router → web client)
