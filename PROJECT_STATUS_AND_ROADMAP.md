# Devil n Dove Project Status and Roadmap — Build 239

This is the second canonical current-status file. `AI_HANDOFF.md` owns architecture/deployment; this file records Build 239 work, launch position, gaps and ordered next actions.




## Build 239 completed work

1. Ran a real headless-Chromium visual review on desktop and mobile for home, about, collections, contact, creations, custom candle, custom gifts, custom soap, events, gallery, gift cards, handmade jewelry, laser engraving, pickup, polymer clay, socials, shop and vintage pages.
2. Added route-specific hero imagery and more product/category-specific photo composites under `/assets/images/site/`.
3. Added seven local item-photo fallbacks under `/assets/products/fallbacks/`, with honest representative-preview badges when a remote R2 item photo cannot load.
4. Replaced visible placeholder language and unfinished contact/about instructions with final customer-facing copy.
5. Updated relevant Open Graph, Twitter and JSON-LD image references to route-specific crawlable assets.
6. Completed responsive CSS checks for 1440×1000 and 390×844 viewports; hero and media bands stack without horizontal page overflow.
7. Rechecked all repository `/assets/...` references and retained one H1 per audited public page.
8. Archived superseded Build 236–238 release records while retaining the two canonical cross-project documents.

## Build 238 completed work

1. Performed a page-by-page public visual audit across the most image-heavy public routes and replaced representative placeholder usage with route-specific real-image fallbacks.
2. Added new route-specific representative assets under `/assets/images/site/` so public pages can show more item-specific visuals while keeping the existing SEO-friendly route structure.
3. Replaced the remaining public editorial/placeholder imagery on gift-card, jewelry and key service pages with concrete images from the project media library.
4. Completed a targeted mobile/desktop CSS drift pass for image-heavy bands and hero media, standardizing framing and preventing oversized images on small screens.
5. Re-ran asset-reference checks so every `/assets/...` path used by the application resolves in the build.
6. Updated the release trail and created `PUBLIC_VISUAL_AUDIT_BUILD238.md` while keeping `AI_HANDOFF.md` and this file as the two canonical entry documents.

## Build 237 completed work

1. Filled the remaining missing image paths used by the image manifest, schema seeds and public pages so every mapped slot now resolves to a concrete asset.
2. Added a reusable `/assets/images/site/` library of real-image fallback files generated from existing Devil n Dove media and approved packaging references.
3. Added concrete photo-backed wrappers for previously missing `product-grid`, `engraving-detail` and `material-detail` visual assets.
4. Preserved the earlier placeholder-path strategy so existing code, database rows and markdown references keep working without route-by-route rewiring.
5. Updated the image requirements guide and release trail while keeping `AI_HANDOFF.md` and this file as the two authoritative project-entry markdown files.

## Build 236 completed work

1. Polished the soap-ribbon SVG renderer so the live editable preview more closely follows the owner-approved Glacial Purple label: a wider front oval, more centered wording, cleaner separators and a smaller integrated round seal.
2. Kept the reusable-template, product-data, bilingual, claims, compliance, versioning and export workflow inside the same Labeling & Packaging System.
3. Replaced the most common placeholder SVGs with photo-backed SVG wrappers so existing page and database paths now render real raster imagery without route-by-route breakage.
4. Created a reusable `assets/real-media/` set from existing repository photos and approved packaging references, then reused those assets across public and selected admin views.
5. Added compatibility placeholder assets for event, pickup, tools and generic product routes that were referenced by schema/manifests but missing from the working tree.
6. Refreshed the Build trail (`BUILD236_*`, release notes, sanity and new-chat pointers) while keeping `AI_HANDOFF.md` and this file as the only two current authorities.

## Build 235 completed work

1. Added server-computed readiness rules for all seven Creative Automation stages using bounded aggregate reads from the existing specialist authorities.
2. Added explicit pass/fail/not-applicable checks, expected/actual evidence and correction guidance without duplicating authoritative business facts.
3. Added a prioritized operational queue for blocked, overdue, due-soon, unassigned and active Creative workflows.
4. Added authenticated JSON and accessible print-ready HTML project evidence packets covering timeline, materials, inventory, CAIP, content, reviews, publications, results and profitability.
5. Corrected publication readiness to use authoritative `content_status` values.
6. Rebuilt the master UI with eight metrics, source-readiness checklists, export controls, safe response handling and contained phone/desktop layouts.
7. Added Build 235 regression coverage for readiness, queue order, publication counting, evidence exports, one-H1/noindex markup, responsive CSS and shell v16.
8. Retired 47 historical Build Markdown files from the root into `docs/archive/build-history/` and updated release checks/references so two current authority files remain unambiguous.
9. Rechecked current Google search/local guidance and representative Ontario/custom-maker sites; retained truthful local intent, clear custom-order process, real workshop identity, useful product imagery and no ranking guarantees as the competitive direction.
10. Kept the schema boundary at Build 234; Build 235 adds no migration or runtime schema initialization.

