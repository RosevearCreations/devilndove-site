# Release 452 — Application Streamlining & UX/SEO Depth

## Environment boundary

Release 452 is a **Development-only, source-only** convergence release on `dev` / `devilndove-site-dev`.

- Development D1 binding: `DB`
- Development D1: `devilndove-dev`
- Development D1 UUID: `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Last independently verified D1 schema release: **Release 450**
- Release 452 D1 migration: **none required**
- Historical migration replay: **forbidden**
- Production promotion: **closed**
- Marketplace/provider publication: **closed**

A new chat, workstation, or release number is not a migration event. Releases 447–450 are never replayed merely to prove connectivity.

## Release purpose

Release 452 removes obsolete current-tree debris and makes repository hygiene, Storefront SEO depth, responsive/admin privacy, and status accessibility permanent gate requirements instead of one-time cleanup tasks.

## Completed source scope

1. Retire obsolete root Build-era D1 verification SQL after current-tree reference verification. Git history remains the archive.
2. Preserve active Release 448 regression authorities still called by the System Gate.
3. Add `scripts/repository_hygiene_gate.py` to reject obsolete root Build verification SQL, backup/temp artifacts, stale current-release authorities, unsafe sitemap entries, principal Storefront SEO regressions, and representative admin privacy/status regressions.
4. Add `scripts/release452_application_streamlining_gate.py` as the Release 452 convergence gate.
5. Preserve both canonical public SEO gates: `scripts/public_seo_gate.py` and `scripts/public_seo_depth_gate.py`.
6. Preserve Release 451 marketplace calibration as a read-only carried-forward authority.
7. Keep the existing dynamic Product JSON-LD authority in `public/js/product-detail.js`; do not create a competing Product schema implementation.
8. Add an accessible visible Product breadcrumb and a local `BreadcrumbList` JSON-LD authority that follows the current Product name and canonical URL.
9. Keep Shop, Collections, and Collages on their existing `CollectionPage` structured-data model rather than duplicating Product truth.
10. Add `/collages/` to the public sitemap and gate principal discovery-route coverage.
11. Require one H1, canonical metadata, Open Graph, Twitter card, JSON-LD, and image alt text across Shop, Product, Collections, and Collages.
12. Guard local principal Storefront navigation against missing static routes.
13. Add `noindex,nofollow` protection to the Accounting admin workspace.
14. Add non-disruptive `aria-live="polite"` status announcements to representative Inventory, Tool Lifecycle, Financials/Accounting, and CAIP workspaces.
15. Preserve responsive breakpoints on Inventory, Tool Lifecycle, CAIP, and Marketplace Calibration workspaces.
16. Keep `wrangler.toml` account-agnostic; `account_id` remains forbidden.
17. Synchronize `development-release.json`, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, repository sanity, Release 452 source workflow, and System Gate.

## Provider boundary

Release 452 may improve local preparation, validation, UI, SEO, and evidence surfaces without provider credentials. It does **not** authorize Etsy, Meta/Facebook, Pinterest, TikTok, Stripe, or PayPal execution.

Provider credentials must never be stored in D1. Publication remains fail-closed until deliberate provider acceptance is completed.

## Acceptance

Release 452 source acceptance requires:

- repository hygiene gate green;
- Release 452 application streamlining gate green;
- Release 451 marketplace calibration carried forward green;
- public structural SEO gate green;
- public SEO depth gate green;
- JavaScript/Python syntax green;
- canonical System Gate green;
- no Production mutation capability.

Authenticated Development runtime acceptance, Stripe test acceptance, PayPal sandbox acceptance, CAIP private-media evidence, and provider-specific acceptance remain separate external/runtime evidence tasks and do not justify a Release 452 D1 migration.
