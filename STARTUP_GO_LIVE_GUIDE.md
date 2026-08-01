# Devil n Dove Startup and Go-Live Guide — Build 227

This is the human-readable operating copy of the 37 database-backed gates in `/admin/startup-readiness/`. The D1 cockpit remains the status authority. Each gate now states how to prepare, test, correct a failure, save evidence, retest, and decide whether the pass condition is met.

## Operating rules

1. Apply `database_build227_unified_business_operations.sql` or the identical `database_upgrade_current_pass.sql`, not both. Back up D1 first.
2. Use owner-controlled test records and real Production bindings only where the gate explicitly requires a production test.
3. Never paste secrets, passwords, access tokens, full payment data, or private customer information into gate evidence.
4. A failed numbered step keeps the gate Failed or Blocked until the correction procedure and full retest succeed.
5. Complete and Not Applicable decisions require factual evidence. Reopen a completed gate after a related deployment, credential rotation, schema/provider version, policy, or material data change.
6. The guide does not replace legal, accounting, tax, product-safety, platform, printer, or regulatory review.

## Foundation and deployment

### 10. Back up D1, apply the current migration, and deploy the complete build — **Critical**

**Inside the application:** `/admin/deployment-preflight/`  
**External location:** Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/deployment-preflight/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open Cloudflare D1 and create a production backup or export before changing the schema.
2. Record the backup date, database name, and safe storage location in the evidence notes.
3. Confirm the Build 225 readiness/packaging migration is already present, then apply database_build227_unified_business_operations.sql or the identical database_upgrade_current_pass.sql, but not both.
4. Confirm the migration ledger records build227_unified_business_operations and the new packaging_components, customer_document_sequences, and customer_documents tables exist.
5. Deploy the complete ZIP rather than selected files.
6. Open Deployment Preflight and run every available check.
7. Open Startup Readiness with All statuses and confirm all 37 gates load with correction/evidence guidance.
8. Save the deployment URL, commit or deployment identifier, schema result, and preflight result.
9. Stop and restore the previous deployment or D1 backup if any critical migration, Function, route, or data-integrity error appears.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then restore the pre-change D1 backup or previous Pages deployment, correct the failed migration/build file, then redeploy the complete package. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** A recoverable D1 backup exists, the Build 227 migration is applied once after the Build 225 baseline, the complete deployment is live, all 37 gates load, and Deployment Preflight has no unresolved critical result.

### 20. Verify production bindings, secrets, domains, and environment separation — **Critical**

**Inside the application:** `/admin/deployment-preflight/`  
**External location:** Cloudflare Pages project → Settings → Variables and Bindings; custom domains; D1/R2 bindings  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/deployment-preflight/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm the production Pages project is connected to the intended D1 database and R2 buckets.
2. Confirm every required secret exists in Production, not only Preview.
3. Check payment, email, OAuth, admin-bootstrap, analytics, and storage variables against CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md.
4. Confirm preview/test credentials are not used in production and production credentials are not committed to the repository.
5. Confirm devilndove.com and any www redirect resolve to the production deployment with valid HTTPS.
6. Test one read and one safe write against each required binding.
7. Record only variable names and test results; never paste secret values into evidence.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct the binding or encrypted Production variable in Cloudflare, verify Preview and Production are not crossed, then repeat one safe read and write. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** The production domain, D1, R2, payment, email, and required application bindings are present in the correct environment and pass safe connectivity checks without exposing secrets.

## Access, security, and recovery

### 30. Prove production login, logout, session expiry, and password recovery — **Critical**

**Inside the application:** `/login/`  
**External location:** Production website and the configured transactional email provider  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /login/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open a private browser window and log in with a test administrator account.
2. Confirm successful login redirects correctly and does not return a 500 error.
3. Log out and verify protected pages and APIs are no longer accessible.
4. Request a password reset from the public recovery page.
5. Confirm the reset message arrives, the link can be used once, and an expired or reused link is rejected.
6. Test Logout All Sessions and confirm an older browser session is invalidated.
7. Leave a test session idle long enough to confirm expiry behaviour and a clear sign-in recovery path.
8. Record browser, time, account role, and result without storing passwords or tokens.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then repair the server session/reset-token path and email delivery rather than only changing the browser message; invalidate test sessions before retesting. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Login, logout, reset, one-time token use, session expiry, and logout-all work in production without 500 errors or continued access after invalidation.

### 40. Verify server-side authorization for destructive, financial, and approval actions — **Critical**

**Inside the application:** `/admin/members/`  
**External location:** Production admin APIs and role test accounts  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/members/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Prepare an administrator account and at least one lower-privilege test account.
2. Test permanent product deletion, inventory reversal, label approval, accounting export, member administration, and publication approval.
3. Confirm the administrator can perform only the actions intended for that role.
4. Call the same APIs while signed in as the lower role and confirm 401 or 403 responses.
5. Confirm hiding a button is not the only protection; direct API calls must also be denied.
6. Confirm every successful sensitive action creates an audit record with actor, target, time, and reason.
7. Remove or disable temporary test accounts after the review.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then enforce the missing role check inside the server endpoint, add an audited denial/success test, and do not rely on hidden buttons. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every sensitive action is enforced on the server, lower roles receive 401/403, and successful actions are attributable in the audit history.

