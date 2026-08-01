# Devil n Dove Startup and Go-Live Guide — Build 225

## Purpose
This is the complete human-readable launch guide. The status authority is the D1-backed **Startup Readiness Cockpit** at `/admin/startup-readiness/`. Use that page to assign owners and due dates, save evidence, mark work Complete, record Blocked reasons, reopen work, and review history.

## How to use this guide
1. Deploy Build 225 and apply `database_build225_startup_readiness_packaging_authority.sql` or the identical `database_upgrade_current_pass.sql`, but not both.
2. Open `/admin/startup-readiness/` and keep the default **Open only** filter.
3. Work in numerical order. Critical gates should not be skipped because a later page appears to work.
4. Add an owner, due date, factual result, and safe evidence reference. Never store passwords, tokens, card data, or raw private customer data.
5. Mark an item **Complete** only after its pass condition is proven. Mark **Not applicable** only with a recorded reason/evidence.
6. Browser-only fallback changes are visibly marked Unsynced and are not server evidence until synchronization succeeds.

## Go-live decision rule
- **Do not open checkout** while any Critical item remains open, blocked, failed, or needs review.
- High items should also be closed before unrestricted public promotion. A limited monitored opening may be considered only after Critical gates are complete and the remaining High items have explicit owners and safe temporary procedures.
- Medium items may continue after a controlled opening when they do not create a misleading, unsafe, financial, privacy, or fulfilment risk.

## Current official guidance used in this pass
- Google Search may use the main visual title, heading elements, and other prominent text to form a title link; keep one clear page title and avoid multiple headings with equal visual prominence.
- Google Business Profile local results mainly depend on relevance, distance, and prominence; complete accurate business information, real reviews/photos, useful local relevance, and trustworthy prominence matter more than keyword repetition.
- Health Canada currently states manufacturers and importers must notify Health Canada within 10 days after first selling a cosmetic in Canada. Confirm current official requirements when each product launches.

## Foundation and deployment

### 10. Back up D1, apply the current migration, and deploy the complete build — **Critical**

**Inside the application:** `/admin/deployment-preflight/`
**External location:** Cloudflare Dashboard → Workers & Pages → D1 and Pages deployments

**Detailed steps**

1. Open Cloudflare D1 and create a production backup or export before changing the schema.
2. Record the backup date, database name, and safe storage location in the evidence notes.
3. Apply database_build225_startup_readiness_packaging_authority.sql or database_upgrade_current_pass.sql, but not both.
4. Deploy the complete ZIP rather than selected files.
5. Open Deployment Preflight and run every available check.
6. Save the deployment URL, commit or deployment identifier, and the preflight result.
7. Stop and restore the previous deployment if any critical migration or routing error appears.

**Pass condition:** A recoverable D1 backup exists, the Build 225 migration is applied once, the complete deployment is live, and Deployment Preflight has no unresolved critical result.

### 20. Verify production bindings, secrets, domains, and environment separation — **Critical**

**Inside the application:** `/admin/deployment-preflight/`
**External location:** Cloudflare Pages project → Settings → Variables and Bindings; custom domains; D1/R2 bindings

**Detailed steps**

1. Confirm the production Pages project is connected to the intended D1 database and R2 buckets.
2. Confirm every required secret exists in Production, not only Preview.
3. Check payment, email, OAuth, admin-bootstrap, analytics, and storage variables against CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md.
4. Confirm preview/test credentials are not used in production and production credentials are not committed to the repository.
5. Confirm devilndove.com and any www redirect resolve to the production deployment with valid HTTPS.
6. Test one read and one safe write against each required binding.
7. Record only variable names and test results; never paste secret values into evidence.

**Pass condition:** The production domain, D1, R2, payment, email, and required application bindings are present in the correct environment and pass safe connectivity checks without exposing secrets.

## Access, security, and recovery

### 30. Prove production login, logout, session expiry, and password recovery — **Critical**

**Inside the application:** `/login/`
**External location:** Production website and the configured transactional email provider

**Detailed steps**

1. Open a private browser window and log in with a test administrator account.
2. Confirm successful login redirects correctly and does not return a 500 error.
3. Log out and verify protected pages and APIs are no longer accessible.
4. Request a password reset from the public recovery page.
5. Confirm the reset message arrives, the link can be used once, and an expired or reused link is rejected.
6. Test Logout All Sessions and confirm an older browser session is invalidated.
7. Leave a test session idle long enough to confirm expiry behaviour and a clear sign-in recovery path.
8. Record browser, time, account role, and result without storing passwords or tokens.

