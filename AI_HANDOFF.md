# Devil n Dove AI Handoff — Build 235

This is the first of two canonical current-status files. Read it first for architecture, authority, safety and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for completed work, risks and ordered next steps. Historical Build Markdown remains evidence only.

## Build 235 outcome

1. Creative Automation now calculates seven stage-readiness results on the server from the existing specialist authorities. Each stage returns explicit checks, expected facts, actual counts, correction guidance and whether an intentional Not applicable review is allowed.
2. A human master review remains mandatory. Computed readiness can expose disagreement as `needs_source_evidence`; it cannot silently approve rights, costs, facts, publication or provider results.
3. The master page now provides one responsive work queue prioritizing blocked, overdue, due-soon and unassigned workflows before ordinary active work.
4. Each linked project can export an authenticated JSON evidence packet or an accessible print-ready HTML packet containing project/timeline/material, inventory, CAIP, content, review, publication, result and profitability evidence already stored in specialist tables.
5. Publication readiness now reads the authoritative `content_status` field rather than the nonexistent `publication_status` field, preventing a real approved/published record from being counted as absent.
6. The browser adds readiness checklists, eight operational metrics, safe authenticated Blob exports, retry/fallback copy and phone/desktop layouts. The admin route remains `noindex,nofollow` and has one H1.
7. Build 235 is code-only. It adds no D1 table, column, seed or ledger row; the Build 234 numbered/current-pass migration remains the current schema boundary.
8. Forty-seven superseded Build guides/validation files were moved from the repository root to `docs/archive/build-history/`. `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` remain the only current cross-project authorities; specialist playbooks retain narrow authority.
9. Release checks now understand the historical archive, and `scripts/build235_creative_readiness_test.mjs` proves source-readiness, queue ordering, publication counting, evidence export, responsive UI and the retained Build 234 schema boundary.
10. Build 235 does not claim production/provider/physical success. Live Cloudflare, payment, concurrency, email, media-rights, printing/laser and paid/refund evidence remain Startup gates.

## Retained Build 234 outcome

1. Labeling & Packaging is the only active packaging editor. The selected `packaging_templates` row now determines renderer and saved `package_type`; stale project data can no longer turn a soap template into a generic rectangle.
2. The Glacial Purple soap renderer follows the owner-supplied visual: permanent Rosevear/Devil n Dove, website, Canadian-origin, small-batch, claim and weight elements; a botanical purple rose; centred product hierarchy; English/French panels; rear seal; and editable SVG text.
3. Five packaging directions are checksum-registered: soap specification, PDF guide, master SVG, approved soap visual and wedding candle-top sample. `PACKAGING_REFERENCE_BASELINE.md` defines their scopes.
4. Five system templates were added: 4-inch and 3.5-inch wedding candle tops, 3-inch general candle top, 4-inch round maker/coaster mark and 2×1.5-inch oval product label.
5. Candle-top names/main wording, two dates, occasion, top/bottom arcs and artwork remain editable and centred. Users can change millimetre dimensions, shape, renderer profile, bleed/safe margin and save a D1 custom template for repeat work.
6. SVG export embeds artwork data so a downloaded repeat-job master does not depend on a website-relative image path. PNG/WebP/JPG remain preview formats; printer/laser acceptance and physical proof remain required.
7. Creative Automation exposes guarded permanent deletion for unused accidental project shells. It permits the automatic output blueprint and ordinary initial product link, preserves the real product, blocks meaningful timeline/inventory/evidence/content/cost/review work and requires `DELETE <project_key>`.
8. Packaging Studio, Creative Automation, Creative Process and Startup Readiness execute no request-time `CREATE TABLE` or schema initializer. Schema/seed installation belongs to migrations, reducing Pages Worker CPU/memory pressure.
9. Startup Readiness now has exactly 44 gates. `candle_top_template_proof` provides twelve detailed measurement, custom-template, export, laser/material proof, correction and archive steps.
10. Build 234 adds migration `database_build234_packaging_templates_creative_cleanup.sql`, identical current-pass SQL and ledger key `build234_packaging_templates_creative_cleanup`. It upserts system templates, five reference records and all 44 canonical gate definitions without overwriting operator status/evidence.
11. Generated text-free packaging art and prompts/checksums are documented in `GENERATED_VISUAL_ASSET_REGISTER.md`. It cannot supply formula, bilingual, legal, customer or product-proof facts.
12. Admin navigation now presents one Labeling & Packaging entry; the old Soap Label route remains a compatibility pointer.
13. Responsive preview CSS distinguishes wide soap wraps from round candle tops, pairs source references safely and stacks destructive controls on phones.
14. Build 234 retains the Build 231 autosave, Build 232 archived-product removal and Build 233 bounded-login/session-retention repairs.
15. Public SEO direction is unchanged: one H1 per exposed page, clear title/main-heading hierarchy, truthful local language, accurate structured data and rights-cleared media. Admin routes remain `noindex,nofollow`.

