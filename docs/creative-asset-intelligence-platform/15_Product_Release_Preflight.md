# 15 — Product Release Preflight (Build 208)

## Purpose

Build 208 adds a **read-only decision screen** that combines product, media, Content Studio, CAIP, and Content Release Board records before an operator chooses to advance a release.

```text
/admin/release-preflight/?product_id=<id>&destination=both
```

It answers two deliberately separate questions:

1. **Ready to pass to Release Board?** Product, source media, Content Studio, and CAIP prerequisites are present.
2. **Ready to publish the chosen destination?** The corresponding Release Board draft, checklist, and approval are also present.

A passing result is not a publish action and is not proof that a third-party platform rendered, indexed, accepted, or displayed the result.

## Read-only contract

Opening or refreshing preflight:

- reads existing D1 records only;
- does not create or update a product, image, content package, CAIP project, source record, consent record, derivative, public draft, or platform post;
- does not call a renderer, AI provider, R2 mutation, marketplace, Google, Meta, Etsy, Shopify, or social platform;
- does not infer consent, copyright, factual claims, approval, SEO performance, or publishing success.

The screen only points an operator to the owning workflow for a missing or failed check.

## Stages

| Stage | Source of truth | Preflight verifies | It does not do |
|---|---|---|---|
| Catalog facts | `products`, `product_seo` | approval, active state, title, slug, price, category, short description, SEO fields | edit catalog data |
| Product media | `product_images`, annotations, consent records, `media_assets` | featured URL, media candidate, roles, available alt text, explicit review signals | create rights or alter a source image |
| Content Studio | `content_projects`, package media, deliverables | package/link, package approval, selected public-cleared source, approved deliverable(s) for the selected destination | publish a story or gallery |
| CAIP | `creative_projects`, assets, evidence, segments | governance status, inherited public-use asset, evidence, reviewed story signals | create consent, a derivative, or public copy |
| Release Board | `content_publications` | destination draft, release checklist, reviewed status | publish the draft |

## Feature-image sync boundary

The companion endpoint:

```text
POST /api/admin/product-featured-image-sync
```

is an explicit administrator action, not part of a preflight refresh. It can copy one known existing `product_images.image_url` or non-deleted `media_assets.public_url` value into `products.featured_image_url` and writes an audit record where supported.

It does **not**:

- create, delete, re-order, transform, render, crop, or move media;
- change media roles, annotations, consent, CAIP assets, facts, Content Studio state, or publication state;
- make a media row public or publish a product.

## Acceptance checks

1. An unauthenticated request receives `401`.
2. A valid admin request with `product_id` returns only existing records and does not change row counts.
3. A Draft/Inactive product cannot pass the catalog stage.
4. A product with no lead-media candidate cannot pass the media stage.
5. A Content Studio package with unapproved/blocked source material remains a blocker or warning as shown; nothing is promoted.
6. A CAIP project without approved governance/evidence remains a blocker.
7. A Release Board draft must separately exist and pass its own readiness and approval conditions for the selected destination.
8. Featured-image sync changes only `products.featured_image_url` when the operator confirms a known retained URL.
9. Opening preflight never changes source media, consent, role, product review, CAIP governance, publication status, or provider configuration.

## Operational handoff

Start with `../../AI_HANDOFF.md` and `../../PROJECT_STATUS_AND_ROADMAP.md`. Use this document only for the release-preflight boundary and acceptance rules.
