# Build 184 Completed Pass — Application Sanity Check, Value Roadmap, Desktop/Mobile Review, and SEO/Visual Direction

1. Added `/admin/application-sanity/` as the sanity-check page for where the application stands now.
2. Added `/api/admin/application-sanity` to seed and display module status, value-added candidates, SEO criteria, desktop/mobile checks, visual enrichment rows, and sanity snapshots.
3. Added `database_build184_sanity_check_and_value_roadmap.sql` as a safe additive D1 migration.
4. Added `application_sanity_snapshots` for saved deployed sanity snapshots.
5. Added `application_module_status_rows` to summarize storefront, admin ops, schema, SEO, visual brand, and compliance readiness.
6. Added `value_added_modification_candidates` with ranked future work by value, effort, risk, and priority.
7. Added `seo_search_criteria_review_rows` to keep local search phrases tied to page paths without changing H1 structure.
8. Added `desktop_mobile_value_checks` so desktop and mobile parity can be reviewed as value work, not only visual cleanup.
9. Added `visual_value_enrichment_rows` for reduced-motion-safe visual effects/images that do not allow H1 changes.
10. Added `sanity_action_plan_rows` so the top value-added items can be promoted into future build plans.
11. Added `data/site/build184-application-sanity.json` as the static sanity handoff report.
12. Updated the admin dashboard and Operations page with Application Sanity links.
13. Updated schema files and schema references for Build 184.
14. Updated deployment preflight and final blocker scripts to require the Build 184 page/API/JS/migration/static report.
15. Updated release manifest generation to Build 184.
16. Confirmed one-H1 and title/meta habits remain locked across exposed HTML.
17. Confirmed CSS drift remains guarded by brace checks.
18. Confirmed the next roadmap should focus on value-added simplification, measurement, product readiness, and real approved visuals.
19. Kept this pass additive and non-destructive to avoid D1 rerun risk.
20. Packaged Build 184 with updated Markdown, schema references, release notes, sanity notes, and validation output.

## Next 20 recommended steps after Build 184

1. Build the Admin Command Center that groups daily work into Today, Products, SEO, Visuals, Orders, Accounting, and Deploy cards.
2. Add storefront conversion funnel tracking from local landing page to product view, cart, checkout, and order completion.
3. Create a Product Readiness Scoreboard that combines QA, image roles, price, story, shipping, inventory, and marketplace status.
4. Add a monthly Local SEO scorecard using Search Console, Google Business Profile observations, manual ranking checks, and page freshness.
5. Build before/after and maker-process gallery templates using approved images only.
6. Create a customer story builder for consented custom orders, trust blocks, product stories, and social captions.
7. Improve phone-first product add with autosave, image-role prompts, and recovery from upload/API failures.
8. Connect inventory tools/supplies to product/job cost estimates and marketplace profit previews.
9. Unify customer/member history for orders, gift cards, recalls, custom requests, proof approvals, and notes.
10. Add public performance budgets for images, scripts, CSS, and low-bandwidth visual mode.
11. Build a structured-data lab for Product, LocalBusiness, BreadcrumbList, FAQPage, and Organization previews.
12. Add a plain-language policy center for returns, custom work approvals, pickup, gift cards, and recalls.
13. Add a content calendar for seasonal campaigns, markets, product launches, blog posts, and social snippets.
14. Plan privacy-safe abandoned-cart and saved-cart follow-up only after consent rules are clear.
15. Add maker/process profile sections that explain the workshop story without distracting from products.
16. Build an error recovery center for failed API, upload, payment, R2, and provider tasks.
17. Add marketplace profit preview after fees, shipping, taxes, materials, and packaging.
18. Add a mobile photo shot-list for product, trust proof, and local SEO images.
19. Add a periodic landing-page refresh queue for titles, meta descriptions, body copy, alt text, and internal links.
20. Add training/simulation mode for deploy, rollback, recall, and gift-card provider actions before live customer impact.

# Build 183 Completed Pass — Visual Enrichment Studio, Media Picker Rows, Screenshot Pairs, Low-Bandwidth Mode, and Final Visual Report

Completed in this pass:
1. Added `/admin/visual-enrichment-studio/` for the Build 183 image/effect refinement workflow.
2. Added `/api/admin/visual-enrichment-studio` for media-picker assets, screenshot rows, alt-text suggestions, visual budgets, schema imports, and report rows.
3. Added `database_build183_visual_enrichment_studio.sql` and updated all main schema SQL files plus `database_upgrade_current_pass.sql`.
4. Connected approved Visual Polish candidates to `visual_candidate_media_assets` rows with product-image/static fallback thumbnail support.
5. Added desktop/mobile screenshot pair rows and automated visual screenshot job placeholders tied to dark-theme evidence review.
6. Added Local SEO visual candidate badges and page image-slot assignments that explicitly block H1 changes.
7. Added media compression budget reports before public image promotion.
8. Added visual diff overlay rows for previous/current screenshot comparisons.
9. Added one-click alt-text suggestion rows for approved visual candidates.
10. Added schema validation result import rows for manual Rich Results/Schema validator checks.
11. Moved JSON→D1 ownership decisions into visible `json_db_ownership_decisions` rows.
12. Added public API fallback preview cards with exact customer-facing fallback messages.
13. Added phone-only visual candidate quick-card rows for mobile approvals.
14. Added seasonal visual campaign rows for Christmas, Mother’s Day, Father’s Day, local markets, and custom gift events.
15. Added gallery hero-image rotation queue using approved media only.
16. Added product detail visual polish checks for thumbnail strip, featured image, image roles, and mobile zoom controls.
17. Added CSS token drift rows for contrast, spacing, card radius, focus outline, and button/touch height review.
18. Added visual accessibility notes for motion, contrast, text-over-image, and touch target review.
19. Added Safe Deploy JSON ownership export rows plus static `data/site/build183-visual-enrichment-studio.json`.
20. Added a customer-facing lighter-visual/low-bandwidth toggle and final visual deployment report rows.

Next 20 recommended steps:
1. Wire the Visual Enrichment media picker to direct R2 browser uploads with signed object keys.
2. Add real screenshot upload controls to the Visual Enrichment Studio page rather than seeded URL placeholders.
3. Generate visual diff thumbnails from uploaded screenshot pairs and store a computed difference score.
4. Show Local SEO visual candidate badges directly inside `/admin/local-seo-review/` rows.
5. Add a guarded publish button that writes selected image-slot assignments into generated static page JSON.
6. Enforce image budget warnings inside product/image upload and public promotion endpoints.
7. Add alt-text suggestion acceptance that writes back to product images or page image-slot rows.
8. Add manual validator paste/import forms for schema validation result rows.
9. Add a JSON→D1 migration admin panel for reviewing and approving individual source files.
10. Add endpoint failure simulators so public API fallback preview cards can be live-tested safely.
11. Add phone quick approval cards to the mobile admin dashboard.
12. Add seasonal campaign public preview cards before campaign images/copy are published.
13. Add gallery hero rotation preview and reorder controls.
14. Add product detail visual polish badges directly in the product editor image strip.
15. Add CSS token extraction from `css/styles.css` so drift checks compare actual values, not placeholders.
16. Add accessibility screenshot annotations for text-over-image contrast and tap target spacing.
17. Add low-bandwidth preference sync for logged-in members.
18. Merge final visual deployment report rows into Safe Deploy ZIP metadata and printable release report.
19. Add per-page professional image/effect recommendations based on current public content density.
20. Add a post-deploy visual smoke-test dashboard that combines screenshots, H1, CSS, and local SEO checks.

# Build 182 Completed Pass — Visual Polish, Desktop/Mobile Parity, SEO Enrichment, and Fallback Safety

Completed in this pass:
1. Added `/admin/visual-polish/` as the Build 182 desktop/mobile polish and enrichment review page.
2. Added `/api/admin/visual-polish` for parity rows, visual candidates, effect safety, fallback reviews, schema queue rows, and JSON-to-D1 ownership candidates.
3. Added `database_build182_mobile_visual_polish.sql` and appended the same additive schema to aggregate schema files.
4. Added desktop/mobile parity check rows for key public and local SEO pages.
5. Added mobile navigation touch-target audit rows using a 44px minimum target guideline inside the admin review workflow.
6. Added visual enrichment candidate rows for local pages, image slots, asset hints, alt text hints, and reduced-motion-safe placement notes.
7. Added visual-effect safety review rows for hero glow, card lift, visual ribbons, and product-image depth.
8. Added public-page visual asset budget rows to limit new images/effects and require lazy loading for future media additions.
9. Added route fallback review rows for core admin and public APIs so blank panels can be replaced with readable retry/error states.
10. Added structured-data validation queue rows for LocalBusiness, WebSite, and Product markup review after page updates.
11. Added JSON-to-D1 migration candidate rows for catalog, SEO overrides, LocalBusiness, release notes, and local SEO bake actions.
12. Added visual-polish admin preferences for default viewport pairs and motion policy.
13. Added a shared visual polish strip on the homepage and local pages without adding any extra H1 headings.
14. Added motion-safe CSS for sharper cards, visual tiles, admin controls, and phone-friendly button sizing.
15. Added `data/site/build182-mobile-visual-polish.json` as a static handoff artifact for this pass.
16. Updated admin dashboard and Operations navigation with Visual Polish & Mobile Parity links.
17. Updated static preflight and final blocker scripts to require the new Build 182 page, API, JS, migration, and handoff JSON.
18. Updated the release manifest generator to emit Build 182 metadata.
19. Updated Markdown handoff files, schema references, release notes, sanity notes, local SEO notes, image/evidence notes, README, and AI context.
20. Ran syntax, JSON, H1, CSS, SQL, preflight, final blocker, and zip validation for the Build 182 package.

Next 20 recommended steps:
1. Connect Visual Polish candidates to real product/R2 media picker thumbnails so approved image slots can choose an existing asset.
2. Add side-by-side screenshot uploads for desktop and mobile parity rows.
3. Add automated screenshot capture after deploy for the Visual Polish page using the existing dark-theme evidence queue.
4. Show Visual Polish candidate badges directly on Local SEO Review rows.
5. Create a public page image-slot editor that writes approved candidates back to page sections without changing H1 structure.
6. Add a media compression budget report that flags large images before they are promoted to public pages.
7. Add visual diff overlays for previous/current screenshot pairs.
8. Add one-click alt-text copy generation from approved visual candidates.
9. Add schema validation result import rows from Rich Results/Schema validators after manual checks.
10. Move `data/catalog.json` fallback ownership decisions into a visible JSON→D1 migration admin panel.
11. Add public API fallback preview cards that show the exact customer-facing error message before deployment.
12. Add phone-only admin quick cards for Visual Polish candidate approval.
13. Add seasonal visual campaign rows for Christmas, Mother’s Day, Father’s Day, markets, and custom gift events.
14. Add a gallery hero-image rotation queue using approved media only.
15. Add product detail visual polish checks for thumbnail strip, featured image, image roles, and mobile zoom controls.
16. Add CSS token checks for contrast, spacing, card radius, and button height drift.
17. Add visual accessibility notes for motion, contrast, text-over-image, and touch target review.
18. Add real D1-export-to-static JSON ownership status inside Safe Deploy package metadata.
19. Add a customer-facing low-bandwidth mode toggle or lighter media preference.
20. Merge Visual Polish status into the final printable deployment report alongside Release Control and Live Ops.


# Build 181 Completed Pass — Live Ops Follow-through, Signed Evidence Downloads, Marketplace Overrides, and SEO Copy Refresh

Completed in this pass:
1. Added `/admin/live-ops-followthrough/` as the Build 181 follow-through admin page after Go-Live Execution.
2. Added `/api/admin/live-ops-followthrough` for QA blocker counts, marketplace gate badges, override requests, recall upload requests, LocalBusiness export rows, content-refresh logs, notification buttons, and watcher snapshots.
3. Added `/api/admin/private-evidence-download` with HMAC-signed R2 download tokens, expiry enforcement, audit logging, and guarded bucket selection.
4. Added `database_build181_live_ops_followthrough.sql` and updated aggregate schema files with the same additive tables.
5. Added private evidence download token and audit tables for accountant/customer/recall evidence objects.
6. Added Product QA blocker preview count rows for Catalog QA badges beside blocker groups.
7. Added marketplace gate badge snapshots so CSV export buttons can show ready/blocked reasons before download.
8. Added marketplace export gate override requests with reason and expiry timestamps for temporary audited overrides.
9. Added recall evidence upload request rows with R2 target prefixes for candle/soap recall evidence widgets.
10. Added LocalBusiness admin export run rows so D1 settings can feed `data/site/local-business-schema.json` during safe deploy packaging.
11. Added public page content refresh tracking rows tied to local SEO phrases and static page copy updates.
12. Added provider webhook crypto test-vector notes for Resend, SendGrid, and Postmark verification work.
13. Added manifest drawer saved filters for admin, functions, schema, and local SEO data paths.
14. Added dashboard notification action button rows for snooze/dismiss rendering.
15. Added post-promotion watcher execution log rows that summarize smoke-test and runtime-incident state.
16. Updated admin dashboard, Operations, and Go-Live Execution navigation for Live Ops Follow-through.
17. Added Southern Ontario handmade gift, jewelry, engraving, candle, soap, workshop gift, and vintage-find body-copy refreshes without adding extra H1 tags.
18. Updated CSS for Build 181 admin controls, status pills, and local-search refresh blocks.
19. Updated Markdown handoff files, schema references, release notes, sanity notes, local SEO notes, image/evidence notes, README, and AI context for Build 181.
20. Ran syntax, JSON, H1, CSS, SQL, manifest, and zip validation for the Build 181 package.

Next 20 recommended steps:
1. Wire the recall evidence upload request rows into the actual candle/soap recall admin page with drag-and-drop R2 uploads.
2. Render Product QA blocker preview counts directly beside each blocker group in the Catalog QA panel.
3. Show marketplace gate badges beside every real CSV/download button and display blocker reasons inline.
4. Add approval/deny controls for marketplace override requests with automatic expiry enforcement in export endpoints.
5. Use `/api/admin/private-evidence-download` from accounting, recall, and customer evidence rows instead of exposing raw private R2 object paths.
6. Add one-time-use enforcement for signed evidence downloads by checking max download count before streaming.
7. Add provider-specific live cryptographic webhook verification for Resend, SendGrid, and Postmark using deployed secrets.
8. Add LocalBusiness export button to Release Control that downloads the exact JSON used by the bake script.
9. Add automatic safe-deploy step that consumes the latest LocalBusiness export row and rewrites `data/site/local-business-schema.json`.
10. Add visual manifest drawer tabs using the new saved filters for admin, functions, schema, data/site, and public HTML.
11. Render dashboard snooze/dismiss buttons on live notification cards and update `dashboard_notification_visibility_states` on click.
12. Run the post-promotion watcher against live URLs and write real HTTP status results into watcher execution logs.
13. Add previous-ZIP binary diff tooling that accepts the prior uploaded zip and fills `previous_zip_binary_comparisons`.
14. Add structured-data preview cards beside each public URL row on Deployment Preflight.
15. Add local SEO mini-chart click-through from each local page row into Search Console trend detail.
16. Add internal-link graph canvas interactions that store source/target clicks in the existing graph interaction table.
17. Add accountant ZIP endpoint integration so each export writes checksum and private evidence download token rows automatically.
18. Add mobile Live Ops Follow-through cards for evidence, recall, marketplace gates, and watcher logs.
19. Add public-page copy refresh checklist rows for future seasonal gift pages without changing H1 structure.
20. Add a final deployment report that merges Release Control, Deploy Readiness, Go-Live Execution, and Live Ops Follow-through into one printable Markdown handoff.

# Build 180 Completed Pass — Go-Live Execution, Direct Endpoint Gates, SEO Visuals, and Final Release Controls

Completed in this pass:
1. Added `/admin/go-live-execution/` as the Build 180 final execution page after Promotion Control.
2. Added `/api/admin/go-live-execution` with guarded actions for safe catalog fixes, SEO chart rendering, LocalBusiness D1 bakes, recall endpoint gates, marketplace blocks, and watcher scheduling.
3. Added `database_build180_go_live_execution.sql` and updated aggregate schema SQL files with the same safe additive tables.
4. Wired approved Product QA safe-apply execution for SEO-title casing and empty product status labels with preview/apply modes.
5. Added real Local SEO SVG mini-chart rendering rows and displayed chart output on the Local SEO Review page.
6. Added internal-link graph interaction storage so source/target click filters can be captured from the admin UI.
7. Added a static `scripts/bake_localbusiness_from_d1_export.py` path to rewrite `data/site/local-business-schema.json` from exported D1 data.
8. Added provider webhook verification run rows for Resend, SendGrid, and Postmark endpoint/header setup.
9. Added signed-download Worker route test rows for expiry/token/download verification handoff.
10. Added recall evidence upload placeholder rows for recall admin UI use.
11. Strengthened recall notification send-status changes so both legacy locks and Build 179 release gates must allow release.
12. Added accountant ZIP endpoint log rows and linked latest evidence checksum data when available.
13. Added previous ZIP binary comparison schema groundwork for future uploaded artifact comparison.
14. Added dashboard notification visibility storage and a dashboard helper action for snooze/dismiss state.
15. Added mobile Release Control layout run storage for phone-first release cards.
16. Added structured-data excerpt rows for Deployment Preflight page-by-page previews.
17. Blocked marketplace CSV downloads from the export endpoint when hard download gates are active.
18. Added release-control row status action rows for pass/block decisions.
19. Added manifest filter drawer runs and readiness score trend Markdown export rows.
20. Added promote-live UI gate state rows and post-promotion watcher schedule rows.

Next 20 recommended steps:
1. Build the actual signed-download Worker route `/api/admin/private-evidence-download` with HMAC token validation and expiry enforcement.
2. Add a drag-and-drop evidence upload widget directly inside the candle/soap recall admin page and connect it to `recall_evidence_ui_uploads`.
3. Expose Product QA safe-apply preview counts directly beside each blocker in the Catalog QA panel.
4. Add a clickable internal-link graph canvas that posts selected source/target filters into `internal_link_graph_interactions`.
5. Export LocalBusiness D1 rows from the admin UI and feed them into the new static bake script automatically during safe deploy package creation.
6. Add provider-specific cryptographic verification code to live Resend, SendGrid, and Postmark webhook endpoints, not only setup rows.
7. Add visible marketplace gate badges beside each CSV download button and show the exact hard blocker reason before download.
8. Add a manual override workflow for marketplace export gates with audit logging and expiry dates.
9. Write accountant ZIP endpoint logs directly from every accounting ZIP/export endpoint response.
10. Add binary comparison against the immediately previous uploaded zip in the build tooling and populate `previous_zip_binary_comparisons`.
11. Render dashboard notification snooze/dismiss buttons on every real warning card, not only the helper panel.
12. Add phone-only Release Control cards to `/admin/release-control/` using `mobile_release_control_layout_runs`.
13. Show structured-data excerpts beside each public URL row on `/admin/deployment-preflight/`.
14. Add release-control per-row pass/block buttons directly to rollback, manifest, Cloudflare match, and smoke-test tables.
15. Add a manifest drawer UI with filters for `admin`, `functions`, `schema`, `data/site`, and public HTML paths.
16. Add visible deploy-readiness score trend charts beside the Markdown export button.
17. Auto-match Cloudflare deployments immediately after deployment import and mirror rows into `cloudflare_deployment_auto_matches`.
18. Disable the final Promote Live button visually using `promote_live_ui_gate_states` before the action is submitted.
19. Add a one-click run from Post-Deploy Smoke Tests that queues and then executes the post-promotion watcher.
20. Add a public-page content refresh pass for more Southern Ontario handmade gift, custom jewelry, laser engraving, candle, and soap phrases without adding extra H1 tags.

