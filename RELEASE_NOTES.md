# Release Notes — Build 231

## Product draft autosave and reload resource-limit recovery

- Added one shared API response parser that accepts valid JSON and turns Cloudflare HTML/1102 pages into a short retryable message without exposing raw markup or a `JSON.parse` exception.
- Changed Draft autosave to one request in flight with a queued-newer-edit pass, a 2.2-second debounce and a visible browser recovery copy that is cleared only after the matching server save.
- Added explicit `save_intent=autosave`; create/update routes skip approval/content/social preparation and repetitive update/media audit work for that intent while deliberate saves keep their normal automation/audit path.
- Moved unapproved products out of social automation before schema/settings inspection and stopped text-only autosaves from rewriting unchanged image rows.
- Replaced request-time schema introspection in `/api/admin/product-detail` with five bounded database calls including authentication, independent optional reads and a seven-image compact JSON response.
- Added a structured 96 KiB product payload guard, paused autosave while a stored product is programmatically loaded and refreshed narrow-screen error/recovery layout.
- Expanded the Startup runtime gate and Cloudflare checklist with exact product load, queued autosave, reload, offline recovery, `exceededCpu` and `exceededMemory` tests.
- Preserved Build 230 as the current D1 migration boundary; Build 231 adds no schema change.

Deploy the complete package, hard refresh to service-worker shell v12, and follow `BUILD231_VALIDATION.md`. If `build230_visual_image_manifest` is already recorded, do not reapply a migration for Build 231.

# Release Notes — Build 230

## Visual Image Manifest and honest editorial enrichment

- Added `/admin/image-manifest/` with 20 D1-backed image requirements, visual filters/previews, owner, rights, public-use, final URL, alternative text, phone/desktop review and append-only history.
- Added approval validation, admin audit/runtime incidents and a complete read-only Unsynced browser fallback so service failure cannot appear empty or approved.
- Generated three intentional editorial illustrations and responsive derivatives for homepage discovery, general jewelry techniques and gift-card decoration; all six WebPs include intrinsic dimensions and remain below 270 KB.
- Preserved generated prompts, dimensions, hashes, intended use and prohibitions in `GENERATED_VISUAL_ASSET_REGISTER.md` and D1. Generated art never satisfies real-product/process/condition proof.
- Updated the Critical Startup image gate with 12 step-by-step test/correction instructions and regenerated all 43 gates without removing prior keys.
- Synchronized the D1-safe Build 230 migration to all aggregate schemas/current-pass SQL and retired the older synchronizer.
- Refreshed one-H1, mobile/desktop CSS, image SEO, Markdown consolidation, current handoff, schema, smoke, sanity and next-step guidance.

Back up D1 and confirm Build 229. Apply `database_build230_visual_image_manifest.sql` or identical `database_upgrade_current_pass.sql`, not both. Deploy the complete package and follow `BUILD230_VALIDATION.md`.

# Release Notes — Build 229

## Adopted packaging sources and explicit missing-image blocker

- Preserved and registered the supplied soap-label automation specification, guide PDF and master SVG with repository paths, SHA-256 values, dimensional summaries and active/adopted state.
- Added Packaging Studio source cards and `PACKAGING_REFERENCE_BASELINE.md` so future work must reconcile all three directions rather than relying on an unlabeled copy.
- Kept the source SVG unchanged and documented that it renders a 25 mm rear seal while the specification/PDF request 50 mm on a 38.1 mm-high artboard; a 100%-scale physical proof must select an approved profile.
- Preserved all 42 Startup gates and added `missing_launch_images` as a distinct Critical gate, for exactly 43.
- Made `IMAGES_REQUIRED.md` the detailed missing/broken/fallback/placeholder/right-clearance evidence manifest and added phone/desktop, structured-data and social-preview checks.
- Regenerated the complete Startup guide and degraded browser fallback; HTML, empty or incomplete API responses still show all gates rather than an empty-filter message.
- Synchronized the D1-safe Build 229 migration to all aggregate schemas/current-pass SQL and added Release Sanity plus deployment-preflight checks for the three-source authority and exact gate count.
- Refreshed canonical handoff, status, schema, release, image, mobile/CSS, SEO/H1 and prelaunch documentation.

Back up D1 and confirm Build 228. Apply `database_build229_packaging_reference_authority.sql` or identical `database_upgrade_current_pass.sql`, not both. Deploy the complete package and follow `BUILD229_VALIDATION.md`.