**Pass condition:** Login, logout, reset, one-time token use, session expiry, and logout-all work in production without 500 errors or continued access after invalidation.

### 40. Verify server-side authorization for destructive, financial, and approval actions — **Critical**

**Inside the application:** `/admin/members/`
**External location:** Production admin APIs and role test accounts

**Detailed steps**

1. Prepare an administrator account and at least one lower-privilege test account.
2. Test permanent product deletion, inventory reversal, label approval, accounting export, member administration, and publication approval.
3. Confirm the administrator can perform only the actions intended for that role.
4. Call the same APIs while signed in as the lower role and confirm 401 or 403 responses.
5. Confirm hiding a button is not the only protection; direct API calls must also be denied.
6. Confirm every successful sensitive action creates an audit record with actor, target, time, and reason.
7. Remove or disable temporary test accounts after the review.

**Pass condition:** Every sensitive action is enforced on the server, lower roles receive 401/403, and successful actions are attributable in the audit history.

### 50. Prove runtime incident capture and honest fallback behaviour — **High**

**Inside the application:** `/admin/runtime-incidents/`
**External location:** Production Pages Functions logs and runtime incident records

**Detailed steps**

1. Use a safe test condition that causes a non-destructive optional API failure, such as an unavailable optional table in a preview environment.
2. Confirm the API returns structured JSON with a useful status code and plain-language error.
3. Confirm the browser shows a usable fallback or retry path without claiming a save, payment, export, or approval succeeded.
4. Confirm the runtime incident includes scope, code, severity, user or request context, and a sanitized stack or detail.
5. Restore the optional dependency and verify the normal path recovers.
6. Review offline.html and low-bandwidth media fallbacks on a throttled connection.

**Pass condition:** Expected failures are visible, sanitized, recoverable, and recorded; fallback states never present an uncompleted business action as successful.

## Catalog, product facts, and media

### 60. Choose a small opening-day product list and freeze its launch scope — **Critical**

**Inside the application:** `/admin/products/`
**External location:** Internal operating decision

**Detailed steps**

1. Select a deliberately small group of products that can be physically counted, photographed, packaged, and fulfilled now.
2. Exclude experimental, incomplete, duplicate, content-only, or uncertain products from the launch group.
3. Record the product IDs, names, SKUs, and intended sale channels.
4. Confirm every selected item has an owner responsible for facts, media, inventory, packaging, and final review.
5. Keep other products in Draft or Archived while the site opens.
6. Revisit the launch group only through a deliberate review so the finish line does not keep moving.

**Pass condition:** A finite opening-day product list is recorded, owned, and protected from unrelated draft work.

### 70. Verify every launch product View link, detail page, and seven-image gallery — **Critical**

**Inside the application:** `/shop/`
**External location:** Public shop and /api/product-detail?slug=<slug>

**Detailed steps**

1. Open the public Shop in a private browser window.
2. Select View on every launch product card.
3. Confirm the URL contains the correct slug and the detail endpoint returns HTTP 200 with ok:true.
4. Confirm name, price, description, SKU, availability, shipping information, and calls to action match the admin record.
5. For products with seven approved images, confirm seven unique thumbnails appear and each changes the main image, alternative text, caption, and image counter.
6. Confirm blocked or consent-needed images remain excluded for a documented reason.
7. Test direct loading, browser refresh, copied link, mobile view, and the public catalog fallback.
8. Record every product that returns fewer images or stale facts and correct it in Catalog Media or Products.

**Pass condition:** Every launch product opens from its card, returns current facts, and displays all approved unique storefront images without broken routes or stale fallback content.

### 80. Complete Product Release Preflight for every launch product — **Critical**

**Inside the application:** `/admin/release-preflight/`
**External location:** Devil n Dove Product Release Preflight

**Detailed steps**

1. Filter Product Release Preflight to the opening-day product list.
2. Resolve required name, slug, SKU, price, category, description, quantity, dimensions, weight, shipping, tax, care, condition, and sale-channel facts.
3. Confirm quantity pricing and set components where applicable.
4. Resolve every blocking media, consent, packaging, content, or inventory warning.
5. Open the public detail page after each important correction.
6. Record any warning intentionally accepted, who accepted it, and why.
7. Do not publish a product merely because a percentage score looks high; manually review the final buyer view.

**Pass condition:** Every opening-day product is green for required preflight checks and has a final human review of the public page.

### 90. Finish product media, rights, roles, alt text, and R2 delivery — **Critical**

**Inside the application:** `/admin/catalog-media/`
**External location:** Catalog Media, R2 object delivery, and public product pages