# Build 179 Completed Pass — Promotion Control, Final Go-Live Gates, Local SEO Visuals, Recall Release Gates, and Post-Promotion Watch

Completed in this pass:
1. Added `/admin/promotion-control/` as the final go-live gate after Release Control and Deploy Readiness.
2. Added `/api/admin/promotion-control` with guarded admin actions for Build 179 controls.
3. Added `database_build179_promotion_control.sql` and updated aggregate schema files with the same additive tables.
4. Added Product QA safe-apply rules for SEO title casing, empty status labels, and existing alt-text fixes, all confirmation-gated.
5. Added local SEO mini-chart configuration rows for Search Console trend visuals.
6. Added internal-link graph snapshot storage with node/edge/missing-link counts.
7. Added LocalBusiness draft approve-and-bake rows tied to `data/site/local-business-schema.json` and injection targets.
8. Added provider webhook signature setup checks for Resend, SendGrid, and Postmark bindings/headers.
9. Added R2 signed URL expiry test rows that separate object lifecycle from signed-route expiry verification.
10. Added recall signature evidence upload records with direct R2 upload support when an evidence bucket is bound.
11. Added recall notification release gates requiring copy review, signature evidence, and customer match review before notices can release.
12. Added accounting ZIP export links that connect ZIP checksums, safe deploy downloads, and accountant evidence traceability.
13. Added previous ZIP manifest import comparison records for prior artifact diff handoff.
14. Added dashboard notification card action rows for dismiss/snooze behaviour.
15. Added mobile release-control rendering preferences for compact phone-first cards and large tap targets.
16. Added structured-data page preview rows with page-specific JSON-LD excerpts and issue counts.
17. Added marketplace export download gates so CSV download buttons can be blocked by hard validation failures.
18. Added rollback row action records plus manifest path filter run records for more exact release review.
19. Added readiness Markdown export rows and Cloudflare deployment-to-release match rows by build/branch/commit/manifest.
20. Added Promote Live attempt rows and post-promotion incident watcher rows for 404/500/provider follow-up.

Next 20 recommended steps:
1. Wire the Product QA safe-apply rules into the actual catalog update endpoint for SEO-title casing and empty status labels.
2. Add a real chart drawing layer on Local SEO Review using the Build 179 chart config rows and Search Console trend points.
3. Add an interactive internal-link graph canvas with click-through source/target page filters.
4. Add a static bake script that consumes approved LocalBusiness bake rows and rewrites `data/site/local-business-schema.json` from exported D1 data.
5. Complete cryptographic webhook signature verification in the deployed webhook endpoints for Resend, SendGrid, and Postmark.
6. Add a real signed-download Worker route with expiry enforcement and connect it to `r2_signed_url_expiry_tests`.
7. Add drag-and-drop recall signature evidence upload UI to the recall admin page, not only Promotion Control.
8. Enforce `recall_notification_release_gates.release_status='release_allowed'` directly inside every recall notification send endpoint.
9. Write accounting ZIP export rows directly from the accountant export endpoint whenever the ZIP is generated.
10. Add previous uploaded ZIP binary comparison in the build tooling so the manifest import no longer depends on pasted JSON.
11. Render dashboard notification snooze/dismiss buttons directly on the main admin dashboard cards.
12. Add a phone-only Release Control layout using the mobile render preferences and saved card list.
13. Add structured-data preview excerpts directly beside each public-page row in Deployment Preflight.
14. Block marketplace CSV downloads from the export endpoint when `marketplace_export_download_gates` has hard blockers.
15. Add per-row rollback pass/block buttons directly on the Release Control table.
16. Add a manifest filter drawer to Release Control using `release_manifest_path_filter_runs` results.
17. Add visible deploy-readiness score trend charts and one-click Markdown download from the latest export row.
18. Match Cloudflare deployments to release records automatically after each deployment import.
19. Disable the final Promote Live button in the UI until the latest attempt would pass all gates.
20. Schedule or manually run the post-promotion incident watcher from the smoke-test page after each live promotion.

# Build 178 Completed Pass — Deploy Readiness Page, Promote-Live Guardrails, Marketplace Validation, Recall Copy Review, and Structured-Data Hints

Completed in this pass:
1. Added a dedicated `/admin/deploy-readiness/` page with score history, source drilldowns, final checklist, manifest path rows, QA confirmations, recall copy review, provider checks, LocalBusiness drafts, schema hints, and mobile release cards.
2. Added `/api/admin/deploy-readiness` for deploy-readiness summaries, final promote-live checklist seeding, drilldown rows, QA apply confirmations, recall copy review rows, signature placeholders, provider/R2 checks, local SEO visuals, LocalBusiness drafts, schema hints, and notification snoozes.
3. Added `database_build178_promote_live_controls.sql` with safe new tables only, avoiding risky repeat `ALTER TABLE ADD COLUMN` statements.
4. Added final promote-live checklist storage in `deployment_promote_live_checklist` with required/pass/block controls.
5. Added deploy-readiness drilldown rows so blockers can be grouped by preflight, manifest, smoke test, rollback, and D1 marker source.
6. Added manifest diff view filters and copy buttons so changed/missing paths are easier to inspect and hand off.
7. Added Product QA apply confirmation rows before approved groups can move toward automatic apply.
8. Added marketplace real export-row validation results and a validation button inside Marketplace Export Preview.
9. Added recall customer notification copy review rows before recall drafts are queued.
10. Added recall compliance signature evidence placeholder rows for batch-level approval support.
11. Added gift-card provider webhook verification log rows for Resend, SendGrid, and Postmark signature-review setup.
12. Added R2 signed URL verification result rows with guarded live bucket checks.
13. Added local SEO chart-point rows and internal-link map edges from Search Console/imported suggestion data.
14. Added LocalBusiness schema edit draft rows so structured-data changes can be reviewed before baking.
15. Added structured-data validation hints for LocalBusiness, Product, BreadcrumbList, and FAQPage blocks.
16. Added previous ZIP comparison storage for future uploaded-build comparison summaries.
17. Added dashboard notification snooze storage groundwork.
18. Added mobile Release Control card rows for deploy score, manifest diff, recall locks, ZIP download, and promote-live checklist.
19. Updated admin navigation, Release Control links, Safe Deploy package contents, schema SQL files, schema references, and handoff documentation for Build 178.
20. Ran validation for JavaScript syntax, Python scripts, SQL migration smoke tests, one-H1, CSS brace balance, JSON parsing, and zip integrity.

Next 20 recommended steps:
1. Wire Product QA apply actions so SEO title casing and empty status-label fixes require Build 178 confirmation rows before applying.
2. Add a real visual mini-chart component for Search Console trend rows instead of table-only chart-point output.
3. Add a true interactive internal-link graph view with source/target clustering and missing-link suggestions.
4. Connect LocalBusiness edit drafts to an approve-and-bake action that updates `data/site/local-business-schema.json` and injection targets.
5. Add provider-specific webhook signature verification using deployed secrets and real Resend/SendGrid/Postmark headers.
6. Add a signed URL worker route test that verifies URL generation and access expiry, not only R2 object operations.
7. Connect recall signature evidence uploads directly to R2 from the deploy-readiness or recall admin page.
8. Require approved recall copy reviews before any candle/soap recall notification leaves draft status.
9. Link accountant ZIP checksum rows directly to the accountant export download response and Safe Deploy records.
10. Add previous uploaded zip comparison import so Build 178 comparison rows are populated from the actual prior artifact manifest.
11. Add dismiss/snooze buttons directly on dashboard notification cards and hide active snoozes until expiry.
12. Add mobile-only Release Control card rendering with compact buttons and large tap targets.
13. Add schema.org validation preview details per public page with page-specific JSON-LD excerpts.
14. Add marketplace validation result badges beside each CSV download button and block downloads with hard blockers unless manually overridden.
15. Add per-row rollback checklist buttons inside Release Control, matching the promote-live checklist controls.
16. Add exact manifest path filters to Release Control UI using `release_manifest_diff_view_filters`.
17. Add deployment readiness score trend charts and exportable Markdown summaries.
18. Add Cloudflare Pages deployment-to-release matching by branch, commit SHA, and manifest hash.
19. Add final Promote Live action that remains disabled until score, smoke, rollback, D1 markers, manifest, R2/email, and release notes are passed.
20. Add a post-promotion incident watcher that creates runtime incident rows for 404/500 spikes and failed provider webhooks.


# Build 177 Completed Pass — Deploy Score, Exact Manifest Diff, QA Approval, Recall Customer Preview, and JSON-LD Bake

Completed in this pass:
1. Added real Cloudflare Pages deployment import support when account, project, and scoped API token bindings are present.
2. Kept Cloudflare import fully guarded when bindings or token are missing, with visible admin setup rows instead of hard failures.
3. Added direct rollback checklist status controls in Release Control so rows can be marked passed, blocked, or left for review.
4. Added exact release manifest diff item rows for missing, changed, and extra file paths.
5. Added Release Control visual tables for exact manifest path-level differences.
6. Added Product QA preview approval records so each bulk-fix group can be marked safe, skipped, or manual-only before apply.
7. Added the first low-risk Product QA apply action for missing image alt text only, with apply-event logging.
8. Added marketplace validation rule editor rows for Etsy, Facebook, Pinterest, and manual CSV columns.
9. Added recall customer match preview rows from product batch/order joins where data exists.
10. Added recall notification API enforcement so notices cannot leave draft/review unless the batch has a release_allowed lock.
11. Added provider-safe webhook/signature tracking groundwork retained from Build 176 and expanded release-control visibility around related safety checks.
12. Added live R2 private evidence create/get/delete health test rows, guarded behind available private bucket bindings.
13. Added accounting ZIP checksum link table for connecting accounting evidence bundle hashes to package/download records.
14. Added LocalBusiness JSON-LD injection targets for homepage and local landing pages.
15. Added a static JSON-LD bake script and injected managed LocalBusiness JSON-LD blocks into key public/local pages.
16. Added internal-link suggestion approval action that writes approved rows into local SEO bake actions.
17. Added dashboard notification cards sourced from release, manifest, recall, and deploy-readiness status.
18. Added deploy-readiness scoring that combines preflight blockers/warnings, manifest differences, smoke-test results, rollback checklist rows, and D1 migration markers.
19. Updated Safe Deploy ZIP metadata and D1 order to include Build 177.
20. Updated schema SQL, schema references, roadmap, known gaps, release notes, sanity notes, local SEO notes, README, and build handoff documentation for Build 177.

Next 20 recommended steps:
1. Add a dedicated `/admin/deploy-readiness/` page with score history charts and drilldowns by blocker source.
2. Add per-row buttons beside rollback checklist rows instead of the current API-level status action.
3. Add direct path filters and copy buttons to the exact manifest diff table.
4. Add a confirmation modal before applying Product QA alt text fixes.
5. Expand safe Product QA apply actions to SEO title casing and empty status labels only after preview approval.
6. Move marketplace rule editing into `/admin/marketplace-exports/` and show rule failures directly beside CSV download buttons.
7. Add marketplace validation against real export row payloads, not just required-column rules.
8. Add customer-facing recall preview copy review cards before notification drafts can queue.
9. Add recall compliance signature upload/evidence attachment support.
10. Add provider-specific webhook signature verification math for Resend, SendGrid, and Postmark using stored secrets.
11. Add R2 signed URL generation verification, not just create/get/delete object checks.
12. Link accountant ZIP checksum rows directly from the accounting export endpoint.
13. Add Search Console trend mini charts beside each local SEO review row.
14. Add a visual internal-link map showing source and target landing pages.
15. Add LocalBusiness schema editing fields directly in Release Control instead of JSON-only preview.
16. Add schema.org validation hints for Product, LocalBusiness, BreadcrumbList, and FAQ JSON-LD blocks.
17. Add deploy package comparison against the previous uploaded zip for a human-friendly changed-file summary.
18. Add dashboard notification card dismiss/snooze controls.
19. Add mobile-only Release Control cards for deploy score, manifest diff, recall locks, and ZIP download.
20. Add a final “promote live” guarded checklist requiring score, smoke tests, rollback, D1 markers, and manifest diff to pass.

# Build 176 Completed Pass — Safe Deploy ZIP, Live Manifest Diff, QA Previews, Recall Locks, and Local SEO Controls

Completed in this pass:
1. Added true binary-safe Safe Deploy ZIP download support at `/api/admin/safe-deploy-package?format=zip` with a package index and SHA-256 response header.
2. Added D1 tracking for safe deploy package download records, included file counts, byte totals, ZIP SHA-256, and skipped/missing package-file notes.
3. Added live deployed-manifest comparison from Release Control so `/data/site/release-package-manifest.json` can be compared against a deployed manifest URL.
4. Added release-manifest live diff storage with missing, changed, and extra file counts.
5. Added Product QA bulk-fix preview item rows with product IDs, blocker codes, exact focus fields, suggested values, and editor fix URLs.
6. Added a Release Control action to build Product QA preview cards from the latest failed QA results.
7. Added marketplace export validation preview runs before CSV generation so required-column rules can be reviewed by channel.
8. Added visible marketplace snapshot diff and validation tables on `/admin/release-control/`.
9. Added recall notification lock rows so recall notices remain locked until an approved compliance review exists.
10. Added a Release Control action to refresh recall locks from candle/soap recall rows and draft notification queues.
11. Added gift-card webhook signature-check storage for provider signature status, replay-window notes, and event linkage.
12. Added local SEO internal-link suggestion rows for source path, target path, anchor text, score, and review status.
13. Added local SEO Search Console trend rows for page/query clicks, impressions, CTR, and average position history.
14. Expanded LocalBusiness schema support with logo, image, price range, payment methods, opening hours, address, and geo fields through a companion schema-extension table and bake tracking.
15. Added LocalBusiness schema bake tracking for approved static JSON-LD output into `data/site/local-business-schema.json`.
16. Added a phone-first Release Control JSON view for compact deployment review.
17. Added rollback checklist rows linking release history, manifest diffs, smoke tests, R2 checks, D1 migration state, and release notes.
18. Added Cloudflare deployment import setup checks that safely report missing account/project/token configuration without failing the admin page.
19. Added admin notification route rows so preflight/release/recall warnings have dashboard destinations.
20. Updated schema references, deployment preflight expectations, static checks, release package guidance, Markdown handoff files, and local business static JSON for Build 176.

Next 20 recommended steps:
1. Add a real Cloudflare Pages API deployment import when a scoped API token is present, with branch/commit/build URL matching into `deployment_history`.
2. Add direct status controls for rollback checklist rows so each required rollback item can be marked passed/blocked with notes.
3. Add a release manifest visual diff drawer that lists the exact missing/changed/extra file paths from `release_manifest_live_diffs.diff_json`.
4. Add Product QA preview approval controls that can mark a preview group safe, skipped, or manual-only before any apply action is enabled.
5. Add the first low-risk Product QA apply action for generated image-alt suggestions only, with before/after logging.
6. Add channel-specific marketplace validation directly into `/admin/marketplace-exports/` download buttons, not only Release Control.
7. Add marketplace validation rule editor controls for Etsy, Facebook, Pinterest, and manual CSV columns.
8. Add recall customer preview generation from actual order/product/batch joins instead of only lock rows and draft queues.
9. Add recall send-unlock enforcement inside the recall notification API so draft rows cannot be promoted without a matching approved lock.
10. Add provider-specific signature verification helpers for Resend, SendGrid, and Postmark gift-card webhooks.
11. Add a live R2 signed-download create/get/delete test for private accountant/customer evidence objects.
12. Add accountant ZIP checksum writing directly inside the accounting export endpoint and link it to Safe Deploy records.
13. Add LocalBusiness schema editing controls on Release Control, including opening hours and sameAs social profile entry fields.
14. Add static JSON-LD injection into the homepage and local SEO landing pages during the bake script.
15. Add Search Console trend charts per local SEO page row using the new trend table.
16. Add internal-link suggestion approval that writes approved bake actions into `local_seo_bake_actions`.
17. Add a compact mobile Release Control page layout that hides long tables and shows only blockers, ZIP download, manifest compare, and recall locks.
18. Add dashboard notification cards sourced from `admin_notification_routes` and recent preflight/manifest/recall warnings.
19. Add release package ZIP download history into `/admin/safe-deploy-package/` with SHA-256 copy buttons.
20. Add a final deploy-readiness score that combines preflight, manifest diff, smoke test results, rollback checklist, and D1 migration markers.

# Build 175 Completed Pass — Release Control, Deeper Preflight, Mobile Saved Views, and LocalBusiness Schema

Completed in this pass:
1. Added `/admin/release-control/` as a release-control center for deployment history, manifest comparison, screenshot jobs, mobile views, safe deploy export records, and LocalBusiness schema preview.
2. Added `/api/admin/release-control` with guarded admin actions for deployment records, dark-theme screenshot job queueing, phone saved-view seeding, local business schema saving, and safe deploy export records.
3. Added `database_build175_release_control.sql` as an additive D1 migration with `file_name` populated in the migration ledger marker.
4. Added deployment history tracking for branch, commit, deploy URL, build ZIP label, manifest hash, promotion status, and notes.
5. Added deployed-manifest comparison records for expected/deployed file counts, missing files, changed files, and comparison JSON.
6. Added dark-theme screenshot evidence job rows with page path, viewport, theme, R2 object key, evidence URL, and capture status.
7. Added response-body keyword checks to Deployment Preflight so top public URLs are checked for required local/search terms, not only H1/title/meta.
8. Added collection/category landing-page preflight checks for exposed supporting pages.
9. Added sample public product-detail URL checks using the newest available D1 product slug.
10. Added Search Console/internal-link visibility checks so local SEO bake actions can surface internal-link opportunities beside page rows.
11. Added Product QA bulk-fix queue schema and preflight visibility for grouped blocker codes and approval-required safe fixes.
12. Added R2 signed/private evidence health-test rows and preflight warnings when private-download flags are enabled without a passing test.
13. Added accountant evidence bundle checksum rows so ZIP hash, byte totals, and verification status can be tracked after export.
14. Added gift-card provider webhook event storage for delivery, bounce, complaint, retry, and provider message status events.
15. Added marketplace required-column validation rules and snapshot diff rows for channel-level export safety.
16. Added recall compliance review rows with legal/compliance notes and approval signatures, plus customer-specific recall preview rows.
17. Added mobile admin saved views for Today tasks, Deployment Preflight, Smoke Tests, and Accounting close workflows.
18. Added LocalBusiness structured-data settings plus static `data/site/local-business-schema.json` output for Devil n Dove service-area/local SEO review.
19. Added safe deploy export records so release notes, preflight Markdown, manifest JSON, schema SQL, and smoke-test results can be packaged and tracked.
20. Added runtime-incident linking from saved preflight snapshots so failed/warn preflight checks can create reviewable admin incidents.