# Release Notes — Build 228

## Master creative workflow and separate prelaunch stages

- Added a seven-stage Creative Automation Studio while preserving Creative Process, CAIP, Content Studio, Social Publishing and Content Release Board specialist features/authorities.
- Added D1 master workflow, stage-review and append-only event tables; mutable status/evidence stays in D1 rather than duplicated JSON.
- Added a Prelaunch Operations Map and detailed separate Product Preflight, Deployment Preflight, Safe Deploy, Smoke, Deploy Readiness, Go-Live and Live Ops playbooks.
- Preserved 37 Startup gates and added five standalone process gates for exactly 42; regenerated detailed correction/evidence/retest instructions.
- Added regression coverage for HTML/incomplete readiness responses and the full 42-gate honest fallback.
- Added responsive master/prelaunch layouts, direct specialist fallbacks, runtime incident handling and two internal planning SVG placeholders.
- Added D1 migration compatibility checks that reject explicit SQL transactions and require numbered/current migrations to match.
- Refreshed the two canonical handoff files, schema reference, SEO direction, smoke guide, image inventory and ordered next steps.

Back up D1 and confirm Build 227. Apply `database_build228_creative_automation_prelaunch_stages.sql` or identical `database_upgrade_current_pass.sql`, not both. Do not add `BEGIN TRANSACTION`/`SAVEPOINT`. Deploy the complete package and follow `BUILD228_VALIDATION.md` plus `PRELAUNCH_PROCESS_PLAYBOOKS.md`.

# Release Notes — Build 227

## Unified business operations