### 50. Prove runtime incident capture and honest fallback behaviour — **High**

**Inside the application:** `/admin/runtime-incidents/`  
**External location:** Production Pages Functions logs and runtime incident records  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/runtime-incidents/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Use a safe test condition that causes a non-destructive optional API failure, such as an unavailable optional table in a preview environment.
2. Confirm the API returns structured JSON with a useful status code and plain-language error.
3. Confirm the browser shows a usable fallback or retry path without claiming a save, payment, export, or approval succeeded.
4. Confirm the runtime incident includes scope, code, severity, user or request context, and a sanitized stack or detail.
5. Restore the optional dependency and verify the normal path recovers.
6. Review offline.html and low-bandwidth media fallbacks on a throttled connection.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then return structured sanitized JSON, record the runtime incident, and make the UI label any local/fallback result as unsynced or incomplete. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Expected failures are visible, sanitized, recoverable, and recorded; fallback states never present an uncompleted business action as successful.

## Catalog, product facts, and media

### 60. Choose a small opening-day product list and freeze its launch scope — **Critical**

**Inside the application:** `/admin/products/`  
**External location:** Internal operating decision  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/products/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Select a deliberately small group of products that can be physically counted, photographed, packaged, and fulfilled now.
2. Exclude experimental, incomplete, duplicate, content-only, or uncertain products from the launch group.
3. Record the product IDs, names, SKUs, and intended sale channels.
4. Confirm every selected item has an owner responsible for facts, media, inventory, packaging, and final review.
5. Keep other products in Draft or Archived while the site opens.
6. Revisit the launch group only through a deliberate review so the finish line does not keep moving.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then remove incomplete products from the launch group, restore them to Draft/Archived, and re-freeze the finite product/SKU list with an owner. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** A finite opening-day product list is recorded, owned, and protected from unrelated draft work.

### 70. Verify every launch product View link, detail page, and seven-image gallery — **Critical**

**Inside the application:** `/shop/`  
**External location:** Public shop and /api/product-detail?slug=<slug>  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /shop/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open the public Shop in a private browser window.
2. Select View on every launch product card.
3. Confirm the URL contains the correct slug and the detail endpoint returns HTTP 200 with ok:true.
4. Confirm name, price, description, SKU, availability, shipping information, and calls to action match the admin record.
5. For products with seven approved images, confirm seven unique thumbnails appear and each changes the main image, alternative text, caption, and image counter.
6. Confirm blocked or consent-needed images remain excluded for a documented reason.
7. Test direct loading, browser refresh, copied link, mobile view, and the public catalog fallback.
8. Record every product that returns fewer images or stale facts and correct it in Catalog Media or Products.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then repair the product slug/facts/media authority, clear stale fallback assumptions, and retest direct, refreshed, copied and mobile URLs. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every launch product opens from its card, returns current facts, and displays all approved unique storefront images without broken routes or stale fallback content.

### 80. Complete Product Release Preflight for every launch product — **Critical**

**Inside the application:** `/admin/release-preflight/`  
**External location:** Devil n Dove Product Release Preflight  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/release-preflight/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Filter Product Release Preflight to the opening-day product list.
2. Resolve required name, slug, SKU, price, category, description, quantity, dimensions, weight, shipping, tax, care, condition, and sale-channel facts.
3. Confirm quantity pricing and set components where applicable.
4. Resolve every blocking media, consent, packaging, content, or inventory warning.
5. Open the public detail page after each important correction.
6. Record any warning intentionally accepted, who accepted it, and why.
7. Do not publish a product merely because a percentage score looks high; manually review the final buyer view.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct required product facts in their owning product/inventory/media/packaging records and rerun the full product preflight. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every opening-day product is green for required preflight checks and has a final human review of the public page.

### 90. Finish product media, rights, roles, alt text, and R2 delivery — **Critical**

**Inside the application:** `/admin/catalog-media/`  
**External location:** Catalog Media, R2 object delivery, and public product pages  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/catalog-media/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Assign one featured image and up to six supporting images to each launch product.
2. Set image role, display order, concise descriptive alt text, caption where useful, and public-use status.
3. Confirm ownership or consent and keep blocked/consent-needed media out of public responses.
4. Verify full, thumbnail, WebP, and AVIF derivatives where configured.
5. Test image loading on a normal desktop connection and a throttled mobile connection.
6. Confirm image URLs do not expose private object paths or require an expired signed URL for public catalog media.
7. Replace every launch-product placeholder or broken image with approved real media.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then replace or block unapproved/broken media, correct role/order/alt text, regenerate required derivatives, and confirm public R2 delivery. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every launch product has an approved featured image, supporting media where available, documented rights, useful alt text, and reliable public delivery.

## Pricing, inventory, and checkout

### 100. Verify base prices, quantity specials, sets, coupons, and gift-card interactions — **Critical**