## Retained Build 233 outcome

1. Startup Readiness preserves all 42 Build 228 gates and adds `missing_launch_images` as a distinct Critical blocker. Exactly 43 gates are expected.
2. The Startup browser rejects HTML, empty, malformed or incomplete API success responses and renders the full built-in 43-gate guide. It never turns a service failure into “No readiness items match these filters.” Browser-only changes are visibly Unsynced.
3. `/admin/prelaunch/` shows the seven separate prelaunch/release stages. `PRELAUNCH_PROCESS_PLAYBOOKS.md` gives click-by-click tests, correction, evidence and pass rules.
4. `/admin/creative-automation/` is the master Creative Automation Studio. It combines Creative Process, materials/cost, CAIP, Content Studio, channel approvals, Release Board and measure/repurpose stages without deleting specialist features or duplicating their source facts.
5. Build 229 adds only `packaging_reference_sources`; existing Creative Process, packaging, inventory, CAIP, Content Studio, publication, social, catalog and analytics tables remain authoritative for their facts.
6. New and changed admin layouts stack on mobile, contain table overflow, preserve touch targets and expose direct specialist/fallback paths.
7. Deployment Preflight now blocks a current D1 migration containing explicit `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK`, and requires the numbered/current migration files to be identical.
8. The exact supplied packaging specification, guide PDF and master SVG are retained with SHA-256 values and exposed in Labeling & Packaging; `PACKAGING_REFERENCE_BASELINE.md` documents their collective authority and dimensional conflict.
9. Public SEO policy remains: one H1 per exposed page, clear titles/descriptions/canonical/visible facts, truthful local language and approved media. Admin routes are `noindex,nofollow`.
10. `/admin/image-manifest/` is now the mutable visual-status authority. It seeds 20 requirements and stores owner, status, rights, public-use, final URL, alternative text, phone/desktop review and append-only history in D1.
11. The manifest API rejects incomplete approvals, audits saves and records runtime incidents. Its browser fallback shows all 20 requirements as visibly Unsynced and read-only instead of implying an empty or complete result.
12. Three responsive editorial illustrations now enrich the homepage, general handmade-jewelry guide and gift-card page. Prompts, intended roles, dimensions and hashes are preserved in `GENERATED_VISUAL_ASSET_REGISTER.md`.
13. Generated art never satisfies a real-product, process, condition, packaging or local-business photo requirement and must not enter Product/Offer structured data or launch-product galleries.
14. Changed public pages keep one H1, truthful editorial disclosure, intrinsic image dimensions and responsive phone/desktop sources; the manifest stacks safely with touch-sized actions.
15. Product Draft autosave now carries an explicit autosave intent so create/update routes omit approval/content/social preparation and repetitive update/media audits while retaining deliberate Save/Update audits and automation.
16. Unapproved products exit social automation before schema/settings inspection, and unchanged image rows are not rewritten on text-only autosaves.
17. Autosave allows one request in flight, queues the newest edit, stores a browser recovery copy before the request and clears it only after the matching server save succeeds.
18. Product reload, autosave and update use one safe response parser. A Cloudflare HTML/1102 page becomes a short retryable message; raw HTML/CSS and `JSON.parse` exceptions are never shown to the operator.
19. `/api/admin/product-detail` now uses one core product read plus three bounded optional editor reads, performs no request-time schema introspection, returns at most seven images and identifies its JSON as `editor_compact_v1`.
20. Build 231 remained code-only and established the current product load/autosave recovery baseline.
21. `/api/admin/delete-product` no longer enumerates every D1 table and foreign key during each correction preflight; it checks a bounded registry of protected business/history relationships and returns `bounded_registry_v1`.
22. Archive status alone does not block an unused product from permanent removal. Ordinary `product_media_change_audit` and product review rows are product-owned cleanup data; orders, customer, accounting, packaging, creative-project, recall and other retained history still block deletion.
23. Reviewed inventory releases/physical returns, product-owned cleanup, preserved-media/soap-record detachment and final product deletion run in one D1 batch so a failure rolls the operation back together.
24. Correction, table-row deletion and the Draft & Archive Cleanup centre all use the shared safe API parser; Cloudflare HTML and malformed responses cannot collapse into the unhelpful “Could not load product correction details” message.
25. Build 232 was code-only. At that historical release, Build 230 was the current D1 boundary; Build 234 now supersedes the current-pass file.
26. `/api/auth/login` validates its request before D1, uses the indexed normalized email lookup, omits request-time schema discovery and returns `auth_login_bounded_v1` after one user read plus one atomic session/last-login batch.
27. Login no longer rereads the session it just created. The new token and timestamps are already authoritative inputs to the successful response.
28. Normal GET `/api/auth/login` is binding-only and performs no D1 query; the older table/column diagnostic remains available only through the deliberate `?diagnostic=full` owner procedure.
29. `/api/auth/me` now performs one indexed `session_token` lookup, returns only the fields the UI consumes and identifies the result as `auth_session_bounded_v1`. A temporary 5xx, Cloudflare 1102, offline or malformed response no longer clears browser credentials; only a real 401/403 authentication decision clears them, and degraded verification is visibly labelled.
30. Build 233 remains code-only and adds a mocked two-operation login/query-budget, temporary-503 retention, real-401 clearing and safe-response regression.
31. Pages Functions compile into one Worker, so the former 1.1 MB/897-row Amazon reference array and its top-level Maps affected unrelated routes. Build 233 keeps that private payload compressed by area and expands it only after an authenticated inventory request; login, session, product detail, autosave and product removal no longer allocate it during Worker startup.