- Unified Soap Label Studio and Packaging Studio into one Labeling & Packaging System.
- Added general label/card/insert templates, generic SVG preview and inventory-linked packaging BOM/cost controls.
- Added sequential immutable invoices, receipts, packing slips, credit notes and refund confirmations with formal void history.
- Added read-only Facebook Page and Instagram professional-account credential tests plus optional Meta token validity/scope/expiry evidence.
- Added preparation, gate-specific correction, evidence and retest guidance to all 37 Startup Readiness gates; All statuses is now the safe initial view.
- Consolidated current project memory into `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.
- Added Build 227 schema, responsive UI rules, planning SVG placeholders, Release Sanity checks and validation.

Back up D1. Apply `database_build227_unified_business_operations.sql` or the identical `database_upgrade_current_pass.sql`, not both, after confirming the Build 225 baseline. Deploy the complete package and follow `BUILD227_VALIDATION.md`.

# Release Notes — Build 226

## Startup Readiness loading repair
- Corrected a malformed newline string that prevented the Build 225 Startup Readiness Pages Function from parsing as an ES module.
- Stopped the browser from accepting empty, malformed, or HTML HTTP 200 responses as a successfully loaded readiness list.
- Preserved all 37 built-in gates in visibly degraded mode whenever the API is unavailable.
- Added honest reset/show-all guidance when active filters have no matches or all gates are closed.
- Added response diagnostics (`expected_total`) and status normalization without overwriting stored evidence.
- Strengthened the final deployment blocker so Pages Functions are parsed as ES modules.
- No D1 schema migration is required; the Build 225 readiness tables and 37 seeded gates remain authoritative.

Deploy the complete Build 226 package and follow `BUILD226_VALIDATION.md`.

# Release Notes — Build 225

## Startup Readiness Cockpit and Packaging Authority
- Replaced the static launch guide interface with a D1-backed status cockpit.
- Added owner, due date, status, severity, evidence, blocked reason, completion, filters, progress, history, local unsynced recovery, and Markdown status export.
- Expanded the launch guide to 37 detailed gates covering every current opening dependency.
- Made `PACKAGING_STUDIO.md` the single packaging source of truth and converted duplicate specification files into compatibility pointers.
- Added direct Packaging Studio interface links to the authoritative specification and packaging launch gates.
- Added `startup_readiness_items` and `startup_readiness_history` to the current and aggregate schemas.
- Build 223–224 product-detail and seven-image gallery fixes remain included.

## Deployment
Back up D1. Apply `database_build225_startup_readiness_packaging_authority.sql` or the identical `database_upgrade_current_pass.sql`, but not both. Deploy the full ZIP and follow `BUILD225_VALIDATION.md`.

# Release Notes — Build 224

## Complete storefront gallery hotfix — Build 224
- Corrected the production condition that could leave a product detail page with only its featured image even though up to seven product images existed.
- Replaced the fragile core gallery join with schema-aware product-image loading plus independent optional media-asset enrichment.
- Added compatibility for legacy `media_assets` tables without `deleted_at`, `variant_role`, or ordering columns.
- Reconciled product-image and annotation records, de-duplicated URLs, and preserved the featured image first.
- Recalculated role groups after explicit media-role assignments.
- Added an `Image X of Y` storefront indicator and complete thumbnail main-image/alt/caption switching.
- Added `image_summary` API diagnostics, `Cache-Control: no-store`, and a Build 224 script cache buster.
- No D1 schema migration is required.

## Product detail runtime hotfix — Build 223
- Corrected the public product-detail API failure `normalizeResults(...).catch is not a function` that occurred whenever the image-annotation table was available.
- Moved the database promise fallback inside `normalizeResults(...)` so image annotations resolve to an empty result safely instead of taking the entire page offline.
- Isolated optional quantity-pricing, set-reservation, gallery-media and resource-story queries so an out-of-sync optional table no longer prevents basic product details from loading.
- Preserved the product featured image when optional gallery tables cannot be read.
- Corrected the browser fallback so valid JSON errors such as HTTP 503 now trigger the public catalog fallback; previously only malformed/non-JSON responses did.
- Added slug to public catalog search and added a complete-catalog retry for older deployed endpoints.
- Added runtime incident capture for any future unhandled public product-detail failure.
- No D1 schema migration is required for Build 223. Deploy the complete package after Build 222 and run `BUILD223_VALIDATION.md`.

## Soap Label Studio and startup readiness
- Added `/admin/packaging/soap-labels/` with a nine-tab exact-size bilingual soap-label editor.
- Rebuilt the ribbon preview to follow the approved Glacial Purple structure.
- Added photo-fit and true-50-mm-seal dimension profiles instead of silently clipping the conflicting specification.
- Added normalized D1 soap templates, products, ingredient rows, claim rows, export evidence and physical print-test records.
- Added purple, green and oatmeal reusable rose SVG assets.
- Added SVG, PNG, WebP, JPG and browser-print preparation with predictable filenames and SHA-256 evidence.
- Added a passed 100%-scale physical print-test requirement before label approval.
- Added browser-local draft recovery for Packaging Studio save failures.
- Added `/admin/startup-readiness/` and `STARTUP_GO_LIVE_GUIDE.md` with 20 ordered launch gates and detailed pass conditions.
- Added direct Admin Dashboard cards for Startup Readiness and Soap Label Studio.
- Updated the soap-label specification, Packaging Studio guide, canonical roadmap/handoff, schema reference, aggregate schemas, current migration and validation documents.

## Build 222 deployment
Apply `database_build222_soap_label_startup_readiness.sql` after Build 221, or the identical `database_upgrade_current_pass.sql`, but not both. Then deploy the complete package and follow `BUILD222_VALIDATION.md`.

---

# Build 221

- Added a visible Draft & Archive Cleanup Centre and corrected product-owned reference classification so unused archived or draft duplicates can be removed after live preflight.
- Streamlined duplicate cleanup so unused recipe/material links no longer force the full correction panel unless reserved stock may be involved; hardened Archive with DB/DD_DB compatibility, audit logging and safe runtime fallback.
- Expanded deletion discovery to include older product-reference tables without declared foreign keys while explicitly protecting order, accounting, project, packaging, customer-story, recall and public-proof history.
- Added the missing canonical and Open Graph metadata to the public custom-request page during the SEO pass.
- Added Packaging Studio with structured D1 projects, templates, review versions and export history.
- Added the supplied scalloped soap-ribbon reference with extended medallion canvas, curved upper/lower text, bilingual centre identity and botanical ornaments.
- Added SVG, PNG, JPG and Print/Save PDF preparation plus browser-local draft fallback.
- Added common Canadian cosmetic-label field preflight while preserving explicit legal/formula/print review boundaries.
- Added purchase-lot reconciliation evidence, discrepancy display, deliberate audited application to main on-hand and manual/FIFO/FEFO policy preferences.
- Repaired the fresh aggregate schemas by restoring missing Build 213–215 Creative Process parent tables, and reset `database_upgrade_current_pass.sql` to the Build 221 additive migration only.
- Updated core/full/store/current schema guidance, canonical handoff documents, specialist Packaging Studio guide, validation and changed-file manifest.

# Build 220

- Added protected permanent cleanup for unused duplicate draft products.
- Added server-validated quantity price breaks.
- Added limited product sets with finished-component reservations and component availability protection.
- Added purchase-lot tracking for repeated supplier/Amazon purchases.
- Added explicit content-only Creative Projects that can create Content Studio plans without products.
- Added offer/set checks to Product Release Preflight.
- Added responsive visual placeholders and consolidated the canonical Markdown pair.

# Build 219

- Added fast table-row editing to Tools & Supplies Inventory Operations.
- Added row-level authenticated saves while preserving audit and inventory movement history.
- Improved mobile responsiveness for inventory operations.
- Refreshed the authoritative roadmap with the next 20 launch-readiness steps.
- Documented the seven-image product-gallery operating rule and launch validation requirements.

# Build 216 — Reviewed Inventory and CAIP Evidence

Adds explicit approved material-to-inventory posting, duplicate prevention, audited stock movements, internal review-required CAIP evidence mirroring, reusable cost templates, mobile-safe controls and updated canonical handoff documents.

# Build 210 — Social Publishing Workspace & Product Draft Automation

- Added `/admin/social-publishing/` with a focused product-social automation configuration, platform status cards, full queue, Social Media Privacy Guard, and practical in-app connection guide.
- Added a disabled-by-default `product_social_automation_settings` table and `database_build210_social_publishing_product_automation.sql`.
- Added a safe, idempotent product trigger:
  - An eligible Active + Approved/Published product can create one linked social **draft**.
  - The draft is initially `needs_review`, `draft`, `privacy_status=needs_review`, and `approved_for_public_post=0`.
  - It never auto-publishes or bypasses privacy/conset/release review.
- Wired the trigger into both Create Product and Update Product while preserving product-save success when the social draft cannot be prepared.
- Added UTM-tagged canonical product links to generated social drafts.
- Added secret-safe connection status for Facebook, Instagram, Pinterest, X, TikTok, and YouTube.
- Updated existing Meta Graph API default from v20.0 to v25.0, while retaining environment override.
- Added `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`.
- Updated `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, `NEW_CHAT_STATUS.md`, and schema reference pointers.