## Retained Build 234 completed work

1. Made the selected packaging template authoritative in both browser and server; old project `package_type` drift can no longer select the wrong renderer.
2. Rebuilt the soap preview around the exact owner-approved structure with permanent brand/static content, botanical rose artwork, centred editable hierarchy, bilingual panels, rear seal, claims and weight area.
3. Registered both supplied visual samples in D1 with checksums, bringing packaging reference authority to five sources.
4. Added generated text-free soap rose and wedding candle artwork as PNG/WebP production/browser pairs with prompt, checksum and usage boundaries.
5. Added editable 4-inch and 3.5-inch wedding candle tops, a 3-inch general candle top, 4-inch round maker/coaster mark and 2×1.5-inch oval product label.
6. Added editable candle names/main wording, two dates, occasion, curved brand/origin text and concentric round preview guides.
7. Added custom millimetre dimensions, shape, renderer profile, bleed/safe margin and Save as reusable template; custom templates live in D1 and reattach to the project.
8. Made SVG exports self-contained by embedding referenced artwork; retained preview and physical proof boundaries.
9. Added guarded Creative Automation deletion for accidental unused duplicates while protecting meaningful work and preserving the linked product.
10. Removed request-time schema DDL from Packaging Studio, Creative Automation, Creative Process and Startup Readiness.
11. Moved all 44 Startup definitions to the one-time Build 234 migration without overwriting owner/status/evidence, eliminating 44 request-time upserts.
12. Added `candle_top_template_proof` as the 44th Critical Startup gate with twelve detailed measurement, safe-area, reusable-template, export, material-test, correction and archive steps.
13. Consolidated the admin dashboard to one Labeling & Packaging entry while retaining the old soap path as a compatibility page.
14. Added shape-aware responsive preview CSS and mobile stacking for paired references and destructive Creative controls.
15. Added Build 234 schema/render/deletion/resource regression coverage and repeat-applied the migration after each aggregate schema.
16. Updated the two canonical handoff files, specialist packaging/visual guides, Startup guide/fallback, schema reference, release/validation evidence and Markdown index.

## Retained integrated baseline through Build 233