## Data authority

- Startup status/history: D1 `startup_readiness_items` and `startup_readiness_history` at `/admin/startup-readiness/`.
- Startup instruction source: `STARTUP_ITEMS` in `functions/api/admin/startup-readiness.js`; generate `STARTUP_GO_LIVE_GUIDE.md`, sync the browser fallback, then sync the 44 definitions into the Build 234 migration. Runtime requests do not seed or create tables.
- Creative project/process/material/output facts: existing Creative Process tables.
- Media rights/evidence/intelligence: CAIP records and referenced source media; CAIP never invents consent.
- Content packages/channel deliverables: Content Studio records.
- Public release state/history: Content Release Board records.
- Master creative ownership/stage reviews: three `creative_automation_*` tables only. Build 235 computes readiness from bounded reads of specialist authorities and writes no duplicate readiness facts.
- Product/order/payment/refund/inventory/accounting facts: their existing D1 transaction/ledger records.
- Packaging: `packaging_projects`, normalized soap rows, `packaging_components`, versions, exports and print tests; `PACKAGING_STUDIO.md` is the human specification.
- Packaging sources: `packaging_reference_sources` and `PACKAGING_REFERENCE_BASELINE.md`; the adopted files remain unchanged at their registered repository paths.
- Issued client documents: immutable `customer_documents.source_snapshot_json`; corrections use void/new document, never history rewriting.
- Static templates/public read-only defaults may remain JSON. Mutable business status, evidence, money, stock, approvals and audit history belong in D1.
- Image requirements/status/history: D1 `image_manifest_items` and `image_manifest_history`; `IMAGES_REQUIRED.md` is the human capture standard and `GENERATED_VISUAL_ASSET_REGISTER.md` is generated-asset provenance.

## Current operating routes

- `/admin/startup-readiness/` — 44 launch gates and D1 evidence, including distinct missing-image and candle-top-proof blockers.
- `/admin/image-manifest/` — 20 seeded static/dynamic image requirements, rights/public/device approvals, evidence and history.
- `/admin/prelaunch/` — separate process map.
- `/admin/deployment-preflight/`, `/admin/post-deploy-smoke-tests/`, `/admin/deploy-readiness/`, `/admin/go-live-execution/`, `/admin/live-ops-followthrough/` — standalone release stages.
- `/admin/creative-automation/` — master creative workflow, computed readiness, priority work queue and authenticated project evidence exports.
- `/admin/creative-process/`, `/admin/creative-assets/`, `/admin/content-studio/`, `/admin/content-publications/`, `/admin/social-publishing/` — specialist creative authorities retained.
- `/admin/packaging-studio/` — whole-business soap/candle/round/general labels, reusable custom templates, packaging BOM/cost, previews, versions, embedded-artwork exports and print tests.
- `/admin/customer-documents/` — invoices, receipts, packing slips, credit notes and refund confirmations.
- `/admin/orders/`, `/admin/accounting/`, `/admin/inventory-operations/` — operational transaction authorities.

## Current database boundary — Build 234 schema, Build 235 code-only

Back up D1 and confirm `build229_packaging_reference_authority` and `build230_visual_image_manifest`. Apply exactly one:

- `database_build234_packaging_templates_creative_cleanup.sql`
- `database_upgrade_current_pass.sql` (byte-identical copy)

The migration upserts five packaging templates, five adopted reference rows and 44 Startup definitions while preserving mutable readiness status/evidence. It adds ledger key `build234_packaging_templates_creative_cleanup` and contains no explicit `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK`. Aggregate schemas contain the same block. Run `node scripts/sync-build234-startup-seed.mjs` after changing the API gate definition, then `node scripts/sync-build234-aggregate-schema.mjs`.