Next 20 recommended steps:
1. Add a true browser/headless screenshot capture worker or external GitHub Action to complete screenshot jobs automatically instead of queueing browser-assisted evidence rows.
2. Add live deployed-manifest fetch/compare action that reads the deployed `/data/site/release-package-manifest.json` and stores the diff automatically.
3. Add a safe deploy export ZIP endpoint that bundles Markdown, manifest JSON, schema SQL, and smoke-test JSON into one downloadable support package.
4. Add channel-specific marketplace validation previews directly on the export-download buttons before CSV files are generated.
5. Add visual marketplace side-by-side diff tables using `marketplace_export_snapshot_diffs.diff_json`.
6. Add Product QA bulk-fix preview cards that list exact fields/products before approval.
7. Add approved Product QA bulk-fix apply actions for only low-risk fields such as missing alt text, title casing, and empty status labels.
8. Add provider-specific webhook signature verification for Resend, SendGrid, and Postmark gift-card delivery events.
9. Add recall compliance lock so recall notification queue rows cannot move from draft unless a signed review row exists.
10. Add customer recall preview generation from actual order/product/batch joins.
11. Add R2 signed-download create/get/delete live action for accountant evidence attachments and private customer uploads.
12. Add accountant ZIP checksum calculation into the actual export endpoint so hashes are generated at download time.
13. Add Search Console import trend graphs per local SEO page row.
14. Add local internal-link suggestion generation from sitemap and page body keyword overlap.
15. Add LocalBusiness schema editor fields for opening hours, social profiles, logo, pickup/service area, and accepted payment types.
16. Add static bake output that injects approved LocalBusiness JSON-LD into the homepage and local landing pages.
17. Add phone-first Release Control view with only the four most important deploy actions.
18. Add notification routing when preflight creates runtime incidents so blockers show on the dashboard.
19. Add deployment-history import from Cloudflare Pages API if a token/binding is configured.
20. Add rollback checklist rows that connect deployment history, manifest comparison, smoke tests, and D1 migration state before reverting.

# Build 174 Completed Pass — Deployment Preflight Detail, Schema Diff, Release Manifest, and Post-Deploy Confirmations

Completed in this pass:
1. Added richer Deployment Preflight detail drawers for public page SEO, schema.org, canonical, image-alt, and fallback checks.
2. Added title/meta length scoring to preflight so local landing pages stay inside practical SEO review ranges.
3. Added canonical URL checks for the public local SEO landing-page set.
4. Added image alt-text checks and featured/fallback visibility into preflight output.
5. Added schema.org JSON-LD preview/validation rows for public pages.
6. Added low-bandwidth/offline fallback signal checks for key public pages.
7. Added expected live D1 schema diff rows directly into Deployment Preflight.
8. Added migration history detail output showing expected marker, SQL file, status, and operator notes.
9. Added a safe SQL planner for fresh database, partially upgraded database, and repair-only workflows.
10. Added a Markdown export option for Deployment Preflight support handoff.
11. Added JSON-to-D1 duplicate ownership checks for catalog, inventory, and local SEO bake actions.
12. Added relationship integrity checks for products, images, SEO rows, public proof candidates, and trust placements.
13. Added R2 route/bucket visibility checks into the Deployment Preflight result set.
14. Added post-deploy confirmation workflow rows for D1, preflight, public pages, smoke tests, release notes, and R2/email review.
15. Added `deployment_post_deploy_confirmations` as an additive Build 174 D1 table.
16. Added `database_build174_deployment_preflight_detail.sql` with a required `file_name` migration-ledger marker.
17. Added a generated release package manifest with SHA-256 file hashes for schema, functions, admin pages, public JS, CSS, Markdown, and static site data.
18. Added automatic SANITY_HEALTH_CHECK regeneration from `data/site/deployment-preflight.json`.
19. Added a dashboard Preflight badge so the desktop admin dashboard shows latest blocker/warning counts.
20. Updated schema reference, migration ledger expectations, DB sanity checks, release notes, and safe deploy package guidance for Build 174.

Next 20 recommended steps:
1. Add live screenshot capture automation for the Deployment Preflight page so dark-theme checks can store before/after images without manual upload.
2. Add a Cloudflare Pages deployment-history table that records branch, commit, build zip label, deploy URL, and who promoted it.
3. Add automatic comparison between the release package manifest and the deployed static manifest after upload.
4. Add preflight response-body keyword checks for the top public URLs, not just HTTP status and HTML structure.
5. Add product-detail sample URL checks using the newest published product slug and a fallback known-safe slug.
6. Add collection/category landing-page checks for every exposed product collection.
7. Add Search Console query import trend summaries directly beside each local SEO page row.
8. Add automatic local SEO internal-link suggestions from high-traffic pages into the bake-action queue.
9. Add an admin queue that groups Product QA blockers by fix type and applies safe bulk fixes only after approval.
10. Add R2 signed download tests for accountant evidence and private customer uploads.
11. Add evidence-bundle checksum verification after accountant ZIP generation.
12. Add gift-card provider webhook ingestion for delivery, bounce, complaint, and retry statuses.
13. Add marketplace export channel-specific required-column validation before each download.
14. Add visual side-by-side marketplace snapshot diff with exact row/field changes.
15. Add recall legal/compliance review notes and approval signatures before customer notifications can leave draft status.
16. Add customer-specific recall notification previews with product/order/batch grouping.
17. Add mobile admin saved views for Today tasks, Preflight, Smoke Tests, and Accounting close.
18. Add a one-click “safe deploy export” ZIP containing release notes, preflight Markdown, manifest JSON, schema SQL, and smoke-test results.
19. Add runtime incident auto-linking from failed preflight checks to the affected admin/public page.
20. Add a local business structured-data editor with validation and static bake output for Devil n Dove contact/service area details.

# Build 173 Completed Pass — Deployment Preflight, D1 Safety, and Local SEO Release Guardrails

Completed in this pass:
1. Added `/admin/deployment-preflight/` as a dedicated deploy-readiness page.
2. Added `/api/admin/deployment-preflight` to check D1 ledger safety, public SEO basics, CSS drift, static JSON fallbacks, and core admin page health.
3. Added D1 detection for the exact Build 171 pattern where tables/columns exist but the ledger marker is missing.
4. Added a safe recommendation to run `database_build171_ledger_repair.sql` instead of rerunning the full upgrade when Build 171 objects already exist.
5. Added `deployment_preflight_runs` so admins can save preflight snapshots before live deploys.
6. Added `database_build173_deployment_preflight.sql` as an additive, non-destructive D1 migration.
7. Added the Build 173 migration marker with `file_name` populated to avoid the previous NOT NULL ledger failure.
8. Updated `database_schema.sql`, `database_full_schema.sql`, `database_store_schema.sql`, and `database_upgrade_current_pass.sql` with the Build 173 table/reference.
9. Added `scripts/deployment_preflight_static_check.py` for no-network package validation.
10. Generated `data/site/deployment-preflight.json` from the static preflight script.
11. Updated `scripts/generate_release_notes.py` so release notes include post-deploy actions and validation.
12. Updated Migration Ledger expectations to include Build 171 and Build 173 markers.
13. Updated Schema Drift and DB Sanity expectations to include `deployment_preflight_runs`.
14. Added a dashboard card linking directly to Deployment Preflight.
15. Added an Operations page link and explanation for the preflight workflow.
16. Added status-pill/table CSS helpers used by the new admin review page.
17. Rechecked the main public local SEO pages for one H1, title, meta description, and required local/search wording.
18. Rechecked CSS brace balance and static JSON parse health.
19. Updated release documentation and post-deploy notes around the safe D1 repair order.
20. Preserved the existing Build 171/172 hotfix repair path while adding the next safe migration layer.

Next 20 recommended steps:
1. Add a D1 migration history detail drawer that shows the exact SQL file, marker, and operator notes for each saved migration.
2. Add a preflight diff between the current live database schema and the expected schema reference file.
3. Add an admin button that exports the latest preflight result to Markdown for support handoff.
4. Add preflight checks for every public landing page image alt text and featured image fallback.
5. Add local SEO title/meta length scoring into the Deployment Preflight page.
6. Add JSON-to-D1 duplicate ownership checks for Tools, Supplies, featured items, and local SEO bake actions.
7. Add a safe migration planner that lists which SQL files to run for fresh database vs already-partially-upgraded database.
8. Add a D1 data-integrity report for product/image/story/trust-block relationships.
9. Add automatic release-note changed-file detection from the zip contents rather than manually maintained JSON.
10. Add a public-page schema.org structured-data preview row to the preflight page.
11. Add canonical URL checks for all exposed local landing pages.
12. Add mobile layout screenshot checklist rows to the Deployment Preflight page.
13. Add low-bandwidth/offline fallback checks for shop, product detail, and gallery pages.
14. Add admin dashboard badges for latest preflight status and latest saved snapshot time.
15. Add automatic SANITY_HEALTH_CHECK regeneration from `data/site/deployment-preflight.json`.
16. Add a release package manifest with file hashes for schema, functions, admin pages, and public JS.
17. Add safer SQL copy blocks for D1 Console with separate fresh-install and repair-only sections.
18. Add R2 route health checks into the same Deployment Preflight result table.
19. Add smoke-test quick links that open each failed/warn page in a new tab.
20. Add a post-deploy confirmation workflow that marks each action done and records the admin user/time.

# Build 171 Completed Pass — Admin Safety, Release Readiness, and Local SEO Controls

Completed this pass:

1. Added binary-safe accountant ZIP evidence bundling that can include small PDF/image receipts only when R2 fetch is explicitly enabled.
2. Added accountant bundle totals and skipped-attachment warnings before ZIP download.
3. Added a dark-theme screenshot evidence admin page with R2 upload, status changes, and public landing-page checklist rows.
4. Added direct Product QA fix links that open the product editor and focus the exact field tied to the blocker.
5. Added public-proof candidate consent source linking, placement previews, and promotion-context handling.
6. Added trust-block placement preview support on the Trust Blocks admin page.
7. Added gift-card provider adapters/log rows for Resend, SendGrid, Postmark, and manual mode.
8. Added gift-card customer history cards in both Gift Card Admin and the member/customer admin view.
9. Added visible gift-card lockout release controls in the Gift Card Admin page.
10. Added marketplace export snapshot diff, replay, whole-channel rollback, and clear-channel selection controls.
11. Added R2 derivative worker route settings plus a create/delete tiny-object health check.
12. Confirmed derivative-to-featured image controls exist in the product image derivative strip and documented the route health check.
13. Added candle/soap recall customer match preview and an approval gate before notification drafts can queue.
14. Added Local SEO D1 bake-action JSON export and a static deploy placeholder at `data/site/local-seo-bake-actions.json`.
15. Added competitor phrase score-history logging and phrase badges on local SEO landing-page rows.
16. Added desktop Today task filters, min-count filtering, and snooze duration selection.
17. Added post-deploy smoke-test quick-run support and admin dashboard result badges.
18. Added deployment-blocker checklist content to `SANITY_HEALTH_CHECK.md`.
19. Added a release-notes API/page and generated release summary data.
20. Added a Safe Deploy Package admin page showing schema, changed files, and required post-deploy actions.

Next 20 recommended steps:

1. Add signed, expiring R2 download links for accountant evidence instead of relying on public URLs.
2. Add per-file checksum rows to accountant ZIP manifest and evidence index.
3. Add live screenshot capture automation for dark-theme public pages.
4. Add visual diff thumbnails for dark-theme evidence comparisons.
5. Add a reusable editor-field registry so every admin QA code maps to one source of truth.
6. Add bulk Product QA repair queue for common missing SEO/image fields.
7. Add public-proof preview rendering using the exact destination page component.
8. Add trust-block A/B placement rotation and performance notes.
9. Add provider webhook ingestion for gift-card email delivery events.
10. Add gift-card failed-send retry rules with max attempts and backoff.
11. Add marketplace export snapshot side-by-side UI instead of alert-only diff summaries.
12. Add marketplace CSV validation rules per channel with required column status.
13. Add R2 derivative worker route self-test that validates public URL fetch, not only object create/delete.
14. Add recall legal/compliance review notes before customer-facing send approval.
15. Add recall draft preview with exact customer-specific message content.
16. Add local SEO phrase trend chart from score history.
17. Add Search Console query import mapping to local SEO bake actions.
18. Add Today task saved views per admin role.
19. Add smoke-test screenshots and response body keyword checks.
20. Add a one-click final release package export that includes release notes, schema migration, smoke results, and changed-file manifest.

# Build 159 roadmap update

Completed in this pass:

- Repaired the Catalog Product Editor image workflow so saved product image URLs are visible as thumbnail cards in the Product pictures section.
- Added click-to-edit, Make first, Remove, and drag-to-reorder controls to the inline image cards.
- Synchronized the first visual card to `featured_image_url` and the remaining cards to the gallery URL fields.
- Prevented existing product loads from duplicating the featured image into Image URL 1.
- Kept the deeper Product Media Workflow as the source for advanced image roles, consent/public-use status, crop history, merchandising score, and delete-row/save behavior.

Next build priorities:

1. Add direct thumbnail-card crop/focal-point editing instead of only URL focus.
2. Add a visible “save image order” confirmation tied to both Product Editor and Product Media Workflow.
3. Add product readiness badges beside the visual cards for hero/front, detail, scale, public-use, and alt text coverage.
4. Add bulk replace/compress tools for images that are too small, portrait-only, or missing alt text.
5. Add dashboard counters for products missing required image roles.

# Build 156 roadmap update

Completed in this pass:

- Added public Custom Candle Making and Custom Soap Making landing pages with one H1 each, local SEO wording, and Custom Request prefill links.
- Added stricter admin payment-share gates before approved custom payment links can be copied or used externally.
- Connected approved payment links to provider checkout preparation records for Stripe, PayPal, Square, and manual fallback.
- Added private customer order-status links for converted custom-request orders.
- Added marketplace CSV downloads for Etsy, Facebook Marketplace, Pinterest, and manual listing review workflows.
- Added public private-token consent/review/photo response pages for post-fulfillment prompts.
- Added related-product proof matching on product detail pages using material, process, locality, product type, and proof metadata.

Next build priorities:

1. Convert provider checkout preparation from safe handoff records into live Stripe/PayPal/Square redirect verification once production credentials are confirmed.
2. Add admin void/resend controls for payment, order-status, and consent-response links.
3. Add customer-facing order status updates for production stages, pickup/shipping notes, and fulfillment photos.
4. Add marketplace CSV presets per channel category, shipping profile, taxonomy, and tags.
5. Add consent-response follow-through into public trust blocks and product stories after admin review.
6. Add mobile capture shortcuts for candle/soap batches, scent notes, batch numbers, ingredients, and safety/allergen notes.
7. Add schema drift repair actions for all Build 156 runtime-added columns.

# Build 154 roadmap update

Completed in this pass:

- Connected accepted custom quote previews to review-needed payment-request and order-draft records.
- Added editable custom quote line items for material, labour, pickup/shipping, custom charges, and taxable/non-taxable planning.
- Added quote totals for material cost, labour cost, pickup/shipping estimate, tax estimate, and quote total.
- Added quote revision history for created/shared/changed/declined/accepted follow-through events.
- Added media-consent review records for uploaded custom-request reference images.
- Added accountant export ZIP packaging with close-summary CSV, evidence-index CSV, and manifest JSON.
- Added static SEO override JSON fallback and `scripts/bake_approved_seo_overrides.py` for deploy-time title/meta/internal-link baking.
- Added public gallery/proof filters by material, process, locality, and product type.

Next build priorities:

1. Convert reviewed payment-request drafts into real payment-link records only after admin approval.
2. Convert reviewed order drafts into real orders with quote line items, tax, pickup/shipping, deposit, and balance state.
3. Add quote revision resend flow and versioned private preview links.
4. Add marketplace export packs for Etsy, Facebook Marketplace, Pinterest, and manual listings.
5. Extend proof filters into shop/product list APIs and product detail proof sections.
6. Add post-fulfillment review/photo/consent prompts.
7. Add a mobile workshop capture flow for image role, consent, story note, and social caption draft.

# Build 153 completed — private quote previews, accept/decline tracking, and custom-request reference uploads

Completed in Build 153:

1. Added token-protected private quote preview links for custom request quote drafts.
2. Added public `/custom-request/quote/` preview page with `noindex,nofollow` so private quote links are not search-index targets.
3. Added public `/api/custom-request-quote` GET endpoint for loading private quote previews by token.
4. Added public `/api/custom-request-quote` POST endpoint for customer accept/decline response tracking.
5. Quote acceptance/decline now updates the custom request status, quote draft status, quote share link status, and conversion event history.
6. Added Operations > Custom Requests button for creating private quote preview links after quote/deposit/invoice planning.
7. Added Operations panel for viewing/copying private quote preview links and seeing accepted/declined responses.
8. Added post-submit reference image upload support for custom request forms.
9. Added `/api/custom-request-reference-upload`, using request-bound upload tokens, image-only validation, 8 MB limit, and 5-file limit.
10. Reference uploads are stored as private-review-only media until admin review/consent clears public use.
11. Public custom request form now lets customers choose reference images while preserving pasted reference URL support.
12. Upload failures do not destroy the written request; the form reports the upload issue and keeps the intake safe.
13. Added D1 schema support for `custom_request_quote_share_links` and `custom_request_reference_uploads`.
14. Updated active schema SQL files and all active Markdown handoff docs.
15. Added CSS/mobile polish for quote previews, reference uploads, and the Custom Requests action cluster.
16. Updated predeploy sanity checks to cover Build 153 assets.

Next strongest build pass:

1. Connect accepted quote previews to a reviewed payment-request/order draft bridge.
2. Add admin-editable quote line items, tax estimate, pickup/shipping estimate, and material/labour estimate fields.
3. Add customer quote revision tracking so declined/not-now responses can become revised quote drafts.
4. Add admin media-consent review rows for uploaded custom-request reference images.
5. Add marketplace-ready exports for accepted custom product plans.
6. Add accountant export ZIP packaging with CSV bundle and evidence index.
7. Bake approved SEO overrides into static HTML during deployment.
8. Add proof/gallery filters by material, process, locality, and product type.
9. Add follow-up notification queue entries after quote acceptance, deposit candidate creation, and request inactivity.
10. Add phone-first workshop capture: photo, crop, role, consent, story note, caption draft.

# Build 152 completed — custom request reply templates, deposit/invoice candidates, and HST/GST reminder queue

Completed in Build 152:

1. Added manual customer reply templates generated from custom request quote drafts.
2. Added Operations UI for viewing/copying customer reply templates without auto-sending.
3. Added D1 table `custom_request_reply_templates`.
4. Added deposit candidate generation from custom request quote drafts.
5. Added invoice candidate generation from custom request quote drafts.
6. Added D1 table `custom_request_payment_candidates`.
7. Added conversion-event logging for reply templates, deposit candidates, and invoice candidates.
8. Kept all custom request payment records as internal candidates so no customer is billed accidentally.
9. Added HST/GST reminder queuing from the Accounting Close Workflow.
10. Ensured `notification_outbox` exists before reminder queue operations.
11. Added Accounting Close UI button to queue the reminder using the selected period/reminder date.
12. Added CSS polish for reply template cards and phone-friendly custom request action buttons.
13. Updated active schema SQL files with Build 152 tables and ledger marker.
14. Updated Markdown handoff documents and competitive notes for the new workflow.
15. Re-ran JS syntax, CSS brace, H1/title/meta, predeploy, and ZIP integrity checks before packaging.

Next strongest build pass:

1. Add a real payment-request/invoice bridge from custom request payment candidates into the existing payment/order system.
2. Add customer-ready quote preview pages that are private/link-token protected.
3. Add R2 upload for custom request reference images so customers do not need to paste public links.
4. Add quote acceptance/decline tracking and deposit-paid status.
5. Add accountant export ZIP packaging with CSV files plus evidence index.
6. Bake approved SEO overrides into static HTML during deploy.
7. Add marketplace readiness exports for Etsy/Facebook/Pinterest/manual listing copy.
8. Add proof filters by material, process, locality, and product type.
9. Add phone-first workshop capture: photo, crop, role, consent, story note, caption draft.
10. Add notification review controls for HST/GST reminders before dispatch.

# Build 151 completed — custom request conversion, UTM attribution joins, and close export hardening

Completed in Build 151:

1. Mounted the existing Custom Requests admin workflow inside Operations so the panel is actually visible after deployment.
2. Added Custom Request conversion actions: create quote draft, create job draft, and create product draft plan.
3. Added D1-backed draft tables for `custom_request_quote_drafts`, `custom_request_job_drafts`, and `custom_request_product_drafts`.
4. Added `custom_request_conversion_events` so every request-to-draft action has an audit-style event trail.
5. Added repeat-request/customer-history indicators by email in the Custom Requests admin table.
6. Added UTM capture to public custom request submissions.
7. Added visitor/session token capture to custom request rows so later analytics can connect request forms to traffic journeys.
8. Added UTM self-healing columns to visit tracking for `site_visitor_sessions` and `site_page_views`.
9. Extended Social Posting Queue UTM rollups to show campaign traffic, sessions, checkout starts, abandoned carts, and custom request counts when analytics tables exist.
10. Added remittance evidence URL and reminder date support to the HST/GST review workflow.
11. Added downloadable Accounting Close CSV output from the Accounting Close Workflow endpoint.
12. Added Accounting Close export manifest pointers to the downloadable CSV summary.
13. Added public Custom Request page analytics loading so form submissions can feed the campaign conversion loop.
14. Added CSS polish for mobile-friendly custom request conversion buttons and status notes.
15. Updated active schema SQL files and active Markdown handoff docs for the new workflow.
16. Updated `COMPETITIVE.md` with the new custom-request-to-workflow and campaign-measurement direction.

Next strongest build pass:

1. Convert quote/job/product draft records into the future full quote, job, and product modules once those modules are ready.
2. Add email reply templates from quote drafts so we can answer custom requests faster without auto-sending.
3. Add deposit/invoice candidate creation from accepted quote drafts.
4. Bake approved SEO overrides into static HTML during deploy instead of relying only on client-side fallback.
5. Add reviewed static SEO export/import tooling for Cloudflare/GitHub deployments.
6. Add custom request attachment upload to R2 instead of only accepting pasted public URLs.
7. Add accountant ZIP packaging with bundled CSV files and attachment index.
8. Add HST/GST due-date reminder notifications in the notification outbox.
9. Add product proof filters by material, process, locality, and product category.
10. Add marketplace readiness exports for Etsy, Facebook Marketplace, Pinterest, and manual listings.

# Build 150 completed — trust blocks, reviewed SEO apply loop, and accounting close workflow

Completed in Build 150:

1. Added D1-backed `trust_block_items` for approved testimonial, local proof, product proof, and supporter trust blocks.
2. Added Operations > Testimonials / Trust Blocks admin workflow for creating trust blocks from reviews or saving custom approved proof rows.
3. Added public `/api/trust-blocks` with safe empty fallback if the table is missing or no approved rows exist.
4. Updated public trust/testimonial injection to try approved trust blocks first, then fall back to featured product reviews.
5. Added `seo_page_overrides` for reviewed title/meta/internal-link improvements from Search Console actions.
6. Added Search Console “Apply” action that writes an approved SEO override and marks the source action applied.
7. Added public `/api/seo-page-overrides` plus client-side fallback script on public pages.
8. Added Accounting > Close Workflow panel for payment application, HST/GST review, month-end close readiness, and accountant export manifests.
9. Added admin API support for `accounting_payment_applications`, `accounting_hst_gst_reviews`, and `accountant_export_packages`.
10. Added Release Sanity and Public API Health coverage for trust blocks, SEO overrides, and accounting close tables/endpoints.
11. Updated schema SQL files and Markdown handoff docs.
12. Added responsive CSS polish for the new trust, SEO override, and accounting close UI blocks.

Next strongest build pass:

1. Convert custom requests into draft quotes, jobs, or product drafts.
2. Add quote status controls and approval thresholds for custom work.
3. Bake approved SEO overrides into static HTML during deploy, not only client-side fallback.
4. Join social UTM rollups with visitor/session/order/request conversion analytics.
5. Add post-fulfillment review/photo/request prompts to feed trust blocks.
6. Add a phone-first quick-capture workflow: photo, crop, role, consent, story note, caption draft.
7. Add downloadable accountant export ZIP/CSV bundle generation from the close manifest.
8. Add HST/GST filing reminder and remittance evidence attachment fields.
9. Add public proof filtering by product type, material, process, and locality.
10. Add custom request duplicate/customer-history matching.

# Build 149 completed — product media gates, consent checks, custom requests, and social template editing

Completed in Build 149:

1. Added automatic product-readiness checks for missing image roles, missing hero/front image role, and blocked/consent-needed public-use statuses.
2. Added the same image-role/public-use blockers to admin product review/publish actions.
3. Connected Product Story Notes approval/publishing to privacy status plus product-image media consent summaries.
4. Displayed media consent status inside Product Story Notes rows and product summary copy.
5. Added simple upload-time image editing presets: keep original, square 1200 crop, landscape 4:3 crop, and max-side resize.
6. Added role-aware public product detail gallery output using image roles such as hero, detail, scale, process, packaging, proof, and gallery.
7. Hid storefront images that are explicitly blocked or consent-needed, and hid images linked to consent records that are not public-safe.
8. Added public `/custom-request/` intake for engraving, personalized gifts, handmade jewelry, sublimation, and other workshop-made custom work.
9. Added Operations > Custom Requests admin review queue with statuses and admin notes.
10. Made Social Posting Queue caption templates editable from admin instead of overwriting them from code on every schema pass.
11. Added Social Posting Queue UTM campaign rollups for queued/open/approved/posted social posts.
12. Updated current-pass SQL and schema reference files for `custom_requests` and caption-template persistence.
13. Updated Markdown handoff docs and sanity notes for this pass.

Still strongest next steps:

1. Finish approved testimonial/local trust block workflow.
2. Add a direct custom request -> quote/job/product draft conversion action.
3. Add Search Console reviewed-action auto-apply with a final confirmation gate.
4. Continue payment application, HST/GST review, month-end close checklist hardening, and accountant export packaging.
5. Add click/session analytics joins to the new UTM social rollups once production analytics tables are confirmed.

## Completed items in this pass — Build 142

1. Completed `COMPETITIVE.md` as the main competitive strategy document for Devil n Dove.
2. Added source-backed direction for handmade/mixed-media positioning, product storytelling, local SEO, ecommerce UX, and social publishing.
3. Added a competitive feature matrix comparing baseline small shops, stronger shops, and the Devil n Dove target.
4. Added tiered competitive priorities for homepage, product pages, media, mobile UX, local trust, collections, filters, custom requests, testimonials, and marketplace readiness.
5. Added product page, homepage, mobile UX, social, local SEO, content, measurement, and 30/60/90-day implementation blueprints.
6. Added `data/site/competitive-opportunities.json` as a public-safe opportunity seed list.
7. Added D1 table `competitive_opportunities` for tracking strategic opportunities.
8. Added D1 table `competitive_opportunity_events` for status/note history.
9. Added `/api/admin/competitive-roadmap` to seed, list, and update competitive opportunities.
10. Added `public/js/admin-competitive-roadmap.js` for the Operations admin panel.
11. Added Operations > Competitive Roadmap mount and script.
12. Added mobile-friendly CSS for the Competitive Roadmap summary and table panel.
13. Added Release Sanity coverage for the Competitive Roadmap endpoint.
14. Added Release Sanity coverage for competitive-opportunity table seeding and high-priority open counts.
15. Updated the local predeploy sanity script so Competitive Roadmap assets and the completed `COMPETITIVE.md` are checked before packaging.
16. Added competitive roadmap schema to `database_full_schema.sql`.
17. Added competitive roadmap schema and Build 142 ledger marker to `database_upgrade_current_pass.sql`.
18. Added schema notes to `database_growth_analytics_seo_extension.sql` and `database_store_schema.sql`.
19. Updated all active Markdown handoff/status files with the Build 142 direction.
20. Re-ran JavaScript syntax, HTML H1/title/meta, local reference, CSS brace, privacy, SQL smoke, and ZIP integrity checks.

## Next logical steps after Build 142

1. Deploy Build 142 and apply or record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and run **Competitive Roadmap**.
3. Click **Seed defaults** if the D1 table has not populated yet.
4. Mark the items already underway as `in_progress`: mobile menu, social queue, Search Console workflow, product draft readiness, and image health.
5. Use Release Sanity to confirm competitive opportunities are seeded.
6. Start the highest-priority product story work: add story/material/process/care fields into product detail rendering.
7. Expand Product Image Health into separate sale-ready, social-ready, and process-media groups.
8. Add mobile Shop quick chips for New Arrivals, Under $25, One-of-a-Kind, Local Pickup, Vintage Finds, and Custom Gifts.
9. Add the reusable local Southern Ontario trust block to shop, about, contact, local pages, and product detail pages.
10. Add custom request intake for engraving, personalization, and similar-piece requests.
11. Add private testimonials/reviews intake with approval workflow.
12. Add marketplace-safe export readiness checks for Etsy/Facebook/Pinterest/manual posting.
13. Add social analytics rollups from UTM-tagged posts.
14. Add customer/job-media privacy guards before media can be selected for public social posts.
15. Connect Search Console opportunity actions to reviewed title/meta/internal-link updates.
16. Add margin-readiness cards using product price, supplies/tools cost, fees, and shipping assumptions.
17. Continue payment application screens for deposits, orders, refunds, processor fees, payouts, gift cards, and manual adjustments.
18. Continue HST/GST review worksheet and remittance-ready totals.
19. Continue month-end close lock/reopen controls with checklist, review notes, and audit trail.
20. Continue accountant export package v2 with GL, trial balance, P&L, HST worksheet, attachment index, and unresolved issue log.

# Development Roadmap — Devil n Dove

## Completed 20 items in this pass — Build 140

1. Added a dry-run platform payload preview for Social Posting Queue items before any API call is attempted.
2. Added `dry_run_platforms` support to `/api/admin/social-post-queue` so admins can inspect Facebook, Instagram, X, Pinterest, TikTok, and YouTube payloads safely.
3. Added dry-run attempt logging with `dry_run_preview` status so preview history is visible in recent attempts.
4. Added platform-specific caption variants for Facebook, Instagram, TikTok, X, YouTube, and Pinterest while keeping the main caption as the fallback.
5. Added scheduled date/time support to the Social Posting Queue form and queue table.
6. Added schedule blocking so future-scheduled posts are not API-published early unless deliberately forced later by code/admin review.
7. Added duplicate/repost signatures based on title, caption, images, platforms, and link.
8. Added `do_not_repost` guardrails so likely duplicate posts are blocked from API publishing until the warning is cleared by an admin.
9. Added a queue-table “Clear duplicate warning” action for reviewed duplicates.
10. Added media-quality warnings for missing image URLs, non-HTTPS/private media URLs, too many images, and X caption trimming.
11. Added saved dry-run payload JSON and last-dry-run timestamp fields for auditability.
12. Added social queue summary counts for scheduled posts, due posts, dry-run previews, and duplicate warnings.
13. Expanded Release Sanity to report social scheduled/dry-run counts and warn on duplicate/repost flags.
14. Expanded the platform readiness UI into a clearer credential checklist.
15. Improved the Social Posting Queue mobile layout, dry-run preview display, warnings, and wide table handling.
16. Updated social queue schema references in `database_full_schema.sql`, `database_store_schema.sql`, `database_growth_analytics_seo_extension.sql`, and `database_upgrade_current_pass.sql`.
17. Added a Build 140 schema migration ledger marker.
18. Updated `scripts/predeploy_sanity_check.py` so dry-run and caption-variant social assets are checked before packaging.
19. Preserved the previous product/media/mobile/Search Console/storefront fallback work while adding the new social publishing safety layer.
20. Updated active Markdown files with the Build 140 handoff, risks, sanity notes, schema notes, local SEO note, and next steps.

## Next logical 20 steps after Build 140

1. Deploy Build 140 and apply or record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and refresh Social Posting Queue.
3. Queue one harmless crafting-process post with one public image URL.
4. Use **Dry run** before any publish attempt and verify the platform payload preview looks correct.
5. Set a future schedule and confirm **Publish APIs** records `blocked_scheduled` instead of posting early.
6. Queue a similar duplicate post and confirm the duplicate/repost warning appears.
7. Clear the duplicate warning only after reviewing the caption/image/platform combination.
8. Add one platform credential set at a time in Cloudflare environment variables, starting with Facebook Page or X.
9. Run dry-run previews after each credential change before pressing Publish APIs.
10. Add a richer job/project timeline source so crafting-process posts can be generated from job records rather than a blank form.
11. Add platform-specific image/video rules, especially aspect ratio and duration checks for Instagram, TikTok, YouTube Shorts, and Pinterest.
12. Add retry/backoff notes for API failures and rate-limit responses.
13. Add a public-safe “workshop story” block that can reuse approved social captions without exposing admin notes.
14. Add social-post performance fields for manual engagement tracking until API analytics are available.
15. Add Google Business Profile post/photo planning as a manual checklist because GBP posting/media workflows differ from the other platforms.
16. Continue Search Console CSV import testing and generate private SEO actions only from real opportunity rows.
17. Add product SEO bulk tools for missing title, description, canonical, OG image, and Product JSON-LD readiness.
18. Continue accounting work: payment application, HST/GST review, period close/lock, and accountant export packaging.
19. Keep testing the compact mobile menu, admin tables, and product editor on a real phone after cache clears.
20. Continue checking one H1, local wording, schema drift, CSS drift, public `/data/` privacy, and robust fallbacks on every pass.


## Completed 20 items in this pass — Build 139

1. Added approved-post API publishing attempts to the existing Social Posting Queue.
2. Kept the workflow review-first so crafting/job posts must be approved before any API push attempt.
3. Added platform credential readiness checks for Facebook, Instagram, X, and Pinterest using Cloudflare environment variables only.
4. Added Facebook Page post/photo publishing support when `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` are configured.
5. Added Instagram image publishing support through the Meta media-container/media-publish flow when `INSTAGRAM_USER_ID` and a valid Meta/Instagram token are configured.
6. Added X text/link publishing support through the X post endpoint when `X_USER_ACCESS_TOKEN` is configured.
7. Added Pinterest image-pin publishing support when `PINTEREST_ACCESS_TOKEN` and `PINTEREST_BOARD_ID` are configured.
8. Kept TikTok manual/review-first in this pass because the direct upload/publish flow needs separate app approval and upload handling.
9. Kept YouTube manual/review-first in this pass because Shorts/upload publishing needs a separate Google OAuth upload workflow.
10. Added per-platform attempt recording for API posted, failed, credentials missing, manual pending, and blocked-needs-approval outcomes.
11. Added `last_publish_attempt_at` and `api_publish_mode` support to the social queue reference schema.
12. Added richer attempt metadata to the social attempt reference schema, including HTTP status, response IDs, request mode, and published URL.
13. Added a Social API publisher readiness check into Release Sanity.
14. Updated the Operations Social Posting Queue UI with an API Publish button beside approved posts.
15. Updated the Platform Readiness table to show API-ready, missing environment variables, and manual/copy-ready status.
16. Added a Crafting process source type and preserved job/process/product story source labels.
17. Preserved the compact mobile menu, product draft/editor improvements, media diagnostics, Search Console import/actions, sitemap, structured-data, and storefront health tools.
18. Kept social credentials out of D1, JSON, Markdown, and public files; they belong in Cloudflare environment variables only.
19. Updated schema reference files and `database_upgrade_current_pass.sql` with the Build 139 ledger marker.
20. Ran syntax, H1/title/meta, CSS, public-data privacy, SQL smoke, and ZIP integrity checks for the packaged build.

## Next logical 20 steps after Build 139

1. Deploy Build 139 and apply/record `database_upgrade_current_pass.sql`.
2. Open Operations > Social Posting Queue and queue one test crafting-process post.
3. Approve the queued post and test API publishing with no credentials first; confirm attempts record `credentials_missing` instead of failing the whole page.
4. Add only one platform credential set at a time in Cloudflare environment variables, starting with Facebook or X.
5. Create a private social credential checklist in Operations so missing/ready variables are more visible before posting.
6. Add a dry-run preview endpoint that shows the exact platform payload without sending it.
7. Add post scheduling controls so approved posts can be queued for a future date/time.
8. Add per-platform caption variants so X can stay shorter while Instagram/Facebook get longer story captions.
9. Add automatic first-image quality warnings before sending posts to image-heavy platforms.
10. Add a “job progress timeline” source so process updates can be created from a project/job record instead of a blank form.
11. Add a public-safe gallery/story block that can reuse approved social captions without exposing private admin notes.
12. Add TikTok API readiness diagnostics, then implement the direct/post upload flow only after developer app approval and media URL rules are confirmed.
13. Add YouTube Shorts upload diagnostics and upload handling after Google OAuth credentials are safely configured.
14. Add platform rate-limit/backoff handling and retry notes for failed API attempts.
15. Add a “do not post again” duplicate detector for repeated image/caption/platform combinations.
16. Connect product publish/review status to optional social queue generation after a product reaches publish-ready.
17. Add Search Console feedback columns to compare page impressions before/after social and SEO pushes.
18. Add month-end social/export summary for accountant/marketing review.
19. Continue local SEO content tuning page by page while keeping one clear H1 per exposed page.
20. Continue retiring JSON duplication where D1 has become the reliable source of truth.

## Completed 20 items in this pass — Build 137

1. Extended `/api/admin/search-console-import` with filtered GET summaries for page, query, country, device, date range, impressions, average position range, and result limit.
2. Added Search Console batch live-row counts so imported CSV batches can be checked against staged rows.
3. Added safe batch delete/revert for Search Console imports using `action: delete_batch`.
4. Added confirmation-gated batch deletion in the Operations UI so a mistaken CSV import can be removed without touching public pages.
5. Added private `seo_opportunity_actions` table for reviewable SEO work items.
6. Added generated title suggestions capped for search-result clarity.
7. Added generated meta-description prompts that require human review before public copy changes.
8. Added internal-link recommendation notes for matching opportunity queries to related local/shop/collection pages.
9. Added duplicate prevention for generated SEO actions using a stable action key per page/query pair.
10. Added action-status updates for private SEO tasks: open, in progress, done, or ignored.
11. Added Search Console filter controls to `/admin/operations/`.
12. Added “Generate private SEO actions” to turn filtered opportunity rows into a managed task list.
13. Added reviewable SEO action table with priority, query, page, suggested title, suggested meta, and link note.
14. Added mobile-friendly CSS for Search Console filters, action rows, and danger/revert buttons.
15. Expanded Release Sanity with an SEO opportunity action-list check.
16. Expanded the local predeploy sanity script so Search Console filter/revert/action assets are verified before zipping.
17. Updated SQL schema files with `seo_opportunity_actions` and supporting indexes.
18. Added a Build 137 migration-ledger marker to `database_upgrade_current_pass.sql`.
19. Updated active Markdown files so the handoff, schema notes, sanity notes, roadmap, and known gaps match the current build.
20. Ran JavaScript syntax, HTML H1/meta, CSS, public-data privacy, SQL smoke, predeploy sanity, and ZIP integrity checks before packaging.

## Next logical 20 steps after Build 137