**Detailed steps**

1. Assign one featured image and up to six supporting images to each launch product.
2. Set image role, display order, concise descriptive alt text, caption where useful, and public-use status.
3. Confirm ownership or consent and keep blocked/consent-needed media out of public responses.
4. Verify full, thumbnail, WebP, and AVIF derivatives where configured.
5. Test image loading on a normal desktop connection and a throttled mobile connection.
6. Confirm image URLs do not expose private object paths or require an expired signed URL for public catalog media.
7. Replace every launch-product placeholder or broken image with approved real media.

**Pass condition:** Every launch product has an approved featured image, supporting media where available, documented rights, useful alt text, and reliable public delivery.

## Pricing, inventory, and checkout

### 100. Verify base prices, quantity specials, sets, coupons, and gift-card interactions — **Critical**

**Inside the application:** `/admin/products/`
**External location:** Public product detail, cart, checkout, and payment total

**Detailed steps**

1. For each launch product, compare the stored base price with the public detail page, cart, checkout, and payment provider.
2. Test every quantity breakpoint using the exact threshold, one below, and one above.
3. Confirm the per-unit price never increases unexpectedly at a higher advertised tier.
4. For sets, confirm component quantities and requested reserved-set quantity are correct.
5. Test coupon and gift-card combinations only if those features are publicly displayed.
6. Confirm discounts cannot reduce a price below an approved floor or create a negative total.
7. Verify the server recalculates all totals and ignores browser-edited values.
8. Record screenshots or order IDs for each scenario.

**Pass condition:** Displayed and server-calculated prices, discounts, quantity tiers, sets, and final payment totals match approved business rules.

### 110. Prove exact-once inventory settlement for regular products — **Critical**

**Inside the application:** `/admin/orders/`
**External location:** Production checkout, Stripe webhook events, orders, and inventory movements

**Detailed steps**

1. Record the starting inventory of a safe test product.
2. Complete one paid production order for one unit.
3. Confirm inventory is consumed only after the approved payment event and exactly one movement is recorded.
4. Replay or resend the same webhook event and confirm no second consumption occurs.
5. Attempt a failed and an expired checkout and confirm no permanent consumption remains.
6. Compare order quantity, inventory movement, on-hand quantity, and audit history.
7. Use a compensating correction only through the reviewed inventory workflow if the test exposes a defect.

**Pass condition:** A successful payment consumes the correct quantity once, retries are idempotent, and failed or expired payment attempts do not leave stock consumed.

### 120. Prove component-set reservation, zero availability, and final-unit concurrency — **Critical**

**Inside the application:** `/admin/products/`
**External location:** Production set product, component products, simultaneous checkout sessions

**Detailed steps**

1. Create or use a safe set with known component quantities and a small temporary stock level.
2. Confirm the set availability equals the lowest whole number of complete component sets.
3. Confirm reserved components reduce the individual component availability shown publicly.
4. Reduce one component below the required quantity and confirm the set shows zero available.
5. Restore stock through a reviewed movement, not a direct database edit.
6. Open two private browser sessions and attempt to buy the final available set or final one-of-a-kind item at nearly the same time.
7. Confirm only one checkout can settle and the other receives a clear unavailable result.
8. Confirm cancellation/refund restores both set and component availability exactly once.

**Pass condition:** Set availability is component-limited, reservations are visible, zero availability is enforced, and simultaneous final-unit attempts cannot oversell.

### 130. Reconcile tools, supplies, purchase lots, dates, and actual costs — **High**

**Inside the application:** `/admin/inventory-operations/`
**External location:** Amazon order history, supplier invoices, and physical stock count

**Detailed steps**

1. Open Tools & Supplies and choose Lots for each launch material.
2. Enter each separate purchase with purchase/received date, supplier, order number, ASIN or supplier SKU, quantity, unit cost, allocated tax/shipping, storage location, and expiry where applicable.
3. Keep goat milk bases, oils, mica, coloured bases, fragrance, packaging, and other batches separate when traceability matters.
4. Compare total lot remaining with the main on-hand quantity.
5. Physically count the material before applying a lot total to main inventory.
6. Use the review and APPLY LOT TOTAL confirmation rather than editing D1 directly.
7. Record quarantine, expiry, return, or consumed status accurately.
8. Verify project and product costing uses reviewed costs rather than a stale default.

**Pass condition:** Every launch material has traceable purchase evidence, physical quantity, lot status, and a reviewed cost suitable for margin calculation.

### 140. Verify Canadian tax scenarios and refund tax calculations — **Critical**