**Inside the application:** `/admin/products/`  
**External location:** Public product detail, cart, checkout, and payment total  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/products/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. For each launch product, compare the stored base price with the public detail page, cart, checkout, and payment provider.
2. Test every quantity breakpoint using the exact threshold, one below, and one above.
3. Confirm the per-unit price never increases unexpectedly at a higher advertised tier.
4. For sets, confirm component quantities and requested reserved-set quantity are correct.
5. Test coupon and gift-card combinations only if those features are publicly displayed.
6. Confirm discounts cannot reduce a price below an approved floor or create a negative total.
7. Verify the server recalculates all totals and ignores browser-edited values.
8. Record screenshots or order IDs for each scenario.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct the server-side pricing or component-set rule, remove unsafe promotions, and repeat boundary values plus a tampered-browser request. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Displayed and server-calculated prices, discounts, quantity tiers, sets, and final payment totals match approved business rules.

### 110. Prove exact-once inventory settlement for regular products — **Critical**

**Inside the application:** `/admin/orders/`  
**External location:** Production checkout, Stripe webhook events, orders, and inventory movements  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/orders/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Record the starting inventory of a safe test product.
2. Complete one paid production order for one unit.
3. Confirm inventory is consumed only after the approved payment event and exactly one movement is recorded.
4. Replay or resend the same webhook event and confirm no second consumption occurs.
5. Attempt a failed and an expired checkout and confirm no permanent consumption remains.
6. Compare order quantity, inventory movement, on-hand quantity, and audit history.
7. Use a compensating correction only through the reviewed inventory workflow if the test exposes a defect.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then repair the idempotency key, settlement transaction or compensating movement workflow; reconcile the test SKU to its counted quantity before repeating. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** A successful payment consumes the correct quantity once, retries are idempotent, and failed or expired payment attempts do not leave stock consumed.

### 120. Prove component-set reservation, zero availability, and final-unit concurrency — **Critical**

**Inside the application:** `/admin/products/`  
**External location:** Production set product, component products, simultaneous checkout sessions  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/products/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Create or use a safe set with known component quantities and a small temporary stock level.
2. Confirm the set availability equals the lowest whole number of complete component sets.
3. Confirm reserved components reduce the individual component availability shown publicly.
4. Reduce one component below the required quantity and confirm the set shows zero available.
5. Restore stock through a reviewed movement, not a direct database edit.
6. Open two private browser sessions and attempt to buy the final available set or final one-of-a-kind item at nearly the same time.
7. Confirm only one checkout can settle and the other receives a clear unavailable result.
8. Confirm cancellation/refund restores both set and component availability exactly once.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct reservation/transaction boundaries and component availability, reconcile every affected component, then rerun simultaneous final-unit attempts. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Set availability is component-limited, reservations are visible, zero availability is enforced, and simultaneous final-unit attempts cannot oversell.

### 130. Reconcile tools, supplies, purchase lots, dates, and actual costs — **High**

**Inside the application:** `/admin/inventory-operations/`  
**External location:** Amazon order history, supplier invoices, and physical stock count  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/inventory-operations/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open Tools & Supplies and choose Lots for each launch material.
2. Enter each separate purchase with purchase/received date, supplier, order number, ASIN or supplier SKU, quantity, unit cost, allocated tax/shipping, storage location, and expiry where applicable.
3. Keep goat milk bases, oils, mica, coloured bases, fragrance, packaging, and other batches separate when traceability matters.
4. Compare total lot remaining with the main on-hand quantity.
5. Physically count the material before applying a lot total to main inventory.
6. Use the review and APPLY LOT TOTAL confirmation rather than editing D1 directly.
7. Record quarantine, expiry, return, or consumed status accurately.
8. Verify project and product costing uses reviewed costs rather than a stale default.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct separate lot quantities, dates, allocation and cost evidence, quarantine uncertain stock, and apply the reviewed physical total through the inventory workflow. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every launch material has traceable purchase evidence, physical quantity, lot status, and a reviewed cost suitable for margin calculation.

### 140. Verify Canadian tax scenarios and refund tax calculations — **Critical**

**Inside the application:** `/checkout/`  
**External location:** Production checkout, payment provider, and accountant-reviewed tax settings  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /checkout/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm the business tax-registration status and effective date with the owner/accountant.
2. Test an Ontario shipping address and every other province or territory the store accepts.
3. Test local pickup if enabled.
4. Confirm tax treatment for physical goods, digital items, shipping charges, discounts, gift cards, and refunds.
5. Compare the public checkout total, payment-provider amount, stored order tax, and accounting journal.
6. Confirm unsupported destinations are rejected before payment.
7. Save scenario evidence and the business rule used; do not rely only on a browser display.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then stop checkout for the affected destination/product rule, have the owner/accountant correct the tax mapping, and rerun saved expected-versus-actual scenarios including refunds. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every accepted destination and product type produces the reviewed tax result, and refunds reverse the correct tax amount.

### 150. Verify shipping destinations, rates, pickup, packaging, and fulfilment promises — **Critical**

**Inside the application:** `/pickup/`  
**External location:** Checkout, carrier or shipping-rate source, packing materials, and public policies  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /pickup/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. List the destinations the business can actually fulfil at launch.
2. Test Ontario, another supported province, PO box handling, and US/international only when intentionally enabled.
3. Confirm package weight and dimensions for each launch-product family.
4. Compare checkout rates with the expected carrier or flat-rate policy.
5. Test local pickup instructions, pickup timing, contact details, and tax treatment.
6. Confirm free-shipping thresholds and surcharges cannot be bypassed through quantity or discount combinations.
7. Perform one physical pack test and verify the product is protected by the materials included in its cost.
8. Ensure policy text matches actual operating practice.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then hide unsupported destinations or pickup promises, correct rate/weight/dimension/policy data, and repeat a physical pack plus checkout test. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every accepted address can be fulfilled at the displayed cost and timeframe, pickup instructions are accurate, and physical packaging protects the product.

