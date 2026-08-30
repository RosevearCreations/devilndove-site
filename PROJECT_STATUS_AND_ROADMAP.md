# Devil n Dove — Project Status & Roadmap

## Current Development state

**Release 461 — Runtime Schema Convergence, Inventory & CAIP Production Pipeline — Development green.**

Development remains `dev` → `devilndove-site-dev` with D1 `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`). Separate live `main` / `devilndove-site` is untouched. Provider live authorization, provider execution/publication, and raw CAIP R2 deletion remain closed.

## Release 461 completed scope

Release 461 closed the runtime-schema convergence and the current Inventory/Product Media/CAIP production-pipeline queue:

1. Inventory purchase-package/base-unit correctness.
2. Inventory desktop/mobile usable-unit clarity.
3. Primary product-image quality acceptance.
4. CAIP private ingest context.
5. Multicamera recognition/synchronization planning.
6. Footage-quality review.
7. Reversible reject/deferred-purge lifecycle.
8. Semantic evidence on source-backed temporal ranges.
9. Reviewed-evidence Story Builder.
10. Reviewed edit/timeline generation with provider execution closed.
11. CAIP → Content Studio reviewed publishing handoff.
12. Broad public/shared/admin/accounting runtime-schema migration ownership.

Request-time schema DDL/repair is forbidden and historical migration replay remains forbidden.

## Database closure

The combined Release 461 D1 acceptance succeeded in run `33340698069`:

- 19 Release 461 migrations applied;
- 77 required tables present;
- 93 required named indexes present;
- zero missing required objects;
- zero remaining structural drift;
- zero foreign-key violations.

The bounded pre-existing structural repair was applied only after exact read-only classification. Release 461 D1 must not be reapplied on future startup unless read-only verification proves actual drift.

## Runtime/deployment closure

Authenticated GET-only Development runtime acceptance succeeded in run `33342752757` on request SHA `7200f421e0fc58842aed4003dc774ed30f910809`.

Live Development proof included:

- Release 461 module authority healthy;
- Inventory base-unit authority live across 80 returned rows;
- Product Media primary thresholds live at 1200×1200, alt ≥12, score ≥70;
- CAIP pipeline schema live with 23 projects and all execution/delete boundaries closed;
- reviewed CAIP handoff live for project 36 with source media unchanged;
- anonymous admin access correctly rejected;
- session token resolved read-only from an existing Development session and masked;
- no D1, R2, provider, publication, raw-media-delete, or Production mutation.

## Carried security/provider boundary

Release 460 security remains carried forward: encrypted OAuth material, hashed single-use state, PKCE where supported, intended-account verification, redacted diagnostics, and fail-closed Development authorization. None of that authorizes live provider execution.

## Deferred evidence / next roadmap

Release 461 itself is closed. The next source release must begin as **Release 462**.

Separate evidence/work that can be resumed deliberately:

- CAIP private-media browser/range-streaming evidence;
- Stripe test transaction/webhook/reconciliation;
- PayPal sandbox transaction/webhook/reconciliation;
- Etsy and social/video provider authorization/controlled acceptance;
- Development-to-Production parity/promotion rehearsal;
- continued Storefront / Creators / Socials (CAIP) / Finance-Accounting / I.T. evolution under SEO and current release authority.

## Promotion rule

Development-green does not promote separate live Production. Promotion remains a deliberate reviewed operation after the chosen later acceptance boundary is satisfied.
