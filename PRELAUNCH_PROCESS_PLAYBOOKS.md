# Build 245 current release-sequence note

Current sequence: back up D1 → apply `database_build245_admin_media_resilience.sql` or byte-identical current-pass once → run `BUILD245_D1_VERIFICATION.sql` → deploy the complete Build 245 package → hard-refresh shell v22 → run admin auth/media/inventory smoke checks and the retained 46-gate Startup process. Build 245 contains the Build 244 inventory/fractional transition, so do not run both Build 244 and Build 245 as separate current migrations in the same deployment pass.

# Devil n Dove Prelaunch Process Playbooks — Build 240

`/admin/startup-readiness/` is the 46-gate status authority. `/admin/operational-continuity/` is the execution/evidence centre for the twenty cross-workflow foundations. A pass in one process never erases a blocker elsewhere.

## Retained Build 240/241 foundation sequence

1. Back up D1 and retain the backup reference.
2. Confirm prior ledger key `build240_operational_evidence_continuity`, then apply `database_build241_caip_large_media_intake.sql` or identical `database_upgrade_current_pass.sql` once.
3. Deploy the complete package and hard-refresh to `devilndove-shell-v19`.
4. Confirm all 46 Startup gates, including `operational_continuity_evidence_center`.
5. Open Operational Continuity and verify the twenty-one workstreams, thirty-six public audit rows, seven mobile cards and honest degraded fallback.
6. Run the public-page audit, predeploy sanity, deployment preflight, retained regression tests and live smoke suite.
7. Record expected/actual evidence in D1; never infer live/provider/physical success from local static checks.

This document separates the release journey into distinct processes. A pass in one process never erases a blocker in another. `/admin/startup-readiness/` remains the 45-gate status authority; this playbook explains where to click, what to prove, what to save, and what to do when a stage fails.

## Process order

1. Product Release Preflight — prove each launch product is sellable.
2. Deployment Preflight — prove the exact package is internally consistent before upload.
3. Safe Deploy — back up D1, apply one migration, upload the complete package, and retain rollback details.
4. Post-Deploy Smoke Tests — prove the live deployment actually works.
5. Deploy Readiness — make an evidence-backed promote/hold decision.
6. Go-Live Execution — open the approved scope under active supervision.
7. Live Ops Follow-through — reconcile real activity and reopen gates when evidence changes.

## 1. Product Release Preflight

**Open:** Admin → Catalog → Product Release Preflight (`/admin/release-preflight/`).

1. In Products, create a deliberately small launch list and record each product ID, slug and SKU.
2. In Product Release Preflight, filter to that list. Do not use an average score to excuse a blocking row.
3. Open each product and verify name, product type, origin, price, currency, tax treatment, inventory authority, sale channel, dimensions, weight, care, shipping/pickup and customer-facing facts.
4. Open Catalog Media and `/admin/image-manifest/`; use `IMAGES_REQUIRED.md` for capture standards. Prove one featured image, promised supporting roles, public-use clearance, useful alt text and reliable delivery. The Critical gate stays open for any missing, broken, placeholder or rights-unclear launch asset; generated art cannot satisfy real-product proof.
5. Open the public View link in a private window, refresh it, copy the URL, and test the gallery on a phone and desktop.
6. Open Labeling & Packaging and prove the approved label, package components, costs, lot/batch fields and physical print/wrap test required for that product.
7. Resolve every red item in the owning record. Retest the public view after important corrections.
8. Save product IDs, screenshots, tested device/browser, inventory count, packaging version and final reviewer.

**Failure:** keep the product Draft/Archived, correct the source record, then rerun the complete product preflight.  
**Pass:** every launch item has current public facts, approved media, accurate stock/pricing and physically proven packaging.

## 2. Deployment Preflight

**Open:** Admin → Operations → Deployment Preflight (`/admin/deployment-preflight/`).