**Inside the application:** `/checkout/`
**External location:** Production checkout, payment provider, and accountant-reviewed tax settings

**Detailed steps**

1. Confirm the business tax-registration status and effective date with the owner/accountant.
2. Test an Ontario shipping address and every other province or territory the store accepts.
3. Test local pickup if enabled.
4. Confirm tax treatment for physical goods, digital items, shipping charges, discounts, gift cards, and refunds.
5. Compare the public checkout total, payment-provider amount, stored order tax, and accounting journal.
6. Confirm unsupported destinations are rejected before payment.
7. Save scenario evidence and the business rule used; do not rely only on a browser display.

**Pass condition:** Every accepted destination and product type produces the reviewed tax result, and refunds reverse the correct tax amount.

### 150. Verify shipping destinations, rates, pickup, packaging, and fulfilment promises — **Critical**

**Inside the application:** `/pickup/`
**External location:** Checkout, carrier or shipping-rate source, packing materials, and public policies

**Detailed steps**

1. List the destinations the business can actually fulfil at launch.
2. Test Ontario, another supported province, PO box handling, and US/international only when intentionally enabled.
3. Confirm package weight and dimensions for each launch-product family.
4. Compare checkout rates with the expected carrier or flat-rate policy.
5. Test local pickup instructions, pickup timing, contact details, and tax treatment.
6. Confirm free-shipping thresholds and surcharges cannot be bypassed through quantity or discount combinations.
7. Perform one physical pack test and verify the product is protected by the materials included in its cost.
8. Ensure policy text matches actual operating practice.

**Pass condition:** Every accepted address can be fulfilled at the displayed cost and timeframe, pickup instructions are accurate, and physical packaging protects the product.

## Payments, refunds, and financial controls

### 160. Complete Stripe live capture, signed webhook, and idempotency proof — **Critical**

**Inside the application:** `/admin/webhook-events/`
**External location:** Stripe Dashboard → Developers → Webhooks and production payment settings

**Detailed steps**

1. Confirm live Stripe keys and the production webhook signing secret are stored in Production secrets.
2. Confirm the public webhook endpoint and subscribed event types match the application.
3. Place one low-value real order with an owner-controlled payment method.
4. Confirm the payment amount, currency, order ID, customer details, and settlement status.
5. Confirm the webhook signature is verified before any state change.
6. Resend the same event and confirm the event ID is not applied twice.
7. Test a failed payment, expired checkout, and customer cancellation.
8. Record Stripe event IDs and order IDs, never secret values or full card data.

**Pass condition:** A live payment settles once, its signed webhook is verified, duplicate delivery has no duplicate effect, and failed/cancelled sessions remain recoverable.

### 170. Prove cancellation, partial/full refund, and inventory restoration — **Critical**

**Inside the application:** `/admin/orders/`
**External location:** Order management, payment provider, inventory movements, and accounting records

**Detailed steps**

1. Use a separate paid rehearsal order after the successful-payment test.
2. Cancel before fulfilment and confirm the order status, payment state, and inventory restoration.
3. Test a full refund and, if supported publicly, a partial refund.
4. Confirm each refund creates one provider action, one order history event, one inventory restoration where appropriate, and balanced accounting entries.
5. Replay the refund webhook and confirm no second restoration or refund record occurs.
6. Confirm non-restockable or partially fulfilled items require an explicit reviewed decision.
7. Check the customer-facing refund communication.

**Pass condition:** Cancellation and refund actions are idempotent, financially traceable, communicate clearly, and restore only the inventory that should return to sale.

### 180. Make PayPal fully operational or completely hide it — **Critical**

**Inside the application:** `/checkout/`
**External location:** PayPal developer/live account and production callback settings

**Detailed steps**

1. Inspect checkout, footer, payment options, and documentation for PayPal references.
2. If live credentials, callbacks, capture, cancellation, webhook, and refund paths are not proven, remove or hide PayPal from all public surfaces.
3. If PayPal will launch, use a low-value owner-controlled transaction to test approval, capture, cancellation, webhook retry, and refund.
4. Confirm order and inventory effects match the Stripe workflow and remain idempotent.
5. Record the explicit business decision and date.

**Pass condition:** Customers either receive a completely working PayPal option or see no PayPal option or promise anywhere on the live site.

### 190. Verify bookkeeping, payment application, HST/GST review, and export controls — **High**

**Inside the application:** `/admin/accounting/`
**External location:** Accountant-reviewed chart of accounts, tax settings, and export process

**Detailed steps**