1. Preserved every prior Startup gate and expanded the authority from 42 to 43 unique gates with a distinct Critical missing-image blocker.
2. Added standalone gates and detailed operating pages for Deployment Preflight, Post-Deploy Smoke Tests, Deploy Readiness, Go-Live Execution and Live Ops Follow-through.
3. Added a single Prelaunch Operations Map without collapsing specialist decisions into one misleading score.
4. Regenerated the detailed Startup guide from the API authority; every gate includes preparation, numbered tests, correction, evidence, retest/reopening and pass condition.
5. Added a regression test proving HTML/incomplete API responses render 43 fallback gates, include the missing-image blocker and never show the empty-filter message.
6. Created the master Creative Automation Studio with seven stages, owner/due date/status/blocker, evidence-required completion and append-only events.
7. Kept Creative Process, materials/cost, CAIP, Content Studio, channel approval, Release Board and analytics/result systems as specialist authorities with every existing feature reachable.
8. Reframed the four older creative admin pages as specialist stages under the master system; no redirect or feature deletion was introduced.
9. Added conservative source-readiness comparisons so a master Complete review cannot hide missing specialist evidence.
10. Added master API/UI fallbacks, specialist links and runtime incident capture.
11. Added responsive Creative Automation and Prelaunch layouts, phone stacking, contained overflow and full-width small-screen actions.
12. Added two descriptive SVG planning placeholders; neither is eligible for Product schema, Open Graph or launch-product galleries.
13. Added the D1-safe Build 229 packaging-reference migration and synchronized all three aggregate schema files plus current-pass SQL.
14. Removed explicit SQL transaction statements from the current D1 migration boundary.
15. Added a preflight blocker for unsupported explicit SQL transactions and current/numbered migration mismatch.
16. Retired the old Build 228 synchronizer so rerunning it cannot truncate Build 229.
17. Expanded Release Sanity with the three-source packaging authority and exact 43-gate checks.
18. Preserved one-H1/noindex rules on all new/changed admin pages and continued the public one-H1 scan.
19. Consolidated current Markdown authority into `AI_HANDOFF.md` and this file; specialist docs remain scoped and older Build docs are historical evidence.
20. Documented exact prelaunch stage order, correction and evidence requirements in `PRELAUNCH_PROCESS_PLAYBOOKS.md`.
21. Preserved the supplied specification, PDF guide and SVG master in the repository with checksums, dimensional metadata and direct Packaging Studio reference cards.
22. Reconciled the 50 mm specified rear seal, 38.1 mm artboard and 25 mm supplied-SVG seal honestly; physical proof must select an approved renderer profile.
23. Made `IMAGES_REQUIRED.md` the evidence manifest for the new Critical gate, covering missing, broken, fallback, placeholder and rights-unclear launch media.
24. Added `/admin/image-manifest/` with 20 requirements, visual filters/previews, owner assignment, rights/public-use decisions, separate phone/desktop results and saved history.
25. Migrated mutable image status/evidence from Markdown intent into D1 while retaining `IMAGES_REQUIRED.md` as the detailed capture/crop standard.
26. Added server approval rules requiring a final URL, rights/public approval, useful alternative text and both device checks.
27. Added an honest 20-row read-only fallback with disabled saving; database/API failure cannot look like a complete or empty manifest.
28. Generated and integrated three editorial illustrations plus responsive 768-pixel derivatives for home, general jewelry and gift cards.
29. Preserved prompts, hashes, intended routes and prohibited uses in `GENERATED_VISUAL_ASSET_REGISTER.md` and the D1 seed.
30. Kept real launch-product, process, condition, packaging and local-business photographs open; editorial art cannot satisfy proof roles.
31. Updated Startup’s Critical image gate to a 12-step D1 workflow and refreshed all 43 guide/fallback gates without deleting prior keys.
32. Added D1-safe Build 230 migration/current-pass synchronization and retired the older synchronizer.
33. Refreshed responsive CSS, intrinsic image sizes, editorial disclosure, one-H1 and SEO/image guidance across changed routes.
34. Removed unapproved-draft social schema/settings preparation and nonessential approval/audit work from the autosave hot path.
35. Prevented unchanged image rows from being rewritten during text-only draft edits and added a 96 KiB structured request guard.
36. Serialized autosave requests, queued newer edits and added a visible browser recovery copy that is never presented as a D1 save.
37. Added one safe API parser for product reload/update/autosave so Cloudflare HTML 503/1102 responses cannot surface as raw markup or `JSON.parse` errors.
38. Expanded the Startup runtime gate and Cloudflare checklist with exact autosave, reload, recovery, `exceededCpu` and `exceededMemory` verification.
39. Replaced repeated Product Detail schema introspection with five bounded database calls including authentication, capped the editor response at seven images and added a mocked product-45 JSON/query-budget regression.
40. Kept Build 231 code-only; aggregate/current schema remains the validated Build 230 boundary.
41. Replaced archived-product correction preflight’s all-table/all-foreign-key discovery with a bounded protected-history registry and a 17-call mocked query budget.
42. Corrected the archive/deletion conflict: ordinary product media-change and review audit rows are cleaned with an unused product rather than automatically forcing Archive-only status.
43. Kept orders, customer/accounting, packaging, creative projects, recalls, trust/public-proof and other business history as permanent-removal blockers.
44. Combined reviewed inventory actions, cleanup/detachment and final product deletion into one D1 batch and added full mocked removal proof plus aggregate-schema registry coverage.
45. Extended shared safe JSON/Cloudflare parsing across all three product-removal browser paths and expanded Startup’s destructive-action test to twelve exact steps.
46. Removed per-login schema/table/column discovery, session reread and nonessential executed calls from `/api/auth/login`; successful login now executes one user read and one D1 batch.
47. Kept detailed auth schema inspection behind explicit `GET /api/auth/login?diagnostic=full`; the normal GET checks only that the Production `DB` binding is present and performs no query.
48. Corrected unexpected logout behaviour: temporary 5xx, Worker 1102, network/offline and malformed verification responses retain the existing token and cached identity, while real 401/403 decisions still clear access.
49. Added concise login resource-limit recovery copy, service-worker shell v14 and a regression proving two D1 operations, no hot-path introspection, invalid-input early exit, temporary-session retention and real-401 clearing.
50. Expanded the Critical Startup login gate from eight broad prompts to fourteen exact deployment, browser, Network, response-profile, Cloudflare log, invalid-password, request-blocking, logout, reset, logout-all and expiry steps.
51. Removed a cross-route Worker-startup hazard: the 897-row Amazon inventory reference no longer creates a 1.1 MB object array plus indexes when the Pages Worker starts. Its 211,860-byte compressed source expands by area only for authenticated catalog/inventory/resource work, preserving all matches while reducing unrelated route startup pressure.

