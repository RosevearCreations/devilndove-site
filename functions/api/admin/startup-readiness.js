// File: /functions/api/admin/startup-readiness.js
// Build 233 — complete blocker register plus bounded login/session-retention proof.

import { auditAdminAction, captureRuntimeIncident, getAdminUserFromRequest, getDb, jsonResponse, normalizeText } from '../_lib/adminAudit.js';

const BUILD = '233';
const STARTUP_ITEMS = [
  {
    "key": "deployment_preflight_standalone",
    "phase": "foundation",
    "phase_label": "Foundation and deployment",
    "title": "Complete Deployment Preflight as a standalone pre-deploy process",
    "order": 5,
    "severity": "critical",
    "live": 0,
    "route": "/admin/deployment-preflight/",
    "external": "Build 233 archive, current schema/migration files, Cloudflare Pages Functions bundler, and PRELAUNCH_PROCESS_PLAYBOOKS.md",
    "instructions": "1. Open the Prelaunch Operations Map and confirm Deployment Preflight is stage 2, before Safe Deploy, live smoke tests, Deploy Readiness, and Go-Live Execution.\n2. Run the static predeploy, deployment-preflight, final-blocker, JavaScript syntax, Build 231 autosave/reload regression, Build 232 archived-product removal regression, Build 233 bounded-login/session-retention regression, aggregate-schema, repeated-current-migration, Startup 43-gate, image-manifest seed/provenance, packaging-reference checksum, and Cloudflare Pages Functions bundle checks against the exact archive to deploy.\n3. Confirm all public HTML pages have a viewport, distinctive title, useful meta description, one H1, crawlable canonical where applicable, valid structured data, and descriptive image alternative text.\n4. Confirm CSS braces balance and review phone, tablet, laptop, and wide-desktop overflow for every changed interface, especially Login, Product Editor, Product Cleanup, Visual Image Manifest and three public image bands.\n5. Confirm Build 233 adds no D1 migration: database_upgrade_current_pass.sql remains identical to database_build230_visual_image_manifest.sql and contains no explicit BEGIN, COMMIT, SAVEPOINT, RELEASE or ROLLBACK statement.\n6. Confirm AI_HANDOFF.md, PROJECT_STATUS_AND_ROADMAP.md, schema references, release notes, changed files and validation identify Build 233 consistently while naming Build 230 as the current D1 migration.\n7. Confirm the three adopted packaging source files still match PACKAGING_REFERENCE_BASELINE.md and the three generated editorial assets match GENERATED_VISUAL_ASSET_REGISTER.md; generated art must not appear in Product/Offer structured data.\n8. Confirm the image manifest contains 20 active seed rows, the three generated rows retain provenance, and real-photo requirements cannot be passed by generated imagery.\n9. Save the exact archive name, SHA-256, check results and unresolved warnings. Do not proceed when any blocker remains.\n10. If a check fails, correct the owning source file rather than editing only generated output; rerun the entire preflight from the beginning.",
    "pass": "The exact Build 233 archive passes every static, bounded-login/session-retention, autosave/reload, archived-product removal, schema, syntax, CSS, one-H1, metadata, image-manifest, fallback, packaging-reference, documentation and Pages Functions bundle check with zero unresolved blocker."
  },
  {
    "key": "backup_migrate_deploy",
    "phase": "foundation",
    "phase_label": "Foundation and deployment",
    "title": "Back up D1, apply the current migration, and deploy the complete build",
    "order": 10,
    "severity": "critical",
    "live": 1,
    "route": "/admin/deployment-preflight/",
    "external": "Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments",
    "instructions": "1. Open Cloudflare D1 and record the current Time Travel bookmark or approved recovery point before changing the schema.\n2. Record the date, database name and safe recovery reference in the evidence notes.\n3. Confirm the Build 229 migration is already present, then apply database_build230_visual_image_manifest.sql or the identical database_upgrade_current_pass.sql, but not both.\n4. Confirm the migration ledger records build230_visual_image_manifest, image_manifest_items and image_manifest_history exist, and 20 active manifest seed rows load without overwriting mutable review evidence.\n5. Deploy the complete ZIP rather than selected files.\n6. Record the Pages deployment URL and deployment/commit identifier.\n7. Open Startup Readiness with All statuses and confirm all 43 gates load without removing prior owner, evidence or history records; explicitly locate missing_launch_images and open its Visual Image Manifest route.\n8. Confirm the manifest loads from D1 rather than Unsynced fallback and preserves the three generated-editorial provenance rows.\n9. Continue to the standalone Post-Deploy Smoke Tests; do not treat successful upload as a passed live deployment.\n10. Stop and restore the previous deployment or D1 recovery point if any critical migration, Function, route or data-integrity error appears.",
    "pass": "A recoverable D1 point exists, the Build 230 migration is applied once after Build 229, the complete deployment is live, all 43 gates and 20 manifest rows load, and no migration, Function, route or data-integrity error remains."
  },
  {
    "key": "post_deploy_smoke_standalone",
    "phase": "foundation",
    "phase_label": "Foundation and deployment",
    "title": "Complete Post-Deploy Smoke Tests as a standalone live-verification process",
    "order": 15,
    "severity": "critical",
    "live": 1,
    "route": "/admin/post-deploy-smoke-tests/",
    "external": "Production domain, browser developer tools, Cloudflare Pages Functions logs, and POST_DEPLOY_SMOKE_TEST.md",
    "instructions": "1. Confirm the deployment ID and Build 230 migration evidence match the package that passed Deployment Preflight.\n2. Open the production home, handmade-jewelry, gift-card, shop, one product detail, contact, policies, login and password-recovery pages while signed out; record HTTP and visual results.\n3. Confirm the three generated WebP illustrations load at phone and desktop sizes, disclose editorial use, preserve one H1, and are absent from Product/Offer structured data and real-product galleries.\n4. Sign in with an owner-controlled administrator and test Startup Readiness, Visual Image Manifest, Creative Automation Studio, Labeling & Packaging, Client Documents, Orders and the Prelaunch Operations Map.\n5. In the manifest, filter open blockers, open a route, make one reversible review update, reload, and confirm database history. Test the API failure path and confirm the full 20-row Unsynced fallback remains visible with saving disabled.\n6. Test safe public/API reads and confirm every failure returns structured JSON or a clearly labelled usable fallback rather than a blank page or false success.\n7. At phone, tablet, laptop and wide-desktop widths, check navigation, image crops, cards, forms, tables, focus, touch targets, contrast and horizontal overflow on every changed route.\n8. Confirm one H1/title/meta/canonical/structured-data behaviour on representative live public pages and verify no admin page is indexable.\n9. Open Startup Readiness with All statuses, confirm 43 unique gates and locate the missing-launch-images Critical blocker.\n10. Record every failed route, console error, incident ID, screenshot/evidence reference and correction owner. After any correction/redeploy, repeat all smoke checks.\n11. Continue to Deploy Readiness only when every critical smoke result passes.",
    "pass": "The exact production deployment passes all critical public, authentication, admin, API, fallback, mobile/desktop and SEO smoke checks with current evidence and no unresolved critical result."
  },
  {
    "key": "production_bindings_secrets",
    "phase": "foundation",
    "phase_label": "Foundation and deployment",
    "title": "Verify production bindings, secrets, domains, and environment separation",
    "order": 20,
    "severity": "critical",
    "live": 1,
    "route": "/admin/deployment-preflight/",
    "external": "Cloudflare Pages project → Settings → Variables and Bindings; custom domains; D1/R2 bindings",
    "instructions": "1. Confirm the production Pages project is connected to the intended D1 database and R2 buckets.\n2. Confirm every required secret exists in Production, not only Preview.\n3. Check payment, email, OAuth, admin-bootstrap, analytics, and storage variables against CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md.\n4. Confirm preview/test credentials are not used in production and production credentials are not committed to the repository.\n5. Confirm devilndove.com and any www redirect resolve to the production deployment with valid HTTPS.\n6. Test one read and one safe write against each required binding.\n7. Record only variable names and test results; never paste secret values into evidence.",
    "pass": "The production domain, D1, R2, payment, email, and required application bindings are present in the correct environment and pass safe connectivity checks without exposing secrets."
  },
  {
    "key": "login_logout_recovery",
    "phase": "access",
    "phase_label": "Access, security, and recovery",
    "title": "Prove production login, logout, session expiry, and password recovery",
    "order": 30,
    "severity": "critical",
    "live": 1,
    "route": "/login/",
    "external": "Production website and the configured transactional email provider",
    "instructions": "1. Deploy the complete Build 233 package, hard refresh to service-worker shell v14, and record the Pages deployment ID before testing.\n2. Open a private browser window, open Developer Tools → Network, enable Preserve log, and load /login/ without storing the password in evidence.\n3. Open /api/auth/login in a separate tab and confirm HTTP 200 JSON reports response_profile auth_login_bounded_v1 and diagnostic_mode binding_only; a normal GET must not run full schema discovery.\n4. Submit an owner-controlled administrator login and confirm POST /api/auth/login returns HTTP 200 JSON, X-DD-Auth-Profile auth_login_bounded_v1, a session cookie, the correct role and the expected redirect. Never copy the token into evidence.\n5. In Cloudflare Workers & Pages → the production project → Functions/Workers Logs and Metrics, filter the login timestamp and confirm the invocation was successful with no exceededCpu, exceededMemory or 1102 outcome.\n6. Confirm the redirected page calls /api/auth/me once, returns HTTP 200 JSON with response_profile auth_session_bounded_v1, and remains signed in after one normal refresh.\n7. Test one deliberately wrong password and confirm HTTP 401 structured JSON AUTH_INVALID_CREDENTIALS, no redirect and no new authenticated session.\n8. While a valid session exists, use browser request blocking for /api/auth/me, reload /login/, and confirm the account widget says the session was retained/verification is temporarily unavailable; local storage and cookie must not be erased by a network/503 failure. Remove the block and confirm the next verification succeeds.\n9. Log out normally and verify the auth token/cookie is cleared and protected pages/APIs return a real 401 rather than continuing access.\n10. Request a password reset from the public recovery page; confirm delivery, one-time use, rejection of an expired/reused link, and successful login with the new password.\n11. Test Logout All Sessions in two browsers and confirm the older session receives 401 and is cleared, while a temporary 503 still does not masquerade as an invalid session.\n12. Confirm a deliberately expired owner-controlled session receives 401 and a clear login path; do not wait on a real production account or alter customer sessions.\n13. Record deployment ID, UTC/local timestamp, route, HTTP status, response code/profile, browser/device, Cloudflare invocation outcome and pass/fail result without passwords, cookies or tokens.\n14. If any step returns 503/1102, keep this gate Failed or Blocked, capture the Cloudflare invocation outcome, redeploy/roll back as appropriate and repeat all fourteen steps from a clean private session.",
    "pass": "Bounded login, session verification, temporary-503 retention, logout, reset, one-time token use, deliberate expiry, and logout-all work in production with no exceeded-resource outcome and no continued access after an explicit invalidation."
  },
  {
    "key": "role_authorization",
    "phase": "access",
    "phase_label": "Access, security, and recovery",
    "title": "Verify server-side authorization for destructive, financial, and approval actions",
    "order": 40,
    "severity": "critical",
    "live": 1,
    "route": "/admin/members/",
    "external": "Production admin APIs and role test accounts",
    "instructions": "1. Prepare an administrator account and at least one lower-privilege test account.\n2. Test inventory reversal, label approval, accounting export, member administration, publication approval and permanent product deletion with the lower role; confirm every direct API call returns 401 or 403 even if a button is hidden.\n3. As an administrator, create an owner-controlled disposable Draft product with no order, payment, customer, packaging or creative-project history; record its ID and System #.\n4. Archive that disposable product, open /admin/products/ → Draft & Archive Cleanup → Archived, select Check removal, and confirm /api/admin/delete-product?product_id=<ID> returns HTTP 200 JSON with cleanup_profile bounded_registry_v1.\n5. Confirm archive status and its ordinary editor/media audit alone do not block removal; the preflight must say Removal allowed unless a genuine protected reference exists.\n6. For a second owner-controlled product that has an order, packaging project, creative project or other protected history, repeat Check removal and confirm Archive only lists the blocking table/count and Permanent remove stays disabled. Never delete that history-backed product.\n7. On the disposable product, link one safe test supply and reserve one unit. Open Correct / return raw inventory, confirm the suggested release never exceeds Reserved, leave physical return at zero unless stock was truly put back, and enter a factual reason.\n8. Select Delete unused product and apply reviewed inventory actions, type DELETE PRODUCT exactly, confirm the current admin password and verify one success response.\n9. Confirm the product row is gone, its System # was not reused, Reserved changed exactly once, On hand did not change for reservation release, and product deletion/material-return/admin audit evidence identifies the actor, product, reason and time.\n10. Repeat the protected-history check after the deletion test and confirm it remains archived and unchanged.\n11. In Cloudflare Functions metrics/logs, confirm product-removal GET/POST returned valid JSON and produced no exceededCpu, exceededMemory, raw HTML or JSON.parse error.\n12. Retest the other sensitive administrator actions, remove or disable temporary accounts, and reconcile or remove only the owner-controlled disposable records.",
    "pass": "Every sensitive action is enforced on the server; lower roles receive 401/403; an unused archived product passes the bounded preflight and is removed with its reviewed inventory action exactly once; protected-history products remain archived; and successful actions are attributable in audit history without a Worker resource-limit event."
  },
  {
    "key": "runtime_incident_fallback",
    "phase": "access",
    "phase_label": "Access, security, and recovery",
    "title": "Prove runtime incident capture and honest fallback behaviour",
    "order": 50,
    "severity": "high",
    "live": 1,
    "route": "/admin/runtime-incidents/",
    "external": "Production Pages Functions logs and runtime incident records",
    "instructions": "1. Use a safe test condition that causes a non-destructive optional API failure, such as an unavailable optional table in a preview environment.\n2. Confirm the API returns structured JSON with a useful status code and plain-language error.\n3. In /admin/catalog/, load an owner-controlled Draft product, change its short description, wait at least three seconds and confirm Draft autosave reports a saved product ID/time.\n4. Reload the same product and confirm it loads without a JSON.parse error and contains the saved value.\n5. Throttle the browser network, edit the draft during an in-flight autosave and confirm the newer edit is queued, saved next and remains after reload.\n6. Block the update request or go temporarily offline, edit again and confirm the browser offers Recover browser copy without showing raw Cloudflare HTML/CSS or claiming D1 saved it.\n7. Restore connectivity, recover the copy, select Autosave now, reload and confirm the recovered value is authoritative in D1.\n8. In Cloudflare Workers & Pages metrics/logs, check the matching product-detail/create/update invocations for exceededCpu, exceededMemory and cf-error-type 1102. Record only timestamp, route, outcome, CPU/wall time and non-secret IDs. A platform-terminated Worker may be unable to write its own runtime incident, so Cloudflare logs are required evidence.\n9. Confirm an ordinary application exception still records scope, code, severity, user/request context and sanitized detail in /admin/runtime-incidents/.\n10. Restore the optional dependency and verify the normal path recovers; also review offline.html and low-bandwidth media fallback.\n11. After any code, deployment, plan/limit or schema change, repeat steps 3–10 before marking this gate Complete.",
    "pass": "Expected failures are visible, sanitized and recoverable; product reload/autosave preserves the newest edit without raw HTML or JSON.parse text; the controlled run adds no exceeded-resource event; and fallback states never present a browser copy as an authoritative save."
  },
  {
    "key": "launch_product_list",
    "phase": "catalog",
    "phase_label": "Catalog, product facts, and media",
    "title": "Choose a small opening-day product list and freeze its launch scope",
    "order": 60,
    "severity": "critical",
    "live": 0,
    "route": "/admin/products/",
    "external": "Internal operating decision",
    "instructions": "1. Select a deliberately small group of products that can be physically counted, photographed, packaged, and fulfilled now.\n2. Exclude experimental, incomplete, duplicate, content-only, or uncertain products from the launch group.\n3. Record the product IDs, names, SKUs, and intended sale channels.\n4. Confirm every selected item has an owner responsible for facts, media, inventory, packaging, and final review.\n5. Keep other products in Draft or Archived while the site opens.\n6. Revisit the launch group only through a deliberate review so the finish line does not keep moving.",
    "pass": "A finite opening-day product list is recorded, owned, and protected from unrelated draft work."
  },
  {
    "key": "product_detail_gallery",
    "phase": "catalog",
    "phase_label": "Catalog, product facts, and media",
    "title": "Verify every launch product View link, detail page, and seven-image gallery",
    "order": 70,
    "severity": "critical",
    "live": 1,
    "route": "/shop/",
    "external": "Public shop and /api/product-detail?slug=<slug>",
    "instructions": "1. Open the public Shop in a private browser window.\n2. Select View on every launch product card.\n3. Confirm the URL contains the correct slug and the detail endpoint returns HTTP 200 with ok:true.\n4. Confirm name, price, description, SKU, availability, shipping information, and calls to action match the admin record.\n5. For products with seven approved images, confirm seven unique thumbnails appear and each changes the main image, alternative text, caption, and image counter.\n6. Confirm blocked or consent-needed images remain excluded for a documented reason.\n7. Test direct loading, browser refresh, copied link, mobile view, and the public catalog fallback.\n8. Record every product that returns fewer images or stale facts and correct it in Catalog Media or Products.",
    "pass": "Every launch product opens from its card, returns current facts, and displays all approved unique storefront images without broken routes or stale fallback content."
  },
  {
    "key": "product_facts_preflight",
    "phase": "catalog",
    "phase_label": "Catalog, product facts, and media",
    "title": "Complete Product Release Preflight for every launch product",
    "order": 80,
    "severity": "critical",
    "live": 0,
    "route": "/admin/release-preflight/",
    "external": "Devil n Dove Product Release Preflight",
    "instructions": "1. Filter Product Release Preflight to the opening-day product list.\n2. Resolve required name, slug, SKU, price, category, description, quantity, dimensions, weight, shipping, tax, care, condition, and sale-channel facts.\n3. Confirm quantity pricing and set components where applicable.\n4. Resolve every blocking media, consent, packaging, content, or inventory warning.\n5. Open the public detail page after each important correction.\n6. Record any warning intentionally accepted, who accepted it, and why.\n7. Do not publish a product merely because a percentage score looks high; manually review the final buyer view.",
    "pass": "Every opening-day product is green for required preflight checks and has a final human review of the public page."
  },
  {
    "key": "catalog_media_rights",
    "phase": "catalog",
    "phase_label": "Catalog, product facts, and media",
    "title": "Finish product media, rights, roles, alt text, and R2 delivery",
    "order": 90,
    "severity": "critical",
    "live": 1,
    "route": "/admin/catalog-media/",
    "external": "Catalog Media, R2 object delivery, and public product pages",
    "instructions": "1. Assign one featured image and up to six supporting images to each launch product.\n2. Set image role, display order, concise descriptive alt text, caption where useful, and public-use status.\n3. Confirm ownership or consent and keep blocked/consent-needed media out of public responses.\n4. Verify full, thumbnail, WebP, and AVIF derivatives where configured.\n5. Test image loading on a normal desktop connection and a throttled mobile connection.\n6. Confirm image URLs do not expose private object paths or require an expired signed URL for public catalog media.\n7. Replace every launch-product placeholder or broken image with approved real media.",
    "pass": "Every launch product has an approved featured image, supporting media where available, documented rights, useful alt text, and reliable public delivery."
  },
  {
    "key": "missing_launch_images",
    "phase": "catalog",
    "phase_label": "Catalog, product facts, and media",
    "title": "Replace every missing, broken, fallback, or placeholder launch image",
    "order": 95,
    "severity": "critical",
    "live": 1,
    "route": "/admin/image-manifest/",
    "external": "Database Visual Image Manifest, IMAGES_REQUIRED.md capture guide, Catalog Media, R2, and every public launch product, service, local, category, and social-preview route",
    "instructions": "1. Open Visual Image Manifest and confirm the green Database status authority banner, 20 active seed rows, three generated-editorial provenance rows, and visible open-launch-blocker count. If Unsynced fallback appears, apply Build 230 and repair the API before continuing.\n2. Open IMAGES_REQUIRED.md from the manifest for capture standards, then freeze the opening-day product list and create item-specific Catalog Media records for every launch product.\n3. Filter Open launch blockers only. Assign each item an owner and open its page; do not approve from the thumbnail alone.\n4. At narrow-phone, tablet, desktop and wide-desktop widths, check source HTTP status, crop, distortion, overlap, layout shift, repeated-image substitution, intrinsic dimensions, slow/offline fallback and whether the alternative text describes the actual image.\n5. For real_photo_required rows, photograph the actual current product, process, condition, location or packaging. Generated or stock-looking artwork cannot pass these rows.\n6. For editorial_illustration_allowed rows, confirm the page discloses illustration where necessary, does not imply actual inventory, and excludes the asset from Product/Offer schema and real-product galleries.\n7. Confirm ownership, model/property consent, product accuracy, privacy and public-use permission. Keep needs-review or blocked media out of public release surfaces.\n8. Upload approved originals through R2/Catalog Media where applicable; create responsive derivatives; save the final root-relative or HTTPS URL and useful alt text.\n9. Save rights, public-use, phone and desktop results plus evidence URL and a plain-language change note. Approval is rejected until all required fields pass. Reload and confirm the change appears in manifest history.\n10. Inspect Open Graph, Organization/LocalBusiness/Product structured data, feeds, social queues and scheduled content so no planning placeholder or generated product proof represents a launch item.\n11. Repeat the open-blocker filter. Keep this Startup gate Failed or Blocked while any required row or item-specific launch-product role is missing, misleading, rights-unclear, placeholder-based, device-failed or absent from saved evidence.\n12. Reopen this gate after any launch-product, route, crop, asset, rights, schema, social-preview or public-use change.",
    "pass": "The D1 Visual Image Manifest and item-specific Catalog Media evidence show approved, accurate, rights-cleared responsive final imagery for every launch product and indexable launch route; no required real-photo row is passed with generated art; no missing, broken, fallback, duplicate substitute or planning placeholder remains; and phone/desktop review history is complete."
  },
  {
    "key": "pricing_quantity_sets",
    "phase": "commerce",
    "phase_label": "Pricing, inventory, and checkout",
    "title": "Verify base prices, quantity specials, sets, coupons, and gift-card interactions",
    "order": 100,
    "severity": "critical",
    "live": 1,
    "route": "/admin/products/",
    "external": "Public product detail, cart, checkout, and payment total",
    "instructions": "1. For each launch product, compare the stored base price with the public detail page, cart, checkout, and payment provider.\n2. Test every quantity breakpoint using the exact threshold, one below, and one above.\n3. Confirm the per-unit price never increases unexpectedly at a higher advertised tier.\n4. For sets, confirm component quantities and requested reserved-set quantity are correct.\n5. Test coupon and gift-card combinations only if those features are publicly displayed.\n6. Confirm discounts cannot reduce a price below an approved floor or create a negative total.\n7. Verify the server recalculates all totals and ignores browser-edited values.\n8. Record screenshots or order IDs for each scenario.",
    "pass": "Displayed and server-calculated prices, discounts, quantity tiers, sets, and final payment totals match approved business rules."
  },
  {
    "key": "inventory_regular_exact_once",
    "phase": "commerce",
    "phase_label": "Pricing, inventory, and checkout",
    "title": "Prove exact-once inventory settlement for regular products",
    "order": 110,
    "severity": "critical",
    "live": 1,
    "route": "/admin/orders/",
    "external": "Production checkout, Stripe webhook events, orders, and inventory movements",
    "instructions": "1. Record the starting inventory of a safe test product.\n2. Complete one paid production order for one unit.\n3. Confirm inventory is consumed only after the approved payment event and exactly one movement is recorded.\n4. Replay or resend the same webhook event and confirm no second consumption occurs.\n5. Attempt a failed and an expired checkout and confirm no permanent consumption remains.\n6. Compare order quantity, inventory movement, on-hand quantity, and audit history.\n7. Use a compensating correction only through the reviewed inventory workflow if the test exposes a defect.",
    "pass": "A successful payment consumes the correct quantity once, retries are idempotent, and failed or expired payment attempts do not leave stock consumed."
  },
  {
    "key": "inventory_sets_concurrency",
    "phase": "commerce",
    "phase_label": "Pricing, inventory, and checkout",
    "title": "Prove component-set reservation, zero availability, and final-unit concurrency",
    "order": 120,
    "severity": "critical",
    "live": 1,
    "route": "/admin/products/",
    "external": "Production set product, component products, simultaneous checkout sessions",
    "instructions": "1. Create or use a safe set with known component quantities and a small temporary stock level.\n2. Confirm the set availability equals the lowest whole number of complete component sets.\n3. Confirm reserved components reduce the individual component availability shown publicly.\n4. Reduce one component below the required quantity and confirm the set shows zero available.\n5. Restore stock through a reviewed movement, not a direct database edit.\n6. Open two private browser sessions and attempt to buy the final available set or final one-of-a-kind item at nearly the same time.\n7. Confirm only one checkout can settle and the other receives a clear unavailable result.\n8. Confirm cancellation/refund restores both set and component availability exactly once.",
    "pass": "Set availability is component-limited, reservations are visible, zero availability is enforced, and simultaneous final-unit attempts cannot oversell."
  },
  {
    "key": "purchase_lots_costs",
    "phase": "commerce",
    "phase_label": "Pricing, inventory, and checkout",
    "title": "Reconcile tools, supplies, purchase lots, dates, and actual costs",
    "order": 130,
    "severity": "high",
    "live": 0,
    "route": "/admin/inventory-operations/",
    "external": "Amazon order history, supplier invoices, and physical stock count",
    "instructions": "1. Open Tools & Supplies and choose Lots for each launch material.\n2. Enter each separate purchase with purchase/received date, supplier, order number, ASIN or supplier SKU, quantity, unit cost, allocated tax/shipping, storage location, and expiry where applicable.\n3. Keep goat milk bases, oils, mica, coloured bases, fragrance, packaging, and other batches separate when traceability matters.\n4. Compare total lot remaining with the main on-hand quantity.\n5. Physically count the material before applying a lot total to main inventory.\n6. Use the review and APPLY LOT TOTAL confirmation rather than editing D1 directly.\n7. Record quarantine, expiry, return, or consumed status accurately.\n8. Verify project and product costing uses reviewed costs rather than a stale default.",
    "pass": "Every launch material has traceable purchase evidence, physical quantity, lot status, and a reviewed cost suitable for margin calculation."
  },
  {
    "key": "tax_scenarios",
    "phase": "commerce",
    "phase_label": "Pricing, inventory, and checkout",
    "title": "Verify Canadian tax scenarios and refund tax calculations",
    "order": 140,
    "severity": "critical",
    "live": 1,
    "route": "/checkout/",
    "external": "Production checkout, payment provider, and accountant-reviewed tax settings",
    "instructions": "1. Confirm the business tax-registration status and effective date with the owner/accountant.\n2. Test an Ontario shipping address and every other province or territory the store accepts.\n3. Test local pickup if enabled.\n4. Confirm tax treatment for physical goods, digital items, shipping charges, discounts, gift cards, and refunds.\n5. Compare the public checkout total, payment-provider amount, stored order tax, and accounting journal.\n6. Confirm unsupported destinations are rejected before payment.\n7. Save scenario evidence and the business rule used; do not rely only on a browser display.",
    "pass": "Every accepted destination and product type produces the reviewed tax result, and refunds reverse the correct tax amount."
  },
  {
    "key": "shipping_pickup",
    "phase": "commerce",
    "phase_label": "Pricing, inventory, and checkout",
    "title": "Verify shipping destinations, rates, pickup, packaging, and fulfilment promises",
    "order": 150,
    "severity": "critical",
    "live": 1,
    "route": "/pickup/",
    "external": "Checkout, carrier or shipping-rate source, packing materials, and public policies",
    "instructions": "1. List the destinations the business can actually fulfil at launch.\n2. Test Ontario, another supported province, PO box handling, and US/international only when intentionally enabled.\n3. Confirm package weight and dimensions for each launch-product family.\n4. Compare checkout rates with the expected carrier or flat-rate policy.\n5. Test local pickup instructions, pickup timing, contact details, and tax treatment.\n6. Confirm free-shipping thresholds and surcharges cannot be bypassed through quantity or discount combinations.\n7. Perform one physical pack test and verify the product is protected by the materials included in its cost.\n8. Ensure policy text matches actual operating practice.",
    "pass": "Every accepted address can be fulfilled at the displayed cost and timeframe, pickup instructions are accurate, and physical packaging protects the product."
  },
  {
    "key": "stripe_live_webhook",
    "phase": "payments",
    "phase_label": "Payments, refunds, and financial controls",
    "title": "Complete Stripe live capture, signed webhook, and idempotency proof",
    "order": 160,
    "severity": "critical",
    "live": 1,
    "route": "/admin/webhook-events/",
    "external": "Stripe Dashboard → Developers → Webhooks and production payment settings",
    "instructions": "1. Confirm live Stripe keys and the production webhook signing secret are stored in Production secrets.\n2. Confirm the public webhook endpoint and subscribed event types match the application.\n3. Place one low-value real order with an owner-controlled payment method.\n4. Confirm the payment amount, currency, order ID, customer details, and settlement status.\n5. Confirm the webhook signature is verified before any state change.\n6. Resend the same event and confirm the event ID is not applied twice.\n7. Test a failed payment, expired checkout, and customer cancellation.\n8. Record Stripe event IDs and order IDs, never secret values or full card data.",
    "pass": "A live payment settles once, its signed webhook is verified, duplicate delivery has no duplicate effect, and failed/cancelled sessions remain recoverable."
  },
  {
    "key": "refund_restore",
    "phase": "payments",
    "phase_label": "Payments, refunds, and financial controls",
    "title": "Prove cancellation, partial/full refund, and inventory restoration",
    "order": 170,
    "severity": "critical",
    "live": 1,
    "route": "/admin/orders/",
    "external": "Order management, payment provider, inventory movements, and accounting records",
    "instructions": "1. Use a separate paid rehearsal order after the successful-payment test.\n2. Cancel before fulfilment and confirm the order status, payment state, and inventory restoration.\n3. Test a full refund and, if supported publicly, a partial refund.\n4. Confirm each refund creates one provider action, one order history event, one inventory restoration where appropriate, and balanced accounting entries.\n5. Replay the refund webhook and confirm no second restoration or refund record occurs.\n6. Confirm non-restockable or partially fulfilled items require an explicit reviewed decision.\n7. Check the customer-facing refund communication.",
    "pass": "Cancellation and refund actions are idempotent, financially traceable, communicate clearly, and restore only the inventory that should return to sale."
  },
  {
    "key": "paypal_visibility",
    "phase": "payments",
    "phase_label": "Payments, refunds, and financial controls",
    "title": "Make PayPal fully operational or completely hide it",
    "order": 180,
    "severity": "critical",
    "live": 1,
    "route": "/checkout/",
    "external": "PayPal developer/live account and production callback settings",
    "instructions": "1. Inspect checkout, footer, payment options, public policies, email templates, admin screens, and documentation for PayPal references.\n2. In Cloudflare Production secrets, confirm the intended PayPal environment, client ID, secret, webhook identity, callback/return URLs, and currency without recording secret values.\n3. If live credentials, callbacks, capture, cancellation, signed webhook, idempotency, and refund paths are not proven, remove or hide PayPal from all public surfaces.\n4. If PayPal will launch, use a low-value owner-controlled transaction to test approval, capture, cancellation, duplicate webhook delivery, and full refund.\n5. Compare the PayPal transaction, stored payment/order, tax, inventory, customer notice and accounting records.\n6. Confirm the displayed provider status never claims connected based only on a client ID or browser-side setting.\n7. Keep manual payment records clearly separate from provider-confirmed payments and record the provider transaction/event IDs as evidence.\n8. Record the explicit launch/hide decision, owner, date, and next review date.",
    "pass": "Customers either receive a completely working PayPal option or see no PayPal option or promise anywhere on the live site."
  },
  {
    "key": "accounting_tax_reporting",
    "phase": "payments",
    "phase_label": "Payments, refunds, and financial controls",
    "title": "Verify bookkeeping, payment application, HST/GST review, and export controls",
    "order": 190,
    "severity": "high",
    "live": 0,
    "route": "/admin/accounting/",
    "external": "Accountant-reviewed chart of accounts, tax settings, and export process",
    "instructions": "1. Confirm sales, tax, shipping, discounts, payment fees, refunds, inventory, cost of goods, and gift-card liabilities map to the intended accounts.\n2. Confirm paid orders can be applied to receivables and provider settlements without duplicate journals.\n3. Review HST/GST reporting fields and opening balances with the accountant.\n4. Test an accountant export with a safe date range and confirm lower roles cannot run it.\n5. Confirm month-end lock/reopen controls or document the temporary manual procedure.\n6. Record unresolved accounting limitations in the operating checklist before launch volume increases.",
    "pass": "Opening transactions can be reconciled and exported accurately, sensitive exports are authorized, and any temporary manual accounting controls are documented."
  },
  {
    "key": "transactional_email",
    "phase": "communications",
    "phase_label": "Customer communication and policies",
    "title": "Verify every required transactional email and failure path",
    "order": 200,
    "severity": "critical",
    "live": 1,
    "route": "/admin/live-ops-followthrough/",
    "external": "Configured email provider, Gmail, Outlook, and mobile inboxes",
    "instructions": "1. Test registration or welcome, password reset, order confirmation, payment receipt, cancellation, refund, fulfilment/shipping, pickup, and review request when enabled.\n2. Send only to owner-controlled test addresses.\n3. Check Gmail, Outlook, and a mobile mail application.\n4. Confirm sender name, reply-to, domain authentication, links, order facts, plain-text fallback, and unsubscribe requirements for non-transactional mail.\n5. Trigger a safe provider failure and confirm it is visible in logs or an admin retry queue.\n6. Confirm no secret, internal note, or unrelated customer data appears in the message.\n7. Save provider message IDs or screenshots as evidence.",
    "pass": "Essential messages arrive with correct facts and links, failures are observable, and a safe resend or support path exists."
  },
  {
    "key": "customer_support_contact",
    "phase": "communications",
    "phase_label": "Customer communication and policies",
    "title": "Verify contact, custom request, order-help, and customer-service response paths",
    "order": 210,
    "severity": "high",
    "live": 1,
    "route": "/contact/",
    "external": "Public contact/custom-request forms and owner-controlled inbox",
    "instructions": "1. Submit the public contact form and any enabled custom-request form from a private browser.\n2. Confirm required consent, spam protection, validation, acknowledgement, and admin visibility.\n3. Ask a product, shipping, pickup, return, and custom-order question using test data.\n4. Confirm the message reaches the correct owner inbox or admin queue with a useful reference.\n5. Verify a customer can find order-help instructions without entering admin areas.\n6. Confirm response-time promises are realistic and consistent with policy pages.\n7. Delete test personal data after verification where appropriate.",
    "pass": "Customers can reach the business, receive acknowledgement, and obtain order/product help through monitored channels with realistic response expectations."
  },
  {
    "key": "policies_legal",
    "phase": "communications",
    "phase_label": "Customer communication and policies",
    "title": "Review privacy, terms, shipping, pickup, returns, refunds, and custom-work policies",
    "order": 220,
    "severity": "critical",
    "live": 0,
    "route": "/terms/",
    "external": "Public footer, checkout, product pages, and owner/legal review",
    "instructions": "1. Open every public policy from the footer and checkout.\n2. Confirm business name, contact method, effective date, jurisdiction, shipping destinations, pickup rules, cancellation, return, refund, damaged-item, custom/personalized, digital, and privacy wording.\n3. Make sure policies describe actual operations and do not promise unsupported delivery times or return rights.\n4. Confirm product pages link to the policy information customers need before payment.\n5. Verify privacy/data-deletion instructions reflect the data actually collected by forms, analytics, accounts, and payment providers.\n6. Review special conditions for one-of-a-kind, vintage, made-to-order, and cosmetic products.\n7. Record who reviewed the final policy set and when.",
    "pass": "All customer-facing policies are findable before payment, internally consistent, dated, and aligned with the way the business will actually operate."
  },
  {
    "key": "soap_formula_ingredients",
    "phase": "packaging",
    "phase_label": "Soap, packaging, and regulatory readiness",
    "title": "Verify each soap formula, INCI order, bilingual identity, warnings, and claims",
    "order": 230,
    "severity": "critical",
    "live": 0,
    "route": "/admin/packaging/soap-labels/",
    "external": "Verified recipe/formula records, supplier documents, bilingual review, and applicable cosmetic requirements",
    "instructions": "1. Link the soap label project to the intended finished soap product and verified recipe or formula source.\n2. Enter ingredients in reviewed INCI order rather than copying supplier marketing bullets.\n3. Complete matched English and French product identity, ingredient display rows, warnings, dealer/address, consumer contact, Canadian-origin wording, and metric net quantity.\n4. Review fragrance, colourant, allergen, and claim obligations that apply to the final formula.\n5. Confirm every displayed claim has an internal approval note and factual support.\n6. Compare the structured rows against the batch record and physical product.\n7. Lock the reviewed source facts before creating the final label version.",
    "pass": "The label content reflects the actual formula and reviewed bilingual/legal facts; no ingredient or claim is inferred from artwork or supplier advertising."
  },
  {
    "key": "soap_print_proof",
    "phase": "packaging",
    "phase_label": "Soap, packaging, and regulatory readiness",
    "title": "Generate, measure, wrap-test, approve, and archive each soap label",
    "order": 240,
    "severity": "critical",
    "live": 0,
    "route": "/admin/packaging/soap-labels/",
    "external": "100% physical printer proof and PACKAGING_STUDIO.md",
    "instructions": "1. Use PACKAGING_STUDIO.md as the single packaging source of truth.\n2. Generate the continuous ribbon from structured records and save a review version.\n3. Print at 100% with browser/page scaling disabled.\n4. Measure strip width, band height, front oval, rear seal, bleed, and safe-area result.\n5. Test both the photo-fit and true-50-mm profile if the final physical geometry is not yet chosen.\n6. Wrap the actual soap and inspect front centring, folds, overlap/glue, ingredient legibility, French text, claims, net weight, barcode/batch zones, and colour.\n7. Upload or link a proof photo, record printer/paper, and mark fit, legibility, and overlap separately.\n8. Approve and archive only the version that passed; supersede rather than silently overwrite an approved label.",
    "pass": "Each launch soap has a saved, physically measured, wrapped, passed, approved, and archived label version linked to its exact structured source data."
  },
  {
    "key": "health_canada_notification",
    "phase": "packaging",
    "phase_label": "Soap, packaging, and regulatory readiness",
    "title": "Prepare Health Canada cosmetic notification and change control",
    "order": 250,
    "severity": "critical",
    "live": 1,
    "route": "/admin/startup-readiness/",
    "external": "Health Canada Cosmetic Notification Form and official guidance",
    "instructions": "1. Determine which launch products are cosmetics and identify the responsible manufacturer or importer.\n2. Prepare product identity, intended use, company/contact, first-sale date, formula ingredients, concentration ranges, and other required notification information.\n3. Submit the Cosmetic Notification Form within the applicable period after first sale; current official guidance states within 10 days after first sale in Canada.\n4. Save the submission confirmation or reference outside the public website and record a safe evidence pointer here.\n5. Create a change-control rule for name, formula, concentration, company, contact, or other reportable changes.\n6. Review the Cosmetic Ingredient Hotlist and other applicable official requirements before release.\n7. Do not treat an app-generated label or notification record as legal approval.",
    "pass": "Every applicable cosmetic has an owner, prepared/submitted notification evidence, and a documented process for later formula or business-detail changes."
  },
  {
    "key": "packaging_prepress_boundary",
    "phase": "packaging",
    "phase_label": "Soap, packaging, and regulatory readiness",
    "title": "Confirm the packaging export is suitable for the chosen printer and production method",
    "order": 260,
    "severity": "high",
    "live": 0,
    "route": "/admin/packaging-studio/",
    "external": "Chosen printer, paper/stock, cutter, colour profile, and production proof",
    "instructions": "1. Confirm whether the printer accepts SVG, browser-generated PDF, or requires a prepress PDF with crop/bleed boxes and embedded/outlined fonts.\n2. Verify the exact media size, bleed, safe area, crop marks, colour mode/profile, and no-scaling setting.\n3. Confirm the rose and icon assets remain sharp and licensed/owned for production use.\n4. Print a calibration ruler and compare measured output to the design dimensions.\n5. Record printer, paper, driver, scaling, colour, and cutting settings.\n6. Keep browser Print/Save PDF labelled as preparation until the chosen printer accepts it as final production output.\n7. Archive the source SVG, delivered file, checksum, and proof result.",
    "pass": "The chosen printer and material reproduce the approved dimensions, type, colour, bleed, and cut safely using an archived export and documented settings."
  },
  {
    "key": "analytics_consent",
    "phase": "discovery",
    "phase_label": "Search, analytics, accessibility, and quality",
    "title": "Verify analytics, consent, privacy boundaries, and commerce event accuracy",
    "order": 270,
    "severity": "high",
    "live": 1,
    "route": "/admin/site-analytics/",
    "external": "GA4 or configured analytics property and browser developer tools",
    "instructions": "1. Confirm the production analytics identifier is loaded once on public pages and not duplicated by multiple scripts.\n2. Test page_view, view_item, add_to_cart, begin_checkout, purchase, refund, contact, and custom-request events that are actually enabled.\n3. Confirm transaction IDs prevent duplicate purchase events after refresh.\n4. Verify no secret, password, payment detail, private admin note, or unnecessary personal data is sent.\n5. Test consent or privacy controls required by the chosen analytics setup.\n6. Exclude admin and preview traffic where practical.\n7. Compare one test order with analytics and the stored order.",
    "pass": "Public and commerce activity is observable once, privacy boundaries are respected, and analytics values can be reconciled to a test transaction."
  },
  {
    "key": "search_console_indexing",
    "phase": "discovery",
    "phase_label": "Search, analytics, accessibility, and quality",
    "title": "Verify sitemap, robots, canonical URLs, Search Console, and index coverage",
    "order": 280,
    "severity": "high",
    "live": 1,
    "route": "/sitemap.xml",
    "external": "Google Search Console for devilndove.com",
    "instructions": "1. Open robots.txt and sitemap.xml on the production domain and confirm both load successfully.\n2. Confirm the sitemap contains only intended canonical public URLs and excludes admin/private pages.\n3. Verify the domain property in Search Console and submit the sitemap.\n4. Inspect the home page, shop, one category/local page, and several product-detail URLs.\n5. Confirm canonical URLs use the production domain and query-based product pages resolve consistently.\n6. Review index coverage, mobile usability, structured-data reports, manual actions, and security issues.\n7. Record important indexing problems as separate work items rather than repeatedly changing titles without evidence.",
    "pass": "Search Console owns the production property, the sitemap/canonical system is correct, and representative public pages are crawlable without critical index or security errors."
  },
  {
    "key": "google_business_profile",
    "phase": "discovery",
    "phase_label": "Search, analytics, accessibility, and quality",
    "title": "Complete and verify Google Business Profile and local-business consistency",
    "order": 290,
    "severity": "high",
    "live": 1,
    "route": "/contact/",
    "external": "Google Business Profile for Devil n Dove",
    "instructions": "1. Confirm the profile name, primary/secondary categories, phone, website, service or pickup area, hours, special hours, description, products/services, and photos are accurate.\n2. Keep address visibility consistent with how customers actually visit or receive products.\n3. Compare business name, phone, website, and locality wording with the website and major directory profiles.\n4. Add current real photos and respond to legitimate reviews without incentives that violate platform rules.\n5. Use local wording only where it truthfully reflects pickup, service, market, or delivery reach.\n6. Record monthly evidence and any profile correction task.\n7. Do not promise or report a guaranteed first-page position; monitor relevance, distance, and prominence over time.",
    "pass": "The Business Profile is complete, accurate, consistent with the website, actively maintained, and supported by real local proof and customer trust."
  },
  {
    "key": "seo_page_quality",
    "phase": "discovery",
    "phase_label": "Search, analytics, accessibility, and quality",
    "title": "Run the public SEO, title, H1, structured-data, image, and internal-link audit",
    "order": 300,
    "severity": "high",
    "live": 1,
    "route": "/admin/local-seo-review/",
    "external": "Production public pages, Google rich-result tools, and Search Console",
    "instructions": "1. Scan every indexable HTML page for one and only one H1, a distinctive title, useful meta description, canonical URL, robots directive, and meaningful visible introduction.\n2. Make the main title visually unambiguous; avoid multiple headings with equal title prominence.\n3. Use descriptive buyer language in titles, headings, product facts, image alt text, and internal links without stuffing locations or keywords.\n4. Validate Organization/LocalBusiness, Breadcrumb, Product, Offer, image, and other applicable structured data against visible facts.\n5. Confirm Product schema includes the approved gallery images, current price, currency, availability, SKU, and canonical offer URL.\n6. Check crawlable internal links to important shop, category, policy, contact, story, and local relevance pages.\n7. Review duplicate/thin pages and redirect or noindex where appropriate.\n8. Record before/after evidence for changes rather than guessing from rankings.",
    "pass": "All indexable pages pass the one-H1 and metadata audit, structured data matches visible facts, and important pages are discoverable through descriptive crawlable links."
  },
  {
    "key": "mobile_accessibility_performance",
    "phase": "discovery",
    "phase_label": "Search, analytics, accessibility, and quality",
    "title": "Complete real-device mobile, keyboard, accessibility, and performance testing",
    "order": 310,
    "severity": "critical",
    "live": 1,
    "route": "/admin/post-deploy-smoke-tests/",
    "external": "Real phones/tablet/desktop, Lighthouse/PageSpeed, keyboard, and screen-reader checks",
    "instructions": "1. Test a narrow phone, large phone, tablet, laptop, and large desktop in portrait and landscape where relevant.\n2. Complete navigation, product view/gallery, cart, checkout, login, password reset, contact, and critical admin workflows.\n3. Confirm touch targets, sticky actions, form labels, validation, focus visibility, keyboard order, dialogs, tables, and horizontal overflow.\n4. Check colour contrast and text readability in dark/light surfaces used by the site.\n5. Test with images disabled or a slow connection and confirm useful fallback content.\n6. Run Lighthouse/PageSpeed on home, shop, product detail, contact, and an important local/content page on mobile and desktop.\n7. Fix critical accessibility errors and layout overlap before launch; document lower-priority performance work.\n8. Re-run after CSS or image changes.",
    "pass": "Critical customer journeys work on target devices and keyboard, no blocking accessibility or overlap defect remains, and performance evidence is recorded."
  },
  {
    "key": "social_oauth_visibility",
    "phase": "discovery",
    "phase_label": "Search, analytics, accessibility, and quality",
    "title": "Keep social publishing controls review-first until provider OAuth is approved",
    "order": 320,
    "severity": "medium",
    "live": 1,
    "route": "/admin/social-publishing/",
    "external": "Meta, Pinterest, YouTube, TikTok, and other configured provider developer consoles",
    "instructions": "1. Open Social Publishing and list each provider shown in the connection cards, queue, and public footer.\n2. For Meta, confirm FACEBOOK_PAGE_ID (or META_PAGE_ID), FACEBOOK_PAGE_ACCESS_TOKEN (or META_PAGE_ACCESS_TOKEN), INSTAGRAM_USER_ID/INSTAGRAM_BUSINESS_ACCOUNT_ID, and the optional INSTAGRAM_ACCESS_TOKEN exist as encrypted Production secrets; never record their values.\n3. Select Test Facebook + Instagram. Confirm the Page identity and Instagram professional-account identity return HTTP 200 and the configured IDs match.\n4. If META_APP_ID and META_APP_SECRET are present, confirm token debug reports is_valid, the app ID matches, expiry/data-access-expiry are acceptable, and the returned scopes cover the approved workflow.\n5. Confirm exact callback URLs, privacy/data-deletion pages, app-review state, Page/account roles, and provider scopes in the Meta developer/business consoles.\n6. Keep automatic publishing disabled. Generate one product draft, review media/privacy/caption/UTM, approve deliberately, and publish only one safe product-only test post.\n7. Confirm the provider post ID/URL and queue status are recorded, then verify the tracked public destination works.\n8. Expire/revoke a test token or use a safe invalid preview credential and confirm the item remains in review/failed state rather than falsely marked published.\n9. Repeat the credential identity test after token rotation, app-role changes, Graph API version changes, or account reconnection.\n10. Keep providers manual and remove unfinished public promises when OAuth, review, or posting permissions are incomplete.",
    "pass": "Unapproved providers remain disabled and honestly labelled; any enabled provider publishes only after deliberate review with observable success/failure evidence."
  },
  {
    "key": "backup_restore_rehearsal",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Rehearse D1, R2, deployment, and configuration recovery",
    "order": 330,
    "severity": "critical",
    "live": 1,
    "route": "/admin/deployment-preflight/",
    "external": "Cloudflare D1 backups/exports, R2, Pages deployments, and secure configuration records",
    "instructions": "1. Create a test or copied environment that can be restored without risking production customer data.\n2. Restore a recent D1 backup and verify users, products, inventory, orders, packaging, and readiness records.\n3. Verify R2 object inventory and restore or re-link a safe test media object.\n4. Roll back to a previous Pages deployment, run smoke tests, then return to the current deployment.\n5. Confirm required variable and binding names are documented outside the code without storing secret values in the repository.\n6. Measure recovery time and record the operator steps that were confusing or missing.\n7. Update the recovery guide after the rehearsal.",
    "pass": "A tested operator can restore database, media, deployment, and required configuration within an acceptable time using documented steps."
  },
  {
    "key": "paid_order_fulfilment_rehearsal",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Complete a real paid order from product view through fulfilment",
    "order": 340,
    "severity": "critical",
    "live": 1,
    "route": "/admin/orders/",
    "external": "Public store, payment provider, email, packaging, pickup/shipping, inventory, and accounting",
    "instructions": "1. Use a launch product and an owner-controlled customer identity/payment method.\n2. Start from the public Shop, inspect the product gallery/facts, add to cart, and complete checkout.\n3. Confirm payment, webhook, order, inventory, tax, shipping/pickup, email, and accounting records.\n4. Pick the physical item, verify lot/batch where relevant, package it with the approved label/materials, and mark fulfilment.\n5. Confirm the customer receives the correct fulfilment or pickup message.\n6. Compare actual labour, packaging, shipping, provider fee, and margin with the stored assumptions.\n7. Save order ID, timestamps, and issues; never store full payment credentials.",
    "pass": "One real order completes end to end with correct product, money, stock, communication, packaging, fulfilment, and reconciliable records."
  },
  {
    "key": "separate_refund_rehearsal",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Complete a separate cancellation/refund rehearsal and customer recovery",
    "order": 350,
    "severity": "critical",
    "live": 1,
    "route": "/admin/orders/",
    "external": "Production payment, order, inventory, email, and accounting systems",
    "instructions": "1. Use a different low-value owner-controlled rehearsal order so the paid-order proof remains intact.\n2. Test the actual cancellation/refund workflow an operator will use.\n3. Confirm provider refund, order history, customer email, inventory decision, tax reversal, fee treatment, and accounting entries.\n4. Confirm the item is returned to sellable stock only after physical/operational review where required.\n5. Replay the provider event and confirm the recovery action remains idempotent.\n6. Document the customer-service wording and escalation path for a failed automated step.",
    "pass": "A separate refund/cancellation can be completed safely, communicated clearly, reconciled, and repeated webhook delivery cannot duplicate its effects."
  },
  {
    "key": "deploy_readiness_standalone",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Complete Deploy Readiness as a standalone promotion decision",
    "order": 355,
    "severity": "critical",
    "live": 1,
    "route": "/admin/deploy-readiness/",
    "external": "Startup Readiness, Deployment Preflight result, Post-Deploy Smoke Tests, rollback evidence, and release manifest",
    "instructions": "1. Open Deploy Readiness only after the exact package passed Deployment Preflight, was deployed, and passed the complete Post-Deploy Smoke process.\n2. Confirm every Critical Startup gate is Complete or has an owner-approved, factually justified Not Applicable result; do not rely only on a score.\n3. Review blocker drilldowns, manifest paths, migration ledger, rollback/recovery reference, smoke evidence, product scope, marketplace/recall locks and provider checks.\n4. Confirm the opening owner, monitoring hours, stop conditions, rollback steps and customer recovery contacts are written and reachable from a phone.\n5. Record the exact deployment, database bookmark/recovery point, approved product count, outstanding High items and the person making the decision.\n6. Select Blocked when any required evidence is absent or contradictory and link back to the exact Startup gate.\n7. Select approval only when the evidence—not the existence of the feature—supports proceeding to controlled Go-Live Execution.\n8. Reopen this decision after a new deployment, migration, critical configuration change, failed smoke test or material Startup-gate change.",
    "pass": "A named owner has recorded an evidence-backed promotion decision for the exact live build, no Critical Startup gate or smoke result remains open, and rollback/stop conditions are ready."
  },
  {
    "key": "launch_monitoring_ownership",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Assign launch-day ownership, monitoring, support, and stop conditions",
    "order": 360,
    "severity": "critical",
    "live": 0,
    "route": "/admin/startup-readiness/",
    "external": "Internal launch operating plan",
    "instructions": "1. Name the person responsible for orders, payments, inventory, email, customer messages, site incidents, and public updates during opening.\n2. Define the hours the store will be actively monitored during the first days.\n3. Write stop conditions for payment mismatch, oversell, repeated 500 errors, lost email, wrong tax, broken fulfilment, or unsafe product/label concern.\n4. Record how to hide checkout, archive a product, roll back a deployment, contact customers, and preserve evidence.\n5. Confirm the owner can access the required dashboards and recovery instructions from a phone.\n6. Prepare a short daily review of orders, incidents, inventory, refunds, and customer questions.",
    "pass": "Each launch responsibility has an owner and the team has clear monitoring, escalation, rollback, and temporary-stop instructions."
  },
  {
    "key": "go_live_execution_standalone",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Run Go-Live Execution as a standalone controlled-opening process",
    "order": 365,
    "severity": "critical",
    "live": 1,
    "route": "/admin/go-live-execution/",
    "external": "Production storefront, Deploy Readiness approval, Promotion Control, launch owner and immediate monitoring dashboards",
    "instructions": "1. Confirm the Deploy Readiness decision names the exact live build and still has no Critical blocker.\n2. Confirm the deliberately small opening product list, conservative sellable quantities, real product media, packaging status, accepted destinations and customer policies.\n3. Record the opening date/time, owner on duty, monitoring window and first scheduled review before changing public availability.\n4. Enable only the approved products/channels; keep unfinished automation and unapproved providers disabled.\n5. Open the production store in a private session and complete the agreed visibility/cart/checkout check without changing unrelated products.\n6. Queue immediate incident/order/payment/inventory/email monitoring and keep rollback, checkout pause and product-archive controls open.\n7. If any stop condition occurs, pause the affected public action immediately, preserve evidence, communicate with affected customers and roll back or correct safely.\n8. Record the exact actions, operator, timestamps and resulting public URLs; never mark this gate complete from a successful button click alone.\n9. Continue to Live Ops Follow-through and monitor the first operational window.",
    "pass": "The approved limited storefront is opened by a named operator, the exact actions and public results are recorded, immediate monitoring is active, and the opening remains reversible."
  },
  {
    "key": "controlled_opening",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Open with controlled stock, limited products, and a reversible rollout",
    "order": 370,
    "severity": "critical",
    "live": 1,
    "route": "/admin/startup-readiness/",
    "external": "Production store and launch operating decision",
    "instructions": "1. Confirm every critical readiness item is Complete or has a formally justified Not Applicable decision.\n2. Keep the opening-day product list small and inventory conservative.\n3. Open to a limited audience or quiet public release before paid promotion.\n4. Monitor the first orders in real time and compare every system record.\n5. Pause sales immediately if a stop condition is reached.\n6. Add products and automation gradually only after the core order, inventory, email, refund, and fulfilment paths remain stable.\n7. Record the opening time, product count, owner on duty, and first review time.",
    "pass": "The store opens through a monitored, reversible, low-risk release with no unresolved critical blocker and a clear pause/rollback path."
  },
  {
    "key": "live_ops_followthrough_standalone",
    "phase": "operations",
    "phase_label": "Recovery, fulfilment, and controlled opening",
    "title": "Run Live Ops Follow-through as a standalone first-window monitoring process",
    "order": 380,
    "severity": "critical",
    "live": 1,
    "route": "/admin/live-ops-followthrough/",
    "external": "Production orders, payments, inventory, email provider, customer support, incidents, analytics and public channels",
    "instructions": "1. Begin monitoring at the Go-Live timestamp and keep the named owner available for the agreed first operating window.\n2. For every first-window order, compare payment, order, item, inventory movement, tax, delivery/pickup, email, client document and accounting records.\n3. Review runtime incidents, webhook retries, failed messages, stock warnings, customer questions, public-content/provider results and analytics duplication.\n4. Confirm completed fulfilment and any separate refund rehearsal remain reconciled and idempotent.\n5. Record expected versus actual results, safe IDs, customer recovery actions, owner and resolution for every anomaly.\n6. Activate the stop condition immediately for payment mismatch, oversell, repeated 500 errors, unsafe product/label, lost transactional email, wrong tax or unrecoverable fulfilment failure.\n7. Reopen every affected Startup gate after a failure, credential/configuration change or corrective deployment; never hide the incident by editing only the status.\n8. Complete a written end-of-window review covering orders, refunds, incidents, inventory, support and the next monitoring period.\n9. Expand products, stock or automation only after stable evidence supports the change.",
    "pass": "The first live operating window is reconciled across customer, money, stock, communication, fulfilment, accounting and incident records, with every anomaly owned and no active stop condition."
  }
];