1. Confirm sales, tax, shipping, discounts, payment fees, refunds, inventory, cost of goods, and gift-card liabilities map to the intended accounts.
2. Confirm paid orders can be applied to receivables and provider settlements without duplicate journals.
3. Review HST/GST reporting fields and opening balances with the accountant.
4. Test an accountant export with a safe date range and confirm lower roles cannot run it.
5. Confirm month-end lock/reopen controls or document the temporary manual procedure.
6. Record unresolved accounting limitations in the operating checklist before launch volume increases.

**Pass condition:** Opening transactions can be reconciled and exported accurately, sensitive exports are authorized, and any temporary manual accounting controls are documented.

## Customer communication and policies

### 200. Verify every required transactional email and failure path — **Critical**

**Inside the application:** `/admin/live-ops-followthrough/`
**External location:** Configured email provider, Gmail, Outlook, and mobile inboxes

**Detailed steps**

1. Test registration or welcome, password reset, order confirmation, payment receipt, cancellation, refund, fulfilment/shipping, pickup, and review request when enabled.
2. Send only to owner-controlled test addresses.
3. Check Gmail, Outlook, and a mobile mail application.
4. Confirm sender name, reply-to, domain authentication, links, order facts, plain-text fallback, and unsubscribe requirements for non-transactional mail.
5. Trigger a safe provider failure and confirm it is visible in logs or an admin retry queue.
6. Confirm no secret, internal note, or unrelated customer data appears in the message.
7. Save provider message IDs or screenshots as evidence.

**Pass condition:** Essential messages arrive with correct facts and links, failures are observable, and a safe resend or support path exists.

### 210. Verify contact, custom request, order-help, and customer-service response paths — **High**

**Inside the application:** `/contact/`
**External location:** Public contact/custom-request forms and owner-controlled inbox

**Detailed steps**

1. Submit the public contact form and any enabled custom-request form from a private browser.
2. Confirm required consent, spam protection, validation, acknowledgement, and admin visibility.
3. Ask a product, shipping, pickup, return, and custom-order question using test data.
4. Confirm the message reaches the correct owner inbox or admin queue with a useful reference.
5. Verify a customer can find order-help instructions without entering admin areas.
6. Confirm response-time promises are realistic and consistent with policy pages.
7. Delete test personal data after verification where appropriate.

**Pass condition:** Customers can reach the business, receive acknowledgement, and obtain order/product help through monitored channels with realistic response expectations.

### 220. Review privacy, terms, shipping, pickup, returns, refunds, and custom-work policies — **Critical**

**Inside the application:** `/terms/`
**External location:** Public footer, checkout, product pages, and owner/legal review

**Detailed steps**

1. Open every public policy from the footer and checkout.
2. Confirm business name, contact method, effective date, jurisdiction, shipping destinations, pickup rules, cancellation, return, refund, damaged-item, custom/personalized, digital, and privacy wording.
3. Make sure policies describe actual operations and do not promise unsupported delivery times or return rights.
4. Confirm product pages link to the policy information customers need before payment.
5. Verify privacy/data-deletion instructions reflect the data actually collected by forms, analytics, accounts, and payment providers.
6. Review special conditions for one-of-a-kind, vintage, made-to-order, and cosmetic products.
7. Record who reviewed the final policy set and when.

**Pass condition:** All customer-facing policies are findable before payment, internally consistent, dated, and aligned with the way the business will actually operate.

## Soap, packaging, and regulatory readiness

### 230. Verify each soap formula, INCI order, bilingual identity, warnings, and claims — **Critical**

**Inside the application:** `/admin/packaging/soap-labels/`
**External location:** Verified recipe/formula records, supplier documents, bilingual review, and applicable cosmetic requirements

**Detailed steps**

1. Link the soap label project to the intended finished soap product and verified recipe or formula source.
2. Enter ingredients in reviewed INCI order rather than copying supplier marketing bullets.
3. Complete matched English and French product identity, ingredient display rows, warnings, dealer/address, consumer contact, Canadian-origin wording, and metric net quantity.
4. Review fragrance, colourant, allergen, and claim obligations that apply to the final formula.
5. Confirm every displayed claim has an internal approval note and factual support.
6. Compare the structured rows against the batch record and physical product.
7. Lock the reviewed source facts before creating the final label version.

**Pass condition:** The label content reflects the actual formula and reviewed bilingual/legal facts; no ingredient or claim is inferred from artwork or supplier advertising.

### 240. Generate, measure, wrap-test, approve, and archive each soap label — **Critical**

