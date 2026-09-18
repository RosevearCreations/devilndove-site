# Release 467 — Build 182 Product Facts & Buyer Readiness

## Purpose

Build 181 established a live-D1 health view spanning Products, Product images, Product-resource links, Inventory, Tools/Supplies and catalog image-reference drift. Build 182 now improves the **Product facts that a buyer depends on** without making the Product Browser heavier and without merging image, Inventory or Tool/Supply mutation authority into the Product Editor.

## Product Editor buyer-readiness layer

The dedicated `/admin/product-editor/` now includes a **Buyer Readiness** tab.

The tab:

- reads only the Product facts already loaded into the existing form;
- performs **zero additional D1 reads**;
- performs no R2 request;
- performs no automatic save;
- performs no QA run;
- evaluates the current unsaved draft as the operator edits it;
- provides direct Fix buttons to the owning Product Editor tab and field.

This means an operator can improve buyer-facing completeness before saving without waking media, Inventory, readiness, provider or publication systems.

## Buyer-facing Product facts checked

Build 182 reviews:

### Identity and classification

- Product name;
- public slug;
- SKU attention;
- Product category;
- physical vs digital Product type.

### Buyer descriptions

- short description: at least 40 useful characters;
- long description: at least 120 useful characters.

These are guidance thresholds, not claims that length alone makes copy good.

### Pricing and delivery

- positive selling price;
- currency;
- compare-at price consistency;
- physical shipping weight when shipping is enabled;
- shipping code when shipping is enabled;
- digital-file URL for digital Products;
- digital Products that still have physical shipping enabled.

### Origin, condition and external-sale facts

- merchandise origin;
- condition summary for vintage, collectible, antique, oddity and pre-built/found Products;
- era/period attention for vintage and antique Products;
- external listing URL for hybrid and external-only sale channels.

### Stock and release state

- tracked finished stock at zero;
- active Products whose review status is not approved/published.

## Catalog Health buyer-readiness queue

`/admin/catalog-health/` now contains an explicit **Load 40 buyer-readiness issues** action.

The new read-only endpoint is:

`GET /api/admin/product-buyer-readiness`

Runtime contract:

- one bounded Product-table read;
- maximum source rows: 240;
- maximum returned issue Products: 40;
- no automatic startup request;
- no background retry;
- no Product mutation;
- no image/R2 lookup;
- no Inventory or Tool/Supply scan;
- no provider/publication execution.

The endpoint returns summary counts plus Product-specific issue records with direct Product Editor repair targets.

## Relationship to other authorities

Build 182 deliberately does **not** decide every aspect of release readiness.

Separate authorities remain responsible for:

- Product images, roles, crop, quality and alt text -> Product Media & Image Editor;
- Tool/Supply inventory, cost, lifecycle, counts and usage -> Inventory Operations;
- Product-to-Tool/Supply linkage -> Product resource workflows / later Build 185;
- static website imagery -> Media & Content Studio;
- SEO/public search proof -> later Build 186 and existing SEO tooling;
- packaging/labels -> Packaging Studio;
- publication/provider execution -> existing governed release lanes.

## D1 acceptance

D1 is fully functional and Build 182 uses it deliberately.

The Build 182 workflow performs a read-only Development D1 probe against exact `devilndove-dev`, proving that the Product fields used by buyer readiness can be read from the live Development authority.

No Development data is copied wholesale to Production. Production business data remains Production-owned.

## Safety boundary

Build 182 is code-only. It introduces:

- no canonical schema migration;
- no request-time DDL;
- no automatic Product save;
- no stock/count mutation;
- no Inventory/Tool/Supply mutation;
- no Product image mutation;
- no R2 mutation;
- no provider/social publication execution;
- no payment/refund action;
- no accounting posting.

## Acceptance

Build 182 is GREEN only when:

1. the Build 182 source gate is GREEN;
2. the exact Development D1 buyer-fact read proof is GREEN;
3. retained Build 181, 180, 179 and Product low-read gates remain GREEN;
4. exact-SHA Development System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene are GREEN;
5. the same SHA is promoted non-force to `main`;
6. Production Pages, Live Resource Integrity, Product Production Browser, Product Route Production and Build 182 are GREEN on that exact SHA.

## Next planned build

**Build 183 — Inventory & Tool/Supply Identity Cleanup** will use the Build 181 health evidence to normalize duplicate identities, source/supplier facts, usage modes, count/reorder context and catalog-reference drift through explicit reviewed actions.