const GATE_FIX_FOCUS = {
  deployment_preflight_standalone:'stop before deployment, correct the owning code/schema/HTML/CSS/Markdown file, regenerate derived artifacts from their source, then rerun every preflight check against the exact rebuilt archive',
  backup_migrate_deploy:'restore the pre-change D1 backup or previous Pages deployment, correct the failed migration/build file, then redeploy the complete package',
  post_deploy_smoke_standalone:'stop promotion, record the exact live route and result, correct or roll back the deployment, then repeat the full smoke suite across public, auth, admin, API, fallback and device checks',
  production_bindings_secrets:'correct the binding or encrypted Production variable in Cloudflare, verify Preview and Production are not crossed, then repeat one safe read and write',
  login_logout_recovery:'inspect the exact /api/auth/login or /api/auth/me Cloudflare invocation outcome, keep login POST on the bounded two-operation D1 path, preserve browser credentials for temporary 5xx/network failures, clear them only after a real 401/403 decision, repair reset-token/email delivery separately, and invalidate only owner-controlled test sessions before retesting',
  role_authorization:'enforce the missing role check inside the server endpoint, keep product-removal reference checks bounded and registry-backed, treat editor/media audit rows as product-owned cleanup rather than protected business history, keep order/accounting/customer/packaging/project history blocking, reconcile any test inventory through audited movements, and do not rely on hidden buttons',
  runtime_incident_fallback:'identify the exact Cloudflare invocation outcome and failing route, reduce CPU/memory and unnecessary D1/automation work, return structured sanitized JSON where the Worker can respond, suppress raw HTML in the browser, preserve a clearly labelled local recovery copy, redeploy, then repeat load/autosave/queued-edit/reload/recovery tests while checking exceededCpu and exceededMemory logs',
  launch_product_list:'remove incomplete products from the launch group, restore them to Draft/Archived, and re-freeze the finite product/SKU list with an owner',
  product_detail_gallery:'repair the product slug/facts/media authority, clear stale fallback assumptions, and retest direct, refreshed, copied and mobile URLs',
  product_facts_preflight:'correct required product facts in their owning product/inventory/media/packaging records and rerun the full product preflight',
  catalog_media_rights:'replace or block unapproved/broken media, correct role/order/alt text, regenerate required derivatives, and confirm public R2 delivery',
  missing_launch_images:'use the D1 Visual Image Manifest and IMAGES_REQUIRED capture guide, replace every real-photo requirement with accurate rights-cleared media, keep generated art limited to disclosed editorial slots, save phone/desktop evidence, and retest every launch route',
  pricing_quantity_sets:'correct the server-side pricing or component-set rule, remove unsafe promotions, and repeat boundary values plus a tampered-browser request',
  inventory_regular_exact_once:'repair the idempotency key, settlement transaction or compensating movement workflow; reconcile the test SKU to its counted quantity before repeating',
  inventory_sets_concurrency:'correct reservation/transaction boundaries and component availability, reconcile every affected component, then rerun simultaneous final-unit attempts',
  purchase_lots_costs:'correct separate lot quantities, dates, allocation and cost evidence, quarantine uncertain stock, and apply the reviewed physical total through the inventory workflow',
  tax_scenarios:'stop checkout for the affected destination/product rule, have the owner/accountant correct the tax mapping, and rerun saved expected-versus-actual scenarios including refunds',
  shipping_pickup:'hide unsupported destinations or pickup promises, correct rate/weight/dimension/policy data, and repeat a physical pack plus checkout test',
  stripe_live_webhook:'correct the live endpoint, signing secret, subscribed events or idempotency handling; reconcile the rehearsal order before resending only the safe test event',
  refund_restore:'correct provider/order/inventory/tax/accounting/email steps as separate observable records, reverse duplicates with audited compensating entries, then replay the webhook safely',
  paypal_visibility:'remove PayPal from every public surface until live capture, cancellation, webhook and refund evidence exists, or correct and retest the entire provider flow',
  accounting_tax_reporting:'correct account mappings with the owner/accountant, post balanced correcting entries instead of rewriting closed history, and rerun reconciliation/export checks',
  transactional_email:'correct the provider secret, sender/domain, template data or retry state; resend only to owner-controlled addresses and confirm the outbox/provider IDs',
  customer_support_contact:'correct every public contact channel and owner schedule, answer the rehearsal request, and document escalation plus expected response time',
  policies_legal:'remove contradictory promises, correct policy and checkout/product wording together, obtain owner/legal review where needed, and repeat every footer/checkout link test',
  soap_formula_ingredients:'block the label/product, correct the authoritative formula and INCI/bilingual facts, supersede stale drafts, and repeat ingredient/claim review',
  soap_print_proof:'keep the version unapproved, correct layout/overflow/scale/material issues, save a new version, and repeat a measured 100%-scale wrap test with proof',
  health_canada_notification:'stop sale when required, correct the notification/change record using the authoritative formula/label facts, and save the submitted acknowledgement/reference',
  packaging_prepress_boundary:'reject the file as a production master, correct dieline/bleed/font/colour/output settings with the printer, and repeat preflight plus physical proof',
  analytics_consent:'disable the affected tag/event, correct consent gating and deduplication without sending personal/sensitive data, then retest debug and production streams',
  search_console_indexing:'correct robots/canonical/sitemap/status/redirect/template data, request validation where appropriate, and recheck the live URL after deployment',
  google_business_profile:'correct the owner-approved business facts/photos/categories/hours in the profile and website, then verify the public listing while signed out',
  seo_page_quality:'rewrite thin/duplicate or misleading visible copy and metadata, keep structured data aligned, repair internal links/images, and revalidate the deployed page',
  mobile_accessibility_performance:'fix the source CSS/HTML/JavaScript issue at the failing viewport or input method, then rerun the entire customer journey on a real device and keyboard',
  social_oauth_visibility:'keep publishing manual/disabled, correct Meta/provider IDs, roles, scopes, token validity or callback settings, then rerun read-only identity tests before one reviewed post',
  backup_restore_rehearsal:'discard the unsafe test restore, correct the backup/media/config/runbook gap, create a fresh isolated target, and repeat while measuring recovery time',
  paid_order_fulfilment_rehearsal:'pause launch, reconcile the rehearsal order across payment/stock/tax/email/accounting/packaging, correct the failing source workflow, then use a new order',
  separate_refund_rehearsal:'reconcile provider refund, credit note, customer notice, stock disposition, tax and accounting records; correct duplicate/missing effects before a new rehearsal',
  deploy_readiness_standalone:'set the promotion decision to Blocked, link it to the exact open Startup or smoke result, correct and retest that source gate, then rebuild the final evidence-backed decision',
  launch_monitoring_ownership:'assign the missing owner/coverage, document phone-accessible stop and rollback steps, and rehearse the handoff or escalation',
  go_live_execution_standalone:'pause the affected public action, preserve timestamps and evidence, use the approved rollback/product-hide/checkout-stop control, correct the source gate, then obtain a new Deploy Readiness decision before retrying',
  controlled_opening:'pause or roll back sales, close the failed critical/high gate with evidence, reduce opening scope if needed, and restart only through the recorded owner decision',
  live_ops_followthrough_standalone:'activate the stop condition, protect affected customers, reconcile each money/stock/message record, reopen related Startup gates, and resume only after corrected live evidence is stable'
};