**Inside the application:** `/admin/packaging/soap-labels/`
**External location:** 100% physical printer proof and PACKAGING_STUDIO.md

**Detailed steps**

1. Use PACKAGING_STUDIO.md as the single packaging source of truth.
2. Generate the continuous ribbon from structured records and save a review version.
3. Print at 100% with browser/page scaling disabled.
4. Measure strip width, band height, front oval, rear seal, bleed, and safe-area result.
5. Test both the photo-fit and true-50-mm profile if the final physical geometry is not yet chosen.
6. Wrap the actual soap and inspect front centring, folds, overlap/glue, ingredient legibility, French text, claims, net weight, barcode/batch zones, and colour.
7. Upload or link a proof photo, record printer/paper, and mark fit, legibility, and overlap separately.
8. Approve and archive only the version that passed; supersede rather than silently overwrite an approved label.

**Pass condition:** Each launch soap has a saved, physically measured, wrapped, passed, approved, and archived label version linked to its exact structured source data.

### 250. Prepare Health Canada cosmetic notification and change control — **Critical**

**Inside the application:** `/admin/startup-readiness/`
**External location:** Health Canada Cosmetic Notification Form and official guidance

**Detailed steps**

1. Determine which launch products are cosmetics and identify the responsible manufacturer or importer.
2. Prepare product identity, intended use, company/contact, first-sale date, formula ingredients, concentration ranges, and other required notification information.
3. Submit the Cosmetic Notification Form within the applicable period after first sale; current official guidance states within 10 days after first sale in Canada.
4. Save the submission confirmation or reference outside the public website and record a safe evidence pointer here.
5. Create a change-control rule for name, formula, concentration, company, contact, or other reportable changes.
6. Review the Cosmetic Ingredient Hotlist and other applicable official requirements before release.
7. Do not treat an app-generated label or notification record as legal approval.

**Pass condition:** Every applicable cosmetic has an owner, prepared/submitted notification evidence, and a documented process for later formula or business-detail changes.

### 260. Confirm the packaging export is suitable for the chosen printer and production method — **High**

**Inside the application:** `/admin/packaging-studio/`
**External location:** Chosen printer, paper/stock, cutter, colour profile, and production proof

**Detailed steps**

1. Confirm whether the printer accepts SVG, browser-generated PDF, or requires a prepress PDF with crop/bleed boxes and embedded/outlined fonts.
2. Verify the exact media size, bleed, safe area, crop marks, colour mode/profile, and no-scaling setting.
3. Confirm the rose and icon assets remain sharp and licensed/owned for production use.
4. Print a calibration ruler and compare measured output to the design dimensions.
5. Record printer, paper, driver, scaling, colour, and cutting settings.
6. Keep browser Print/Save PDF labelled as preparation until the chosen printer accepts it as final production output.
7. Archive the source SVG, delivered file, checksum, and proof result.

**Pass condition:** The chosen printer and material reproduce the approved dimensions, type, colour, bleed, and cut safely using an archived export and documented settings.

## Search, analytics, accessibility, and quality

### 270. Verify analytics, consent, privacy boundaries, and commerce event accuracy — **High**

**Inside the application:** `/admin/site-analytics/`
**External location:** GA4 or configured analytics property and browser developer tools

**Detailed steps**

1. Confirm the production analytics identifier is loaded once on public pages and not duplicated by multiple scripts.
2. Test page_view, view_item, add_to_cart, begin_checkout, purchase, refund, contact, and custom-request events that are actually enabled.
3. Confirm transaction IDs prevent duplicate purchase events after refresh.
4. Verify no secret, password, payment detail, private admin note, or unnecessary personal data is sent.
5. Test consent or privacy controls required by the chosen analytics setup.
6. Exclude admin and preview traffic where practical.
7. Compare one test order with analytics and the stored order.

**Pass condition:** Public and commerce activity is observable once, privacy boundaries are respected, and analytics values can be reconciled to a test transaction.

### 280. Verify sitemap, robots, canonical URLs, Search Console, and index coverage — **High**

**Inside the application:** `/sitemap.xml`
**External location:** Google Search Console for devilndove.com

**Detailed steps**

1. Open robots.txt and sitemap.xml on the production domain and confirm both load successfully.
2. Confirm the sitemap contains only intended canonical public URLs and excludes admin/private pages.
3. Verify the domain property in Search Console and submit the sitemap.
4. Inspect the home page, shop, one category/local page, and several product-detail URLs.
5. Confirm canonical URLs use the production domain and query-based product pages resolve consistently.
6. Review index coverage, mobile usability, structured-data reports, manual actions, and security issues.
7. Record important indexing problems as separate work items rather than repeatedly changing titles without evidence.