## Payments, refunds, and financial controls

### 160. Complete Stripe live capture, signed webhook, and idempotency proof — **Critical**

**Inside the application:** `/admin/webhook-events/`  
**External location:** Stripe Dashboard → Developers → Webhooks and production payment settings  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/webhook-events/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm live Stripe keys and the production webhook signing secret are stored in Production secrets.
2. Confirm the public webhook endpoint and subscribed event types match the application.
3. Place one low-value real order with an owner-controlled payment method.
4. Confirm the payment amount, currency, order ID, customer details, and settlement status.
5. Confirm the webhook signature is verified before any state change.
6. Resend the same event and confirm the event ID is not applied twice.
7. Test a failed payment, expired checkout, and customer cancellation.
8. Record Stripe event IDs and order IDs, never secret values or full card data.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct the live endpoint, signing secret, subscribed events or idempotency handling; reconcile the rehearsal order before resending only the safe test event. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** A live payment settles once, its signed webhook is verified, duplicate delivery has no duplicate effect, and failed/cancelled sessions remain recoverable.

### 170. Prove cancellation, partial/full refund, and inventory restoration — **Critical**

**Inside the application:** `/admin/orders/`  
**External location:** Order management, payment provider, inventory movements, and accounting records  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/orders/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Use a separate paid rehearsal order after the successful-payment test.
2. Cancel before fulfilment and confirm the order status, payment state, and inventory restoration.
3. Test a full refund and, if supported publicly, a partial refund.
4. Confirm each refund creates one provider action, one order history event, one inventory restoration where appropriate, and balanced accounting entries.
5. Replay the refund webhook and confirm no second restoration or refund record occurs.
6. Confirm non-restockable or partially fulfilled items require an explicit reviewed decision.
7. Check the customer-facing refund communication.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct provider/order/inventory/tax/accounting/email steps as separate observable records, reverse duplicates with audited compensating entries, then replay the webhook safely. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Cancellation and refund actions are idempotent, financially traceable, communicate clearly, and restore only the inventory that should return to sale.

### 180. Make PayPal fully operational or completely hide it — **Critical**

**Inside the application:** `/checkout/`  
**External location:** PayPal developer/live account and production callback settings  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /checkout/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Inspect checkout, footer, payment options, public policies, email templates, admin screens, and documentation for PayPal references.
2. In Cloudflare Production secrets, confirm the intended PayPal environment, client ID, secret, webhook identity, callback/return URLs, and currency without recording secret values.
3. If live credentials, callbacks, capture, cancellation, signed webhook, idempotency, and refund paths are not proven, remove or hide PayPal from all public surfaces.
4. If PayPal will launch, use a low-value owner-controlled transaction to test approval, capture, cancellation, duplicate webhook delivery, and full refund.
5. Compare the PayPal transaction, stored payment/order, tax, inventory, customer notice and accounting records.
6. Confirm the displayed provider status never claims connected based only on a client ID or browser-side setting.
7. Keep manual payment records clearly separate from provider-confirmed payments and record the provider transaction/event IDs as evidence.
8. Record the explicit launch/hide decision, owner, date, and next review date.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then remove PayPal from every public surface until live capture, cancellation, webhook and refund evidence exists, or correct and retest the entire provider flow. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Customers either receive a completely working PayPal option or see no PayPal option or promise anywhere on the live site.

### 190. Verify bookkeeping, payment application, HST/GST review, and export controls — **High**

**Inside the application:** `/admin/accounting/`  
**External location:** Accountant-reviewed chart of accounts, tax settings, and export process  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/accounting/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm sales, tax, shipping, discounts, payment fees, refunds, inventory, cost of goods, and gift-card liabilities map to the intended accounts.
2. Confirm paid orders can be applied to receivables and provider settlements without duplicate journals.
3. Review HST/GST reporting fields and opening balances with the accountant.
4. Test an accountant export with a safe date range and confirm lower roles cannot run it.
5. Confirm month-end lock/reopen controls or document the temporary manual procedure.
6. Record unresolved accounting limitations in the operating checklist before launch volume increases.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct account mappings with the owner/accountant, post balanced correcting entries instead of rewriting closed history, and rerun reconciliation/export checks. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Opening transactions can be reconciled and exported accurately, sensitive exports are authorized, and any temporary manual accounting controls are documented.

## Customer communication and policies

### 200. Verify every required transactional email and failure path — **Critical**