## Deployment note

Apply `database_build210_social_publishing_product_automation.sql` in D1 if desired. It is additive and leaves automation disabled. The runtime code also creates the minimal settings row safely when the Social Publishing admin page is opened.

## Known separate incident

The login `POST /api/auth/login` 500 remains evidence-first. Do not run a legacy auth migration; capture the sanitized response or matching Function log before changing login code or D1 schema.


# Build 212 — Social platform policy and callback prerequisites

The following production prerequisites now exist directly in the application:

- `https://devilndove.com/privacy/` and `/privacy.html`
- `https://devilndove.com/terms/` and `/terms.html`
- `https://devilndove.com/data-deletion/` and `/data-deletion.html`
- `https://devilndove.com/social-connections/` and `/social-connections.html`
- Exact OAuth callback routes for Meta/Facebook/Instagram, Pinterest, X, TikTok, and YouTube
- `https://devilndove.com/api/social/meta/data-deletion`
- `https://devilndove.com/api/social/integration-readiness`

The Pinterest verification meta tag is present in every HTML head. Callback routes are currently safe readiness endpoints: they do not exchange codes or store tokens until one-time state storage, encrypted token persistence, refresh, and disconnect controls are implemented.

## Build 214
- Added optional many-to-many Creative Project/product links.
- Preserved independent phone capture and direct catalog product creation.
- Added project-aware phone capture preselection, link/unlink, and primary-product controls.
- Added responsive flexible-entry workflow visual and Build 214 validation guide.


## Build 215 — Creative Intelligence Integration
Added reviewed project evidence handoffs, material-usage approval, profitability, optional Catalog project convenience controls, responsive integration panels, and an internal workflow visual.

## Build 217
Added authorized inventory reversals, cost-template application, revenue-percentage channel fees, shared linked-product cost allocation, CAIP-derived reviewed knowledge summaries, and a scoped dark contrast repair for Creative Asset Intelligence.

## Build 218
- Added a review-first Amazon link importer to Tools & Supplies Inventory Operations.
- Added authenticated Amazon metadata preview with ASIN/canonical-link extraction and safe fallbacks.
- Added mobile-responsive import controls and explicit no-auto-create safeguards.
- Consolidated Markdown authority around `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.
