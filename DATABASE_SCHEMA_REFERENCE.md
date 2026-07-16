# Build 216 additions
- `creative_project_inventory_posts`: one idempotent inventory posting per approved material review.
- `creative_project_caip_mirrors`: tracks Creative Project evidence mirrored into CAIP.
- `creative_project_cost_templates`: reusable labour, packaging, overhead, fee and shipping assumptions.

# Build 208 schema note

Build 208 does not require a D1 migration. `/api/admin/product-release-preflight` is read-only and detects absent optional Content Studio, CAIP, and Content Release Board tables rather than creating them. `/api/admin/product-featured-image-sync` updates only `products.featured_image_url` after an explicit administrator request and an existing retained `product_images`/`media_assets` candidate match. It does not change source-media rows, annotations, consent, Content Studio, CAIP, or publication state.

---

# Build 206 schema note

Build 206 does not require D1 migration. Catalog APIs normalize a tax class stored as a fraction (`0.13`) or a historic whole percentage (`13`) into `tax_rate` (fraction) and `rate_percent` (display). Product-detail reads existing `products.featured_image_url`, `product_images`, and non-deleted `media_assets` safely; it does not create, delete, or change media rows on read.

---

# Database Schema Reference — Build 202

Use `database_full_schema.sql` for a fresh database. Use numbered migrations in order for an existing production database. The current migrations are:

```text
database_build201_creative_asset_intelligence_platform.sql
database_build202_caip_media_operations_secure_review.sql
```

Apply Build 201 after Builds 199 and 200, then apply Build 202. Both are additive and safe to rerun. Build 202 does not convert, move, copy, publish, or delete source media. It creates reference/control records only; it does not copy, move, delete, overwrite, reorder, feature, or publish product/R2/media records.

## Build 199 Content Automation Studio

- `content_projects` — one review-first content package per source (`product` now; future detailing jobs may use another source type).
- `content_project_media` — source-linked archive rows, selection score, reviewer safety state, and product/media references. No source media is deleted or relocated.
- `content_project_deliverables` — exact output plans, copy, scripts, output URLs, review states, and Social Queue link.
- `content_render_jobs` — provider-neutral rendering/export handoffs. Build 201 still uses manual export, not MP4 encoding.
- `content_project_events` — package audit activity.

## Build 200 Content Release Board

- `content_publications` — one public draft per content-project destination (`workshop_journal` or `website_gallery`), including copy, public media references, search title/description, safe path, release status, copy lock, and explainable manual metrics.
- `content_publication_events` — audit records for prepare, refresh, update, approve, publish, unpublish, and metric snapshot actions.

## Build 201 Creative Asset Intelligence Platform

- `creative_projects` — canonical CAIP project identity linked one-to-one to a `content_projects` package/source/product. Includes lifecycle/governance status, policy snapshot, and internal approval record.
- `creative_assets` — reference-only canonical asset records. Stores source IDs/URLs/fingerprint/logical archive path, inherited safety, local CAIP rights status, source role/selection/feature state, tags, notes, and source metadata.
- `creative_asset_analyses` — versioned deterministic metadata analysis/results: technical, story, reuse, total/confidence scores, reasons/evidence, and human-review requirement.
- `creative_asset_recommendations` — destination-role candidate records for website hero/gallery, YouTube thumbnail, and short-video use. They remain review candidates only.
- `creative_story_evidence` — source references and claim/fact records with verification/review/visibility/lock state.
- `creative_story_segments` — ordered editable/lockable story spine sections linked to evidence keys.
- `creative_policy_decisions` — source-integrity, rights, story provenance, and public-search readiness decision signals.
- `creative_intelligence_runs` — auditable sync/intelligence run records; Build 201 uses local metadata only.
- `creative_project_events` — immutable-style activity/event trail.

### Critical integrity boundary

`creative_assets` is **not** a media-file table. It is a reference/control layer. A source is never deleted when a CAIP asset is updated, a project is refreshed, an analysis is rerun, a recommendation is rejected, a story is edited, or a CAIP project is unapproved.

The established product-media integrity rules remain: ordinary product saves preserve media; only explicit media deletion can remove a product-image row; R2 source deletion remains a separate explicit asset-library action.

## Build 202 — CAIP media operations and secure review

- `creative_asset_probe_jobs` — bounded record of metadata/R2-head probe intent, status, retry ceiling, sanitized input/output evidence, and source fingerprint.
- `creative_asset_technical_observations` — latest recorded technical observation for a CAIP asset/probe version; no media-body/visual inference implied.
- `creative_derivative_recipes` — immutable source-specific future-output specification, including dimensions, aspect ratio, format, policy snapshot, and recipe hash.
- `creative_asset_derivatives` — planned/future verified output lineage. In Build 202, output object/URL/checksum are intentionally empty and `verification_status` is `not_created`.
- `creative_asset_access_grants` — SHA-256 hash-only short-lived authenticated review grants, expiry, view cap, user binding, and revocation state. Raw review tokens are never stored.
- `creative_asset_access_audit` — secure-review grant events/outcomes without raw token or credential data.
- `creative_provider_profiles` — disabled non-secret provider/capability registry. A row is not an active integration.
- `creative_execution_budget_controls` — disabled CAD per-project/per-capability budget policy records for future provider work.

The Build 202 schema is additive. It does not change the source-media ownership of `product_images`, `media_assets`, `content_project_media`, or R2 objects.

> Build 207 note: no D1 migration is required. The product-content bridge uses existing additive Content Studio/CAIP schema routines only after an administrator explicitly invokes a package action.

## Build 208 release-preflight schema boundary

Build 208 adds **no mandatory D1 migration**. `/api/admin/product-release-preflight` detects and reads available existing catalog, media, Content Studio, CAIP, and Release Board tables. `/api/admin/product-featured-image-sync` updates only `products.featured_image_url` after an explicit admin request using an already retained product/media URL.


## Build 210 — Product social draft automation

`product_social_automation_settings` is a singleton configuration table (`settings_id=1`) for optional **review-first** product social drafts.

- Defaults to `auto_queue_enabled = 0`.
- Controls the eligible review status, active/image prerequisites, default destinations, hashtag set, caption-template key, and UTM campaign.
- It does not contain platform credentials.
- Product-triggered queue rows use `source_type='product'` and `source_id=<product_id>`.
- New rows must start as `approval_status='needs_review'`, `post_status='draft'`, `privacy_status='needs_review'`, and `approved_for_public_post=0`.

Platform tokens, client secrets, OAuth codes, Page tokens, and refresh tokens remain Cloudflare encrypted Secrets, not D1 schema data.

## Build 214 optional project/product relationship
`creative_project_product_links` connects a Creative Project to zero, one, or many products. The relationship is optional in both directions and does not replace `products` or require legacy/direct products to be migrated.
