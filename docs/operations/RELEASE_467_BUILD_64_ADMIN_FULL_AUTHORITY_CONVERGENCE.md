# Release 467 Build 64 — Admin Full-Authority Convergence

## Purpose

Build 64 closes the next reliability item after D1 read-budget protection: prove that the active root administrator can manage every enabled Devil n Dove application module and can traverse every enabled shared-service contract without being locked out by stale per-user access rows.

This build is intentionally schema-neutral and mutation-neutral. It does not add a canonical migration, change Production business data, write R2 objects, execute payment/provider actions, publish content, or mutate Cloudflare Access.

## Source predecessor

- Release 467 Build 63 source SHA: `2e70dc5e3eb22eed19ad591cf3c25b480514311d`
- Release 467 Build 63 tree SHA: `2a11582d835b5dd793ca980793e87f6cf1047685`
- Canonical D1 migration authority remains `0001` through `0004`.

## Authority model being proven

The canonical runtime module guard already gives an authenticated `admin` effective `manage` authority on every enabled module before per-user grants or denials are considered. This is the recovery invariant that prevents a stale explicit access row from locking the administrator out of I.T., release, diagnostics, or other module-owned surfaces.

Storage policy remains deliberately stricter:

- Storefront, Creators, Socials and Financials retain `admin/manage` role rows.
- I.T. role-derived access remains denied.
- The active root administrator retains one explicit `it-platform/manage` recovery grant so the explicit-user access-management surface itself stays recoverable.

Build 64 verifies both layers rather than conflating them.

## New fail-closed permission matrix

`GET /api/admin/admin-authority-matrix`

The endpoint is administrator-authenticated and read-only. It returns HTTP 200 only when the complete matrix is green; otherwise it returns HTTP 503 with `fail_closed: true`.

It proves:

1. the canonical module registry is schema-ready and does not require migration;
2. exactly the five canonical module keys are present;
3. the active root administrator exists, is active and has role `admin`;
4. every enabled module evaluates to effective `manage` using the same canonical runtime evaluator used by the application module guard;
5. the four non-I.T. business modules retain their `admin/manage` storage baseline;
6. I.T. remains role-denied so non-admin I.T. elevation stays explicit-user only;
7. the root administrator retains the explicit I.T. recovery `manage` grant;
8. all seven canonical shared-service contracts have a qualifying enabled consumer for the root administrator;
9. mutation-capable shared-service contracts require `manage`, matching runtime shared-service guard semantics.

The matrix exposes per-module and per-shared-service rows so I.T. tooling can show exactly what failed instead of only returning a generic authorization error.

## Fail-closed boundaries

Build 64 does **not** repair authority automatically. A failed matrix is evidence for operator action, not permission to mutate data.

- automatic repair: **OFF**
- request-time schema DDL: **NONE**
- D1 business-data mutation: **NONE**
- R2 mutation: **NONE**
- provider/payment execution: **NONE**
- provider publication: **NONE**
- Cloudflare Access mutation: **NONE**
- automatic Production promotion: **NONE**

The existing Development-only `scripts/release467_root_admin_access.py --verify-only` remains the read-only D1 proof used by the I.T. Admin Runtime Proof. Its narrowly-scoped `--repair` mode remains separately deliberate and Development-only; Build 64 does not invoke it automatically.

## Required release proof

Before Build 64 may move to `main`, the exact Development SHA must pass:

- System Gate
- Current Application Quality Proof
- I.T. Admin Runtime Proof
- Repository Branch Hygiene
- canonical Development D1 proof
- exact Development Preview deployment and smoke acceptance when required by System Gate

Production promotion remains a non-force fast-forward from that exact fully-green Development commit only.

## Next planned build

After Build 64 is fully green and promoted, the roadmap continues with **Build 65 — Admin Page Lazy Loading**.