1. Run `python3 scripts/predeploy_sanity_check.py` from the extracted release folder.
2. Run `python3 scripts/deployment_preflight_static_check.py` and open `data/site/deployment-preflight.json`.
3. Run `node scripts/build230_visual_manifest_test.mjs`; it must report the current 44 unique Startup gates, 20 unique manifest rows, a working read-only fallback and retained generated-asset checksum integrity.
4. Run `node scripts/build231_product_autosave_test.mjs`; it must prove bounded Product Detail JSON, safe Cloudflare parsing, queued autosave and browser recovery.
5. Run `node scripts/build232_product_removal_test.mjs`; it must prove bounded archived-product preflight, full product-reference registry coverage and one reviewed removal batch.
6. Run `node scripts/build233_login_resource_test.mjs`; it must prove two executed D1 operations for successful login, no POST schema discovery/session reread, binding-only normal diagnostics, temporary-503 session retention, real-401 clearing and all 897 compressed Amazon matches available only through demand loading.
7. Run `node scripts/build234_packaging_creative_test.mjs`; it must prove authoritative template selection, soap/candle render structure, five reference/template keys, 45 current gates, guarded duplicate cleanup, bounded hot routes and aggregate-schema repeatability.
8. Run syntax checks for all Functions, browser JavaScript, scripts and the service worker.
9. Confirm every public HTML page has a viewport, distinctive title, useful description, exactly one H1, canonical where applicable and descriptive image alternatives.
10. Confirm `css/styles.css` has balanced braces and inspect the changed pages at phone, tablet, laptop and wide-desktop widths.
11. Compare `database_upgrade_current_pass.sql` with `database_build234_packaging_templates_creative_cleanup.sql`; they must be identical.
12. Search the current migration for explicit SQL transaction statements. Any `BEGIN`, `COMMIT`, `SAVEPOINT`, `RELEASE` or `ROLLBACK` is a blocker for D1/Durable Objects execution.
13. Apply aggregate schemas in disposable SQLite databases and apply the current migration twice to prove rerun safety.
14. Compile Pages Functions with the Wrangler version used by Cloudflare.
15. Compare all five adopted packaging source checksums with `PACKAGING_REFERENCE_BASELINE.md`; retain the 25/38.1/50 mm soap discrepancy and unmeasured candle-sample boundary until physical proofs.
16. Compare all generated asset hashes with `GENERATED_VISUAL_ASSET_REGISTER.md`; verify intrinsic dimensions and confirm no generated path appears in Product/Offer data.
17. Generate the release manifest and record the ZIP SHA-256. Deploy only that exact archive.

**Failure:** correct the owning source file, regenerate derived files, rebuild the archive and restart the entire preflight.  
**Pass:** all local/static/schema/syntax/bundle checks pass and the archive is identified by name and checksum.

## 3. Safe Deploy

**Open:** Cloudflare Dashboard → Workers & Pages, D1 and the production Pages project.

1. Record the production D1 database name and create an approved Time Travel/recovery reference before writing.
2. Confirm the Build 229 and Build 230 ledger entries exist.
3. Apply either `database_build234_packaging_templates_creative_cleanup.sql` or the identical `database_upgrade_current_pass.sql` once—not both.
4. Do not wrap the SQL in `BEGIN TRANSACTION` or `SAVEPOINT`. If migration is executed inside Durable Object code, use `state.storage.transaction()` or `transactionSync()` around the JavaScript operations.
5. Confirm ledger key `build234_packaging_templates_creative_cleanup`, five active packaging references, five new system-template keys and 44 active Startup rows. Existing Startup evidence/status must be unchanged.
6. Upload the complete preflighted package and record deployment ID, URL, time and operator.
7. Keep the previous production deployment and D1 recovery point available.
8. Do not promote because upload succeeded; continue immediately to live smoke tests.

**Failure:** stop, preserve logs, roll back the Pages deployment and restore D1 only when necessary under the approved recovery procedure.  
**Pass:** schema and complete package deploy without a Function, route or integrity error and rollback references are recorded.

## 4. Post-Deploy Smoke Tests

**Open:** Admin → Operations → Post-Deploy Smoke Tests (`/admin/post-deploy-smoke-tests/`).

