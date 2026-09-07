# Release 467 Build 68 — Catalog Options Authority

## Proven predecessor

Build 68 starts only after Release 467 Build 67 — Product Editor Recovery & Autosave was fully green and promoted.

- Development `dev`: `8c4e8aa7e73c68fb82f7531503d40ddcd30fc503`
- Production `main`: `8c4e8aa7e73c68fb82f7531503d40ddcd30fc503`
- Build 67 tree: `f1c5da73c2f76068437f16a40c9c5ae95b8976bd`
- System Gate `34148679189`: SUCCESS
- Current Application Quality Proof `34148679114`: SUCCESS
- I.T. Admin Runtime Proof `34148679110`: SUCCESS
- Repository Branch Hygiene `34148679124`: SUCCESS
- Production Pages Deploy `34148808131`: SUCCESS
- Production Live Resource Integrity Proof `34148861990`: SUCCESS

Canonical D1 migration authority remains `0001` through `0004`.

## Purpose

Build 68 makes Product dropdown data one explicit authority instead of a mixture of hard-coded browser lists, Product-table `DISTINCT` scans, app settings, tax-table reads, and mobile-bootstrap-specific logic.

The authority covers:

- Category
- Colour
- Shipping Code
- Product Type
- Product Status
- Product Review Status
- Merchandise Origin
- Sale Channel
- Tax Class

## Authority model

`functions/api/admin/_catalog-option-authority.js` is the shared server authority.

It returns:

- `authority_version = R467B68_V1`
- one normalized `option_sets` object
- normalized tax classes
- cache state
- a declared D1 read contract

Editable business lists remain stored in existing `app_settings` keys:

- `site.catalog.product_category_options`
- `site.catalog.color_options`
- `site.catalog.shipping_code_options`

Product Type and lifecycle/state values are system-governed because application behavior depends on their semantics. They are therefore centralized and validated, not made free-form.

Tax Classes remain owned by the existing `tax_classes` table and are returned through the same authority response.

## D1 read-budget contract

A cold authority refresh performs at most:

1. one batched `app_settings` read for all editable option sets;
2. one Tax Class read.

Normal authority loading performs:

- zero Product-table scans;
- zero `SELECT DISTINCT` Product reads;
- zero `PRAGMA` reads;
- zero exact Product counts.

A five-minute in-Worker fresh cache and one-hour stale window protect repeated editor/bootstrap requests. Explicit option or Tax Class writes invalidate the cache before the next response is generated.

This makes Product editor dropdown startup independent of Product catalog size.

## Product editor behavior

`public/js/admin-catalog-option-manager.js` now consumes the shared authority and applies it to the Product editor.

It keeps Category, Colour, Shipping Code, Product Type, Status, Review Status, Merchandise Origin, Sale Channel, and Tax Class controls aligned with the same source.

When an existing Product contains a historical value no longer present in the managed list, the editor temporarily preserves that current value instead of silently blanking it. This preserves correction safety without restoring Product-table scans as an option authority.

Tax Classes already used by historical Products remain visible even when inactive.

## Mobile and desktop convergence

`functions/api/admin/product-mobile-bootstrap.js` now obtains Product dropdowns and Tax Classes from the shared catalog authority.

The desktop Product editor, mobile Product capture bootstrap, cold-start recovery, and catalog option manager therefore no longer own independent tax/category/colour/shipping authorities.

Mobile resource expansion remains separate and opt-in. Build 68 does not broaden Inventory reads.

## Validation and mutation boundaries

Build 68 validates:

- editable option set names;
- non-empty saved option lists;
- normalized option lengths/counts;
- Tax Class code format;
- Tax Class name length;
- Tax Class rate range.

Build 68 adds no D1 schema migration, request-time schema DDL, R2 mutation, Product business-data rewrite, payment execution, social publication, OAuth execution, or provider-side mutation.

Normal Product and Tax Class writes remain explicit administrator actions under their existing audited APIs.

## Acceptance contract

Build 68 is complete when all of the following are true:

1. `_catalog-option-authority.js` is the shared cached authority.
2. Category, Colour, and Shipping Code use one batched app-settings read.
3. Product Type and related lifecycle dropdown values come from the same authority.
4. Tax Class values come from the same authority response.
5. Product dropdown loading performs no Product-table `DISTINCT` scans.
6. Product option authority performs no `PRAGMA` reads.
7. Existing historical Product values remain representable in the editor.
8. Option/Tax writes invalidate authority cache.
9. Mobile Product bootstrap consumes the authority instead of maintaining its own tax-option loader.
10. Canonical D1 migrations remain `0001`–`0004`.
11. All four exact Development proofs are green before any Production promotion.

## Next build

After Build 68 is exact-green, the next planned item is **Release 467 Build 69 — Product CRUD & Duplicate Safety**.
