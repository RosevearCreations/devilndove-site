# 14 — Catalog Media / CAIP Context Bridge (Build 206)

## Purpose

Build 206 connects the focused catalog-media workspace to CAIP without changing source records or creating new public content. A product selected at:

```text
/admin/catalog-media/?product_id=<id>#product-media-workflow
```

is visible as a persistent reference card and can open:

```text
/admin/creative-assets/?product_id=<id>
```

## Contract

- Catalog Media resolves product context through the authenticated product-detail API.
- CAIP receives an optional `product_id` query parameter.
- If an existing CAIP project is linked to that product, CAIP opens it.
- If no CAIP project exists, CAIP says so clearly. It does not infer, create, or publish a project without the existing review-led flow.
- The bridge reads product/media context only. It does not copy, feature, reorder, modify, delete, render, inspect image bytes, publish, or elevate source-media rights.

## Featured-media resolution contract

The Product Editor’s display-only resolution order is:

1. `products.featured_image_url`
2. ordered `product_images.image_url`
3. non-deleted linked `media_assets.public_url`

The resolved source is shown to the operator. A normal intentional Product Editor save can write the resolved URL to `products.featured_image_url`; it never deletes the source gallery/media row.

## Acceptance checks

- Product ID search finds a product by row ID, name, SKU, slug, or product number.
- A valid media-library-only image loads into the Featured image URL field with a source label.
- Catalog Media context card matches the URL’s product ID.
- Image, annotation, score, listing facts, story, and SEO panels receive the same selected product ID.
- CAIP selects an existing linked project only; it stays blank/explicitly absent when no project exists.
- No R2 object, `product_images` row, `media_assets` row, CAIP source record, or public release changes from simply opening the bridge.


## Build 208 release-preflight handoff

Catalog Media is the owner screen for selecting/reviewing source product media. After the product, media, Content Studio, and CAIP records exist, an operator can open:

```text
/admin/release-preflight/?product_id=<id>
```

The preflight is read-only and reports whether the records are ready to pass to the Release Board or ready for a human publication decision. See `15_Product_Release_Preflight.md`.