**Pass condition:** Search Console owns the production property, the sitemap/canonical system is correct, and representative public pages are crawlable without critical index or security errors.

### 290. Complete and verify Google Business Profile and local-business consistency — **High**

**Inside the application:** `/contact/`
**External location:** Google Business Profile for Devil n Dove

**Detailed steps**

1. Confirm the profile name, primary/secondary categories, phone, website, service or pickup area, hours, special hours, description, products/services, and photos are accurate.
2. Keep address visibility consistent with how customers actually visit or receive products.
3. Compare business name, phone, website, and locality wording with the website and major directory profiles.
4. Add current real photos and respond to legitimate reviews without incentives that violate platform rules.
5. Use local wording only where it truthfully reflects pickup, service, market, or delivery reach.
6. Record monthly evidence and any profile correction task.
7. Do not promise or report a guaranteed first-page position; monitor relevance, distance, and prominence over time.

**Pass condition:** The Business Profile is complete, accurate, consistent with the website, actively maintained, and supported by real local proof and customer trust.

### 300. Run the public SEO, title, H1, structured-data, image, and internal-link audit — **High**

**Inside the application:** `/admin/local-seo-review/`
**External location:** Production public pages, Google rich-result tools, and Search Console

**Detailed steps**

1. Scan every indexable HTML page for one and only one H1, a distinctive title, useful meta description, canonical URL, robots directive, and meaningful visible introduction.
2. Make the main title visually unambiguous; avoid multiple headings with equal title prominence.
3. Use descriptive buyer language in titles, headings, product facts, image alt text, and internal links without stuffing locations or keywords.
4. Validate Organization/LocalBusiness, Breadcrumb, Product, Offer, image, and other applicable structured data against visible facts.
5. Confirm Product schema includes the approved gallery images, current price, currency, availability, SKU, and canonical offer URL.
6. Check crawlable internal links to important shop, category, policy, contact, story, and local relevance pages.
7. Review duplicate/thin pages and redirect or noindex where appropriate.
8. Record before/after evidence for changes rather than guessing from rankings.

**Pass condition:** All indexable pages pass the one-H1 and metadata audit, structured data matches visible facts, and important pages are discoverable through descriptive crawlable links.

### 310. Complete real-device mobile, keyboard, accessibility, and performance testing — **Critical**

**Inside the application:** `/admin/post-deploy-smoke-tests/`
**External location:** Real phones/tablet/desktop, Lighthouse/PageSpeed, keyboard, and screen-reader checks

**Detailed steps**

1. Test a narrow phone, large phone, tablet, laptop, and large desktop in portrait and landscape where relevant.
2. Complete navigation, product view/gallery, cart, checkout, login, password reset, contact, and critical admin workflows.
3. Confirm touch targets, sticky actions, form labels, validation, focus visibility, keyboard order, dialogs, tables, and horizontal overflow.
4. Check colour contrast and text readability in dark/light surfaces used by the site.
5. Test with images disabled or a slow connection and confirm useful fallback content.
6. Run Lighthouse/PageSpeed on home, shop, product detail, contact, and an important local/content page on mobile and desktop.
7. Fix critical accessibility errors and layout overlap before launch; document lower-priority performance work.
8. Re-run after CSS or image changes.

**Pass condition:** Critical customer journeys work on target devices and keyboard, no blocking accessibility or overlap defect remains, and performance evidence is recorded.

### 320. Keep social publishing controls review-first until provider OAuth is approved — **Medium**

**Inside the application:** `/admin/social-hub/`
**External location:** Meta, Pinterest, YouTube, TikTok, and other configured provider developer consoles

**Detailed steps**

1. List each social provider shown in the admin or public interface.
2. Confirm callback URLs, privacy/data-deletion pages, scopes, app review, tokens, and page/account identifiers are approved and current.
3. Keep automatic publishing disabled for providers that are not completely connected.
4. Test draft generation, deliberate approval, one safe publish, provider response, and analytics link tracking separately.
5. Confirm failure or token expiry leaves content in review rather than falsely marked published.
6. Hide unfinished public promises or buttons; social OAuth is not a blocker to selling when publishing remains manual.

**Pass condition:** Unapproved providers remain disabled and honestly labelled; any enabled provider publishes only after deliberate review with observable success/failure evidence.

## Recovery, fulfilment, and controlled opening

### 330. Rehearse D1, R2, deployment, and configuration recovery — **Critical**

