# Phase 3: Shipment Creation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 03-shipment-creation
**Areas discussed:** Sender/receiver lookup, Form layout & tablet optimization, Edit & cancel behavior, Location model

---

## 1. Sender / receiver lookup

| Option | Description | Selected |
|--------|-------------|----------|
| Autocomplete text field | Type to search; results as you type (tablet-friendly) | ✓ |
| Dropdown with search | Open list, then filter by typing | |
| Two tabs | "Directory" vs "External" free text | |

**User's choice:** Autocomplete text field

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-fill sender | Default sender = signed-in user (changeable) | ✓ |
| Blank sender | Always empty | |

**User's choice:** Pre-fill sender with current user

| Option | Description | Selected |
|--------|-------------|----------|
| Name only | | |
| Name + company | | |
| Name + email | | |
| Name + company + email | | ✓ |

**User's choice:** External contacts require name + company + email

**Notes:** Aligns with SHIP-02 (directory + external fallback).

---

## 2. Form layout & tablet optimization

| Option | Description | Selected |
|--------|-------------|----------|
| Single page | All fields visible, scroll to submit | ✓ |
| Multi-step wizard | Grouped steps with progress | |
| Claude's discretion | | |

**User's choice:** Single page form

| Option | Description | Selected |
|--------|-------------|----------|
| Preset six categories | Documents, Parts, Samples, Equipment, Personal, Other | ✓ |
| Custom list | User provides own list | |

**User's choice:** Documents, Parts, Samples, Equipment, Personal, Other (implementation must update shared enum/schema)

| Option | Description | Selected |
|--------|-------------|----------|
| Simple number + stepper | | ✓ |
| Per-piece detail at create | | |
| Count only now | | |

**User's choice:** Simple number input with +/- stepper

---

## 3. Edit & cancel behavior

| Option | Description | Selected |
|--------|-------------|----------|
| All fields until first scan | | ✓ |
| Limited fields after create | | |
| Claude's discretion | | |

**User's choice:** All fields editable until first scan

| Option | Description | Selected |
|--------|-------------|----------|
| Soft delete (Cancelled status) | | ✓ |
| Hard delete | | |
| Claude's discretion | | |

**User's choice:** Soft delete — retain for audit

| Option | Description | Selected |
|--------|-------------|----------|
| Modal confirmation | | |
| Inline double-confirm | Button turns red, click again | ✓ |
| Claude's discretion | | |

**User's choice:** Inline confirm for cancel

---

## 4. Location model

| Option | Description | Selected |
|--------|-------------|----------|
| Firestore `locations` collection | Config/admin later | ✓ |
| Config file in repo | | |
| Claude's discretion | | |

**User's choice:** Firestore locations collection (INFR-03)

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-fill origin from user `locationId` | | ✓ |
| Always pick manually | | |

**User's choice:** Origin auto-fill from profile location

| Option | Description | Selected |
|--------|-------------|----------|
| HA = Hayward, SC = San Carlos (two sites) | | ✓ |
| Custom list | | |

**User's choice:** HA (Hayward), SC (San Carlos) — two locations for now

---

## Claude's Discretion

- Directory API vs stub timing; debounce; exact Zod shape for external receiver
- Priority visual styling details; sticky submit bar

## Deferred Ideas

- Admin location CRUD UI (Phase 10)
- Per-piece detail at creation (later phases)
- Directory API approval path if deferred
