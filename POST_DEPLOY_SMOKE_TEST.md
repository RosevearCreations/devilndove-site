# Build 184 post-deploy sanity check

After deploy, open `/admin/application-sanity/`, seed rows, save a sanity snapshot, then compare it with Deployment Preflight, Go-Live Execution, Visual Enrichment, and Post-Deploy Smoke Tests.

# Build 183 post-deploy visual smoke-test notes

After deploy, open `/admin/visual-enrichment-studio/`, seed the Build 183 rows, then review screenshot pairs, image-slot assignments, compression budgets, low-bandwidth toggle behaviour, and final visual deployment report rows. Confirm public pages still show one H1 and that the lighter visual toggle does not hide core content.

# Build 182 post-deploy smoke-test additions

- Open `/admin/visual-polish/` after Live Ops and run **Refresh all Build 182 rows**.
- Review desktop/mobile parity rows, visual candidates, fallback rows, schema queue rows, and JSON-to-D1 candidates.
- Check public pages on phone and desktop for hero/card polish, no horizontal scroll, readable contrast, and one clear H1.

# Build 181 Post-Deploy Addendum

- After deploy, open `/admin/live-ops-followthrough/` and run Refresh all Build 181 rows.
- Create one short-expiry signed evidence link against a harmless test R2 object and confirm expiry/download behaviour.
- Check marketplace gate badges, recall upload requests, dashboard action buttons, and watcher execution snapshot rows.

# Build 180 post-deploy smoke notes

After deploy, run Deployment Preflight, Release Control, Deploy Readiness, Promotion Control, Go-Live Execution, and Post-Deploy Smoke Tests. Then queue the post-promotion watcher from Go-Live Execution.

# Build 179 post-deploy checks

After running the Build 179 D1 migration, open `/admin/promotion-control/` and run these checks:

1. Seed/refresh all final controls.
2. Confirm Product QA safe-apply rules are approval-gated.
3. Confirm marketplace download gates are not blocking required exports unexpectedly.
4. Confirm recall release gates stay blocked until copy, signature evidence, and customer match review are present.
5. Run provider signature setup checks and R2 signed URL expiry checks in the deployed environment.
6. Attempt Promote Live only after Release Control, Deploy Readiness, Safe Deploy, Smoke Tests, D1 markers, R2/email, recall, marketplace, and release notes are clear.
7. Run the post-promotion incident watcher after live promotion.

# Build 177 post-deploy smoke-test additions

After deploying Build 177:

1. Run D1 migrations through `database_build177_deploy_score_and_controls.sql`.
2. Open `/admin/release-control/` and click **Import Cloudflare deployments** after configuring `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_PAGES_PROJECT`, and a scoped token.
3. Run **Live Manifest Compare** against the live `/data/site/release-package-manifest.json`.
4. Run **Create Rollback Checklist** and mark rows manually before promotion.
5. Run **Calculate deploy score** after smoke tests.
6. Verify recall notification status changes remain blocked unless release locks say `release_allowed`.
7. Confirm LocalBusiness JSON-LD exists on homepage and local landing pages.

Build 176 post-deploy addition: after smoke tests, open Release Control, run Live Manifest Compare, download the Safe Deploy ZIP, refresh recall locks, and create rollback checklist rows before promotion.


## Build 175 smoke additions

After deploying, open `/admin/release-control/`, seed mobile saved views, queue dark-theme screenshot evidence rows, and review `/api/admin/release-control?format=local-business-json`.

# Build 174 Post-Deploy Smoke and Confirmation Notes

After applying Build 174:

1. Run `/admin/deployment-preflight/` and review blockers/warnings.
2. Export the Markdown preflight handoff if anything needs review outside the admin UI.
3. Save a preflight snapshot.
4. Run `/admin/post-deploy-smoke-tests/` for the core live URLs.
5. Return to Deployment Preflight and mark post-deploy confirmation rows complete with notes.
6. Review `/admin/safe-deploy-package/` and `/data/site/release-package-manifest.json` before promoting live.

# Build 173 Post-Deploy Smoke and Preflight Update

New post-deploy step:
- Open `/admin/deployment-preflight/` after D1 migrations and before live promotion.
- Run the preflight check for D1 ledger safety, one-H1/title/meta checks, local wording, CSS drift, static JSON fallbacks, and core admin page fetch health.
- Save a snapshot so the deployment has a dated admin review record.

Recommended order:
1. Apply any needed repair migration (`database_build171_ledger_repair.sql`) only if the Build 171 ledger marker failed after schema objects already existed.
2. Apply `database_build173_deployment_preflight.sql`.
3. Run `/admin/deployment-preflight/`.
4. Run `/admin/post-deploy-smoke-tests/`.
5. Open `/admin/safe-deploy-package/` and confirm required post-deploy actions are documented.

# Post-deploy live URL smoke-test checklist

Run this after each Cloudflare Pages deployment.

## Public pages

- `/` loads without console JSON/HTML parse errors.
- `/shop/` keeps the dark Devil n Dove theme and shows product cards with usable thumbnails.
- `/shop/product/?slug=<known-product-slug>` returns product JSON-backed content, not an `Unexpected token '<'` error.
- `/creations/` keeps dark cards with readable text.
- `/gift-cards/` loads the gift-card page and artwork.
- `/custom-candle-making-ontario/` and `/custom-soap-making-ontario/` each have one H1.

## Admin pages

- `/admin/catalog/` loads product rows, readiness badges, QA controls, and edit buttons.
- `/admin/catalog-media/` loads Product Media Workflow and derivative history.
- `/admin/marketplace-exports/` shows image selectors and CSV download.
- `/admin/trust-blocks/` shows placement counts and context preview.
- `/admin/mobile/` shows Today tasks, failed API details, and snooze buttons.
- `/admin/local-seo-review/` shows score badges and title/meta quick actions.

## Data/API checks

- `/api/products` returns JSON.
- `/api/product-detail?slug=<known-product-slug>` returns JSON.
- `/api/admin/today-tasks` returns JSON when signed in.
- `/api/admin/marketplace-export-preview?channel=etsy` returns JSON when signed in.
- `/api/admin/product-readiness` returns JSON when signed in.

## Visual checks

- No white card with white/light text in shop, creations, or Local maker trust sections.
- Product card images do not stretch vertically.
- Product media table/cards do not force long full-page scrolling for routine edits.


## Build 169 D1 smoke-test result storage

The admin endpoint `/api/admin/post-deploy-smoke-tests` stores manual or automated smoke-test results in D1.

Recommended checks to store after deploy:

- `/` homepage returns 200 and dark-theme sections render correctly.
- `/shop/` returns 200 and product cards fetch JSON successfully.
- `/creations/` returns 200 and Browse Devil n Dove creations uses dark cards.
- `/gift-cards/` returns 200 and balance lookup form loads.
- `/admin/catalog/` loads without function syntax errors.
- `/api/products` returns JSON.
- `/api/product-detail?slug=<known-product-slug>` returns JSON, not HTML.
- `/api/trust-blocks?context=home` returns JSON.

Store results with `build_label`, `page_url`, `result_status`, `http_status`, and `notes`.

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

## Build 178 smoke-test additions

- After standard smoke tests, open `/admin/deploy-readiness/`, seed drilldowns, and build the promote-live checklist.
- Confirm marketplace row validation, recall copy review, R2 signed URL check, and provider webhook signature setup rows.



## Build 189 value ops note

Use `/admin/command-center/` after deploy to refresh live counts. Run `database_build189_value_ops_live_counts.sql` after the existing Build 186 migration. Placeholder images are still placeholders; replace only with approved, compressed public-use media.
