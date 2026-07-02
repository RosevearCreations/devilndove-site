# Devil n Dove AI Handoff — Build 201

Read this file first in a new chat, then `PROJECT_STATUS_AND_ROADMAP.md`, then `MARKDOWN_INDEX.md`. Those two top-level files are the only canonical cross-project planning direction. The CAIP folder is the authoritative subsystem specification for Creative Asset Intelligence Platform design and implementation details.

## Current release in one sentence

Build 201 creates the **Creative Asset Intelligence Platform (CAIP)** as a governed, reference-only bridge between Content Automation Studio and later release/rendering work: it inventories source assets, records rights and evidence, explains recommendations, builds a reviewable story spine, and exports a manifest—without copying, deleting, reordering, publishing, or claiming anything about original media.

## What works now

- Build 199 creates one source-linked Content Automation Studio package when a finished product becomes Approved or Published.
- Build 200 creates review-first Workshop Journal and website-gallery drafts from reviewed Content Studio deliverables.
- Build 201 creates one CAIP creative project per Content Studio package and synchronizes it automatically during product approval, Content Studio create/refresh, and source-media review.
- CAIP keeps a canonical reference record for each `content_project_media` source. It stores source IDs, URLs, fingerprints, logical archive paths, roles, review notes, and derived metadata only; it does not own the actual file.
- CAIP preserves the upstream restriction. A source that is not already `public_allowed` cannot be upgraded to public by CAIP. A source marked blocked stays blocked.
- CAIP uses transparent local metadata scoring only in Build 201. The system shows technical/story/reuse/confidence components and reasons; no vision model, transcript service, LLM, renderer, or external AI provider is being presented as active.
- CAIP creates an evidence ledger and editable/lockable story segments. Product/catalog and Content Studio fields remain the source of fact; CAIP never converts a suggestion into a sale, material, condition, consent, availability, price, or transformation claim.
- CAIP prepares review candidates for website hero/gallery, YouTube thumbnail, and short-video roles, then exports a human-readable JSON manifest for later approved adapters.
- The phone- and desktop-safe CAIP workspace is at `/admin/creative-assets/`.

## Build 201 routes and files

- `GET/POST /api/admin/creative-assets`
- `/admin/creative-assets/`
- `functions/api/_lib/creativeAssetIntelligence.js`
- `functions/api/admin/creative-assets.js`
- `public/js/admin-creative-assets.js`
- `database_build201_creative_asset_intelligence_platform.sql`
- `docs/creative-asset-intelligence-platform/README.md` and `00_...` through `12_...`

## Deployment order

1. Back up D1.
2. Confirm Build 199 and Build 200 appear in `schema_migration_ledger`.
3. Run `database_build201_creative_asset_intelligence_platform.sql`. It is additive and safe to rerun.
4. Deploy the complete Pages bundle, including `/functions`, `/admin/creative-assets/`, `/public/js/admin-creative-assets.js`, CSS, service worker, documentation, and schema references.
5. Use `POST_DEPLOY_SMOKE_TEST.md` on the deployed domain before treating CAIP as live.

## Non-negotiable operating rules

- **Reference, never duplicate or mutate source media.** CAIP must never move, delete, overwrite, reorder, feature, or publish objects from `product_images`, `media_assets`, `content_project_media`, R2, or a product gallery.
- **Source consent and release status remain authoritative.** CAIP may preserve or tighten a restriction; it cannot create public rights or public publishability.
- **Evidence before prose.** Public wording must be traceable to a source record, a selected reviewed asset, or an explicit human confirmation. Metadata scores and future model outputs are review aids, never factual proof.
- **No automatic publishing.** Internal CAIP approval is not release approval. Content Release Board and Social Queue controls remain independent human gates.
- **No implied external capability.** Do not call an asset analyzed by AI, a video rendered, a thumbnail generated, a platform connected, or a post published without an actual verified provider action.
- **Keep CAIP failure isolated.** A CAIP sync warning must not undo an approved product or an already-created Content Studio package; record the warning and refresh CAIP deliberately.
- **Search/structured-data truthfulness remains mandatory.** Visible page copy, real image/video URLs, title/meta, schema, and public claims must agree.

## Current limits / honest state

- Build 201 has no external AI vision, transcription, speech-to-text, image generation, transcription, rendering, thumbnail, proxy, or derivative creation provider.
- It has no signed R2 URLs, private-media transfer worker, retention process, legal hold, object lifecycle job, or source-file hash verification. Those are planned controls, not active claims.
- It has no direct YouTube/Facebook/Instagram/TikTok/Google Business Profile OAuth or publishing integration.
- No CAIP candidate is automatically accessible, indexable, public-cleared, or a valid accessibility description simply because it has a score.
- Existing live requirements remain: D1/R2/Pages deployment proof, source-media integrity, mobile real-device checks, consent validation, Stripe/email/webhook checks, accessibility review, Search Console/GBP verification, and observable logs/errors.

## Strongest next work after Build 201

1. Deploy Build 201 and prove one real approved product through Product → Content Studio → CAIP → Release Board without changing a single source media row/object.
2. Add bounded technical media probe jobs (dimensions, duration, orientation, codec) and an immutable derivative recipe model before generating thumbnails/proxies.
3. Add a secure R2 access adapter with signed review links, expiry, CORS rules, access audit, lifecycle/review states, and human delete gate.
4. Add an opt-in external intelligence job layer only with versioned prompts/models, evidence capture, privacy controls, cost caps, retry/reconciliation, and mandatory human-review status.
5. Add a renderer/export adapter with signed input manifest, output verification, disclosure/template controls, manual fallback, then only later add per-platform OAuth preview-and-confirm publishing.