function enrichRow(row) {
  const item = STARTUP_ITEMS.find((entry) => entry.key === row.item_key) || {};
  const focus = GATE_FIX_FOCUS[row.item_key] || 'correct the authoritative source record or configuration, then repeat the failed step and the full gate';
  const route = row.target_route || item.route || 'the named internal workflow';
  return {
    ...row,
    preparation_guidance: `Assign one owner and open ${route}. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.`,
    correction_guidance: `If any step fails, do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then ${focus}. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.`,
    evidence_guidance: `Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.`,
    retest_guidance: `Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.`
  };
}

function json(data, status = 200) { return jsonResponse(data, status, { 'Cache-Control': 'no-store' }); }
function text(value, max = 5000) { return normalizeText(value).slice(0, max); }
function records(result) { return Array.isArray(result?.results) ? result.results : []; }
function normalizeStatus(value) {
  const raw = text(value, 40).toLowerCase();
  return ['not_started','in_progress','blocked','needs_review','passed','failed','not_applicable'].includes(raw) ? raw : 'not_started';
}
function validationError(message) { const error = new Error(message); error.code = 'VALIDATION'; return error; }
function safeUrl(value) {
  const raw = text(value, 1000);
  if (!raw) return '';
  if (raw.startsWith('/') || /^https:\/\//i.test(raw)) return raw;
  return '';
}
function fallbackRows() {
  return STARTUP_ITEMS.map((item) => enrichRow({
    item_key: item.key, phase_key: item.phase, phase_label: item.phase_label, item_title: item.title,
    sort_order: item.order, blocker_severity: item.severity, is_launch_blocker: 1, requires_live_binding: item.live,
    target_route: item.route, external_location: item.external, instructions_markdown: item.instructions,
    pass_condition: item.pass, item_status: 'not_started', owner_name: '', due_date: '', evidence_url: '',
    evidence_notes: '', blocked_reason: '', completed_at: null, updated_at: null
  }));
}
async function ensureSchema(db) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS startup_readiness_items (
      startup_readiness_item_id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_key TEXT NOT NULL UNIQUE,
      phase_key TEXT NOT NULL,
      phase_label TEXT NOT NULL,
      item_title TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 100,
      blocker_severity TEXT NOT NULL DEFAULT 'high',
      is_launch_blocker INTEGER NOT NULL DEFAULT 1,
      requires_live_binding INTEGER NOT NULL DEFAULT 0,
      target_route TEXT,
      external_location TEXT,
      instructions_markdown TEXT NOT NULL,
      pass_condition TEXT NOT NULL,
      item_status TEXT NOT NULL DEFAULT 'not_started',
      owner_name TEXT,
      due_date TEXT,
      evidence_url TEXT,
      evidence_notes TEXT,
      blocked_reason TEXT,
      completed_at TEXT,
      completed_by_user_id INTEGER,
      last_updated_by_user_id INTEGER,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_startup_readiness_items_phase_status ON startup_readiness_items(is_active, phase_key, item_status, sort_order)`,
    `CREATE INDEX IF NOT EXISTS idx_startup_readiness_items_severity ON startup_readiness_items(is_active, blocker_severity, item_status)`,
    `CREATE TABLE IF NOT EXISTS startup_readiness_history (
      startup_readiness_history_id INTEGER PRIMARY KEY AUTOINCREMENT,
      startup_readiness_item_id INTEGER NOT NULL,
      item_key TEXT NOT NULL,
      previous_status TEXT,
      next_status TEXT NOT NULL,
      owner_name TEXT,
      due_date TEXT,
      evidence_url TEXT,
      evidence_notes TEXT,
      blocked_reason TEXT,
      changed_by_user_id INTEGER,
      changed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(startup_readiness_item_id) REFERENCES startup_readiness_items(startup_readiness_item_id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_startup_readiness_history_item ON startup_readiness_history(startup_readiness_item_id, changed_at DESC)`
  ];
  for (const statement of statements) await db.prepare(statement).run();
}
async function seedItems(db) {
  for (const item of STARTUP_ITEMS) {
    await db.prepare(`INSERT INTO startup_readiness_items
      (item_key,phase_key,phase_label,item_title,sort_order,blocker_severity,is_launch_blocker,requires_live_binding,target_route,external_location,instructions_markdown,pass_condition,is_active)
      VALUES (?1,?2,?3,?4,?5,?6,1,?7,?8,?9,?10,?11,1)
      ON CONFLICT(item_key) DO UPDATE SET
        phase_key=excluded.phase_key,phase_label=excluded.phase_label,item_title=excluded.item_title,sort_order=excluded.sort_order,
        blocker_severity=excluded.blocker_severity,is_launch_blocker=1,requires_live_binding=excluded.requires_live_binding,
        target_route=excluded.target_route,external_location=excluded.external_location,instructions_markdown=excluded.instructions_markdown,
        pass_condition=excluded.pass_condition,is_active=1,updated_at=CURRENT_TIMESTAMP`)
      .bind(item.key,item.phase,item.phase_label,item.title,item.order,item.severity,item.live,item.route,item.external,item.instructions,item.pass).run();
  }
}
function statsFor(rows) {
  const isClosed = (row) => ['passed','not_applicable'].includes(String(row.item_status || ''));
  const total = rows.length;
  const complete = rows.filter(isClosed).length;
  const criticalOpen = rows.filter((row) => row.blocker_severity === 'critical' && !isClosed(row)).length;
  const highOpen = rows.filter((row) => row.blocker_severity === 'high' && !isClosed(row)).length;
  const blocked = rows.filter((row) => row.item_status === 'blocked').length;
  const inProgress = rows.filter((row) => row.item_status === 'in_progress').length;
  const percent = total ? Math.round(complete / total * 100) : 0;
  let launch_state = 'not_ready';
  if (!criticalOpen && !highOpen && complete === total) launch_state = 'ready';
  else if (!criticalOpen && !highOpen) launch_state = 'ready_for_final_rehearsal';
  else if (!criticalOpen) launch_state = 'controlled_launch_review';
  return { total, complete, open: total - complete, critical_open: criticalOpen, high_open: highOpen, blocked, in_progress: inProgress, completion_percent: percent, launch_state };
}
function markdown(rows, stats) {
  const lines = [
    '# Devil n Dove Startup Readiness Status', '',
    `Generated by Build ${BUILD} Startup Readiness Cockpit.`, '',
    `- **Completion:** ${stats.complete} / ${stats.total} (${stats.completion_percent}%)`,
    `- **Critical open:** ${stats.critical_open}`,
    `- **High open:** ${stats.high_open}`,
    `- **Blocked:** ${stats.blocked}`,
    `- **Launch state:** ${stats.launch_state.replace(/_/g,' ')}`, ''
  ];
  let phase = '';
  for (const row of rows) {
    if (row.phase_label !== phase) { phase = row.phase_label; lines.push(`## ${phase}`, ''); }
    lines.push(`### ${row.sort_order}. ${row.item_title}`, '');
    lines.push(`- **Status:** ${row.item_status.replace(/_/g,' ')}`);
    lines.push(`- **Severity:** ${row.blocker_severity}`);
    lines.push(`- **Owner:** ${row.owner_name || 'Unassigned'}`);
    lines.push(`- **Due:** ${row.due_date || 'Not set'}`);
    lines.push(`- **Internal route:** ${row.target_route || 'Manual/external'}`);
    lines.push(`- **External location:** ${row.external_location || 'None'}`);
    lines.push(`- **Evidence:** ${row.evidence_url || 'Not recorded'}`);
    if (row.blocked_reason) lines.push(`- **Blocked reason:** ${row.blocked_reason}`);
    if (row.evidence_notes) lines.push(`- **Evidence notes:** ${row.evidence_notes}`);
    lines.push('', '#### Before you begin', '', row.preparation_guidance || '', '', '#### Test steps', '', row.instructions_markdown || '', '', '#### If a step fails: correction procedure', '', row.correction_guidance || '', '', '#### Evidence to save', '', row.evidence_guidance || '', '', '#### Retest and reopening rule', '', row.retest_guidance || '', '', `**Pass condition:** ${row.pass_condition}`, '');
  }
  return lines.join('\n');
}
async function readData(db) {
  const rows = records(await db.prepare(`SELECT * FROM startup_readiness_items WHERE is_active=1 ORDER BY sort_order,item_key`).all())
    .map((row) => enrichRow({ ...row, item_status: normalizeStatus(row.item_status) }));
  const history = records(await db.prepare(`SELECT h.*,i.item_title FROM startup_readiness_history h JOIN startup_readiness_items i ON i.startup_readiness_item_id=h.startup_readiness_item_id ORDER BY h.changed_at DESC,h.startup_readiness_history_id DESC LIMIT 60`).all());
  const stats = statsFor(rows);
  return { ok:true, build:BUILD, degraded:false, expected_total:STARTUP_ITEMS.length, items:rows, recent_history:history, stats, markdown:markdown(rows,stats) };
}
function degradedData(message) {
  const rows = fallbackRows();
  const stats = statsFor(rows);
  return { ok:true, build:BUILD, degraded:true, expected_total:STARTUP_ITEMS.length, backend_warning:message || 'D1 readiness status is temporarily unavailable. Instructions remain visible, and browser-only changes will be clearly marked unsynced.', items:rows, recent_history:[], stats, markdown:markdown(rows,stats) };
}
async function requireAdmin(context) {
  try {
    const adminUser = await getAdminUserFromRequest(context.request, context.env);
    if (!adminUser) return { error:json({ok:false,error:'Admin access required.'},401) };
    const db = getDb(context.env);
    if (!db) return { error:json({ok:false,error:'Database binding is not configured.'},500) };
    return { adminUser, db };
  } catch (error) {
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'startup_readiness',incident_code:'startup_readiness_access_failed',severity:'error',message:error?.message||'Startup readiness access check failed.',details:{error:String(error?.stack||error)}}).catch(()=>null);
    return { error:json({ok:false,error:'Startup readiness access could not be verified.'},503) };
  }
}