1. Deploy Build 137 and apply/record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and test Search Console filters with a small imported CSV batch.
3. Use the new Delete/revert batch action on a test batch before importing a large file.
4. Generate private SEO actions from one filtered opportunity set only.
5. Review generated title/meta suggestions manually before editing any public page.
6. Add an export CSV button for `seo_opportunity_actions` so the task list can be shared or archived.
7. Add page-level “current title/current meta/current H1” comparison beside generated SEO actions.
8. Add an “apply to draft SEO fields” helper for product pages only, keeping public publish separate.
9. Add Search Console trend charts for clicks/impressions/position once dated imports accumulate.
10. Add sitemap-to-Search-Console coverage comparison.
11. Add product SEO bulk tools for missing title, description, canonical, OG image, and Product JSON-LD readiness.
12. Add a dedicated product media library page with filters for unassigned, duplicate URL, missing alt, weak score, and product-linked assets.
13. Add one-click attach/detach controls for media assets.
14. Add high-confidence Amazon bulk approval with rollback notes and duplicate detection.
15. Add payment application workflow for matching payments to orders/invoices.
16. Add HST/GST review worksheet for taxable sales, input tax credits, and remittance readiness.
17. Add period close/lock and reopen controls.
18. Add accountant export packaging with ledgers, journals, reconciliations, tax summaries, and attachment index.
19. Continue mobile testing for the grouped menu and larger admin tables.
20. Continue checking one H1, local wording, mobile CSS, schema drift, and public `/data/` privacy on every pass.

Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, private SEO opportunity actions, and release-sanity coverage.


## Completed 20 items in this pass — Build 136

1. Added an admin-only `/api/admin/search-console-import` endpoint for Search Console CSV staging.
2. Added CSV file upload support for Search Console exports.
3. Added pasted-CSV support for small/manual Search Console imports.
4. Added safe CSV parsing that handles quoted commas and blank rows.
5. Added flexible column mapping for Page, Query, Clicks, Impressions, CTR, Position, Country, Device, and Date.
6. Added Search Console import batch tracking with source file, site property, row count, notes, and importing admin user.
7. Added top-page Search Console summaries by clicks, impressions, CTR, and average position.
8. Added SEO opportunity query summaries for terms with impressions and average positions roughly between 4 and 20.
9. Added Operations > Search Console CSV Import panel.
10. Added mobile-friendly Search Console import form layout.
11. Added Search Console import results tables for top pages, opportunity queries, and recent batches.
12. Added Release Sanity coverage for the new Search Console import endpoint.
13. Added current-pass SQL self-healing table/index definitions for Search Console staging tables.
14. Added a Build 136 migration ledger marker.
15. Preserved the compact grouped mobile menu from the previous passes.
16. Preserved product editor draft/image upload fixes from the recent product workflow passes.
17. Preserved media/R2 diagnostics and product image health checks.
18. Updated schema notes for the Search Console staging workflow.
19. Updated active Markdown files so the current build and next steps stay in sync.
20. Ran syntax, H1/meta, CSS, reference, SQL, privacy, and ZIP integrity checks before packaging.

## Next logical 20 steps after Build 136

1. Deploy Build 136 and apply/record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and run Search Console CSV Import.
3. Export a small Search Console page/query CSV and import only a few rows first.
4. Confirm the top-pages table shows clicks, impressions, CTR, and average position.
5. Use the SEO opportunities table to pick one page/query pair for title/meta refinement.
6. Compare the opportunity page against its current H1, title, and meta description.
7. Add a Search Console delete/revert batch action before doing large imports.
8. Add filters for date range, page path, query text, country, and device.
9. Add a local SEO recommendations panel that converts query opportunities into suggested page-title/meta/internal-link tasks.
10. Add Search Console trend charts once enough dated rows are imported.
11. Add a sitemap-to-Search-Console coverage comparison.
12. Add product SEO bulk tools for missing title, description, canonical, OG image, and Product JSON-LD readiness.
13. Add a dedicated product media library page with filters for unassigned, duplicate URL, missing alt, weak score, and product-linked assets.
14. Add one-click attach/detach controls for media assets.
15. Add high-confidence Amazon bulk approval with rollback notes and duplicate detection.
16. Add payment application workflow for matching payments to orders/invoices.
17. Add HST/GST review worksheet for taxable sales, input tax credits, and remittance readiness.
18. Add period close/lock and reopen controls.
19. Add accountant export packaging with ledgers, journals, reconciliations, tax summaries, and attachment index.
20. Continue checking one H1, local wording, mobile CSS, and public `/data/` privacy on every pass.

Current sync: 2026-05-18 — Build 136 Search Console CSV import/review workflow, SEO opportunity summaries, and release-sanity coverage.

## Completed 20 items in this pass — Build 135

1. Carried forward the media-upload public URL fallback so uploads return `https://assets.devilndove.com/...` when no explicit R2 public base variable is set.
2. Added upload diagnostics to `/api/admin/media-upload` responses so admins can see the public base source and bucket binding used.
3. Added `/api/admin/media-diagnostics` for admin-only R2/media configuration checks.
4. Added Operations > Media / R2 Diagnostics with bucket binding, public base URL, sample URL, and recent media asset review.
5. Added optional latest-public-URL verification from the Media / R2 Diagnostics panel.
6. Added `/api/admin/product-image-health` for product featured image, gallery image, alt text, and media public URL coverage checks.
7. Added Operations > Product Image Health with missing-image product samples and weak-alt-text image samples.
8. Added Release Sanity checks for the new media diagnostics endpoint.
9. Added Release Sanity checks for the new product image health endpoint.
10. Added a live Product editor draft-readiness checklist that separates draft, review, and publish readiness.
11. Added a one-click slug-from-name helper inside the Product editor checklist.
12. Added a Move draft to review helper that verifies name, type, slug, category, price, and image before setting the review-ready draft state.
13. Added a reusable image library picker inside the Product editor.
14. Connected the image library picker to `/api/admin/media-assets` so existing R2 uploads can be reused instead of uploaded again.
15. Added image-library tiles that can fill the featured image or next empty gallery image URL field.
16. Updated the inline Product editor upload panel so edit-mode uploads attach to the currently loaded product instead of always being unassigned.
17. Exposed the currently loaded product id to product editor helpers through form dataset/window state.
18. Fixed product edit payloads so merchandise origin, sale channel, external listing details, condition, era, and sourcing notes are saved during updates.
19. Added CSS for the checklist, reusable image picker, mobile image-library tiles, and media diagnostics metric cards.
20. Updated schema files, active Markdown, the migration-ledger marker, and local predeploy sanity checks for Build 135 assets.

## Next logical 20 steps after Build 135

1. Deploy Build 135 and open `/admin/products/` on desktop and phone.
2. Test image upload again and confirm the returned URL starts with `https://assets.devilndove.com/`.
3. Run Operations > Media / R2 Diagnostics and confirm the bucket binding is connected.
4. Add an explicit `PRODUCT_MEDIA_PUBLIC_BASE_URL=https://assets.devilndove.com` environment variable if the diagnostics panel says it is using the default fallback.
5. Create a draft with only product name/type and confirm the checklist shows draft-ready but review/publish incomplete.
6. Use Fill slug from name and confirm the slug field updates cleanly.
7. Upload one new image while editing an existing product and confirm it attaches to that product.
8. Use the reusable image library picker to assign an existing media asset to a draft product.
9. Run Operations > Product Image Health and fix the first products without featured/gallery images.
10. Fill short alt text rows shown by Product Image Health before publishing products.
11. Add a bulk alt-text helper that creates draft alt text from product name, material, colour, and category.
12. Add a real product media library page with filters for unassigned, duplicate URL, missing alt, weak score, and product-linked assets.
13. Add one-click attach/detach controls for media assets from the media library page.
14. Add a safe product publish wizard that requires passing the checklist before setting `status=active` and `review_status=published`.
15. Add product SEO bulk tools for missing title, description, canonical, OG image, and JSON-LD readiness.
16. Continue Search Console CSV import UI and page/query reporting.
17. Continue Amazon duplicate detection, manual relinking, and high-confidence bulk approval with rollback notes.
18. Continue accounting work: payment application, HST review, journal automation, period close/lock controls, and accountant export packaging.
19. Continue local SEO refinement using one clear H1, clear title/meta pairs, and Ontario/Southern Ontario wording on relevant public pages.
20. Keep CSS/mobile sanity checks in every pass because admin panels are becoming large and phone layout can drift.


## Completed 20 items in this pass — Build 134

1. Reworked the admin Product editor to be draft-first instead of publish-first.
2. Changed the Create button label to "Save Draft Product" so the workflow matches how partial products are actually created.
3. Added clear draft-mode guidance that SEO, images, pricing, and external links are readiness items, not draft blockers.
4. Relaxed client-side draft validation to require only product name and product type for a new draft.
5. Kept external listing URL required only when a hybrid/external item is no longer in draft mode.
6. Added publish-readiness badges for category, price, featured image, SEO title, and SEO description without blocking draft save.
7. Added an inline Product pictures uploader to the Product editor.
8. The uploader can place the uploaded image into featured image or the next empty gallery image URL field.
9. The uploader sends product draft images through `/api/admin/media-upload` with FormData so JSON Content-Type is not forced on file uploads.
10. Added upload status messaging, preview thumbnail, automatic alt-text suggestion, and mobile-friendly media upload layout.
11. Added JSON-safe response handling in `admin-create-product.js` so HTML 500 pages produce a readable admin message instead of `Unexpected token '<'`.
12. Rebuilt `/api/admin/create-product` with a top-level try/catch so failures return JSON and are logged as runtime incidents.
13. Made `/api/admin/create-product` adaptive to the live `products` table columns instead of assuming every newer storefront column exists.
14. Made product SEO insertion adaptive to the live `product_seo` table columns.
15. Made product image insertion adaptive to the live `product_images` table columns.
16. Added runtime incident logging with `incident_scope: admin_products` and `incident_code: create_product_failed` for failed creates.
17. Allowed draft products to save without image, price, SEO title, SEO description, category, or external listing URL.
18. Kept readiness scoring so incomplete drafts remain not-ready for storefront until missing publish fields are completed.
19. Added product-editor checks to `scripts/predeploy_sanity_check.py` so future passes catch missing draft/media assets.
20. Updated schema files, active Markdown, CSS, and the migration ledger marker for the Build 134 pass.

## Next logical 20 steps after Build 134

1. Deploy Build 134 and open `/admin/products/` on desktop and mobile.
2. Create a draft with only product name and product type to confirm draft mode saves cleanly.
3. Confirm the admin message no longer shows `Unexpected token '<'` if the API fails.
4. If image upload fails, check whether the R2 media bucket binding and public base URL are configured for `/api/admin/media-upload`.
5. Upload one product image from the editor and confirm the returned URL fills the featured/gallery image field.
6. Create another draft with pasted image URLs only to confirm non-upload workflows still work.
7. Open Operations > Runtime Incidents and check for new `admin_products/create_product_failed` rows.
8. If a create-product incident appears, copy its `error_detail` and fix the exact live D1 column/table issue.
9. Run Storefront Schema Repair after deployment if product columns are still missing.
10. Run Storefront Value Backfill after several drafts exist so defaults and SEO placeholder rows can be filled safely.
11. Add an edit-mode version of the same inline image uploader so existing products can receive new images without leaving the editor.
12. Add a product draft checklist card that explains which missing fields block publish readiness.
13. Add a one-click "Move draft to review" action that verifies image/SEO/price/category readiness first.
14. Add an image library picker so uploaded media can be reused across products instead of re-uploaded.
15. Add R2 binding diagnostics to Operations so missing media storage is visible before uploads fail.
16. Add product-image health checks to Public API Health for featured and gallery image coverage.
17. Add product SEO bulk-fix tools for drafts missing title, description, alt text, and local wording.
18. Continue Search Console CSV import UI and page/query SEO performance reporting.
19. Continue accounting work: payment application, HST review, journal automation, period close, and accountant export packaging.
20. Continue local SEO refinement while keeping one clear H1 and mobile-friendly layouts on every exposed page.

Current sync: 2026-05-17 — Build 134 draft-first product editor, inline image upload, JSON-safe create-product errors, and adaptive product create schema handling.

## Completed 20 items in this pass — Build 133

1. Preserved the Build 132 compact mobile drawer and verified the mobile-nav assets are still present.
2. Added `/api/admin/structured-data-health` for admin-only JSON-LD and Product schema readiness checks.
3. Added the Operations > Structured Data Health panel.
4. Added static page JSON-LD checks for Home, Shop, Gallery, About, Tools, Supplies, and local landing pages.
5. Added live product structured-data readiness sampling from `/api/products`.
6. Added `/api/admin/storefront-value-backfill` to inspect blank storefront product defaults.
7. Added safe product value defaults for status, product type, merchandise origin, sale channel, currency, review status, tax/shipping flags, inventory flags, and timestamps.
8. Added missing `product_seo` placeholder row creation for products that do not yet have SEO rows.
9. Added the Operations > Storefront Value Backfill panel with inspect/apply controls.
10. Added `/api/admin/sitemap-preview` to combine priority static pages with live D1 product URLs.
11. Added the Operations > Live Sitemap Preview panel with XML preview.
12. Expanded Release Sanity to check Structured Data Health, Live Sitemap Preview, and storefront default values.
13. Added Search Console CSV staging tables for future page/query performance imports.
14. Updated `database_upgrade_current_pass.sql` with the Build 133 migration marker.
15. Updated full and SEO extension schema files for Search Console staging.
16. Added schema notes to the base/store schema files so the schema set remains synchronized.
17. Expanded the local predeploy sanity script to verify the new Operations admin assets.
18. Confirmed public `/data/` privacy checks still pass after the new SEO/admin work.
19. Re-ran one-H1/title/meta checks across exposed HTML pages.
20. Updated active Markdown files with the completed Build 133 work and the next 20 steps.

## Next logical 20 steps after Build 133

1. Deploy Build 133 and open `/admin/operations/`.
2. Run Storefront Schema Repair first if product columns are still missing.
3. Run Storefront Value Backfill and inspect blank defaults before applying.
4. Apply the safe value backfill only after the inspect report looks reasonable.
5. Run Structured Data Health and repair missing JSON-LD warnings on priority pages first.
6. Run Live Sitemap Preview and compare product URL count with live product count.
7. Decide whether to replace static `sitemap.xml` with a dynamic route or keep regenerating it before deploys.
8. Add a Search Console CSV import screen using the new staging tables.
9. Add Search Console performance charts for clicks, impressions, CTR, and average position by page/query.
10. Add product SEO bulk tools for missing meta title, meta description, image alt text, and Product schema readiness.
11. Add duplicate Amazon staging detection by ASIN, order id, item title, and item total.
12. Add manual Amazon row relinking when a purchase row matched the wrong inventory item.
13. Add high-confidence Amazon bulk approval with a preview/confirm step and rollback notes.
14. Continue payment application screens for deposits, order balances, refunds, processor fees, payouts, and gift cards.
15. Continue journal automation for sales, fees, HST, COGS, inventory movements, shipping, refunds, and write-offs.
16. Build HST/GST review worksheet with taxable sales, input tax credits, adjustments, and remittance checklist.
17. Build period close/lock/reopen controls with audit notes and unresolved issue checks.
18. Build accountant export package v2 with GL, trial balance, P&L, HST worksheet, statement summaries, attachment index, and issue log.
19. Add an admin mobile command palette if Operations/Catalog panels continue to grow.
20. Continue local SEO landing-page refinement using real Search Console data once imports are available.


## Build 130 completed hotfix items

1. Investigated the recurring `/api/products` incidents that increased from 7 to 8 after the previous public API patch.
2. Confirmed the incident pair still came from `products_primary_query_failed` followed by `products_fallback_query_failed`.
3. Rebuilt `/api/products` so optional candidate columns are no longer added to the verified column set.
4. Changed products/tax/SEO column detection to use strict D1 `PRAGMA table_info` metadata, with `SELECT * LIMIT 1` only as a sample fallback.
5. Added a final `SELECT * FROM products LIMIT 500` recovery tier that filters/sorts in JavaScript instead of referencing optional SQL columns.
6. Stopped logging a runtime incident for the primary query if a lower fallback tier succeeds.
7. Stopped logging a runtime incident for the product-only fallback if the final select-star tier succeeds.
8. Preserved safe empty-result behavior only for true all-tier product failures.
9. Kept product filter groups working from normalized fallback products.
10. Hardened `/api/product-detail` to use strict actual columns rather than candidate optional product columns.
11. Preserved one-H1 SEO checks and local-search page structure from earlier builds.
12. Updated `database_upgrade_current_pass.sql` with the Build 130 migration-ledger marker.
13. Updated active Markdown handoff files so the fix and next validation steps are documented.
14. Re-ran JavaScript syntax checks after the endpoint changes.
15. Re-ran exposed-page H1/title/meta checks.
16. Re-ran missing local asset reference checks.
17. Re-ran CSS brace drift checks.
18. Re-ran ZIP integrity checks before packaging.
19. Kept Amazon import/review and inventory cost-history features from Build 129.
20. Prepared the new deployable Build 130 ZIP.

## Next 20 steps after Build 130

1. Deploy Build 130 and open `/api/products` directly.
2. Confirm the response has `ok: true` and does not show `summary.authority: "error"`.
3. Acceptable temporary authorities are `d1_adaptive_query`, `d1_product_only_fallback_query`, or `d1_select_star_fallback`.
4. Refresh `/admin/operations/` > Runtime Incidents and confirm the `/api/products` grouped count does not increase after fresh page loads.
5. If Build 130 returns `d1_select_star_fallback`, run D1 Schema Drift Report and schedule the missing product-column migration later.
6. Mark the old `/api/products` incident groups resolved only after the count stops increasing.
7. Open Gallery, Creations, Shop, and Product Detail pages and verify they still show products/images.
8. Run Public API Health from Operations after deployment.
9. Run Release Sanity from Operations after deployment.
10. Record the Build 130 marker in the Migration Ledger.
11. Continue Amazon CSV staging import testing with a tiny file before approving many rows.
12. Continue approving only safe Amazon purchase matches into inventory cost history.
13. Add a public-products schema compatibility card to Operations if `d1_select_star_fallback` remains active for more than one deploy.
14. Add product-image fallback enrichment if products display without featured images.
15. Add a safe `/api/product-images` health check for gallery/creations image regressions.
16. Add admin guidance for which D1 columns are missing versus optional.
17. Continue compacting duplicate product/catalog fields from JSON into D1 where D1 is now authoritative.
18. Continue accounting work: payment application, journal automation, HST review, close controls, and accountant export packaging.
19. Continue local SEO refinement with one clear H1 per public page.
20. Continue mobile admin improvements for catalog review, inventory counts, and Amazon import approvals.

## Build 131 completed 20-step pass — storefront schema repair, API health, and predeploy sanity

1. Added `/api/admin/storefront-schema-repair` as an admin-only D1 schema compatibility inspector.
2. Added a non-destructive repair action that checks live D1 before adding missing product storefront columns.
3. Added safe repair support for older `tax_classes` schemas, including `rate_percent` compatibility.
4. Added safe repair support for missing `product_seo` table/columns.
5. Added storefront compatibility indexes for product slug, category, origin, and sale channel filters.
6. Added `public/js/admin-storefront-schema-repair.js` for an Operations page repair panel.
7. Added the Storefront Schema Repair mount and script to `/admin/operations/`.
8. Expanded Public API Health to check HTML pages, API JSON, sitemap XML, and robots.txt.
9. Expanded Public API Health to treat `summary.authority: "error"` as a true failure.
10. Added D1 row-count snapshot data to Public API Health for products, catalog, inventory, incidents, and migration ledger.
11. Added endpoint-specific next-action guidance in the Public API Health UI.
12. Added Release Sanity coverage for storefront schema repair readiness.
13. Updated Release Sanity actions to point admins to Storefront Schema Repair when product fallbacks remain.
14. Added `scripts/predeploy_sanity_check.py` for local H1/title/meta, local asset, CSS brace, and public-data privacy checks.
15. Updated `database_full_schema.sql` with `tax_classes.rate_percent` and storefront indexes.
16. Updated `database_store_schema.sql` with `tax_classes.rate_percent` and storefront indexes.
17. Updated `database_growth_analytics_seo_extension.sql`/full schema with a product SEO product-id index.
18. Added the Build 131 migration ledger marker to `database_upgrade_current_pass.sql`.
19. Re-ran JavaScript syntax checks and local predeploy sanity checks.
20. Updated all active Markdown handoff, schema, roadmap, SEO, and repo documents for this pass.