**Inside the application:** `/admin/live-ops-followthrough/`  
**External location:** Configured email provider, Gmail, Outlook, and mobile inboxes  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/live-ops-followthrough/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Test registration or welcome, password reset, order confirmation, payment receipt, cancellation, refund, fulfilment/shipping, pickup, and review request when enabled.
2. Send only to owner-controlled test addresses.
3. Check Gmail, Outlook, and a mobile mail application.
4. Confirm sender name, reply-to, domain authentication, links, order facts, plain-text fallback, and unsubscribe requirements for non-transactional mail.
5. Trigger a safe provider failure and confirm it is visible in logs or an admin retry queue.
6. Confirm no secret, internal note, or unrelated customer data appears in the message.
7. Save provider message IDs or screenshots as evidence.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct the provider secret, sender/domain, template data or retry state; resend only to owner-controlled addresses and confirm the outbox/provider IDs. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Essential messages arrive with correct facts and links, failures are observable, and a safe resend or support path exists.

### 210. Verify contact, custom request, order-help, and customer-service response paths — **High**

**Inside the application:** `/contact/`  
**External location:** Public contact/custom-request forms and owner-controlled inbox  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /contact/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Submit the public contact form and any enabled custom-request form from a private browser.
2. Confirm required consent, spam protection, validation, acknowledgement, and admin visibility.
3. Ask a product, shipping, pickup, return, and custom-order question using test data.
4. Confirm the message reaches the correct owner inbox or admin queue with a useful reference.
5. Verify a customer can find order-help instructions without entering admin areas.
6. Confirm response-time promises are realistic and consistent with policy pages.
7. Delete test personal data after verification where appropriate.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct every public contact channel and owner schedule, answer the rehearsal request, and document escalation plus expected response time. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Customers can reach the business, receive acknowledgement, and obtain order/product help through monitored channels with realistic response expectations.

### 220. Review privacy, terms, shipping, pickup, returns, refunds, and custom-work policies — **Critical**

**Inside the application:** `/terms/`  
**External location:** Public footer, checkout, product pages, and owner/legal review  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /terms/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open every public policy from the footer and checkout.
2. Confirm business name, contact method, effective date, jurisdiction, shipping destinations, pickup rules, cancellation, return, refund, damaged-item, custom/personalized, digital, and privacy wording.
3. Make sure policies describe actual operations and do not promise unsupported delivery times or return rights.
4. Confirm product pages link to the policy information customers need before payment.
5. Verify privacy/data-deletion instructions reflect the data actually collected by forms, analytics, accounts, and payment providers.
6. Review special conditions for one-of-a-kind, vintage, made-to-order, and cosmetic products.
7. Record who reviewed the final policy set and when.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then remove contradictory promises, correct policy and checkout/product wording together, obtain owner/legal review where needed, and repeat every footer/checkout link test. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** All customer-facing policies are findable before payment, internally consistent, dated, and aligned with the way the business will actually operate.

## Soap, packaging, and regulatory readiness

### 230. Verify each soap formula, INCI order, bilingual identity, warnings, and claims — **Critical**

**Inside the application:** `/admin/packaging/soap-labels/`  
**External location:** Verified recipe/formula records, supplier documents, bilingual review, and applicable cosmetic requirements  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/packaging/soap-labels/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Link the soap label project to the intended finished soap product and verified recipe or formula source.
2. Enter ingredients in reviewed INCI order rather than copying supplier marketing bullets.
3. Complete matched English and French product identity, ingredient display rows, warnings, dealer/address, consumer contact, Canadian-origin wording, and metric net quantity.
4. Review fragrance, colourant, allergen, and claim obligations that apply to the final formula.
5. Confirm every displayed claim has an internal approval note and factual support.
6. Compare the structured rows against the batch record and physical product.
7. Lock the reviewed source facts before creating the final label version.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then block the label/product, correct the authoritative formula and INCI/bilingual facts, supersede stale drafts, and repeat ingredient/claim review. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** The label content reflects the actual formula and reviewed bilingual/legal facts; no ingredient or claim is inferred from artwork or supplier advertising.

### 240. Generate, measure, wrap-test, approve, and archive each soap label — **Critical**

**Inside the application:** `/admin/packaging/soap-labels/`  
**External location:** 100% physical printer proof and PACKAGING_STUDIO.md  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/packaging/soap-labels/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Use PACKAGING_STUDIO.md as the single packaging source of truth.
2. Generate the continuous ribbon from structured records and save a review version.
3. Print at 100% with browser/page scaling disabled.
4. Measure strip width, band height, front oval, rear seal, bleed, and safe-area result.
5. Test both the photo-fit and true-50-mm profile if the final physical geometry is not yet chosen.
6. Wrap the actual soap and inspect front centring, folds, overlap/glue, ingredient legibility, French text, claims, net weight, barcode/batch zones, and colour.
7. Upload or link a proof photo, record printer/paper, and mark fit, legibility, and overlap separately.
8. Approve and archive only the version that passed; supersede rather than silently overwrite an approved label.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then keep the version unapproved, correct layout/overflow/scale/material issues, save a new version, and repeat a measured 100%-scale wrap test with proof. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Each launch soap has a saved, physically measured, wrapped, passed, approved, and archived label version linked to its exact structured source data.

### 250. Prepare Health Canada cosmetic notification and change control — **Critical**

