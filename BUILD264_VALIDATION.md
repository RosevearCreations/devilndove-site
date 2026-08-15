# Devil n Dove Build 264 Validation

**Release:** Build 264  
**Scope:** Media Studio visibility/static content, Home/Shop editability, full-frame storefront imagery, explicit public display order, optional Movie metadata helper, and productless Creative Project → CAIP/inventory-cost workflow.

## Build 264 focused regression

`scripts/build264_content_project_merchandising_regression.py`

**70 / 70 PASS**

Validated:

- Website Areas has no nested max-height/overflow clipping.
- Media Studio catalog is version 264 with **30 owner-facing areas and 543 explicit static slots**.
- Shop presentation is managed while Product/Inventory/Supply/Tool specialist boundaries remain.
- Home has six editable What-we-make cards: title, body, destination and background colour.
- Home has two additional editable What-we-make visuals.
- All three Build-182 visual-polish tiles expose editable kicker, heading, message and colour.
- Home category cards route to filtered Shop product results.
- Shop moves matching product results above Recently Viewed/support content while an active filter/query is present.
- Shop static hero, available-products copy, collection direction, policy/FAQ, Recently Viewed presentation and compact Gift Card presentation are Media-Studio editable.
- Storefront product imagery uses full-frame `contain` presentation.
- Media Studio/public manifest/runtime support text, links and background-colour slots.
- Public display priority exists independently for Home Featured, Art/Gallery and Creations.
- Movie helper keeps TMDB credentials server-side, uses the official `primary_release_year` search parameter, and supports detailed title/cast/director/genre/runtime/studio/IMDb/poster/trailer/synopsis preview.
- Movie UI fills empty metadata by default and requires an explicit replace choice for populated fields.
- Productless Creative Process projects can create/reuse CAIP workspaces.
- Research/content projects can record Inventory usage and save internal cost purpose.
- Material-usage and cost-analysis outputs remain available for productless projects.
- CAIP intake honors direct `creative_project_id` navigation.
- Build 264 migration is byte-identical to `database_upgrade_current_pass.sql` and is idempotent in the test fixture.
- D1 has no foreign-key violations after the fresh aggregate schema plus repeated Build 264 migration.

## Retained core regressions

- Build 263 Packaging / My Printers: **15 / 15 PASS**
- Build 255 Packaging Material Library: **38 / 38 PASS**
- Build 254 Startup / Smoke runtime: **16 / 16 PASS**
- Build 253 Inventory linked-item/reset: **18 / 18 PASS**
- Build 252 Inventory unit runtime: **10 / 10 PASS**
- Build 251 Product image runtime: **9 / 9 PASS**
- Build 250 Product media/use-batch: **14 / 14 PASS**
- Build 249 Kit/component inventory: **25 / 25 PASS**
- Build 246 product/project/packaging lifecycle regression: **PASS**

Historical Build 259/260 regression scripts contain exact-version/scope assertions that are intentionally superseded by Build 264 (for example, they expected Shop not to be Media-Studio managed and expected old cache versions). Their current behavior is covered by the Build 264 focused regression instead of weakening Build 264 to satisfy obsolete assertions.

## Public page / asset audit

- Public pages audited: **36 / 36 PASS**
- Warnings: **0**
- Failures: **0**
- Local asset references: **151**
- Missing assets: **0**

## Database validation

The following aggregate schemas execute successfully in fresh SQLite fixtures with zero foreign-key violations:

- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`

`database_build264_content_project_merchandising.sql` is additive and may be replayed safely in the Build 264 regression fixture. The migration ledger remains one row for `build264_content_project_merchandising`.

A seeded productless `research` Creative Work Project was additionally verified to backfill to a CAIP `creative_projects` workspace with `product_id = NULL`, a `workspace_ready` mirror, and `material_usage` + `cost_analysis` outputs.

## JavaScript syntax

**21 changed JavaScript modules PASS `node --check`**, covering the new merchandising API/UI, Movie helper, Creative Process/CAIP changes, Media Studio/runtime, Shop behavior, Recently Viewed/Gift Card presentation, Home script and public product-image bundles.

## External Movie metadata requirement

The TMDB helper is optional. It stays disabled unless `TMDB_READ_ACCESS_TOKEN` is configured in Cloudflare. Manual Movie Catalog editing continues to work without the token.

Because Devil n Dove is a commercial site, TMDB commercial-use/licensing and attribution requirements must be reviewed/approved before enabling this integration in production. Build 264 deliberately does not assume that a standard developer key grants commercial rights.

## Production checks after deployment

1. Confirm Build 263 is already in production, back up D1, then apply Build 264 migration once.
2. Run `BUILD264_D1_VERIFICATION.sql` and confirm the missing-workspace/output/FK checks are zero.
3. Open Media Studio and confirm all Website Areas, including Collections, are reachable without an internal scroll cutoff.
4. Edit one Home card title/body/colour/link and then restore its original/default values.
5. Click Resin (and one other Home category) and confirm filtered Shop products appear at the top of the Shop content.
6. Test one portrait and one landscape product photo on Home/Shop/Product Detail and confirm the full edited image is visible.
7. Use Public Display Order to pin/rank a small test set independently on Home Featured, Art/Gallery and Creations.
8. For Movie import, configure/approve the provider license + secret first; then search one known title/year and confirm only blank metadata fields are filled unless Replace is checked.
9. Open the existing research/experiment Creative Project, confirm its CAIP workspace, record one consumable and one reusable Inventory use, upload a disposable media fixture, and verify the reviewed Content Studio handoff path.