export async function onRequestGet(context) {
  const access = await requireAdmin(context); if (access.error) return access.error;
  try {
    await ensureSchema(access.db);
    await seedItems(access.db);
    return json(await readData(access.db));
  } catch (error) {
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'startup_readiness',incident_code:'startup_readiness_get_degraded',severity:'warning',message:error?.message||'Startup readiness could not load from D1.',related_user_id:access.adminUser.user_id,details:{error:String(error?.stack||error)}}).catch(()=>null);
    return json(degradedData(error?.message || 'Startup readiness status is temporarily unavailable.'));
  }
}

export async function onRequestPost(context) {
  const access = await requireAdmin(context); if (access.error) return access.error;
  let body = {}; try { body = await context.request.json(); } catch { return json({ok:false,error:'Expected a JSON request body.'},400); }
  const action = text(body.action,80).toLowerCase();
  try {
    await ensureSchema(access.db);
    await seedItems(access.db);
    if (action === 'seed_items' || action === 'export_markdown') return json({...(await readData(access.db)),message:'Startup readiness list refreshed.'});
    if (!['save_item','mark_complete','reopen_item'].includes(action)) return json({ok:false,error:'Unsupported startup readiness action.'},400);
    const itemKey = text(body.item_key,120);
    const current = await access.db.prepare(`SELECT * FROM startup_readiness_items WHERE item_key=?1 AND is_active=1`).bind(itemKey).first();
    if (!current) return json({ok:false,error:'Startup readiness item was not found.'},404);
    let nextStatus = action === 'mark_complete' ? 'passed' : action === 'reopen_item' ? 'in_progress' : normalizeStatus(body.item_status);
    const ownerName = text(body.owner_name,180);
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(text(body.due_date,20)) ? text(body.due_date,20) : '';
    const evidenceUrl = safeUrl(body.evidence_url);
    const evidenceNotes = text(body.evidence_notes,5000);
    const blockedReason = text(body.blocked_reason,2000);
    if (nextStatus === 'blocked' && blockedReason.length < 5) throw validationError('Add a clear blocked reason before saving this item as Blocked.');
    if (['passed','not_applicable'].includes(nextStatus) && !evidenceNotes && !evidenceUrl) throw validationError('Add evidence notes or an evidence link before marking this item complete or not applicable.');
    await access.db.batch([
      access.db.prepare(`UPDATE startup_readiness_items SET item_status=?2,owner_name=?3,due_date=?4,evidence_url=?5,evidence_notes=?6,blocked_reason=?7,
        completed_at=CASE WHEN ?2 IN ('passed','not_applicable') THEN CURRENT_TIMESTAMP ELSE NULL END,
        completed_by_user_id=CASE WHEN ?2 IN ('passed','not_applicable') THEN ?8 ELSE NULL END,
        last_updated_by_user_id=?8,updated_at=CURRENT_TIMESTAMP WHERE startup_readiness_item_id=?1`)
        .bind(current.startup_readiness_item_id,nextStatus,ownerName||null,dueDate||null,evidenceUrl||null,evidenceNotes||null,blockedReason||null,access.adminUser.user_id),
      access.db.prepare(`INSERT INTO startup_readiness_history (startup_readiness_item_id,item_key,previous_status,next_status,owner_name,due_date,evidence_url,evidence_notes,blocked_reason,changed_by_user_id)
        VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)`)
        .bind(current.startup_readiness_item_id,itemKey,current.item_status,nextStatus,ownerName||null,dueDate||null,evidenceUrl||null,evidenceNotes||null,blockedReason||null,access.adminUser.user_id)
    ]);
    await auditAdminAction(context.env,context.request,access.adminUser,{action_type:'startup_readiness_updated',target_type:'startup_readiness_item',target_id:current.startup_readiness_item_id,target_key:itemKey,details:{previous_status:current.item_status,next_status:nextStatus,has_evidence:!!(evidenceUrl||evidenceNotes),owner_name:ownerName||null,due_date:dueDate||null}}).catch(()=>null);
    return json({...(await readData(access.db)),message:nextStatus==='passed'?'Readiness item marked complete.':'Readiness item saved.'});
  } catch (error) {
    await captureRuntimeIncident(context.env,context.request,{incident_scope:'startup_readiness',incident_code:'startup_readiness_post_failed',severity:'warning',message:error?.message||'Startup readiness save failed.',related_user_id:access.adminUser.user_id,details:{action,error:String(error?.stack||error)}}).catch(()=>null);
    return json({ok:false,error:error?.message||'Startup readiness save failed.'},error?.code==='VALIDATION'?400:503);
  }
}