**Inside the application:** `/admin/startup-readiness/`  
**External location:** Health Canada Cosmetic Notification Form and official guidance  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/startup-readiness/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Determine which launch products are cosmetics and identify the responsible manufacturer or importer.
2. Prepare product identity, intended use, company/contact, first-sale date, formula ingredients, concentration ranges, and other required notification information.
3. Submit the Cosmetic Notification Form within the applicable period after first sale; current official guidance states within 10 days after first sale in Canada.
4. Save the submission confirmation or reference outside the public website and record a safe evidence pointer here.
5. Create a change-control rule for name, formula, concentration, company, contact, or other reportable changes.
6. Review the Cosmetic Ingredient Hotlist and other applicable official requirements before release.
7. Do not treat an app-generated label or notification record as legal approval.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then stop sale when required, correct the notification/change record using the authoritative formula/label facts, and save the submitted acknowledgement/reference. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Every applicable cosmetic has an owner, prepared/submitted notification evidence, and a documented process for later formula or business-detail changes.

### 260. Confirm the packaging export is suitable for the chosen printer and production method — **High**

**Inside the application:** `/admin/packaging-studio/`  
**External location:** Chosen printer, paper/stock, cutter, colour profile, and production proof  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/packaging-studio/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm whether the printer accepts SVG, browser-generated PDF, or requires a prepress PDF with crop/bleed boxes and embedded/outlined fonts.
2. Verify the exact media size, bleed, safe area, crop marks, colour mode/profile, and no-scaling setting.
3. Confirm the rose and icon assets remain sharp and licensed/owned for production use.
4. Print a calibration ruler and compare measured output to the design dimensions.
5. Record printer, paper, driver, scaling, colour, and cutting settings.
6. Keep browser Print/Save PDF labelled as preparation until the chosen printer accepts it as final production output.
7. Archive the source SVG, delivered file, checksum, and proof result.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then reject the file as a production master, correct dieline/bleed/font/colour/output settings with the printer, and repeat preflight plus physical proof. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** The chosen printer and material reproduce the approved dimensions, type, colour, bleed, and cut safely using an archived export and documented settings.

## Search, analytics, accessibility, and quality

### 270. Verify analytics, consent, privacy boundaries, and commerce event accuracy — **High**

**Inside the application:** `/admin/site-analytics/`  
**External location:** GA4 or configured analytics property and browser developer tools  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/site-analytics/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm the production analytics identifier is loaded once on public pages and not duplicated by multiple scripts.
2. Test page_view, view_item, add_to_cart, begin_checkout, purchase, refund, contact, and custom-request events that are actually enabled.
3. Confirm transaction IDs prevent duplicate purchase events after refresh.
4. Verify no secret, password, payment detail, private admin note, or unnecessary personal data is sent.
5. Test consent or privacy controls required by the chosen analytics setup.
6. Exclude admin and preview traffic where practical.
7. Compare one test order with analytics and the stored order.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then disable the affected tag/event, correct consent gating and deduplication without sending personal/sensitive data, then retest debug and production streams. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Public and commerce activity is observable once, privacy boundaries are respected, and analytics values can be reconciled to a test transaction.

### 280. Verify sitemap, robots, canonical URLs, Search Console, and index coverage — **High**

**Inside the application:** `/sitemap.xml`  
**External location:** Google Search Console for devilndove.com  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /sitemap.xml. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open robots.txt and sitemap.xml on the production domain and confirm both load successfully.
2. Confirm the sitemap contains only intended canonical public URLs and excludes admin/private pages.
3. Verify the domain property in Search Console and submit the sitemap.
4. Inspect the home page, shop, one category/local page, and several product-detail URLs.
5. Confirm canonical URLs use the production domain and query-based product pages resolve consistently.
6. Review index coverage, mobile usability, structured-data reports, manual actions, and security issues.
7. Record important indexing problems as separate work items rather than repeatedly changing titles without evidence.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct robots/canonical/sitemap/status/redirect/template data, request validation where appropriate, and recheck the live URL after deployment. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Search Console owns the production property, the sitemap/canonical system is correct, and representative public pages are crawlable without critical index or security errors.

### 290. Complete and verify Google Business Profile and local-business consistency — **High**

**Inside the application:** `/contact/`  
**External location:** Google Business Profile for Devil n Dove  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /contact/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm the profile name, primary/secondary categories, phone, website, service or pickup area, hours, special hours, description, products/services, and photos are accurate.
2. Keep address visibility consistent with how customers actually visit or receive products.
3. Compare business name, phone, website, and locality wording with the website and major directory profiles.
4. Add current real photos and respond to legitimate reviews without incentives that violate platform rules.
5. Use local wording only where it truthfully reflects pickup, service, market, or delivery reach.
6. Record monthly evidence and any profile correction task.
7. Do not promise or report a guaranteed first-page position; monitor relevance, distance, and prominence over time.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then correct the owner-approved business facts/photos/categories/hours in the profile and website, then verify the public listing while signed out. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** The Business Profile is complete, accurate, consistent with the website, actively maintained, and supported by real local proof and customer trust.

### 300. Run the public SEO, title, H1, structured-data, image, and internal-link audit — **High**