## Current position

The application has broad, integrated foundations for catalog/media, inventory lots/movements, orders/payments/refunds, accounting review, customer documents, whole-business packaging, creative/content governance, SEO operations and launch control. Build 235 adds computed Creative readiness, a focused exception queue and portable project evidence while retaining Build 234 packaging templates, guarded duplicate cleanup and request-time DDL removal. Local checks cannot prove the live Worker, login, product correction, autosave, packaging or laser/print results until controlled log-backed production tests pass. Generated art and untested production/physical/provider work remain outside launch evidence.

Status remains **production-evidence and controlled-opening preparation**.

## Known launch risks

- Production payment webhook signature, duplicate delivery, refund and exact-once stock settlement/restoration need live evidence.
- Final-unit and component-set concurrency need simultaneous-session proof.
- Packaging component BOM currently estimates quantity/cost; fulfilment consumption/reservation needs an approved idempotent movement design.
- Launch soaps require verified formula/INCI/bilingual facts, measured 100% print/wrap proof and applicable notification/change control.
- Every candle-top size/material requires a measured blank, saved reusable template, reviewed names/dates, self-contained export and passed physical laser/print proof; the supplied sample is not a dieline.
- Embedded candle artwork is raster and may require reviewed trace/vectorization for the chosen laser workflow.
- Accidental Creative deletion must be tested on one empty duplicate and one meaningful-work project; the latter must remain blocked.
- Customer documents require owner/accountant review of legal identity, registration number, tax adjustment and retention.
- Transactional email delivery/retry, tax/shipping fixtures, D1/R2 restore and separate paid-order/refund rehearsals remain open.
- Meta credential presence/read-only identity success does not prove app review, scope approval or publishing. Automation stays review-first.
- Real product photography remains required. Planning placeholders are not public product evidence.
- The six generated WebP files require owner/device review and stay only in their documented editorial roles; 17 seeded manifest requirements remain real-photo or dynamic-catalog work.
- Google local first-page placement cannot be guaranteed; relevance, distance and prominence must be improved and monitored over time.
- Product autosave/reload needs a Build 231 production run correlated with Cloudflare invocation outcomes; any new `exceededCpu` or `exceededMemory` result keeps the runtime Startup gate open.
- Archived-product correction/removal needs a Build 232 production run proving an unused archived record can be removed while a history-backed record remains blocked and inventory/audits change exactly once.
- Login/session verification needs the Build 233 fourteen-step production run. Any `/api/auth/login` or `/api/auth/me` `exceededCpu`, `exceededMemory` or 1102 result keeps the Critical login gate open; a temporary verification error must retain credentials but is not proof the session was server-validated.
- The demand-loaded Amazon registry still performs deliberate decompression on catalog/inventory/resource routes. Measure those routes separately; never move its private purchase/order reference payload into public static assets merely to reduce bundle work.

## Ordered next steps

### P0 — before production promotion

