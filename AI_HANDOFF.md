# Devil n Dove AI Handoff — Build 196

Read this first in a new chat. Then read `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, `BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md`, `BUILD196_PRODUCT_CORRECTION_MATERIAL_RETURN_GUIDE.md`, `BUILD194_TESTING_GUIDE.md`, and `LIVE_TESTING_GUIDE.md`.

## Current build

Build 196 corrects the visible product-correction path: an editor-level panel now previews linked raw inventory and requires explicit reviewed reservation-release or physical-return quantities before unused-product deletion. It also returns the inventory display to a single item name directly below each image.

New D1 migration:

```text
database_build195_product_lifecycle_sku_inventory_cards.sql
database_build196_product_correction_material_returns.sql
database_build196_product_correction_material_returns.sql
```

New operating rules:

- `products.product_number` is the internal **System #** and stays unique.
- Product numbers are allocated from `catalog_product_number_sequence`; a deleted product number is not reused.
- A blank SKU is automatically generated as `DND-xxxxx` from the permanent system number.
- A custom SKU remains allowed but must be unique.
- Incorrect unused products can be permanently deleted only after admin step-up password, exact `DELETE PRODUCT` phrase, and a reason.
- Products with order/history/reference records are blocked from deletion and must be archived.
- Permanent deletion writes a factual `product_deletion_audit` record.
- Tool/supply item names now render directly below their image. Legacy `site_inventory_item_descriptions` data is retained but no longer rendered or overwritten by ordinary edits.
- `/api/admin/delete-product` now supports a GET correction preview plus explicit `material_actions` in the guarded POST delete flow.
- `product_material_return_audit` records every reviewed reservation release or returned raw supply quantity.

## Primary routes

- `/admin/products/` — desktop product editor with visible **Correct / return raw inventory** panel after loading an existing product.
- `/admin/catalog/` — catalog/product administration and System #/SKU explanation.
- `/admin/site-item-inventory/` — tools/consumables inventory; item name appears directly below image.
- `/admin/command-center/` — daily operations, cost/fee, SEO, media, live readiness, and consolidation evidence.
- `/admin/catalog-media/` — product image health, listing facts, and media-role scoring.
- `/admin/mobile-product/` — phone product draft capture and resumable large-photo uploader.
- `/admin/local-seo-review/` — Search Console and local SEO review.
- `/admin/deployment-preflight/` — static and release checks.

## Important APIs

- `/api/auth/login` — must return JSON; root `_routes.json` must include `/api/*`.
- `/api/admin/create-product` — desktop product creation with permanent system number and automatic SKU when blank.
- `/api/admin/mobile-create-product` — mobile product creation with same sequence rules.
- `/api/admin/delete-product` — GET previews linked raw inventory; POST requires admin step-up, confirmation phrase, and reason; it can apply explicit reviewed material actions before deleting an unused product.
- `/api/admin/site-item-inventory` — tools/supplies inventory including `item_description` sidecar data.
- `/api/admin/product-listing-profiles` — admin listing facts workflow.
- `/api/admin/product-media-score` — admin image-role assignment and score workflow.
- `/api/admin/value-ops` — integrated Command Center operations.

## D1 migration order

Run only missing migrations. Do not blindly rerun older non-idempotent migrations.

```text
database_build171_ledger_repair.sql only if Build 171 schema exists but the marker is missing
database_build173_deployment_preflight.sql
database_build174_deployment_preflight_detail.sql
database_build175_release_control.sql
database_build176_release_safety_controls.sql
database_build177_deploy_score_and_controls.sql
database_build178_promote_live_controls.sql
database_build179_promotion_control.sql
database_build180_go_live_execution.sql
database_build181_live_ops_followthrough.sql
database_build182_mobile_visual_polish.sql
database_build183_visual_enrichment_studio.sql
database_build184_sanity_check_and_value_roadmap.sql
database_build185_admin_command_center_value_dashboards.sql
database_build186_markdown_consolidation_visual_placeholders.sql
database_build189_value_ops_live_counts.sql
database_build190_integrated_value_operations.sql
database_build191_value_operations_followthrough.sql
database_build192_operational_data_connection.sql
database_build193_live_readiness_playbook.sql
database_build194_storefront_discovery_product_facts_media_roles.sql
database_build195_product_lifecycle_sku_inventory_cards.sql
```

Builds 187 and 188 were routing/environment hotfixes without D1 migrations.

## Key business rules

- One H1 maximum per exposed page.
- Never promise first-page or local-pack placement.
- Fee/cost defaults are not financial truth until owner-reviewed.
- Marketplace exports stay blocked for unhealthy/unknown margin unless a current reviewed override exists.
- Review eligibility is not permission to contact.
- Customer stories, gallery proof, and customer photographs require consent/public-use approval.
- Placeholders are layout scaffolding, not proof.
- Mobile recovery stores fields; user must reselect image files after browser reload.
- Resumable image uploads require an R2 binding and an already-saved product draft.
- Environment views must never reveal secret values.
- Do not merge customer duplicates automatically.
- Do not permanently delete a product with order/history references; archive it instead.
- Do not reuse a deleted System # or custom SKU.

## Build 195 owner test order

1. Apply `database_build195_product_lifecycle_sku_inventory_cards.sql` after Build 194.
2. Confirm `/api/auth/login` returns JSON and `DB` remains a D1 binding.
3. Create one clearly marked test draft with blank SKU and record its System #/automatic SKU.
4. Use **Delete unused** on that product: password, reason, phrase `DELETE PRODUCT`.
5. Create a second test draft and verify System # increased rather than reused.
6. Confirm the item name appears directly below the picture on desktop and phone; no short-description block is shown.
7. Use `BUILD195_PRODUCT_LIFECYCLE_INVENTORY_GUIDE.md`, `BUILD196_PRODUCT_CORRECTION_MATERIAL_RETURN_GUIDE.md` for detailed expected results and cleanup.
8. Run `/admin/deployment-preflight/` and save evidence.

## Documentation policy

Canonical files:

1. `PROJECT_STATUS_AND_ROADMAP.md`
2. `AI_HANDOFF.md`

Supporting documents exist only for specialist detail. Historical context remains in `docs/archive/`.
