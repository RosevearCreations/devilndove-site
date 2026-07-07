# Devil n Dove AI Handoff — Build 209

## Read this first

This is the technical/deployment source of truth. Pair it with `PROJECT_STATUS_AND_ROADMAP.md` for business, workflow, SEO, and release direction. Use `MARKDOWN_INDEX.md` to open only task-specific references.

## Current build

**Build 209** focuses on the internal Inventory Operations workspace and a safe stock/maker-input context inside Product Release Preflight.

### What changed

- `/admin/inventory-operations/` received a scoped contrast, responsive-layout, and action-column repair.
  - Nested inventory cards no longer fall back to white backgrounds with light text.
  - Inputs, selects, buttons, message banners, table headers, table cells, and action columns have readable dark-theme colors.
  - Inventory actions are contained in visible two-column desktop groups and one-column mobile groups.
  - The inventory, movement, and product-stock reports become labelled mobile cards instead of forcing a wide desktop table off-screen.
  - The inventory page accepts `?product_id=<id>` and opens that product in the Tools & Supplies link editor.
- `/admin/release-preflight/` now includes a **non-blocking Inventory & maker-input context** stage.
  - It reads existing finished-product tracking and linked resource/inventory records.
  - It flags missing inventory matches, reorder pressure, and do-not-reuse signals as internal notes only.
  - It never writes stock, creates reservations, changes costs, changes a product, changes rights, or affects pass/fail release readiness.
- Added the admin-only visual: `assets/inventory-operations-placeholder.svg`.
- Added Build 209 validation guidance and refreshed the canonical documentation pair.

## Safety boundaries

- No database migration is included or required.
- Inventory context is internal operational information, not a public availability, provenance, sustainability, or material claim.
- Product Release Preflight remains read-only. Its inventory context is deliberately excluded from Release Board handoff and publication scores.
- CAIP remains source-preserving and evidence-led. It does not create consent, rights, public copy, derivatives, provider jobs, or publications.
- The unresolved `POST /api/auth/login` 500 remains evidence-first. Do not run any legacy D1 migration. The live D1 database was already confirmed to have current `users` and `sessions` tables.

## Required deployed proof

1. Sign in as admin and open `/admin/inventory-operations/` on phone, tablet, and desktop.
2. Confirm the page has no white-on-light nested cards, no horizontal page overflow, and no clipped action buttons.
3. On a narrow phone width, confirm the inventory and stock-report tables display labelled rows/cards; action buttons must remain visible and tappable.
4. Open `/admin/inventory-operations/?product_id=<known-product-id>` and confirm the Product Tools & Supplies selector chooses the matching record.
5. Use a test record to open **Edit full record**, then cancel/reset; confirm no change occurs until Save.
6. Test one Reserve, Release, Receive, and Consume action in a safe test record and verify a movement history row appears.
7. Open `/admin/release-preflight/?product_id=<known-product-id>` and confirm the new Inventory & maker-input context stage is labelled context-only.
8. Confirm inventory notes do not change the handoff score or the publication score.
9. Re-run `POST_DEPLOY_SMOKE_TEST.md`, Build 206/207 media-consent checks, and Build 208 preflight checks.

## Current priority order

1. Capture the safe response body or matching Cloudflare Function log for the verified login `500`, then repair only the proven code path.
2. Deploy and prove Build 209 inventory contrast/mobile behavior on real devices.
3. Complete Build 208 release-preflight proof using real approved, blocked, consent-needed, legacy-unannotated, and public-permitted media examples.
4. Use evidence from live product pages and actual search/marketplace performance to improve factual titles, alt text, descriptions, internal links, and structured data.
5. Only after explicit policy approval, design CAIP derivative controls with source checksum, rights, namespace, budget, human review, output verification, retry, and rollback.

## Deployment shape

The deployment archive must have these at its root:

```text
index.html
_routes.json
wrangler.toml
functions/
```

Cloudflare Pages must bind the existing D1 database as `DB`. Do not create `DB` as a text secret.
