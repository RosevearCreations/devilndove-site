# Devil n Dove AI Handoff — Build 200

Read this file first in a new chat, then `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md`. They are the only canonical direction set. Specialist runbooks remain only to preserve implementation evidence and do not override this file.

## Current release in one sentence

Build 200 closes the next safe gap after content planning: an approved finished-product content package can now create **review-first Workshop Journal and website-gallery drafts**, pass factual/public-media/source-approval checks, and be manually approved, published, unpublished, or measured without ever moving or deleting original media.

## What works now

- Build 199 automatically creates one source-linked Content Automation Studio package when a finished product becomes Approved/Published. It keeps images/videos in their original `product_images`, `media_assets`, and R2 locations.
- Build 200 adds `/admin/content-publications/`, the **Content Release Board**.
- One Content Studio package can prepare two public drafts: one Workshop Journal article and one website-gallery feature.
- A public release requires all of the following: approved source deliverable, visible factual title/summary/body, at least one selected `public_allowed` media reference, lead image + descriptive alt text, stable slug, and prepared title/description fields.
- Publication copy can be explicitly locked so a later Content Studio source refresh does not overwrite edited public copy.
- Publishing is an explicit separate button; unpublish is available immediately and does not delete the source package or media.
- `/api/workshop-journal` exposes **published items only** with a cache-safe public fallback. The Workshop Journal and Gallery progressively show released items after the Build 200 migration.
- A Workshop Journal story page exists at `/workshop-journal/story/?story=<slug>` and safely renders published copy and Article/ImageGallery JSON-LD that matches visible content.
- Manual views/clicks/saves/enquiries can be recorded with a source note. This is not a fabricated analytics connection and must not be treated as sales attribution.

## Build 200 routes and files

- `GET/POST /api/admin/content-publications`
- `GET /api/workshop-journal`
- `/admin/content-publications/`
- `/workshop-journal/story/?story=<slug>`
- `functions/api/_lib/contentPublications.js`
- `functions/api/admin/content-publications.js`
- `functions/api/workshop-journal.js`
- `public/js/admin-content-publications.js`
- `public/js/workshop-journal-publications.js`
- `public/js/published-gallery-features.js`
- `public/js/workshop-journal-story.js`
- `database_build200_content_publication_release_board.sql`

## Deployment order

1. Back up D1.
2. Confirm production has Build 199 in `schema_migration_ledger`.
3. Run `database_build200_content_publication_release_board.sql` once; it is additive and safe to rerun.
4. Deploy the full Pages bundle, including `/functions`, new public scripts, and static admin/public pages.
5. Use `POST_DEPLOY_SMOKE_TEST.md` on the deployed site before calling the release live.

## Non-negotiable operating rules

- **Never auto-publish.** A prepared draft, source package, video handoff, or rendered URL is not permission to release anything publicly.
- **Never infer consent.** Only selected `public_allowed` source media can satisfy public-release readiness. Content Studio labels are review aids, not a replacement for source consent records.
- **Never claim a render exists when it does not.** Build 200 still does not encode MP4 videos or upload to YouTube, Meta, TikTok, or Google Business Profile.
- **Never let content publishing alter product media.** Featured product image, source gallery order, `product_images`, `media_assets`, and R2 source objects stay separate from public-release records.
- **Never make claims absent from the visible page and source record.** Product name, materials, price/availability, image, title/meta, structured data, copy, and captions must agree.
- **Do not call manual metrics automated performance data.** Record the source and date; do not turn views or clicks into claimed revenue without evidence.

## Current limits / honest state

- Build 200 publishes website content through the Devil n Dove public API and journal/gallery UI only. It does not have a persistent server-rendered per-article path or automatic sitemap submission; after live publication, inspect actual rendered content and add only truthful URLs to the sitemap process when appropriate.
- Dynamic Workshop Journal story copy is generated client-side from published D1 records. It is intentionally review-first; evaluate Search Console indexing before relying on it as the primary long-term article delivery path.
- The existing video renderer remains `manual_export`; actual render provider adapter, signed source transfer, output verification, retry/recovery, and quota/cost guardrails remain future work.
- OAuth-backed YouTube/Facebook/Instagram/TikTok/Google Business Profile posting remains separate and must retain preview, permissions, consent, rate-limit, and owner approval gates.
- Existing live concerns remain: D1/R2/Pages environment validation, real device testing, Stripe/email/webhook testing, stock/cost evidence, Search Console, Merchant Center/GBP verification, and real accessibility checks.

## Strongest next work after Build 200

1. Deploy Build 200 and prove one real product → content package → public draft → approval → published Workshop Journal card → unpublish loop without media loss.
2. Build a renderer-provider adapter around `content_render_jobs` with manual-export fallback, signed job payloads, output verification, budget/timeout limits, and error recovery.
3. Add a server-rendered or pre-generated public story delivery/sitemap path once real publication volume exists; do not create thin/duplicate pages.
4. Connect actual platform publishing only after each OAuth provider/account is configured and preview/error/permissions evidence is captured.
5. Add only consented, future detailing-job source adapters with client-visible/detailer-only media and privacy controls.
