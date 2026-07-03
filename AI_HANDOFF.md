# Devil n Dove AI Handoff — Build 202

Read this file first, then `PROJECT_STATUS_AND_ROADMAP.md`, then `MARKDOWN_INDEX.md`. Those are the two canonical cross-project planning sources. `docs/creative-asset-intelligence-platform/README.md` and `13_Media_Operations_Secure_Review.md` are the authoritative CAIP subsystem specification.

## Current release in one sentence

Build 202 extends CAIP from a reference-only intelligence record into a governed media-operations foundation: it can inspect existing catalog/bound-R2 object metadata, create immutable derivative plans, and issue short-lived administrator-bound review links—without copying, deleting, transforming, publishing, or granting rights to source media.

## What works now

- Build 199 creates a review-first Content Studio package for an approved/published finished product, including the 1 YouTube / 3 Facebook / 5 Instagram Reels / 5 TikTok plan, website gallery, GBP, SEO, blog, thumbnail, captions, and review package.
- Build 200 creates review-first Workshop Journal and Gallery releases with public-copy/media/title/meta/slug gates, publish/unpublish controls, and source-media protection.
- Build 201 creates a CAIP project per Content Studio package, canonical source reference rows, inherited rights, explainable metadata scoring, evidence, story segments, candidates, policies, and JSON manifest.
- Build 202 adds technical observations from catalog metadata and bound R2 object headers only; it never fetches arbitrary URLs or reads media bytes for content inference.
- Build 202 adds immutable derivative recipes and planned outputs. Blank output fields and `not_created` status mean exactly that: no derivative exists and no provider was called.
- Build 202 adds four reviewable output briefs: website gallery WebP, vertical social MP4, YouTube thumbnail WebP, and internal review preview WebP.
- Build 202 adds a same-origin secure review proxy. Grants are short-lived, session-bound to the issuing admin, capped, revocable, audited, no-store, and stored as hashes only. They do not make R2 objects public.
- Build 202 includes disabled, non-secret provider and budget-control records. There is no renderer, vision AI, transcription, thumbnail generator, S3 presigner, OAuth publisher, or paid provider active.
- CAIP is at `/admin/creative-assets/`; Content Studio is `/admin/content-studio/`; Release Board is `/admin/content-publications/`.

## Build 202 routes and files

- `GET/POST /api/admin/creative-assets`
- `GET /api/admin/creative-asset-review?token=<opaque>`
- `/admin/creative-assets/`
- `functions/api/_lib/creativeAssetIntelligence.js`
- `functions/api/_lib/creativeAssetOperations.js`
- `functions/api/admin/creative-assets.js`
- `functions/api/admin/creative-asset-review.js`
- `public/js/admin-creative-assets.js`
- `database_build202_caip_media_operations_secure_review.sql`
- `docs/creative-asset-intelligence-platform/13_Media_Operations_Secure_Review.md`

## Deployment order

1. Back up D1.
2. Confirm Builds 199, 200, and 201 appear in `schema_migration_ledger`.
3. Run `database_build202_caip_media_operations_secure_review.sql`. It is additive and rerunnable.
4. Deploy the complete Pages bundle, including functions, CAIP admin UI, CSS, placeholder SVG, service worker/cache updates, documentation, and schema reference.
5. Use `POST_DEPLOY_SMOKE_TEST.md` on the deployed domain before treating Build 202 as live.

## Non-negotiable operating rules

- **Reference, never duplicate/mutate sources.** CAIP cannot move, delete, overwrite, reorder, feature, transform, or publish a `product_images`, `media_assets`, `content_project_media`, R2 source, or product-gallery item.
- **No implicit rights.** A technical probe, high score, derivative plan, internal approval, or secure review grant does not create consent/public rights. Upstream source consent/status remains authoritative.
- **Evidence before prose.** No score, metadata value, future vision output, transcript, or render plan is proof of a material, condition, transformation, availability, price, or customer claim.
- **No automatic publishing.** CAIP approval, derivative-plan approval, and secure review remain internal. Release Board and Social Queue stay separate human gates.
- **No implied external capability.** Never say a file was analyzed by AI, rendered, transformed, published, uploaded, or verified unless a real provider run/output record proves it.
- **Secure reviews are internal.** Raw review tokens never enter D1/logs/public files; review URLs are neither public media URLs nor SEO/structured-data values.
- **Source failures stay isolated.** A probe/grant/plan failure must not undo product approval, Content Studio records, source media, or a live publication.
- **Search truth remains mandatory.** Visible page copy, actual image/video URLs, titles/meta, alt text, schema, captions, and public claims must agree.

## Honest current limits

- Technical probes do not decode media or establish duration, codec, frame rate, sharpness, content, duplicate-frame, or rights truth unless already present in source metadata.
- No derivative is generated in Build 202. No output R2 key, URL, checksum, thumbnail, video, or visual AI result exists until a later provider writes and verifies it.
- The secure review proxy requires a bound R2 key and the issuing administrator’s authenticated session; catalog-only/public-URL assets cannot be proxy-served by Build 202.
- No S3 presigned R2 direct-link service is configured; Build 202 intentionally uses a same-origin proxy.
- No OAuth or direct publish integration exists for YouTube, Facebook, Instagram, TikTok, or Google Business Profile.
- Existing production work remains: D1/R2/Pages proof, source-media integrity, mobile real-device checks, consent validation, Stripe/email/webhook tests, accessibility, Search Console/GBP evidence, and observable runtime errors.

## Strongest next work after Build 202

1. Deploy Build 202 and prove a real finished product through Content Studio → CAIP probe → derivative plan → secure review → revoke with no source-media changes.
2. Add durable source checksum verification through a bounded worker design with full R2 operation/cost logging.
3. Add actual technical extraction (duration/codec/dimensions) only with a versioned, consent-aware, cost-capped provider/worker and evidence capture.
4. Add a true derivative worker with isolated output namespace, input/output checksums, before/after review, accessible output verification, and manual fallback.
5. Add renderer/export integration, signed manifest, template/disclosure policy, budget controls, retries/reconciliation, and only later OAuth preview-and-confirm publishing.


Build 205 auth correction: the Build 204 D1-console repair used PRAGMA foreign_keys = OFF, which D1 does not permit within its implicit transaction. Replace it with database_auth_legacy_to_current_repair_d1_console.sql and execute its numbered blocks separately. Login errors now render the safe Function detail and classify session create/read failures.