## Retained Build 233 database boundary

Build 233 added no D1 table, column, seed or ledger row. At that historical release, its current-pass file was byte-identical to the numbered Build 230 migration. Build 234 has now replaced `database_upgrade_current_pass.sql`; use `database_build230_visual_image_manifest.sql` by its numbered name only when repairing an environment whose `build230_visual_image_manifest` ledger key is absent.

That Build 230 migration adds `image_manifest_items`, `image_manifest_history`, 20 active requirements, three generated-asset provenance rows and ledger key `build230_visual_image_manifest`. It preserves operator-editable evidence on repeat execution and contains no explicit SQL transaction statements. Do not add `BEGIN TRANSACTION` or `SAVEPOINT`; D1/Durable Object code must use `state.storage.transaction()` or `transactionSync()` when a JavaScript transaction is required.

Aggregate schema files `database_schema.sql`, `database_full_schema.sql` and `database_store_schema.sql` retain Builds 229 and 230 and now end with Build 234. Older synchronizers intentionally stop so they cannot erase the current block.

## Error/fallback rules

- An unavailable API is Blocked/Unavailable, never Passed.
- Browser fallback may preserve instructions or a visibly unsynced draft; it cannot represent server evidence.
- Payment, refund, publish, inventory, accounting, approval and document actions require an observable authoritative result.
- Runtime incidents must be sanitized and include scope/code/severity plus non-secret request/user context.
- Master creative failure must leave specialist workspaces reachable.
- Startup failure must show all built-in gates and a retry path.
- Image-manifest failure must show 20 read-only fallback requirements, an Unsynced warning and retry; saving is disabled and no fallback status is presented as approved.
- Authentication credentials are cleared only after an explicit 401/403 decision or deliberate logout. A 5xx, Worker 1102, network/offline or malformed upstream response retains the existing session and reports degraded verification without claiming the server validated it.
- Large optional reference datasets must not be allocated at module top level in Pages Functions. Keep the Amazon rows private, compressed and demand-loaded; do not move purchase/order identifiers into a publicly served JSON file.

## SEO/local/mobile rules

- Exactly one H1 on each exposed HTML page; do not create multiple equally prominent title-like headings.
- Use natural buyer language in title, H1, introduction, product facts, alt text and internal links. Avoid location/keyword stuffing.
- Keep canonical, Product/Offer, LocalBusiness/Organization and visible facts consistent; placeholders never enter Product schema, Open Graph or launch galleries.
- Put accurate, high-quality images near relevant visible text, preserve equivalent mobile/desktop content and alt text, and use multiple real high-resolution product views where useful; never keyword-stuff alternative text.
- Maintain accurate Business Profile name/category/contact/hours/service area/photos and real review practices. First-page placement cannot be guaranteed because local results also depend on distance and prominence.
- Test phone, tablet, laptop and wide desktop; keyboard order/focus, touch targets, overflow, dialogs and slow-image fallback are release checks.

## Deploy sequence

1. Run the complete Build 235 Deployment Preflight and regression suite against the exact folder/archive.
2. Record a D1 recovery point. If the `build234_packaging_templates_creative_cleanup` ledger key is absent, apply exactly one Build 234 numbered/current-pass migration; otherwise do not reapply it merely for Build 235.
3. Deploy the complete Build 235 archive and retain previous deployment/rollback details; hard refresh so service-worker shell v16 is active.
4. Run Post-Deploy Smoke Tests on production.
5. Confirm all 44 Startup gates load, the image manifest has 20 D1 rows, and degraded fallbacks remain visibly unsynced/read-only.
6. In Creative Automation, verify the priority queue order with owner-controlled blocked/overdue/unassigned fixtures; open one project and compare every computed check with its specialist authority.
7. Export the same project as JSON and print-ready HTML. Confirm authentication, safe filenames, one H1/landmarks, complete factual sections and no credential/private-payment leakage.
8. Save one human stage review with evidence, reload, and confirm computed disagreement is shown rather than overwritten.
9. Run Build 235 validation plus the retained bounded-login, product autosave, product removal, guarded duplicate cleanup, packaging physical proof, visual-manifest and provider read-only checks.
10. Make a separate Deploy Readiness decision; execute Go-Live only after Ready; continue Live Ops reconciliation.

## Not claimed complete

Local code cannot supply production credentials, physical stock/label proof, legal/tax approval, real provider permission, customer email delivery or paid/refund evidence. Those remain Startup gates. Google ranking cannot be guaranteed; monitor Search Console, Business Profile and real local/customer evidence.
