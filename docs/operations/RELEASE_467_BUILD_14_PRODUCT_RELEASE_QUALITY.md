# Release 467 Build 14 — Product Release Quality Command Center

## Purpose

Build 14 executes items 1–5 from `RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md` as one bounded Product/Storefront quality improvement. It turns existing product, cost, inventory, media, SEO and local marketplace-readiness facts into one ranked operator queue without creating another owning business authority.

## Exact predecessor

Build 14 starts from current `dev` `86907d512c5121bb05306ca9d31d4aecb5fd6c50`, tree `9740eec99afbcd93773ab7e3b875037c183591db`.

The exact last Development-green build is Release 467 Build 13:

- merged SHA `794fd5b36191fff4c9e8376197f968d9c6d6da80`
- tree `9c2bcdcb12bcbf2f00aeb19345329cdce39c65d9`
- System Gate `33643833623` SUCCESS
- Build 13 Proof `33643833608` SUCCESS

Build 13 remains **Repository Hygiene and Historical CI Cleanup** authority. Its exact Build 12 predecessor was `374983f68fb16172fb357b1755293a29e5d2953f`. External lanes remain `HOLD_EXTERNAL`.

## Product Release Quality Command Center

`/admin/products/` mounts `public/js/admin-product-quality-command-center.js` above the ordinary Product editor.

The board reads only existing authorities:

- `/api/admin/products`
- `/api/admin/product-readiness?limit=300&show_ready=1`

It ranks products by unresolved blocking and attention items and shows product-specific remediation for:

- title and descriptions;
- category;
- selling price;
- linked cost completeness and gross margin;
- inventory/buildable-resource availability and shortages;
- hero image quality;
- gallery depth;
- alt-text coverage;
- public-use/consent clearance;
- SEO title/meta;
- canonical/slug readiness;
- visible facts needed for structured-data parity;
- shipping-code eligibility;
- marketplace image readiness.

The board is read-only. Every correction opens the existing owning workspace. It does not save product facts, move stock, alter SEO, publish a listing or execute a provider automatically.

## Visual readiness and crop/focal discoverability

Each product card shows compact pass/fail quality badges plus the first prioritized fix. The current hero media is visible when available.

The `Crop / focal` action opens the existing Product Media Workflow. That workflow already owns:

- clickable focal-point placement;
- normalized focal X/Y storage;
- crop X/Y/width/height geometry;
- `Set 1:1 crop`;
- queued storefront-square derivative files;
- derivative before/after history;
- explicit featured-derivative selection.

Build 14 does not destructively edit or replace the original R2 source asset. The approved presentation crop/derivative remains separate from source media.

## Marketplace image readiness

`functions/api/_lib/marketplaceReadiness.js` now includes `validateSelectedImageSet` and folds image-quality results into the existing `validateListingDraft` result.

When selected-image metadata is available, local marketplace preparation checks:

- duplicate selected URLs;
- useful alt text;
- public-use clearance;
- lead image minimum 800×800;
- preferred 1200×1200 lead image target;
- strongly portrait lead images;
- lead merchandising score below 70%;
- sparse one/two-image sets.

Hard image blockers flow through the existing Marketplace Export Preview and continue to block local CSV preparation. No marketplace/provider network call is introduced and provider execution/publication remains false.

## Proof-image recommendations

`/api/admin/product-readiness` now emits `image_recommendations` based on existing product name/category and existing image roles. Recommendations can include:

- Hero/front;
- Detail/texture;
- Scale/context;
- Packaging/label for candle/soap/bath products;
- Process/story for maker categories;
- Back/side for jewelry-like products;
- Material/tool proof where useful;
- additional supporting gallery views.

These are prompts to capture real media, not synthetic claims or proof. If real evidence does not exist, the recommendation remains open.

## Safety boundary

Build 14 has:

- no schema migration;
- no request-time DDL;
- no new D1 mutation authority;
- no R2 mutation authority;
- no raw R2 deletion;
- no automatic repair;
- no provider execution/publication;
- no Cloudflare Access policy mutation;
- no `main` mutation;
- no Production contact/mutation;
- no secret-value emission.

Canonical migrations remain exactly `0001`–`0004`. Existing U.S. sales/shipping suspension remains unchanged.

## External lanes

These remain separate and deliberately `HOLD_EXTERNAL`:

- Cloudflare Access service-token acceptance;
- Stripe Development;
- PayPal sandbox;
- Social/OAuth.

CAIP private-media status continues to use fresh Build 7 runtime evidence.

## Acceptance

Build 14 is complete only when one exact feature head passes Build 13 preservation and the Build 14 proof, the full current Release 467/System PR fanout is green, that unchanged head is merged, and the exact merged `dev` SHA passes both Build 14 proof and the canonical System Gate including Development D1/data proof, exact Preview deployment, binding proof and smoke acceptance.