## Next logical 20 steps after Build 131

1. Deploy Build 131 and open `/admin/operations/`.
2. Run **Storefront Schema Repair > Inspect repairs** first; review missing product/tax/SEO columns.
3. If the repair report shows safe missing columns, click **Apply safe repairs**.
4. Run **Public API Health** and confirm `/api/products` no longer reports `authority: "error"`.
5. If `/api/products` still uses `d1_select_star_fallback`, inspect product table columns and rerun schema repair.
6. Run **Release Sanity** and confirm product schema repair readiness is pass/warn rather than fail.
7. Recheck Runtime Incidents and resolve only old `/api/products` rows after the count stops increasing.
8. Add a product schema backfill screen that can populate blank `merchandise_origin`, `sale_channel`, and `currency` values.
9. Add admin product-filter QA cards for handmade, vintage, collectible, external-only, and hybrid products.
10. Add product structured-data health checks for required Product fields and image URLs.
11. Add sitemap regeneration from live D1 products/pages instead of static-only sitemap maintenance.
12. Add public search-performance fields for Search Console clicks, impressions, CTR, and position by page/query.
13. Continue Amazon staging import review with manual inventory-link correction and bulk approval safeguards.
14. Continue payment application screens tying orders, deposits, refunds, fees, gift cards, and journal entries together.
15. Continue automatic journal-line generation for sales, fees, shipping, inventory, COGS, refunds, write-offs, and HST.
16. Continue HST/GST review worksheet with collected tax, ITCs, adjustments, and remittance-ready totals.
17. Continue month-end close lock/reopen controls with checklist, reason, and audit trail.
18. Continue accountant export package v2 with GL, trial balance, P&L, balance-sheet support, HST worksheet, attachments, and unresolved exceptions.
19. Continue media lifecycle tools for replace, retire, alt text, crop, public/private flag, and broken-link scans.
20. Continue moving duplicated JSON/DB product and content data toward D1-first management with public-safe JSON fallbacks only.

## Build 132 completed 20-step pass — compact mobile menu and phone layout polish

1. Reworked the shared public navigation so the mobile menu is no longer one long flat list.
2. Added grouped expandable mobile sections: Essentials, Shop & Browse, Workshop, Community, Account, and Local pages.
3. Kept the desktop navigation flat and familiar while limiting it to the main high-value links.
4. Added a mobile quick row for Shop, Search, and Cart so the most useful links are available immediately.
5. Added accessible `details/summary` accordion behavior for grouped mobile navigation without extra dependencies.
6. Added focus-visible styling for mobile menu controls so keyboard users can see where they are.
7. Improved Escape-key and close-button handling for the mobile menu.
8. Added click-outside-to-close behavior for the mobile menu drawer.
9. Preserved active-link highlighting inside both desktop and mobile grouped navigation.
10. Added safer focus restoration when the mobile menu closes.
11. Hardened the mobile drawer height with `100dvh` sizing so it fits better on phone browsers with dynamic address bars.
12. Added sticky mobile drawer heading/close controls so the close action remains easy to reach.
13. Improved small-screen brand/logo sizing so the header does not crowd the menu button.
14. Added mobile horizontal scrolling for admin department shortcut buttons so they no longer create a tall button stack.
15. Added mobile card/hero spacing refinements to reduce cramped layouts on phone screens.
16. Updated `scripts/predeploy_sanity_check.py` to verify compact mobile-nav JavaScript and CSS assets exist.
17. Added a Build 132 marker to `database_upgrade_current_pass.sql` while confirming no D1 structural migration is required.
18. Updated schema files with a no-structure-change Build 132 note so the schema set remains current.
19. Re-ran JavaScript syntax checks, local predeploy sanity checks, CSS brace checks, HTML SEO checks, and missing-reference checks.
20. Updated active Markdown documentation so the mobile navigation change, sanity process, and next steps are recorded.

## Next logical 20 steps after Build 132

1. Deploy Build 132 and test the main menu on a real phone or narrow browser window.
2. Confirm tapping **Menu** opens grouped expandable sections instead of one long flat list.
3. Confirm Shop, Search, and Cart appear in the quick row and are easy to tap.
4. Confirm the menu closes with Close, Escape, outside click/tap, and after selecting a link.
5. Check admin department pages on a phone and confirm shortcut buttons scroll horizontally instead of stacking too tall.
6. Run `/admin/operations/` > Public API Health after deployment.
7. Run `/admin/operations/` > Release Sanity after deployment.
8. Confirm no new runtime incidents appear from public page loads after the mobile-nav update.
9. Run Storefront Schema Repair if `/api/products` still reports fallback/schema warnings.
10. Add a Product structured-data health panel for Product, BreadcrumbList, Organization, and WebSite checks.
11. Add product schema value backfill for blank `merchandise_origin`, `sale_channel`, `currency`, status, and shipping flags.
12. Add sitemap regeneration from live D1 product/page records rather than relying only on static sitemap updates.
13. Add Search Console import fields/screens for page, query, clicks, impressions, CTR, and average position.
14. Continue Amazon CSV import hardening with duplicate detection and manual inventory relinking.
15. Add bulk approval only for very high-confidence Amazon purchase matches with a preview and confirmation step.
16. Continue payment application screens for deposits, orders, refunds, fees, payouts, and gift cards.
17. Continue fuller journal automation and posting validation for sales, fees, HST, COGS, inventory, shipping, refunds, and write-offs.
18. Build the HST/GST review worksheet and remittance review flow.
19. Build period close/lock/reopen controls with audit notes and checklist status.
20. Build accountant export package v2 with GL, trial balance, P&L, HST worksheet, statement summaries, attachment index, and unresolved issue log.


## Build 138 completed 20-step pass — social posting queue, process-photo workflow, and platform readiness

1. Added an admin-only Social Posting Queue in `/admin/operations/` for job/process photos and summaries.
2. Added `/api/admin/social-post-queue` with review-first create, refresh, status update, manual-post recording, and recent-media draft generation actions.
3. Added `social_platform_connections` so Facebook, Instagram, TikTok, X, YouTube, and Pinterest can be tracked separately.
4. Added `social_post_queue` to hold captions, image URLs, hashtags, target platforms, review status, schedule notes, and source/job references.
5. Added `social_post_attempts` to record manual posts now and future API attempts later.
6. Seeded platform readiness rows as manual/copy-ready until official OAuth tokens, app permissions, and review are configured.
7. Added a “Draft from recent media” button so recently uploaded product/job images can become a reviewed social post draft.
8. Added copy-to-clipboard support for captions so posts can be published manually today without exposing platform tokens.
9. Added manual posted-record flow so published Facebook/Instagram/TikTok/X URLs can be linked back to the queue.
10. Added approve/ready/archive controls so posts are not pushed accidentally.
11. Added source type/source ID fields for job updates, product stories, workshop updates, events, and customer deliveries.
12. Added platform-specific checkbox targeting for Facebook, Instagram, TikTok, X, YouTube, and Pinterest.
13. Added mobile-safe CSS for the social queue form and tables.
14. Added social queue checks to Release Sanity.
15. Added runtime incident logging for social queue load/save failures.
16. Added admin audit logging for social queue actions.
17. Added schema entries to the current migration, full schema, store schema, and growth/SEO extension schema set.
18. Added Build 138 migration-ledger marker.
19. Preserved compact mobile navigation, product image workflow, Search Console action queue, and schema-drift protections from prior builds.
20. Updated active Markdown handoff, roadmap, known gaps, sanity, schema, SEO, and repo documents.

## Next logical 20 steps after Build 138