**Inside the application:** `/admin/local-seo-review/`  
**External location:** Production public pages, Google rich-result tools, and Search Console  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/local-seo-review/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Scan every indexable HTML page for one and only one H1, a distinctive title, useful meta description, canonical URL, robots directive, and meaningful visible introduction.
2. Make the main title visually unambiguous; avoid multiple headings with equal title prominence.
3. Use descriptive buyer language in titles, headings, product facts, image alt text, and internal links without stuffing locations or keywords.
4. Validate Organization/LocalBusiness, Breadcrumb, Product, Offer, image, and other applicable structured data against visible facts.
5. Confirm Product schema includes the approved gallery images, current price, currency, availability, SKU, and canonical offer URL.
6. Check crawlable internal links to important shop, category, policy, contact, story, and local relevance pages.
7. Review duplicate/thin pages and redirect or noindex where appropriate.
8. Record before/after evidence for changes rather than guessing from rankings.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then rewrite thin/duplicate or misleading visible copy and metadata, keep structured data aligned, repair internal links/images, and revalidate the deployed page. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** All indexable pages pass the one-H1 and metadata audit, structured data matches visible facts, and important pages are discoverable through descriptive crawlable links.

### 310. Complete real-device mobile, keyboard, accessibility, and performance testing — **Critical**

**Inside the application:** `/admin/post-deploy-smoke-tests/`  
**External location:** Real phones/tablet/desktop, Lighthouse/PageSpeed, keyboard, and screen-reader checks  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/post-deploy-smoke-tests/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Test a narrow phone, large phone, tablet, laptop, and large desktop in portrait and landscape where relevant.
2. Complete navigation, product view/gallery, cart, checkout, login, password reset, contact, and critical admin workflows.
3. Confirm touch targets, sticky actions, form labels, validation, focus visibility, keyboard order, dialogs, tables, and horizontal overflow.
4. Check colour contrast and text readability in dark/light surfaces used by the site.
5. Test with images disabled or a slow connection and confirm useful fallback content.
6. Run Lighthouse/PageSpeed on home, shop, product detail, contact, and an important local/content page on mobile and desktop.
7. Fix critical accessibility errors and layout overlap before launch; document lower-priority performance work.
8. Re-run after CSS or image changes.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then fix the source CSS/HTML/JavaScript issue at the failing viewport or input method, then rerun the entire customer journey on a real device and keyboard. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Critical customer journeys work on target devices and keyboard, no blocking accessibility or overlap defect remains, and performance evidence is recorded.

### 320. Keep social publishing controls review-first until provider OAuth is approved — **Medium**

**Inside the application:** `/admin/social-publishing/`  
**External location:** Meta, Pinterest, YouTube, TikTok, and other configured provider developer consoles  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/social-publishing/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Open Social Publishing and list each provider shown in the connection cards, queue, and public footer.
2. For Meta, confirm FACEBOOK_PAGE_ID (or META_PAGE_ID), FACEBOOK_PAGE_ACCESS_TOKEN (or META_PAGE_ACCESS_TOKEN), INSTAGRAM_USER_ID/INSTAGRAM_BUSINESS_ACCOUNT_ID, and the optional INSTAGRAM_ACCESS_TOKEN exist as encrypted Production secrets; never record their values.
3. Select Test Facebook + Instagram. Confirm the Page identity and Instagram professional-account identity return HTTP 200 and the configured IDs match.
4. If META_APP_ID and META_APP_SECRET are present, confirm token debug reports is_valid, the app ID matches, expiry/data-access-expiry are acceptable, and the returned scopes cover the approved workflow.
5. Confirm exact callback URLs, privacy/data-deletion pages, app-review state, Page/account roles, and provider scopes in the Meta developer/business consoles.
6. Keep automatic publishing disabled. Generate one product draft, review media/privacy/caption/UTM, approve deliberately, and publish only one safe product-only test post.
7. Confirm the provider post ID/URL and queue status are recorded, then verify the tracked public destination works.
8. Expire/revoke a test token or use a safe invalid preview credential and confirm the item remains in review/failed state rather than falsely marked published.
9. Repeat the credential identity test after token rotation, app-role changes, Graph API version changes, or account reconnection.
10. Keep providers manual and remove unfinished public promises when OAuth, review, or posting permissions are incomplete.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then keep publishing manual/disabled, correct Meta/provider IDs, roles, scopes, token validity or callback settings, then rerun read-only identity tests before one reviewed post. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Unapproved providers remain disabled and honestly labelled; any enabled provider publishes only after deliberate review with observable success/failure evidence.

## Recovery, fulfilment, and controlled opening

### 330. Rehearse D1, R2, deployment, and configuration recovery — **Critical**

**Inside the application:** `/admin/deployment-preflight/`  
**External location:** Cloudflare D1 backups/exports, R2, Pages deployments, and secure configuration records  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/deployment-preflight/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Create a test or copied environment that can be restored without risking production customer data.
2. Restore a recent D1 backup and verify users, products, inventory, orders, packaging, and readiness records.
3. Verify R2 object inventory and restore or re-link a safe test media object.
4. Roll back to a previous Pages deployment, run smoke tests, then return to the current deployment.
5. Confirm required variable and binding names are documented outside the code without storing secret values in the repository.
6. Measure recovery time and record the operator steps that were confusing or missing.
7. Update the recovery guide after the rehearsal.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then discard the unsafe test restore, correct the backup/media/config/runbook gap, create a fresh isolated target, and repeat while measuring recovery time. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** A tested operator can restore database, media, deployment, and required configuration within an acceptable time using documented steps.

### 340. Complete a real paid order from product view through fulfilment — **Critical**