**Inside the application:** `/admin/deployment-preflight/`
**External location:** Cloudflare D1 backups/exports, R2, Pages deployments, and secure configuration records

**Detailed steps**

1. Create a test or copied environment that can be restored without risking production customer data.
2. Restore a recent D1 backup and verify users, products, inventory, orders, packaging, and readiness records.
3. Verify R2 object inventory and restore or re-link a safe test media object.
4. Roll back to a previous Pages deployment, run smoke tests, then return to the current deployment.
5. Confirm required variable and binding names are documented outside the code without storing secret values in the repository.
6. Measure recovery time and record the operator steps that were confusing or missing.
7. Update the recovery guide after the rehearsal.

**Pass condition:** A tested operator can restore database, media, deployment, and required configuration within an acceptable time using documented steps.

### 340. Complete a real paid order from product view through fulfilment — **Critical**

**Inside the application:** `/admin/orders/`
**External location:** Public store, payment provider, email, packaging, pickup/shipping, inventory, and accounting

**Detailed steps**

1. Use a launch product and an owner-controlled customer identity/payment method.
2. Start from the public Shop, inspect the product gallery/facts, add to cart, and complete checkout.
3. Confirm payment, webhook, order, inventory, tax, shipping/pickup, email, and accounting records.
4. Pick the physical item, verify lot/batch where relevant, package it with the approved label/materials, and mark fulfilment.
5. Confirm the customer receives the correct fulfilment or pickup message.
6. Compare actual labour, packaging, shipping, provider fee, and margin with the stored assumptions.
7. Save order ID, timestamps, and issues; never store full payment credentials.

**Pass condition:** One real order completes end to end with correct product, money, stock, communication, packaging, fulfilment, and reconciliable records.

### 350. Complete a separate cancellation/refund rehearsal and customer recovery — **Critical**

**Inside the application:** `/admin/orders/`
**External location:** Production payment, order, inventory, email, and accounting systems

**Detailed steps**

1. Use a different low-value owner-controlled rehearsal order so the paid-order proof remains intact.
2. Test the actual cancellation/refund workflow an operator will use.
3. Confirm provider refund, order history, customer email, inventory decision, tax reversal, fee treatment, and accounting entries.
4. Confirm the item is returned to sellable stock only after physical/operational review where required.
5. Replay the provider event and confirm the recovery action remains idempotent.
6. Document the customer-service wording and escalation path for a failed automated step.

**Pass condition:** A separate refund/cancellation can be completed safely, communicated clearly, reconciled, and repeated webhook delivery cannot duplicate its effects.

### 360. Assign launch-day ownership, monitoring, support, and stop conditions — **Critical**

**Inside the application:** `/admin/startup-readiness/`
**External location:** Internal launch operating plan

**Detailed steps**

1. Name the person responsible for orders, payments, inventory, email, customer messages, site incidents, and public updates during opening.
2. Define the hours the store will be actively monitored during the first days.
3. Write stop conditions for payment mismatch, oversell, repeated 500 errors, lost email, wrong tax, broken fulfilment, or unsafe product/label concern.
4. Record how to hide checkout, archive a product, roll back a deployment, contact customers, and preserve evidence.
5. Confirm the owner can access the required dashboards and recovery instructions from a phone.
6. Prepare a short daily review of orders, incidents, inventory, refunds, and customer questions.

**Pass condition:** Each launch responsibility has an owner and the team has clear monitoring, escalation, rollback, and temporary-stop instructions.

### 370. Open with controlled stock, limited products, and a reversible rollout — **Critical**

**Inside the application:** `/admin/startup-readiness/`
**External location:** Production store and launch operating decision

**Detailed steps**

1. Confirm every critical readiness item is Complete or has a formally justified Not Applicable decision.
2. Keep the opening-day product list small and inventory conservative.
3. Open to a limited audience or quiet public release before paid promotion.
4. Monitor the first orders in real time and compare every system record.
5. Pause sales immediately if a stop condition is reached.
6. Add products and automation gradually only after the core order, inventory, email, refund, and fulfilment paths remain stable.
7. Record the opening time, product count, owner on duty, and first review time.

**Pass condition:** The store opens through a monitored, reversible, low-risk release with no unresolved critical blocker and a clear pause/rollback path.

## After the controlled opening

Continue adding products, content, packaging variants, social connections, accounting automation, and intelligence features only while the paid-order, inventory, email, refund, support, and fulfilment paths remain observable and reversible. Reopen a readiness item whenever a provider, schema, tax rule, product formula, policy, domain, or production workflow changes.