1. Test the production domain, HTTPS and the canonical `www`/non-`www` redirect.
2. In a private window, open Home, Shop, one local landing page, one product detail, Contact, policies, sitemap and robots.
3. Confirm exactly one visible H1 and no CSS overlap or horizontal page overflow at phone and desktop widths.
4. Test the complete fourteen-step Build 233 login gate: `auth_login_bounded_v1`, successful redirect and refresh, Cloudflare invocation result, wrong-password 401, blocked `/api/auth/me` session retention/recovery, deliberate logout, reset, logout-all and expiry using owner-controlled accounts.
5. Open Startup Readiness with All statuses and confirm all 46 gates appear, including `missing_launch_images` and `candle_top_template_proof`. Force or simulate an API error and confirm the full built-in guide appears instead of an empty result.
6. Open Visual Image Manifest and confirm 20 D1 rows. Save/reload one reversible review, confirm history, then test the API failure path: all 20 rows must remain visible as Unsynced and saving must be disabled.
7. Open Home, Handmade Jewelry and Gift Cards on phone/desktop. Confirm responsive WebPs, editorial disclosure, one H1 and no Product/Offer use. Keep real-photo rows open.
8. Open Labeling & Packaging and confirm all five reference directions are represented. Verify the approved soap structure, candle-top round renderer, exact dimensions and self-contained SVG exports on phone and desktop; physical proofs remain separate gates.
9. Test a safe product view/cart/checkout path without completing payment unless the Startup gate calls for a paid rehearsal.
10. Test image fallback, slow network behaviour, structured error messages and runtime incident capture.
11. Open Creative Automation Studio, confirm its specialist links remain usable if the master API is unavailable, delete one untouched disposable shell and prove meaningful work blocks deletion.
12. Run the read-only Facebook + Instagram identity/token test; save IDs and scope/expiry results, never secrets.
13. Record route, time, browser/device, expected/actual result and safe evidence for every check.

**Failure:** pause promotion, correct or roll back, and repeat the full live suite—not only the failed route.  
**Pass:** public, authentication, admin, API, fallback, mobile and provider-test paths have current production evidence.

## 5. Deploy Readiness

**Open:** Admin → Operations → Deploy Readiness (`/admin/deploy-readiness/`).

1. Confirm Deployment Preflight and live smoke evidence refer to the same archive/deployment.
2. Open Startup Readiness with All statuses and inspect every Critical/High gate.
3. Confirm migrations, backups, payment, inventory exact-once behaviour, email, refunds/documents, packaging, mobile/accessibility, SEO and launch ownership have factual evidence.
4. Verify no green summary is based on missing/unavailable data. An unreachable source is Blocked, not Passed.
5. Record remaining warnings, owner, due date and accepted risk.
6. Select Ready only when every launch blocker is Complete or has a factual, authorized Not Applicable decision.
7. Save approver, time, deployment ID and evidence references.

**Failure:** choose Hold/Blocked, link the exact source gate, correct it and rebuild the decision.  
**Pass:** one named approver has made a current, evidence-backed promotion decision for the exact deployment.

## 6. Go-Live Execution

**Open:** Admin → Operations → Go-Live Execution (`/admin/go-live-execution/`).

1. Confirm the Deploy Readiness decision is Ready and current.
2. Confirm owner on duty, monitoring hours, support access and stop conditions.
3. Open only the approved product list with conservative inventory; keep unrelated items Draft/Archived.
4. Enable only the payment, shipping/pickup, email and public channels already proven.
5. Perform a quiet/limited opening before paid promotion.
6. Watch the first live actions in real time: payment, webhook, order, stock, email, documents, fulfilment and analytics.
7. If a stop condition occurs, hide checkout/product or roll back using the pre-approved control, preserve evidence and notify affected customers.
8. Record opening time, deployment ID, product count, operator and first review time.

**Failure:** pause the affected public action, reconcile records and obtain a new Deploy Readiness decision after correction.  
**Pass:** the approved scope is live, monitored and reversible without an unresolved stop condition.

## 7. Live Ops Follow-through

**Open:** Admin → Operations → Live Ops Follow-through (`/admin/live-ops-followthrough/`).

1. Reconcile every early order across provider payment, webhook, order, inventory movement, customer document, email and fulfilment.
2. Review runtime incidents, failed messages, oversell warnings, refunds, disputes and customer requests at the agreed interval.
3. Confirm stock counts and packaging material consumption against physical counts.
4. Review Search Console, Business Profile, analytics and customer questions for factual signals; do not infer first-page ranking.
5. Reopen any Startup gate affected by a deployment, credential rotation, provider version, policy, schema or material data change.
6. Record lessons in Creative Automation/operations only after real evidence exists.
7. Add products and automation gradually after stable core operations.

**Failure:** activate the stop condition, protect customers, reconcile money/stock/messages, reopen source gates and resume only after stable evidence.  
**Pass:** live activity is reconciled, incidents have owners and the next controlled expansion is evidence-based.