**Inside the application:** `/admin/orders/`  
**External location:** Public store, payment provider, email, packaging, pickup/shipping, inventory, and accounting  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/orders/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Use a launch product and an owner-controlled customer identity/payment method.
2. Start from the public Shop, inspect the product gallery/facts, add to cart, and complete checkout.
3. Confirm payment, webhook, order, inventory, tax, shipping/pickup, email, and accounting records.
4. Pick the physical item, verify lot/batch where relevant, package it with the approved label/materials, and mark fulfilment.
5. Confirm the customer receives the correct fulfilment or pickup message.
6. Compare actual labour, packaging, shipping, provider fee, and margin with the stored assumptions.
7. Save order ID, timestamps, and issues; never store full payment credentials.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then pause launch, reconcile the rehearsal order across payment/stock/tax/email/accounting/packaging, correct the failing source workflow, then use a new order. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** One real order completes end to end with correct product, money, stock, communication, packaging, fulfilment, and reconciliable records.

### 350. Complete a separate cancellation/refund rehearsal and customer recovery — **Critical**

**Inside the application:** `/admin/orders/`  
**External location:** Production payment, order, inventory, email, and accounting systems  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/orders/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Use a different low-value owner-controlled rehearsal order so the paid-order proof remains intact.
2. Test the actual cancellation/refund workflow an operator will use.
3. Confirm provider refund, order history, customer email, inventory decision, tax reversal, fee treatment, and accounting entries.
4. Confirm the item is returned to sellable stock only after physical/operational review where required.
5. Replay the provider event and confirm the recovery action remains idempotent.
6. Document the customer-service wording and escalation path for a failed automated step.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then reconcile provider refund, credit note, customer notice, stock disposition, tax and accounting records; correct duplicate/missing effects before a new rehearsal. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** A separate refund/cancellation can be completed safely, communicated clearly, reconciled, and repeated webhook delivery cannot duplicate its effects.

### 360. Assign launch-day ownership, monitoring, support, and stop conditions — **Critical**

**Inside the application:** `/admin/startup-readiness/`  
**External location:** Internal launch operating plan  
**Production test:** No live binding is required, but deployed verification may still be appropriate.

#### Before you begin

Assign one owner and open /admin/startup-readiness/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Name the person responsible for orders, payments, inventory, email, customer messages, site incidents, and public updates during opening.
2. Define the hours the store will be actively monitored during the first days.
3. Write stop conditions for payment mismatch, oversell, repeated 500 errors, lost email, wrong tax, broken fulfilment, or unsafe product/label concern.
4. Record how to hide checkout, archive a product, roll back a deployment, contact customers, and preserve evidence.
5. Confirm the owner can access the required dashboards and recovery instructions from a phone.
6. Prepare a short daily review of orders, incidents, inventory, refunds, and customer questions.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then assign the missing owner/coverage, document phone-accessible stop and rollback steps, and rehearse the handoff or escalation. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** Each launch responsibility has an owner and the team has clear monitoring, escalation, rollback, and temporary-stop instructions.

### 370. Open with controlled stock, limited products, and a reversible rollout — **Critical**

**Inside the application:** `/admin/startup-readiness/`  
**External location:** Production store and launch operating decision  
**Production test:** Yes — use owner-controlled records and save non-secret identifiers.

#### Before you begin

Assign one owner and open /admin/startup-readiness/. Record the starting IDs, counts, totals, timestamps, browser/device, environment, and expected result before changing anything. Use owner-controlled test data and never place passwords, access tokens, full payment data, or private customer information in evidence.

#### Test steps

1. Confirm every critical readiness item is Complete or has a formally justified Not Applicable decision.
2. Keep the opening-day product list small and inventory conservative.
3. Open to a limited audience or quiet public release before paid promotion.
4. Monitor the first orders in real time and compare every system record.
5. Pause sales immediately if a stop condition is reached.
6. Add products and automation gradually only after the core order, inventory, email, refund, and fulfilment paths remain stable.
7. Record the opening time, product count, owner on duty, and first review time.

#### If any step fails: correction procedure

Do not mark the gate Complete. Set Failed or Blocked and identify the exact numbered step, actual result, request/order/product/event ID, safe log reference, and affected environment. Then pause or roll back sales, close the failed critical/high gate with evidence, reduce opening scope if needed, and restart only through the recorded owner decision. Preserve history with audited corrections or new versions instead of silently rewriting financial, inventory, approval, or customer evidence.

#### Evidence to save

Save a concise before/after record: date/time and environment; owner; tested route and external console; non-secret record/event/deployment IDs; expected versus actual result for every numbered step; screenshots or approved evidence links; correction made; final rerun result; and confirmation that the stated pass condition is now true.

#### Retest and reopening rule

Repeat the failed step first, then repeat the entire gate from a clean browser/session or fresh owner-controlled record. Reopen this gate after any related deployment, credential rotation, schema change, provider-version change, policy change, or material data correction.

**Pass condition:** The store opens through a monitored, reversible, low-risk release with no unresolved critical blocker and a clear pause/rollback path.

## Gate count and authority

This guide contains 37 gates. If it differs from the D1 cockpit after deployment, use the Build 227 API seed, confirm all 37 items return, and keep the gate Failed until the status authority and guide agree.