1. Run Build 235 validation, resolve every blocker and generate/checksum the exact ZIP.
2. Back up D1; verify Build 229 and 230 ledger keys; apply `database_build234_packaging_templates_creative_cleanup.sql` or identical current-pass SQL exactly once.
3. Deploy, hard refresh to service-worker shell v16, run the full live smoke suite and confirm 44 Startup gates, five packaging references, five new system templates and the D1-backed image manifest with honest degraded-mode behaviour.
4. Complete the fourteen-step Startup login proof: bounded profile/header, successful redirect, Cloudflare outcome, valid refresh, invalid password, blocked `/api/auth/me` retention, recovery, logout, reset, logout-all and deliberate expiry.
5. Run the controlled Product Editor load/autosave/queued-edit/reload/browser-recovery test and correlate it with Cloudflare `exceededCpu`/`exceededMemory` metrics before closing the runtime gate.
6. Complete the twelve-step Startup role/destructive-action test: remove one disposable archived product through `bounded_registry_v1`, verify one reviewed inventory/audit effect, and prove a separate order/packaging/project-history product remains Archive-only; then test reversal, refund/document void, packaging approval, publication and accounting export authorization.
7. Prove Stripe signed webhook and duplicate delivery; reconcile payment/order/inventory exactly once.
8. Prove final-unit and component-set concurrency with two simultaneous owner-controlled sessions.
9. Complete separate failed/abandoned/cancelled and partial/full refund tests with stock, credit note, refund confirmation, tax and fee reconciliation.
10. Save expected/actual Canadian tax and shipping/pickup fixtures for every launch scenario.
11. Test transactional order/receipt/refund/fulfilment messages, provider IDs, retry and failure diagnostics.
12. Complete D1, R2, deployment and required-configuration restore rehearsal.
13. Complete physical counts, packaging BOM, approved label version and measured print/wrap proof for each launch product. For every candle-top/round job, measure the blank, save the exact reusable template and complete the new twelve-step physical material gate.
14. Complete `missing_launch_images` in `/admin/image-manifest/`; use `IMAGES_REQUIRED.md` for capture standards, create item-specific Catalog Media rows, replace real-photo blockers, approve the three editorials deliberately, then validate Product/Offer, Open Graph, canonical, alt text, galleries and Search Console on phone and desktop.
15. Complete Business Profile details/photos/hours/services and record a recurring local accuracy review.
16. Complete one real paid fulfilment and a different refund recovery; retain all non-secret evidence.
17. Test Creative Automation end to end: prove blocked/overdue/unassigned queue order, compare all seven computed stages with specialist records, export JSON/HTML evidence, delete one untouched accidental shell using its exact key, and prove a meaningful-work project remains protected.
18. Assign launch owner, monitoring hours, support access, stop conditions and phone-ready rollback instructions.

### P1 — controlled-opening stabilization

18. Add transactional packaging-component reservation/consumption/reversal with idempotency keys and lot references.
19. Link verified formula/source rows to packaging without duplicating ingredient facts.
20. Add server-generated prepress PDF with exact media/bleed boxes and embedded/outlined fonts.
21. Add deterministic text-fit, barcode/QR destination and region-overflow blockers.
22. Add approved packaging lock/supersession/reprint workflow with checksum and physical-proof links.
23. Run one deliberately reviewed Meta product-only publish test only after provider roles/scopes/app review pass.
24. Reconcile provider post ID/URL and analytics without treating queue status as publication.
25. **Completed in Build 235:** server-computed Creative Automation stage rules and blocked/overdue/due-soon/unassigned work queue. Next, add external notification delivery only after delivery/retry evidence is designed.
26. Add camera-first mobile evidence upload with R2 rights/derivative checks and explicit unsynced recovery.
27. **Partly completed in Build 235:** accessible JSON/print-ready project evidence packet export. Provider/result reconciliation remains open and must use observable provider IDs/URLs rather than queue status.
28. Add camera-first manifest upload from a phone with EXIF/privacy warning, R2 derivative creation and offline draft recovery.
29. Add automated deployed-URL checks for manifest assets, intrinsic dimensions, duplicate hashes, structured-data leakage and slow-network budgets.
30. Generate product-specific manifest rows from the frozen launch-product list so featured/detail/scale/packaging roles remain visible without copying product facts.

### P2 — after stable operations

31. Add notification queues for customer service, inventory exceptions, failed email and creative/visual approvals.
32. Add controlled batch approval only for low-risk items, retaining per-item evidence/rollback.
33. Add accounting close/reconciliation checklist and accountant export validation fixtures.
34. Add repeat-customer support history and consent-safe follow-up workflows.
35. Expand launch products/channels only when order, stock, email, refunds, packaging, media and support remain reconciled and reversible.

## SEO/local-search direction each pass

Run the public audit on every pass: one H1, distinctive title/description, canonical, crawlable descriptive links, visible/structured fact agreement, approved representative media, mobile readability and no thin/duplicate indexable page. Use natural Ontario/service language only where true. Track Search Console queries/pages, Business Profile actions and local landing-page conversions monthly; change content from evidence, not guessed rank fluctuations.
