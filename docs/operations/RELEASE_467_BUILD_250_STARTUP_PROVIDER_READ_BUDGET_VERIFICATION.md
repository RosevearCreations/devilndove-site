# Release 467 Build 250 — Startup & Provider Read-Budget Verification

Build 250 starts from exact Build 249 Development `fe7ac18156f2cbe83c67536be27b77756d29c696` and Production `94e4561f6b47337538a23ef2404f456237961ca3`, sharing tree `bec700bf173ef7cc07b74aafdde4db6d362faad1`.

## Purpose

Build 249 established browser-local runtime measurement. Build 250 turns the Admin-home startup path into a bounded read-budget acceptance contract and adds exact-Development provider metering for the two automatic authenticated reads used by Seller Daily/Admin Home.

## Browser-local startup budget

During the first 15 seconds of Admin Home:
- automatic authenticated API calls are counted by pathname only;
- no more than **4** safe GET calls may be observed;
- no more than **2** Build 240 provider-bound live reads may be observed;
- query values, request/response bodies, headers, cookies, tokens, email addresses and business payloads are never captured;
- measurements remain in `sessionStorage` and are never transmitted.

The expected automatic authenticated paths are:
- `/api/admin/contracts/operations-today-tasks-read`
- `/api/admin/dashboard-summary`

## Exact-Development provider budget

The Build 250 workflow runs only on an exact `dev` push and executes read-only D1 probes against canonical Development database `devilndove-dev`:

| Surface | Read-only SQL statements | rows_read ceiling |
| --- | ---: | ---: |
| Today Tasks startup | 13 | 15,000 |
| Seller Daily summary | 1 | 10,000 |
| Aggregate | 14 | 25,000 |

The workflow reads D1 provider `meta.rows_read`, fails closed above any ceiling, writes a sanitized JSON evidence artifact, and identifies the highest-fanout remaining startup read surface. No Production D1/R2 contact or business-data copy is permitted.

## Exact Development measurement

Measured on Development SHA `14f1d1f9d29988d39902dc6667230a611fb0018e` / tree `42e3797d5a575af10da0aa9d1d367b41d85908ed` in workflow run `35998730536`:

| Surface | Measured rows_read | Ceiling | Headroom |
| --- | ---: | ---: | ---: |
| Today Tasks startup | **1,132** | 15,000 | 13,868 |
| Seller Daily summary | **1,046** | 10,000 | 8,954 |
| Aggregate | **2,178** | 25,000 | 22,822 |

Evidence artifact: `10807715341` / `build250-provider-read-budget-14f1d1f9d29988d39902dc6667230a611fb0018e`.

All three provider ceilings are GREEN. No D1/R2 mutation, Production D1 contact, provider execution/publication, or Production business-data copy occurred.

## Current repeated-read hotspot

Exact provider measurement identifies **Operations Today Tasks** as the highest provider-read startup surface: 1,132 rows across 13 read-only statements, versus 1,046 rows for Seller Daily's one statement. This is measured evidence, not a synthetic estimate.

## Acceptance

Build 250 is accepted only when:
1. Build 249 exact Development and Production GREEN closure is ingested;
2. Admin Home retains Build 176/240 containment while loading the Build 250 budget verifier before startup consumers;
3. the browser-local verifier enforces the 4-call / 2-live-read ceilings without remote telemetry;
4. measurement SQL contains SELECT-only statements and the expected 13 + 1 statement fan-out;
5. provider metering is restricted to exact `dev` pushes and canonical Development D1 identity;
6. Today Tasks, Seller Daily and aggregate provider rows-read ceilings are hard failures;
7. no Production data copy/mutation, D1 mutation, R2 mutation, provider execution/publication, Product publication, Inventory movement or Finance posting is introduced;
8. System, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene and Build 250 dedicated gates are GREEN on the exact Development head before Production promotion.

Next authorized release: **Build 251 — CSP Style Injection-Surface Hardening**.