1. Deploy Build 138 and run `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and confirm Social Posting Queue loads.
3. Queue one test post from a real job/process photo and copy it manually to Facebook or Instagram.
4. Record the resulting public post URL back into the queue as a manual post.
5. Test “Draft from recent media” after uploading product/job photos.
6. Decide which profiles are official for Devil n Dove: Facebook Page, Instagram account, TikTok, X, YouTube, Pinterest, and any others.
7. Add profile URLs to `social_platform_connections` in the admin UI or a follow-up editor.
8. Add a platform credential settings screen that stores only non-secret public status in D1 and keeps secrets in Cloudflare environment variables.
9. Add Meta/Facebook Page OAuth connection diagnostics before attempting any API publishing.
10. Add Instagram Content Publishing API diagnostics after Meta/Instagram account setup is confirmed.
11. Add TikTok Content Posting API diagnostics only after TikTok developer app approval and verified media URL/domain rules are ready.
12. Add X API diagnostics only after confirming current pricing and write permissions still fit the business.
13. Add per-platform caption length checks and media-ratio warnings before approval.
14. Add short-video/Reels/TikTok-specific media checks for duration, aspect ratio, and thumbnail readiness.
15. Add a content calendar view that groups queued posts by scheduled week.
16. Add product/job link helpers that pull image, title, price, and short summary automatically into a social draft.
17. Add reusable caption templates for “making story,” “finished product,” “behind the scenes,” “oops/funny shop moment,” and “local market/event.”
18. Add UTM-tagged links so social posts can be measured in analytics.
19. Add social performance import fields later for clicks, likes, comments, saves, shares, and platform post URLs.
20. Continue payment application, HST review, period close, accountant export, and Search Console SEO action workflows.

## Build 141 completed 20-step pass — social content calendar, caption templates, UTM links, and continued safety hardening

1. Preserved the Build 140 social queue, dry-run, scheduling, duplicate guardrail, and credential-readiness workflow.
2. Added reusable social caption templates for making stories, finished products, funny shop moments, local updates, laser engraving, and vintage finds.
3. Added `social_caption_templates` to the D1 schema and current migration references.
4. Added template seeding/self-healing inside `/api/admin/social-post-queue` so older D1 installs can recover safely.
5. Added `caption_template_key` to queued social posts.
6. Added `content_pillar` to group posts as behind-the-scenes, finished goods, local presence, custom work, human story, or vintage/collectible content.
7. Added `call_to_action` for each queued social post so captions are less generic.
8. Added `utm_source`, `utm_medium`, `utm_campaign`, and `utm_url` fields to the queue.
9. Added automatic UTM link generation for product/job/social links without overwriting existing UTM values.
10. Updated platform payload generation so UTM URLs are preferred in social dry runs and API attempts.
11. Added a caption-template preview action that returns a generated caption without queueing or posting anything.
12. Added a Social Posting Queue template selector in Operations.
13. Added a “Preview template caption” button before queueing posts.
14. Added a content calendar summary showing upcoming/due/posted/duplicate-warning social rows by date.
15. Added a caption-template reference table inside the Operations panel.
16. Added quick “Use template” buttons that copy template defaults into the queue form.
17. Expanded Release Sanity to check active social caption templates and calendar readiness.
18. Updated full schema/current migration/store/growth schema notes for Build 141.
19. Re-ran JavaScript syntax checks and SQL smoke tests after the social queue changes.
20. Updated active Markdown handoff, roadmap, known gaps, sanity, schema, SEO, and repo documents for this pass.

## Next logical 20 steps after Build 141

1. Deploy Build 141 and run/record `database_upgrade_current_pass.sql`.
2. Open `/admin/operations/` and confirm Social Posting Queue loads with caption templates and the content calendar.
3. Create one test crafting-process post using the “Making story” template.
4. Use “Preview template caption” before queueing so the generated caption can be reviewed.
5. Confirm the generated UTM link is used in dry-run payloads when a related link is provided.
6. Queue one local Ontario update and confirm hashtags/content pillar are locally relevant.
7. Dry-run the post and confirm Facebook/Instagram/X/Pinterest payloads look correct before API publishing.
8. Keep TikTok and YouTube manual until their upload flows and app approvals are configured.
9. Add a weekly/monthly social calendar view that can filter by content pillar and platform.
10. Add one-click product-story drafts from Product editor records, pulling image, title, price, short description, and product URL.
11. Add one-click workshop/process drafts from recent media uploads with selected images.
12. Add per-platform image ratio/size checks for Instagram, TikTok, Pinterest, and X before approval.
13. Add a reusable caption-template editor so templates can be adjusted from admin without code changes.
14. Add UTM analytics rollup so social-post campaigns can be tied to `/api/site-search-event`/visitor analytics later.
15. Add platform post-performance import fields for clicks, likes, comments, shares, saves, and video views.
16. Add a “do not post before/after” customer privacy checkbox for job/customer-related media.
17. Continue payment application screens for deposits, orders, refunds, processor fees, payouts, gift cards, and manual adjustments.
18. Continue HST/GST review worksheet and remittance-ready totals.
19. Continue month-end close lock/reopen controls with checklist, review notes, and audit trail.
20. Continue accountant export package v2 with GL, trial balance, P&L, HST worksheet, attachment index, and unresolved issue log.


## Build 143 — Social Media Privacy Guard + Competitive Execution

Completed in this pass:

1. Added Operations > Social Media Privacy Guard.
2. Added `/api/admin/social-media-privacy-guard`.
3. Added `social_media_privacy_rules` and `social_post_privacy_reviews` schema support.
4. Added default rules for customer/private identifiers, workshop background leaks, product-only media, personal wording review, and visible children/visitors.
5. Added privacy columns to `social_post_queue` through runtime-safe self-healing.
6. Blocked API publishing from Social Posting Queue until the queued post is privacy-approved or marked no-private-media.
7. Added Release Sanity checks for the Social Media Privacy Guard endpoint and open posts needing privacy review.
8. Expanded `COMPETITIVE.md` with competitive execution details, product-page direction, social calendar, trust/privacy posture, marketplace direction, accounting/margin priorities, and immediate/next/later implementation waves.
9. Expanded `data/site/competitive-opportunities.json` with social privacy, product story, and local trust block opportunities.
10. Updated schema files and active Markdown handoff docs.

Next strongest directions:

1. Render product-story blocks publicly on product detail pages.
2. Add a reusable local trust block to Home, About, Shop, Contact, product, and local pages.
3. Add “post this product” from Product editor into Social Posting Queue.
4. Add admin-editable caption templates.
5. Add social analytics rollups from UTM links and manual/API post URLs.
6. Add product media role checklist: main/detail/scale/process/packaging/video.
7. Add customer media consent records for job/customer-specific posts.
8. Add testimonials/review approval workflow.
9. Add marketplace export readiness checks.
10. Continue payment application, HST review, period close, and accountant export packaging.

## Build 144 completed — product story, local trust, and product-to-social workflow

Completed in this pass:

1. Added a public product-story block to product detail pages.
2. Added approved story-note schema through `product_story_public_notes`.
3. Added a safe fallback story generator using existing product fields when no approved story note exists.
4. Added condition/era/sourcing notes to the story block when available.
5. Added linked-tool/supply count and image count into the public story context.
6. Added `data/site/local-trust.json` as a public-safe Southern Ontario trust seed.
7. Added `/public/js/local-trust-block.js` as a reusable local trust renderer.
8. Added the local trust block to the homepage.
9. Added the local trust block to product detail pages.
10. Added mobile-friendly styling for the trust block.
11. Added **Post this product** buttons to the admin product table.
12. Added product-to-social queue payload generation from product rows.
13. Product social posts are queued as drafts, not published automatically.
14. Product social posts use UTM-ready product links through the existing Social Posting Queue.
15. Product social posts continue to pass through privacy review and platform readiness checks.
16. Added Build 144 schema updates to active SQL files.
17. Updated `COMPETITIVE.md` with the new buyer/admin directions.
18. Updated active Markdown handoff/status files for the new workflow.
19. Extended product detail structured/story direction without exposing private import/accounting data.
20. Preserved one-H1/page SEO checks, compact mobile direction, and public `/data/` privacy posture.

## Next several steps after Build 144

1. Build an admin editor for `product_story_public_notes` so story copy can be approved/published without SQL.
2. Add product readiness warnings when public story output is fallback-only.
3. Add story snippets to shop cards and site search results.
4. Add reusable testimonial/trust approval tables and a public testimonial block.
5. Add customer/job/media consent records and connect them to social privacy review.
6. Add a local pickup confidence block to cart and checkout.
7. Add custom request intake for engraving, personalization, ring ideas, and “can you make something similar?” requests.
8. Add marketplace export readiness checks for Etsy/Facebook/Pinterest/manual channels.
9. Add social analytics rollups from UTM-tagged links and posted URLs.
10. Add product media role checklist enforcement for main/detail/scale/process/packaging photos.
11. Add admin-editable social caption templates.
12. Add product story-to-social caption helpers.
13. Add Search Console action completion links back to page/product records.
14. Add dynamic sitemap generation from active D1 product rows once schema health is stable.
15. Add accounting payment application screens.
16. Add HST/GST review worksheet and filing support.
17. Add month-end close lock/reopen controls.
18. Add accountant export packaging.
19. Add inventory depletion simulation from product/resource links.
20. Add marketplace/channel margin previews before publishing or discounting.

## Build 146 completed — product story editor, mobile draft fix, and capture hardening

Completed in this pass:

1. Replaced the mobile product capture API with a safer version that defines `normalizeColorNames`.
2. Kept mobile draft saves JSON-only on failure so browser pages do not show `Unexpected token '<'` style errors.
3. Preserved product draft autosave from the desktop Product editor.
4. Preserved seven-total-image finished-product capture.
5. Preserved sequential image uploads so one bad file does not cancel the full batch.
6. Added `product_story_public_notes` admin editor support.
7. Added `/api/admin/product-story-notes`.
8. Added `/public/js/admin-product-story-notes.js`.
9. Added Product editor mount for story notes.
10. Added story seeding from existing product fields.
11. Added display statuses: draft, review, approved, published, archived.
12. Added story privacy statuses: needs_review, safe, private_detail_removed, blocked.
13. Added story review/internal notes fields.
14. Added safe schema helpers so older D1 databases can add optional story columns at runtime.
15. Updated reference schema files for story source/privacy/review columns.
16. Updated predeploy sanity checks for the new story editor assets.
17. Updated `COMPETITIVE.md` with the new story-led product strategy.
18. Updated Known Gaps with the remaining story/media/accounting risks.
19. Kept one-H1/page, title/meta, CSS, and public-data privacy checks in the deployment workflow.
20. Prepared Build 146 as a deployable handoff with sanity/outstanding items.

### Next several steps

1. Add story snippets to public shop cards and search results.
2. Add image drag/drop ordering in the Product editor.
3. Add duplicate image URL warnings and “same angle” warnings.
4. Add product media role checklist: hero, back, scale, detail, process, packaging, material/tool proof.
5. Add a “Post this product” panel inside the Product editor, not only in the product table.
6. Add customer/job/media consent records for social publishing.
7. Add admin-editable social caption templates.
8. Add social analytics rollups from UTM-tagged links.
9. Add approved testimonial/trust blocks and local proof snippets.
10. Add custom request intake for engraving, personalized gifts, and workshop-made requests.
11. Add Search Console action application workflow that updates titles/meta only after review.
12. Add payment application workflow.
13. Add reconciliation exception closeout.
14. Add HST review worksheets.
15. Add month-end close checklist and lock/reopen controls.
16. Add accountant export packaging.
17. Add Amazon high-confidence bulk approval with duplicate/relink protection.
18. Add inventory movement audit views for product-resource consumption.
19. Add product margin preview before publishing.
20. Add release-health “go/no-go” summary that combines schema drift, public API health, runtime incidents, sitemap, structured data, and image readiness.



## Build 147 completed — shop story snippets, image role checklist, social shortcut, and consent registry

Completed in this pass:

1. Added public story snippet fields to `/api/products` output.
2. Added safe D1 enrichment from approved/privacy-safe `product_story_public_notes` rows.
3. Kept `/api/products` resilient when the story table or columns are missing.
4. Added story snippet text to public shop cards.
5. Added story fields to public shop/search query matching.
6. Added `.shop-card-story` CSS for product story snippets.
7. Added duplicate image URL warnings inside the Product editor.
8. Added a Product image role checklist for seven total product photos.
9. Added the roles: hero/front, detail/texture, scale/context, back/side, process/story, packaging/pickup, material/tool proof.
10. Added a **Post this product** shortcut directly inside the Product editor.
11. Kept Product editor social posts as draft/review-only; they still go through Social Posting Queue and Privacy Guard.
12. Added Operations > Media Consent Records.
13. Added `/api/admin/media-consent-records`.
14. Added `public/js/admin-media-consent-records.js`.
15. Added `media_consent_records` schema/table support.
16. Added consent status/scope/public/social-use fields for safer media approvals.
17. Added media-consent assets to Operations and predeploy sanity checks.
18. Removed the duplicate product-story script include from the Product admin page.
19. Updated `data/site/competitive-opportunities.json` with story snippets, image roles, and consent registry items.
20. Updated active Markdown and schema files for the new direction.

### Next several steps

1. Add drag/drop image ordering in the Product editor.
2. Persist image role labels per product image instead of only using the checklist.
3. Add duplicate/same-angle warnings using image metadata once image scoring is deeper.
4. Add story snippets to internal site search results, not only shop cards.
5. Connect Media Consent Records directly to Social Media Privacy Guard queue items.
6. Connect consent records to Product Story Notes before story approval.
7. Add approved testimonial/trust block workflow.
8. Add custom request intake for engraving, personalized gifts, ring ideas, and “make similar” requests.
9. Add admin-editable social caption templates.
10. Add social analytics rollups from UTM-tagged links.
11. Add Search Console action application workflow that updates titles/meta only after review.
12. Add product margin preview before active/published status.
13. Add inventory depletion simulation from product-resource links.
14. Add payment application workflow.
15. Add reconciliation exception closeout.
16. Add HST/GST review worksheets.
17. Add month-end close checklist and lock/reopen controls.
18. Add accountant export packaging.
19. Add release-health “go/no-go” summary combining schema drift, public API health, runtime incidents, sitemap, structured data, image readiness, and media consent risk.
20. Add marketplace/channel export readiness for Etsy, Facebook Marketplace, Pinterest, and manual copy/paste channels.


## Build 148 Completed — Product Image Ordering, Roles, Consent Link, and Search Story Snippets

Completed in this pass:

1. Fixed the Product Images admin API syntax issue caused by a duplicated `return json({` block.
2. Added self-healing product image annotation fields for `image_role`, `public_use_status`, `consent_record_id`, and `role_review_notes`.
3. Added a `product_image_role_reference` schema table and seeded role definitions.
4. Added drag/drop ordering to the Product Media Workflow.
5. Kept up/down image movement as a fallback for mobile and accessibility.
6. Added image role selection per image.
7. Added public-use status per image.
8. Added optional consent record ID per image.
9. Added role/review notes per image.
10. Added an “Apply recommended roles” helper in the Product Media Workflow.
11. Expanded the image quality summary to show role coverage and consent/blocking warnings.
12. Persisted role/public-use/consent fields through `/api/admin/product-images`.
13. Included image role counts in media score history metadata.
14. Connected Social Privacy Guard to Media Consent Records by social source and media URL.
15. Added consent match counts/status to Social Privacy Guard rows.
16. Blocked approval of customer/private social media when consent is required but no social-use consent is linked.
17. Added approved product story snippets to internal site search summaries and scoring.
18. Updated CSS for drag/drop product image rows and mobile-safe fallback controls.
19. Updated schema files and active Markdown handoff files.
20. Updated `COMPETITIVE.md` with the new product-media/consent/search direction.

## Next Several Steps

1. Add automatic missing-role warnings before a product can move from draft to review.
2. Add story snippets to more internal search/result card surfaces, including homepage featured areas if appropriate.
3. Connect Media Consent Records directly to Product Story Notes approval.
4. Add a product-story privacy checklist beside the story editor.
5. Add approved testimonial/trust block workflow.
6. Add custom request intake for engraving, personalized gifts, and mixed-media commissions.
7. Add admin-editable social caption templates.
8. Add social analytics rollups from UTM links.
9. Add Search Console action apply/review workflow for title/meta/internal-link updates.
10. Add payment application workflow.
11. Add HST/GST review workflow.
12. Add month-end close checklist and lock/reopen controls.
13. Add accountant export packaging.
14. Add marketplace export helpers for selected products.
15. Add product image duplicate detection across the whole catalog, not only within the editor.
16. Add product media “missing scale photo” and “missing packaging photo” warnings.
17. Add public-safe gallery/testimonial blocks to local SEO pages.
18. Add customer/media consent expiry reminders.
19. Add social posting result reconciliation into analytics.
20. Keep retiring duplicate JSON into D1/private staging where the data is operational or private.

## Build 155 completed roadmap items

- Converted reviewed custom request payment-request drafts into approved private payment review links.
- Converted reviewed custom request order drafts into real `orders` and `order_items` records while keeping status as draft/pending until final review.
- Added quote revision resend/version links so changed quotes can supersede older private links.
- Added marketplace export packs for Etsy, Facebook Marketplace, Pinterest, and manual listing copy.
- Extended proof filters into the shop/product APIs and shop UI for material, process, and locality.
- Added post-fulfillment review/photo/consent prompts as draft/copy-only admin records.

### Next strongest steps after Build 155

1. Connect approved payment review links to Stripe/PayPal/Square provider checkout records once processor settings are confirmed.
2. Add order status history rows and customer order-view pages for converted custom request orders.
3. Add marketplace CSV exports for Etsy/Facebook/Pinterest instead of copy-only cards.
4. Add consent-response capture from the post-fulfillment prompt.
5. Add proof filters to product detail related-item suggestions and collection landing pages.
6. Add admin approval gates before payment links can be sent externally.

## Build 157 update — payment readiness, link controls, stages, candle/soap specs, marketplace presets, and consent proof review

Completed in this pass:

- Hardened `/api/admin/mobile-create-product` so Save Partial retries duplicate SKU/product-number/slug conflicts and returns a recoverable JSON response instead of a raw D1 500 when identity generation collides.
- Added admin link lifecycle controls for custom quote, payment, order-status, and consent links: resend marker, expire, and void.
- Added customer custom-order stage tracking for planning, making, curing/finishing, ready, shipped/pickup, and complete.
- Added candle/soap intake fields for scent profile, wax/base, colour notes, batch, ingredient notes, and allergen/safety notes.
- Added `custom_candle_soap_product_specs` so candle/soap details can be tracked outside the general message text and later linked to product drafts or finished products.
- Added marketplace channel presets and richer CSV rows for Etsy, Facebook Marketplace, Pinterest, and manual listings, including category and shipping-profile review fields.
- Added payment provider readiness records for Stripe, PayPal, and Square configuration checks. This records configuration readiness only; real production checkout still requires a live low-value test order with credentials in Cloudflare.
- Added consent-to-public-proof candidates and an admin approval action that can turn an approved response into a public trust block.
- Updated private order-status pages to show custom work stage history.
- Updated schema files and handoff Markdown for the new workflow.

Next strongest steps:

1. Add editable UI fields for candle/soap scent, wax/base, colour, batch, ingredients, allergen/safety notes, and cure-ready date inside product drafts and mobile product capture.
2. Add explicit Stripe/PayPal/Square live-test result buttons after production credentials are configured in Cloudflare.
3. Add per-link customer copy templates for resend actions so quote/payment/order/consent links can be manually resent with consistent wording.
4. Add public-safe trust block moderation filters so approved consent proof can be scheduled by page/context.
5. Add stage-specific customer messages for custom work: planning, making, curing/finishing, ready, and shipped/pickup.
6. Add marketplace preset editing UI instead of relying on seeded defaults.

## Build 158 — Catalog action and image workflow repair

- Added `IMAGES.md` with the complete image/video placement checklist, required sizes, allowed video use, target paths/data fields, and product image role workflow.
- Repaired `/admin/catalog/` so it now includes the full product editor form required by Edit, product picker, image fields, SEO fields, marketplace fields, and the media/resource modules.
- Changed Product table Approve/Publish buttons so they are clickable even when blocked; the backend now returns the exact missing fields instead of silently doing nothing through a disabled button.
- Improved Needs Changes so admins are prompted for what needs changing and that note can be saved into the product review history/readiness notes.
- Hardened product review actions by ensuring support tables exist before review/publish checks run and by returning human-readable readiness labels.
- Repaired Reserve Resources and Release Resources UI feedback so it handles the actual inventory API response shape and reports affected, skipped/story-only, and missing inventory links.
- Improved Product Media Workflow so loading a product for editing auto-loads its image rows, each row shows a thumbnail, Delete image row is clearer, and saving an empty image set clears `featured_image_url`.
- Continued SEO/H1 discipline: one H1 per scanned public page, private/admin pages kept separate from public SEO goals, and local/product image guidance documented.

### Build 158 next steps

1. Add admin dashboard counters for products missing hero image, missing image roles, missing alt text, blocked public-use status, and missing OG image.
2. Add static example images for custom candle making, custom soap making, custom requests, and About/workshop story.
3. Add a backend endpoint that returns product readiness blockers separately from review actions so the UI can show a checklist before clicking Approve/Publish.
4. Add CSV/export image validation for Etsy/Facebook/Pinterest before marketplace export.
5. Add video poster image fields to product story notes and custom candle/soap pages.

## Build 160 — Catalog editor URL validation and publish image sync repair

- Fixed the Product Editor canonical URL field so relative site paths such as `/shop/product/?slug=desert-succulents-100` are accepted. The input is now text with helper guidance instead of browser `type=url` validation.
- Clarified External Listing URL: leave it blank for normal Devil n Dove shop products; only add a full `https://` Etsy/Facebook/marketplace URL when Sale Channel is Hybrid or External-only.
- Hardened update/create product image syncing so the featured image is also stored in `product_images` at sort order 0, gallery rows follow after it, duplicates are removed, and existing image rows/annotations are preserved when the URL already exists.
- Fixed Clear editor so the visual image cards and Product Media Workflow panel clear along with the form fields.
- Improved publish/approve readiness consistency by making the editor’s image fields and backend `product_images` rows agree before review actions run.
- No new D1 table is required in this pass; this is a code/data-sync behavior repair against the existing products, product_images, product_seo, and product_image_annotations tables.

Next recommended checks:
1. Edit a product with a relative canonical path and click Update Product.
2. Confirm External Listing URL is blank for normal onsite listings.
3. Save, reload, and confirm the first visual image is the featured image and appears in Product Media Workflow.
4. Run Approve/Publish; any blocker should now be a real readiness issue such as missing image role, missing SEO, missing price, or blocked public-use status.

## Build 161 — shop image/gallery, product detail JSON fallback, and catalog workspace split

- Repaired the public product detail page so an HTML fallback response from `/api/product-detail` no longer throws a raw `Unexpected token '<'` JSON error in the browser. The page now reads the response as text, detects HTML, and falls back to `/api/products` by slug when possible.
- Hardened `functions/api/product-detail.js` with a final JSON error wrapper so late D1/query failures return JSON instead of a static HTML error page.
- Extended `/api/products` to attach product image arrays from `product_images`, allowing shop cards to show a main image plus selectable thumbnail images.
- Updated the Shop product card UI so cards are more compact, show richer product details, and allow thumbnail clicks to change the main product image.
- CSS-polished the Shop “Browse by collection direction” area and the `/creations/` collection/trust grid so the layouts are less cramped and more mobile-safe.
- Split the oversized `/admin/catalog/` workflow into focused workspaces: Products & Publishing, Media & Product Images, and Tools & Supplies Inventory Operations.
- Added `/admin/catalog-media/` for media, image roles, image annotations, SEO, and product story work.
- Added `/admin/inventory-operations/` for tools, supplies, stock, product resource reservations, catalog sync, option sets, notifications, and app settings.
- Capped the Product Editor file picker to six selected uploads at a time while preserving existing product-image slots.
- Made the Product Media Workflow more compact by moving advanced crop/quality/scoring fields into a collapsible advanced section.

Next recommended steps: add a dedicated readiness-preview endpoint for product publishing blockers, add image health counters to the admin dashboard, and add live test notes after deploying Build 161.

## Build 162 — Shop/Creations CSS, Gift Page, and Inventory Image References

- Added `/gift-cards/` as a dedicated public gift-card page so the main shop no longer has the full gift-card form awkwardly placed between filters and products.
- Changed `/shop/` to show a compact gift-card callout that links to `/gift-cards/`.
- Repaired the contrast for the `/shop/` Browse by collection direction panel and the `/creations/` browse/filter/cards areas so light panels use dark readable text.
- Updated Tools & Supplies Inventory Operations to show a live visual image preview beside the Image URL field while keeping the URL editable.
- Updated the inventory list rows to show a larger thumbnail, the image URL link, and the source/Amazon URL link for easier visual reference.
- Added `/gift-cards/` to the sitemap. No D1 schema migration is required for this pass.


## Build 163 — 20-step roadmap/gaps pass: readiness, image health, gifts, and admin clarity

Completed in this pass:

1. Added `/admin/readiness/` as a focused Product Readiness workspace.
2. Added `/api/admin/product-readiness` so Approve/Publish blockers can be previewed before clicking action buttons.
3. Added readiness summary counters for total, ready, blocked, missing featured image, missing image roles, missing alt text, blocked public-use images, missing SEO, missing price, and products needing 3 images.
4. Added per-product blocker cards with direct links back to the product editor and media workspace.
5. Added dashboard counters for product image/SEO readiness gaps.
6. Added a Product Readiness department card to the Admin Dashboard.
7. Added Readiness Preview links to Catalog, Catalog Media, and Inventory Operations workspace navigation.
8. Added a static gift-card artwork placeholder at `/assets/gift-card-placeholder.svg`.
9. Added gift-card artwork guidance directly to the `/gift-cards/` hero.
10. Added Gift Cards to the home navigation so the new gift page is easier to find.
11. Hardened predeploy sanity checks so the new readiness page, endpoint, dashboard counters, gift artwork, and CSS assets are checked every pass.
12. Added CSS for readiness cards, readiness score badges, blocker rows, and the split gift-card hero.
13. Kept the one-H1 rule intact across all scanned exposed pages.
14. Kept private/admin pages as `noindex,nofollow` where appropriate.
15. Continued the local SEO habit of clear titles, readable headings, and visible local/product wording.
16. Kept the new readiness endpoint D1-backed without adding a required migration.
17. Preserved the split admin structure from the previous pass: Products, Media, Inventory Operations, and now Readiness.
18. Improved operator visibility before publishing by making missing image roles, missing hero/detail/scale roles, public-use blockers, SEO gaps, and price gaps visible from one place.
19. Updated active Markdown handoff docs with Build 163 notes.
20. Updated schema/reference SQL notes with Build 163 status and no-migration guidance.

Next 20 recommended steps:

1. Add inline readiness badges beside each row in the `/admin/catalog/` product table.
2. Add a one-click “Open first blocker” shortcut from each readiness card.
3. Add image-role quick-fix buttons from the readiness page.
4. Add automatic “apply recommended roles” preview before saving image rows.
5. Add true crop/focal-point visual editing directly on thumbnail cards.
6. Add visible “image order saved” confirmation that shows featured/gallery order after save.
7. Add dashboard drilldown links from each image/SEO counter.
8. Add gift-card admin settings for default amounts, expiry wording, and active/inactive status.
9. Add a real gift-card image upload field and replace the placeholder artwork.
10. Add gift-card checkout order-line creation instead of only local draft storage.
11. Add marketplace image validation before CSV export.
12. Add channel-specific marketplace CSV presets editing in admin.
13. Add shop/product API filters for “missing proof image” and “ready for social.”
14. Add post-publish QA for product detail JSON, image gallery, cart button, and SEO preview.
15. Add public product page mini-gallery thumbnails below the main image if any product detail page still only shows one image.
16. Add public proof/trust moderation filters before new trust blocks appear customer-facing.
17. Add order-stage photo uploads for custom work: planning, making, curing/finishing, ready, pickup/shipping.
18. Add candle/soap spec editing after product creation: scent, wax/base, colour, ingredients, allergens, and batch number.
19. Add accountant export checks for missing evidence URLs and missing close notes.
20. Add a mobile admin landing page that links to phone capture, inventory intake, readiness blockers, and today’s admin actions.


## Build 164 — Roadmap/Gaps Pass Completed

Completed from the requested next-20 pass:

1. Added inline readiness badges beside each product row in `/admin/catalog/`.
2. Added one-click **Open blocker** shortcuts from product rows and readiness cards.
3. Added image-role quick-fix buttons from `/admin/readiness/` that apply recommended image roles through the Product Media Workflow endpoint.
4. Added recommended image-role preview before saving image rows.
5. Added click-to-set focal point editing directly on Product Media Workflow thumbnail cards.
6. Added visible “Product images and image order saved” confirmation after saving image rows.
7. Added Admin Dashboard drilldown links from readiness counters into `/admin/readiness/?filter=...`.
8. Added gift-card admin quick settings through Operations > Saved App Settings.
9. Replaced the placeholder gift-card artwork with `/assets/gift-card-art.svg`.
10. Verified gift-card checkout order-line creation is already supported by `checkout-create-order.js` through `gift_card_purchase` payloads.
11. Added marketplace image-readiness validation notes/fields before CSV export packs.
12. Added editable marketplace CSV presets for Etsy, Facebook Marketplace, Pinterest, and manual listings.
13. Added shop filters for “Ready for social” and “Missing proof image”.
14. Added `/api/admin/product-publish-qa` for post-publish QA checks covering product detail JSON, gallery, cart basics, and SEO.
15. Extended product/shop proof signals so product cards and filters can detect proof-image and social-readiness gaps.
16. Added public trust-block moderation filters by context, item kind, locality, and related product slug.
17. Added `custom_order_stage_photos` API/table for order-stage photo tracking.
18. Added candle/soap spec editing after product creation through `/api/admin/candle-soap-specs` and the Catalog Media workspace.
19. Added accountant export/evidence visibility notes for missing HST/GST evidence URLs.
20. Improved `/admin/mobile/` as a better mobile admin landing page by adding readiness, inventory operations, and missing accounting-state mount support.

### Build 164 schema/data notes

New tables or schema references added:

- `custom_order_stage_photos`
- `custom_candle_soap_product_specs`
- unique index `idx_custom_candle_soap_product_specs_product`
- marketplace export pack fields for image validation status/notes

No public page should have more than one H1; the sanity pass must keep checking this every build.


## Next 20 Recommended Steps After Build 164

1. Add a dedicated admin page for product publish QA results with pass/fail history.
2. Add one-click fixes from the publish QA report, not only from readiness cards.
3. Add real crop boxes with draggable handles, not just focal-point clicks.
4. Save image focal/crop previews as generated derivative image URLs in R2.
5. Add product image version history so replaced images can be restored.
6. Add bulk readiness fixes for all products missing hero/detail/scale roles.
7. Add gift-card settings UI with proper form fields instead of quick preset buttons.
8. Add gift-card artwork upload to R2 and preview it on `/gift-cards/`.
9. Add admin gift-card order review, delivery queue, and resend delivery controls.
10. Add marketplace CSV field mapping per channel, including category ID, shipping profile, materials, tags, and photo columns.
11. Add marketplace image export selection so only approved images appear in CSV packs.
12. Add social-readiness badges directly on shop/admin product cards.
13. Add proof-image requirements by product category, because candles, soap, jewelry, and vintage pieces need different proof shots.
14. Add public product-detail related-proof sections that explain material/process/locality matches in plain language.
15. Add moderation queues for public trust blocks with archive, publish, and hide buttons.
16. Add order-stage photo upload directly in the custom request admin row, including R2 upload.
17. Add candle/soap label export fields for ingredients, allergens, batch, weight, and safety warnings.
18. Add accountant export ZIP checks that fail the export package when required evidence is missing.
19. Add mobile dashboard tiles for readiness blockers, today’s custom requests, and pending order-stage updates.
20. Add a full regression checklist page that tests shop, product detail, cart, checkout, admin catalog, media workflow, custom requests, and accounting exports before each deploy.

## Build 165 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Restored `functions/api/admin/custom-requests.js` to the full admin custom-request workflow file and repaired the broken marketplace preset tag-splitting regex that blocked Cloudflare Pages Functions deployment.
2. Repaired dark-theme consistency for the previously light `/shop/` browse-by-collection panels, `/creations/` creation-browse panels, gift-card cards, and inventory image cards.
3. Added inline post-publish QA buttons and QA badges inside `/admin/catalog/` product rows.
4. Added `Run QA` action wiring to call `/api/admin/product-publish-qa` directly from product rows.
5. Added `Fix now` links beside each readiness blocker on `/admin/readiness/`.
6. Added visible crop rectangle guidance on product image thumbnails.
7. Added square crop/focal quick controls in Product Media Workflow.
8. Added bulk recommended image-role assignment controls in Product Media Workflow.
9. Confirmed the upload workflow keeps client-side resize/compression controls visible before upload.
10. Added admin gift-card balance lookup endpoint and UI support through the customer engagement workflow.
11. Added a direct Trust Block Moderation workspace at `/admin/trust-blocks/`.
12. Added public proof/trust-block placement guidance by page/context.
13. Added marketplace export preview workspace at `/admin/marketplace-exports/`.
14. Added `/api/admin/marketplace-export-preview` with image-readiness summaries before CSV export work.
15. Added customer-facing private order-stage photo gallery support on custom order status links.
16. Added admin prompt workflow for adding custom order-stage photo URLs.
17. Added candle/soap spec display support on public product detail pages.
18. Added safety/allergen note display for candle/soap products.
19. Added accountant evidence URL checker endpoint and Accounting page UI mount.
20. Added a compact mobile-admin “Today’s admin tasks” queue linking readiness, failed APIs, inventory, and accounting evidence work.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 sanity remains covered by the predeploy pass.
- SEO bake script: PASS, 0 pages changed because no override rows are populated.

Next 20 recommended steps:

1. Add true visual drag handles for crop rectangles, not just focal-click crop guidance.
2. Add actual browser-side image compression size reporting before upload.
3. Add R2 direct upload for order-stage photos instead of URL-only entry.
4. Add moderation approvals before order-stage photos can become public proof.
5. Add gift-card activation after confirmed paid order status.
6. Add gift-card refund/void/reissue controls.
7. Add gift-card public balance lookup with email/code verification.
8. Add marketplace CSV download from the new preview screen.
9. Add channel-specific marketplace validation rules for Etsy/Facebook/Pinterest.
10. Add trust-block placement toggles per page instead of manual context typing.
11. Add public page modules that can request trust blocks by page/context.
12. Add product-card trust/proof badges based on approved trust blocks.
13. Add customer-facing candle/soap safety accordion on product pages.
14. Add admin candle/soap batch search and batch recall notes.
15. Add accountant evidence attachment upload, not only URL checks.
16. Add failed API cards to the mobile admin queue using runtime incident data.
17. Add a Today task API that merges orders, inventory, products, requests, and accounting work.
18. Add product publish QA results persistence so badges survive reloads.
19. Add one-click “fix first image” guided workflow from the QA/readiness cards.
20. Add local SEO landing-page review queue for each major product/service category.
## Build 166 — Roadmap/Gaps Pass Completed

Completed this pass:

1. Added visual drag handles on product image crop rectangles in Product Media Workflow.
2. Added browser-side upload size reporting so image edit preview shows original size, estimated output size, and savings.
3. Added R2 direct upload support for custom order-stage photos, with URL-entry fallback preserved.
4. Added moderation fields for order-stage photos before they can become public proof.
5. Added gift-card activation handling when a connected order is confirmed paid.
6. Added admin gift-card lifecycle actions: activate paid, void, refund/reduce balance, and reissue.
7. Added public gift-card balance lookup with gift-card code plus email verification.
8. Added marketplace CSV download from the preview endpoint.
9. Added channel-specific marketplace validation rules for Etsy, Facebook Marketplace, Pinterest, and manual listings.
10. Added trust-block placement toggle storage by page/context.
11. Added public trust-block context loader module for shop, creations, gift cards, product, gallery, and about pages.
12. Added shop product-card trust/proof badges when approved trust blocks or social-ready proof signals exist.
13. Added customer-facing candle/soap safety accordion on product detail pages.
14. Added candle/soap batch/safety fields to the public detail renderer.
15. Added accounting evidence attachment upload from the evidence checker workflow.
16. Added failed API/runtime incident task cards into the mobile admin queue through the new Today Tasks API.
17. Added `/api/admin/today-tasks` to merge orders, inventory, products, custom requests, accounting, and failed API work.
18. Added persisted product publish QA results in `product_publish_qa_results` so QA badges can survive reloads.
19. Added groundwork for a one-click first-image fix workflow through crop handles, role tools, and existing readiness links.
20. Added `/admin/local-seo-review/` and `/api/admin/local-seo-review` for major category/service landing-page review.

Validation for this pass:

- Predeploy sanity: PASS
- JavaScript syntax checks: PASS
- CSS brace check: PASS
- One-H1 check: PASS
- SEO bake script: PASS, 0 pages changed because no override rows are populated.
- ZIP integrity: PASS

Schema/data notes:

- New tables: `product_publish_qa_results`, `gift_card_admin_events`, `trust_block_placements`, `local_seo_landing_page_reviews`.
- Expanded table: `custom_order_stage_photos` now supports R2 object metadata, moderation status, proof candidate status, and approval fields.
- Gift cards continue to use `gift_cards` and `gift_card_redemptions`; admin lifecycle events now write to `gift_card_admin_events`.
- Public token/private pages remain `noindex,nofollow` where applicable.

Next 20 recommended steps:

1. Add draggable crop-box preview persistence to generated R2 derivative images.
2. Add automatic image compression before upload instead of preview-only reporting.
3. Add customer-facing proof-photo consent prompts tied to uploaded order-stage photos.
4. Add admin moderation queue dedicated only to stage photos and proof candidates.
5. Add automated gift-card email delivery after paid-order activation.
6. Add gift-card redemption entry in admin checkout/order screens.
7. Add public gift-card balance lookup rate limiting and abuse logging.
8. Add marketplace CSV mapping editor for channel-specific field names.
9. Add marketplace CSV image selector so only approved image roles export.
10. Add trust-block placement UI with max item counts and filters visible on each toggle.
11. Add public trust-block sections to remaining local landing pages.
12. Add category-specific proof requirements for jewelry, candles, soap, vintage, and custom work.
13. Add candle/soap label export fields for weight, ingredients, allergens, and batch.
14. Add candle/soap batch recall workflow and customer notification queue.
15. Add accountant evidence ZIP inclusion for uploaded accounting attachments.
16. Add failed-API drilldown cards directly on the mobile dashboard.
17. Add Today task completion/ignore controls so the queue can be cleared.
18. Add product QA history panel beside Catalog product rows.
19. Add guided “fix first image” wizard that opens image role, crop, and public-use fields in order.
20. Add local SEO review scoring for title, meta, H1, internal links, and local proof wording.

## Build 167 update - dark theme, media derivatives, proof moderation, gift cards, marketplace mapping, and SEO scoring

- Repaired the `/creations/` browse panels and main-page Local maker trust block so they stay consistent with the dark Devil n Dove theme instead of using white cards with black text.
- Added product image derivative/crop preview records so focal/crop work can be queued toward real R2 derivative images.
- Added stage-photo proof moderation queue before custom order photos can become public proof.
- Added gift-card redemption endpoint for admin checkout/order workflows, plus public balance lookup attempt logging and rate limiting.
- Added marketplace CSV mapping editor and endpoint for Etsy, Facebook Marketplace, Pinterest, and manual exports.
- Added accountant evidence attachment upload/list endpoint for future accountant ZIP packaging.
- Added Today task complete/ignore persistence and mobile dashboard controls.
- Added local SEO scoring endpoint for landing-page review rows.
- Added product QA history endpoint for future catalog-side QA panels.

### Next direction
Keep moving repeated image proof, marketplace mapping, gift card, evidence, and local SEO review data into D1-backed review queues with safe JSON fallbacks, and keep public pages on one clear H1 with local wording in titles/headings.

## Build 168 — Roadmap/Gaps Pass Completed

Build 168 continues the Devil n Dove roadmap/gaps pass with real R2-backed derivative image records, marketplace image selection persistence, consent-aware stage-photo proof moderation, gift-card delivery/redemption/abuse tooling, accountant evidence attachment packaging, local SEO scoring/quick actions, catalog QA history, candle/soap labels and recall review, trust-placement counts/previews, Today task snoozing, failed API drilldowns, stronger dark-theme regression checks, and a post-deploy smoke-test checklist.

Completed Build 168 items:

1. Product image derivative records can now create an R2 derivative object/key when an R2 bucket is available; otherwise they fall back to safe query-string previews.
2. Marketplace export image selections now persist per product/channel before CSV export.
3. Stage-photo public proof approval now checks for matching public-use media consent.
4. Approved public-use stage photos now generate public-proof candidates for admin review.
5. Order admin screens now include a gift-card redemption panel for order-linked redemptions.
6. Gift-card activation/reissue actions queue email delivery records in the notification outbox.
7. Gift-card lookup abuse dashboard endpoint added for repeated failed public lookups.
8. Accountant export ZIP now includes evidence attachment URL files and attachment rows in the evidence index.
9. Local SEO review rows now show score badges.
10. Local SEO review has quick actions for title/meta review and completion.
11. Product QA history panel was added to catalog product rows.
12. Product Media Workflow now shows image derivative history beside media rows.
13. Candle/soap label CSV export endpoint and admin download action were added.
14. Candle/soap batch recall/watch dashboard endpoint and admin panel were added.
15. Trust-block placement counts were added to placement data.
16. Trust-block preview by page context was added.
17. Today tasks now support snooze, in addition to done/ignore.
18. Mobile admin Today tasks now show failed API/runtime incident drilldown details.
19. Stronger dark-theme regression checks were added for public sections.
20. `POST_DEPLOY_SMOKE_TEST.md` was added for live URL checks after deployment.

Apply `database_upgrade_current_pass.sql` after deployment so the Build 168 D1 tables/columns are available.

Next 20 recommended steps:

1. Add true pixel crop/resizing worker output for derivative images instead of metadata copy fallbacks.
2. Add visual derivative comparison before/after panels.
3. Add direct marketplace export history per channel.
4. Add marketplace image-selection bulk apply from product role order.
5. Add a dedicated public-proof candidate moderation page.
6. Add customer-visible proof consent status inside private order links.
7. Add gift-card delivery template editor.
8. Add gift-card resend delivery action.
9. Add gift-card fraud/abuse severity scoring.
10. Add binary R2 evidence file bundling when Cloudflare zip generation supports it safely.
11. Add local SEO deploy/bake actions for approved title/meta changes.
12. Add local SEO competitor phrase checklist per landing page.
13. Persist product QA panel expanded/collapsed state.
14. Add product QA issue-specific Fix buttons.
15. Add candle/soap label print layout preview.
16. Add candle/soap recall customer notification queue.
17. Add trust-block A/B placement notes and performance tracking.
18. Add Today task snooze duration selector.
19. Add live post-deploy smoke-test result storage in D1.
20. Add public-page dark-theme screenshot review checklist to `IMAGES.md`.


## Build 169 pass — derivative output, proof moderation, marketplace history, gift delivery, local SEO bake queue

Completed in this pass:

1. Enhanced product image derivatives with Cloudflare Image Resizing/R2 output support when enabled.
2. Added before/after derivative comparison panels in Product Media Workflow.
3. Added marketplace export history per channel.
4. Added marketplace bulk image selection from product image role order.
5. Added `/admin/public-proof-candidates/` moderation workspace.
6. Added public proof candidate API for stage photo/manual proof review.
7. Added proof-consent status to private custom order links.
8. Added gift-card delivery template editor and resend queue.
9. Added `/admin/gift-cards/` operations page.
10. Added gift-card lookup abuse severity scoring.
11. Added local SEO bake-action queue for approved title/meta changes.
12. Added local SEO competitor/local phrase checklist API and quick UI action.
13. Added persisted product QA panel state endpoint.
14. Added issue-specific Product QA Fix helper wiring.
15. Added candle/soap recall notification queue endpoint and recall integration.
16. Added Today task snooze duration support.
17. Added post-deploy smoke-test result storage endpoint.
18. Added public-page dark-theme screenshot checklist to `IMAGES.md`.
19. Extended dark-theme CSS for new proof/gift/marketplace panels.
20. Updated schema/reference notes for new D1 tables.

## Build 170 — deployment blocker hardening, image derivatives, marketplace replay, proof promotion, gift-card lockouts, SEO bake scoring, recall matching, smoke tests

### Completed in this pass
- Added `/api/image-derivative` worker route for derivative image serving when Cloudflare Image Resizing is available, with safe original-image fallback.
- Added “Use this derivative as featured image” support to `product-image-derivatives` and Product Media Workflow derivative cards.
- Added marketplace export history snapshot storage plus replay and rollback actions.
- Added marketplace CSV field preview per channel/product row in the export preview UI.
- Connected approved public-proof candidates into `trust_block_items` through a Promote to trust block action.
- Added source filters for public-proof candidates by status, source kind, consent status, product, and custom request.
- Added gift-card delivery sender bridge into `notification_outbox` plus sent/failed status controls.
- Added gift-card delivery history endpoint for order/customer admin views.
- Added gift-card abuse lockout controls and public lookup lockout enforcement.
- Extended the static SEO bake script to consume `data/site/local-seo-bake-actions.json` as deploy-bake input.
- Added competitor/local phrase scoring against live page copy from the local SEO phrase endpoint.
- Persisted product QA blocker events and blocker-resolution history.
- Kept Product QA fix targeting tied to exact admin editor destinations and blocker history records.
- Added candle/soap recall customer matching from orders/order items.
- Added candle/soap recall send-review and notification-draft queue steps before customer notification.
- Prepared accountant export evidence attachment bundling notes and kept safe URL/object-key evidence manifests in ZIP output.
- Added `/admin/post-deploy-smoke-tests/` page with storage for live URL smoke-test results.
- Added dark-theme screenshot/evidence rows via `/api/admin/dark-theme-evidence`.
- Added mobile Today task filters for urgent/product/accounting/request work queues.
- Added `scripts/final_deployment_blocker_check.py` and ran it before packaging.

### Next 20 recommended steps
1. Add real binary-safe accountant evidence bundling for small PDF/image receipts when R2 fetch is explicitly enabled.
2. Add an admin page for dark-theme screenshot evidence review and status changes.
3. Add direct product QA fix buttons that auto-open the exact editor section and focus the target field.
4. Add one-click promotion from public-proof trust block into selected public page placements.
5. Add gift-card delivery provider adapters for the chosen email service.
6. Add gift-card lockout release controls into the visible Gift Card Admin page.
7. Add marketplace export diff view between current selections and replayed history.
8. Add marketplace rollback per whole channel export, not only per product selection.
9. Add public proof candidate customer-consent source linking in the moderation card.
10. Add R2 derivative worker route settings panel with enabled/disabled health checks.
11. Add direct derivative-to-featured buttons inside the product editor image strip, not only the Product Media Workflow.
12. Add recall customer-match preview grouped by product/batch/order before queueing notifications.
13. Add recall “send approval required” gate before notification drafts can leave draft state.
14. Add local SEO bake-action export from D1 to `data/site/local-seo-bake-actions.json`.
15. Add competitor phrase status badges directly on each local SEO landing-page row.
16. Add today-task filters to the desktop admin dashboard too.
17. Add post-deploy smoke-test quick-run buttons for core live URLs.
18. Add deployment-blocker checklist output into `SANITY_HEALTH_CHECK.md` automatically.
19. Add stronger public-page dark-theme screenshot checklist examples into `IMAGES.md` as real sample rows.
20. Add a release notes generator so each zip includes exact changed-file and D1 migration summaries.


## Build 172 hotfix note — D1 migration ledger

The build 171 SQL marker for `schema_migration_ledger` was corrected to include the required `file_name` column. A small live repair file, `database_build171_ledger_repair.sql`, is included for databases where the schema additions already ran but the final ledger insert failed. Do not rerun the entire upgrade only to fix the marker if build 171 ALTER TABLE additions already succeeded; repeated ALTER TABLE ADD COLUMN statements can fail on existing columns in SQLite/D1.


## Build 189 — Value Ops live counts, funnel events, mobile recovery, and visual replacement plan

Completed in this pass:

1. Added the missing `/api/admin/command-center` endpoint so the Admin Command Center can load real live counts instead of being only a static page.
2. Connected live Product Readiness counts from products/product images/product gaps into the Command Center.
3. Added live conversion funnel rollups: landing page view → product view → add to cart → checkout start → order.
4. Added explicit public funnel events for product detail views, add-to-cart actions, checkout starts, and order creation.
5. Added mobile product browser autosave/recovery so phone-entered draft text survives refresh/session/upload failures.
6. Added visual placeholder bands to high-value public pages without adding extra H1 tags.
7. Added visual replacement candidate rows so placeholders can be replaced only after public-use/consent/compression review.
8. Added local SEO observation rows to pair Search Console data with Google Business Profile/manual ranking notes.
9. Added product cost/margin review rows for product pricing and marketplace-profit review.
10. Updated schema files, release notes, sanity notes, handoff docs, and static Build 189 report.

Next 20 recommended steps after Build 189:

1. Replace placeholder graphics with approved real compressed photos, starting with homepage, shop, custom gifts, jewelry, and gallery.
2. Import the first Search Console export and connect real clicks/impressions to Local SEO scorecards.
3. Add manual Google Business Profile observation notes monthly for important pages and products.
4. Add product material/labour/package cost defaults for major product families.
5. Add customer/member timeline cards that combine orders, custom requests, gift cards, recalls, proof approvals, and notes.
6. Add a phone-tested Mobile Quick Add recovery checklist with screenshots from a real device.
7. Connect approved customer stories directly into product cards and local landing trust blocks.
8. Add a product margin warning before marketplace export when estimated margin is too low.
9. Add a simple dashboard for real media waiting on consent/public-use review.
10. Add product-detail visual proof modules that show process, scale, material, and care notes.
11. Add admin command-center saved views for Owner, Product, SEO, Accounting, and Deploy mode.
12. Add a low-bandwidth preview toggle to more public pages.
13. Add image compression reports for all public placeholder replacement candidates.
14. Add “missing real photo” badges on Product Readiness rows.
15. Add conversion funnel date filters and source/UTM filters.
16. Add cart recovery/customer follow-up review rows before emailing anyone.
17. Add Search Console opportunity buttons that create title/meta/internal-link actions.
18. Add a customer story approval screen grouped by source product/order/custom request.
19. Add performance-budget badges directly beside visual placeholder candidates.
20. Retire or archive duplicate Markdown once `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` stay complete for two more build passes.

