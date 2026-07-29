# Devil n Dove Startup and Go-Live Guide — Build 222

**Updated:** 2026-07-29  
**Purpose:** One ordered document showing every known item that can prevent or materially weaken a confident Devil n Dove public launch. Complete the items in sequence because later tests depend on earlier database, authentication, payment and inventory controls.

## How to use this guide

1. Work on a staging or production-like Cloudflare Pages deployment first.
2. Keep a current D1 backup before every migration or destructive cleanup action.
3. Record the date, tester, result, screenshot/log location and any corrective action for every test.
4. Do not mark an item complete because the screen exists. Mark it complete only after the deployed workflow has been exercised successfully.
5. Use `/admin/startup-readiness/` for a browser-friendly version with direct links to the relevant admin pages.

---

## 1. Back up D1 and deploy Build 222 safely — **Launch blocker**

### Where to go
- Cloudflare dashboard → **Workers & Pages** → Devil n Dove project.
- Cloudflare dashboard → **D1** → the production database used by the site.
- Repository file: `database_build222_soap_label_startup_readiness.sql`.
- Admin page after deployment: `/admin/deployment-preflight/`.

### What to do
1. Confirm which D1 binding is used in production (`DB` or `DD_DB`).
2. Export or otherwise create a recoverable D1 backup before changing the schema.
3. Apply **either** `database_build222_soap_label_startup_readiness.sql` **or** `database_upgrade_current_pass.sql`; do not apply both because the current-pass file contains the same Build 222 migration.
4. Confirm the new tables exist: `soap_label_templates`, `soap_products`, `soap_ingredients`, `soap_label_claims`, `soap_label_exports`, and `soap_label_print_tests`.
5. Deploy the full Build 222 package.
6. Open `/admin/deployment-preflight/` and run every check.
7. Save/export the preflight result and keep it with the release evidence.

### Pass condition
The migration completes without error, Packaging Studio loads from production D1, all six normalized soap-label tables are present, and Deployment Preflight reports no critical failures.

---

## 2. Prove production login, logout and password recovery — **Launch blocker**

### Where to go
- `/login/`
- `/account-help/index.html?mode=password`
- `/change-password/`
- `/admin/`
- `AUTH_LOGIN_500_TROUBLESHOOTING.md` when an error occurs.

### What to do
1. Sign in with a real administrator account in a private browser window.
2. Sign out and confirm protected pages return to login rather than showing cached admin data.
3. Request a password reset for a test account.
4. Confirm the reset email arrives, the link works once, and an expired or reused link is rejected.
5. Change the password and prove the old password no longer works.
6. Use **logout all sessions** and confirm other browsers lose access.
7. Repeat with a non-admin account and confirm it cannot access admin APIs or pages.

### Pass condition
All authentication actions succeed on the deployed site, failed attempts return a useful message rather than a 500, and role boundaries are enforced server-side.

---

## 3. Verify administrator roles and sensitive-action authorization — **Launch blocker**

### Where to go
- `/admin/members/`
- `/admin/accounting/`
- `/admin/inventory-operations/`
- `/admin/products/`

### What to do
1. Identify the small set of accounts allowed to permanently delete unused products, reverse inventory, export accounting data, change payment settings and approve packaging.
2. Test each action with an administrator account and a lower-privilege account.
3. Confirm lower-privilege users receive `401` or `403` from the API, not merely a hidden button.
4. Confirm every sensitive action creates an admin-audit record with user, time, target and reason.
5. Remove or deactivate unused administrator accounts.

### Pass condition
Only approved roles can perform destructive, financial or approval actions, and every action is auditable.

---

## 4. Complete Stripe production configuration and webhook proof — **Launch blocker**

### Where to go
- Cloudflare Pages → **Settings** → **Variables and Secrets**.
- Stripe Dashboard → **Developers** → **API keys** and **Webhooks**.
- `/admin/payment-operations/` or the payment/admin pages available in the build.
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`.

### What to do
1. Confirm production uses live Stripe keys, never test keys.
2. Confirm secrets are stored as Cloudflare secrets and are not committed to GitHub.
3. Register the exact production webhook endpoint shown by the application documentation.
4. Subscribe only to the events the application handles.
5. Store the webhook signing secret in Cloudflare.
6. Place a low-value real order and confirm checkout, payment, order creation and confirmation page.
7. Replay the same Stripe event and prove stock, payment and accounting actions are not duplicated.
8. Test failed payment, expired checkout, cancellation, full refund and partial refund.
9. Confirm webhook failures are visible in runtime incidents and can be safely retried.

### Pass condition
A real payment completes once, a replay does not duplicate anything, failures are recoverable, and refunds produce the expected order, inventory and accounting state.

---

## 5. Decide whether PayPal is live or hidden — **Launch blocker when PayPal is displayed**

### Where to go
- PayPal Developer/Business dashboard.
- Cloudflare environment variables.
- Checkout and payment-options pages.

### What to do
1. If PayPal credentials and production callbacks are not ready, hide PayPal from public checkout before launch.
2. When enabled, test a real payment, cancelled approval, failed capture and refund.
3. Confirm PayPal callbacks are authenticated and idempotent.
4. Confirm PayPal orders settle inventory through the same single order-settlement path as Stripe.

### Pass condition
PayPal is either fully proven or not offered publicly. A non-working payment button is not acceptable at launch.

---

## 6. Prove inventory settlement for regular products and sets — **Launch blocker**

### Where to go
- `/admin/inventory-operations/`
- `/admin/products/`
- `/admin/orders/`
- Product Release Preflight: `/admin/release-preflight/`.

### What to do
1. Create a temporary regular product with known stock.
2. Buy one unit and confirm stock is consumed exactly once only after the approved payment event.
3. Create a limited set with two component products and reserve the components.
4. Buy one set and confirm each component is consumed exactly once.
5. Attempt to buy more than available and confirm server-side checkout rejects it.
6. Cancel/refund the order and confirm the correct quantity is restored once.
7. Replay payment/refund webhooks and confirm no duplicate consumption or restoration.
8. Run two simultaneous checkout attempts for the final unit/set and confirm only one succeeds.

### Pass condition
Regular stock and every set component settle exactly once across payment, retry, cancellation and refund paths, with no oversell under concurrency.

---

## 7. Reconcile tools, supplies and purchase lots — **Launch blocker for reliable costing; may be completed in parallel with a small controlled launch**

### Where to go
- `/admin/inventory-operations/`
- Open an item → **Lots**.

### What to do
1. Enter every separate purchase of goat-milk base, soap bases, oils, mica, colourants and packaging materials as its own lot.
2. Record purchase date, received date, supplier, order number, ASIN/SKU, quantity, unit cost, allocated shipping/tax, expiry/best-before and storage location.
3. Compare lot remaining totals with physical on-hand stock.
4. Use **Record review only** first.
5. Apply a lot total to main inventory only after physical counting and typed confirmation.
6. Record FIFO or FEFO as the preferred method, but continue selecting the actual lot deliberately until automatic lot depletion and reversal are proven.

### Pass condition
Every material used in launch products has an explainable on-hand total, purchase history and cost basis.

---

## 8. Verify prices, quantity specials, taxes and discounts — **Launch blocker**

### Where to go
- `/admin/products/`
- Public product detail page.
- Cart and checkout.

### What to do
1. For each launch product, compare displayed price, cart price and checkout price.
2. Test quantity tiers at the exact breakpoints: one below, equal to, and one above each threshold.
3. Confirm a lower unit price never creates a negative line total or reduces unrelated products.
4. Test coupons, gift cards and any membership benefit intended for launch.
5. Verify HST/GST/PST behaviour for every province/territory you will ship to and verify pickup tax treatment.
6. Verify tax on shipping, discounts, refunds and partial refunds.
7. Save screenshots and order totals for an accountant or qualified tax reviewer.

### Pass condition
The server-calculated total matches the visible cart/checkout and the reviewed Canadian tax configuration for each supported destination.

---

## 9. Verify shipping, pickup and address handling — **Launch blocker**

### Where to go
- Checkout.
- `/pickup/` and shipping-policy pages.
- Payment/shipping administration pages.

### What to do
1. Define launch destinations clearly: Canada only, Canada/US, or another limited scope.
2. Hide unsupported destinations rather than accepting orders you cannot fulfil.
3. Test Ontario pickup, an Ontario shipment, another province, a rural/PO box address, a US address if supported, and an invalid address.
4. Confirm shipping rates, free-shipping thresholds and taxes.
5. Confirm pickup instructions, location privacy and readiness notification.
6. Buy or create test labels with the actual carrier workflow before launch.

### Pass condition
Every address the checkout accepts can be fulfilled at the price and service level shown to the customer.

---

## 10. Verify every transactional email — **Launch blocker**

### Where to go
- Registration, password reset, checkout and order admin workflows.
- Email-provider dashboard and Cloudflare logs.

### What to do
1. Test registration/verification, password reset, order confirmation, payment failure, refund, shipping/pickup ready and review-request messages.
2. Test Gmail, Outlook/Hotmail and at least one mobile mail app.
3. Confirm From/Reply-To, domain authentication, working links and plain-language content.
4. Confirm failed delivery is logged and a manual resend path exists.
5. Check spam placement and provider suppression/bounce lists.

### Pass condition
Every essential message arrives with correct order/customer information and failures are visible to an operator.

---

## 11. Complete every launch product in Product Release Preflight — **Launch blocker**

### Where to go
- `/admin/release-preflight/`
- `/admin/products/`
- `/admin/catalog-media/`

### What to do
1. Create a short, deliberate launch list rather than publishing every draft.
2. For each product, complete name, unique description, price, SKU/product number, category, inventory, weight/dimensions, shipping, tax, care/safety information and truthful availability.
3. Confirm one featured image and supporting gallery images.
4. Confirm alt text, image roles, rights/consent and quality checks.
5. Confirm Product structured data matches visible price and availability.
6. Resolve every required Product Release Preflight blocker.
7. Review the public page on desktop and mobile before publishing.

### Pass condition
Every product intended for opening day is green in release preflight and has been visually checked on the deployed storefront.

---

## 12. Finish media, image rights and seven-image galleries — **Launch blocker for products being sold**

### Where to go
- `/admin/catalog-media/`
- `IMAGES_REQUIRED.md`.

### What to do
1. Provide one featured image and up to six supporting images when useful: front/hero, alternate angle, detail, scale, lifestyle/use, packaging and process/story.
2. Use real product images; do not use placeholders on a published product.
3. Confirm each image has descriptive alt text, role, sort order and rights/consent state.
4. Verify WebP/AVIF/thumbnail derivatives or approved fallbacks load from R2.
5. Test weak mobile connections and broken-image fallback.
6. Confirm replacing one image does not overwrite unrelated source media.

### Pass condition
Published products show correct, fast, authorized images without blank cards or broken fallbacks.

---

## 13. Complete soap formula, label and physical print review — **Launch blocker for soap**

### Where to go
- `/admin/packaging/soap-labels/`
- `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`.
- Health Canada cosmetic-labelling and Cosmetic Notification resources.

### What to do
1. Create one structured soap-label project per formula/variant.
2. Enter the exact product identity in English and French.
3. Enter one structured ingredient row per ingredient using verified INCI plus English/French display wording where used.
4. Obtain fragrance-allergen information from the supplier for rinse-off thresholds that apply as of 2026.
5. Check every ingredient against the current Cosmetic Ingredient Hotlist and formula restrictions.
6. Review claims so cosmetic wording does not imply an unapproved therapeutic use.
7. Enter metric quantity, dealer identity, principal place of business, consumer contact, warnings/directions and bilingual content.
8. Select the required rose asset and review colour contrast.
9. Save a review version, export SVG, and print at **100% / Actual Size**.
10. Measure the 11-inch strip, 0.75-inch band, 2 × 1.5-inch front oval and selected rear-seal profile.
11. Physically wrap the real bar; verify folds, overlap, legibility and durability.
12. Upload/record proof evidence and mark the print test passed.
13. Approve the version only after formula, label and physical proof review.

### Important 50 mm conflict
The provided specification requires both a 1.50-inch (38.1 mm) artboard and a 50 mm rear circle. Those dimensions cannot physically fit together. Build 222 preserves two explicit profiles: **photo-fit** uses a 38.1 mm rear seal, while **50 mm rear seal** expands the artboard. Select the profile from physical evidence rather than hiding the conflict.

### Pass condition
Every soap sold has a verified formula, complete label data, approved review version and passed physical print/wrap test.

---

## 14. Complete Health Canada cosmetic notification and change control — **Legal/operating blocker for cosmetics**

### What to do
1. Determine which products are cosmetics; handmade cleansing soap sold by a home-based business can fall within the cosmetic regime.
2. Prepare the Cosmetic Notification Form information: brand/product, notifier/manufacturer, label contact, rinse-off/leave-on type, use/application, form, every ingredient and concentration/range.
3. Submit the CNF within the required period after first sale and retain confirmation evidence.
4. Update/resubmit when formulation, product name, business/contact data or sale status changes.
5. Record CNF/reference details in your controlled business records.
6. Remember that notification is not Health Canada approval and does not replace compliance review.

### Pass condition
A documented notification/change-control process exists and every cosmetic launch product is submitted within the required timeline.

---

## 15. Review customer-facing legal and operating policies — **Launch blocker**

### Where to go
- `/privacy/`, `/terms/`, shipping, returns/refunds, pickup, accessibility and data-deletion pages.

### What to do
1. Confirm business name, contact method, jurisdiction and effective dates.
2. Make shipping timelines, pickup conditions, custom-order terms, cancellation/refund rules and final-sale exceptions clear.
3. Confirm privacy language matches actual analytics, payment, email, customer-account and social integrations.
4. Confirm data-deletion instructions work.
5. Confirm policies are linked from footer and checkout.
6. Obtain qualified legal review when needed; the application cannot certify legal sufficiency.

### Pass condition
Customers can find and understand the policies before paying, and the business can follow the stated process.

---

## 16. Verify analytics, Search Console and Google Business Profile — **Strong launch requirement**

### Where to go
- Google Analytics 4 real-time view.
- Google Search Console.
- Google Business Profile.
- `/admin/analytics/` and local SEO tools available in the app.

### What to do
1. Confirm analytics fires once per page and does not expose sensitive customer/payment data.
2. Confirm ecommerce events contain correct product, value and currency information.
3. Verify the domain in Search Console and submit `sitemap.xml`.
4. Check robots and canonical URLs.
5. Keep the Business Profile complete and accurate: business category, hours, contact, service information, photos and review responses.
6. Use truthful Tillsonburg/Southern Ontario wording only where it describes the real business/service context.
7. Monitor indexing and errors after launch.

### Pass condition
Search and analytics systems can observe the public site accurately, with no duplicate events or blocked key pages.

---

## 17. Run SEO, accessibility, mobile and performance checks — **Launch blocker when critical issues remain**

### Where to go
- `/admin/deployment-preflight/`
- Browser Lighthouse/Accessibility tools.
- Real iPhone/Android/tablet/desktop devices where available.

### What to do
1. Confirm every exposed HTML page has exactly one H1.
2. Confirm unique title, meta description, canonical and descriptive main heading.
3. Confirm public internal links are crawlable and use descriptive wording.
4. Confirm Product structured data matches visible price/availability/shipping/returns.
5. Test keyboard navigation, focus visibility, form labels, validation messages, contrast and zoom.
6. Test mobile menu, cart, checkout, image gallery, product filters and admin quick actions.
7. Fix overflow, overlapping columns, off-screen buttons, light-on-light text and sticky elements that hide content.
8. Check Core Web Vitals/Lighthouse and correct large images or blocking resources.

### Pass condition
No critical accessibility, mobile checkout, broken layout, indexability or structured-data error remains on launch paths.

---

## 18. Prove backup restore, incident fallback and operator recovery — **Launch blocker**

### Where to go
- Cloudflare D1 backups/exports.
- R2 storage.
- Runtime incident/admin diagnostics pages.
- `POST_DEPLOY_SMOKE_TEST.md` and `LIVE_TESTING_GUIDE.md`.

### What to do
1. Restore a backup into a separate test D1 database.
2. Confirm products, orders, customers, inventory, packaging, lots and audit history can be read.
3. Confirm R2 source media and derivatives are recoverable.
4. Simulate an API failure and verify the user sees a useful fallback rather than raw errors.
5. Confirm runtime incidents include route, code, time and enough context to investigate without exposing secrets.
6. Document who can roll back the Pages deployment and database migration.

### Pass condition
A tested restore and rollback path exists, and failures produce actionable evidence without losing customer or inventory data.

---

## 19. Run a complete real-world fulfilment rehearsal — **Launch blocker**

### What to do
1. Place a real low-value order as a customer on mobile.
2. Pay using every enabled payment method.
3. Receive the order email.
4. Pick/produce the item, verify lot/material information, pack it with the approved label, and create shipping/pickup evidence.
5. Mark fulfilment complete and verify customer status.
6. Perform a cancellation/refund rehearsal on a separate test order.
7. Confirm accounting, tax, fees, inventory and margin data match the transaction.

### Pass condition
The team can complete the entire customer journey without editing the database manually or guessing which screen to use.

---

## 20. Use a controlled opening rather than an all-at-once launch — **Final gate**

### What to do
1. Open with a small set of fully ready products and conservative stock.
2. Keep scarce sets and one-of-a-kind products under close manual review until concurrent oversell tests are proven.
3. Check orders, webhooks, emails, inventory, errors and customer messages several times during the first days.
4. Keep unfinished products in Draft or Archived status.
5. Add products and channels gradually after the launch list remains stable.

### Pass condition
The public store is open only with products and workflows that have passed this guide, while unfinished development continues safely in the background.

---

# Not required to open the first controlled store, but still outstanding

These are important platform improvements but should not delay a small launch once the blockers above are proven:

- Automatic FIFO/FEFO lot selection with reviewed reversal.
- Realized margin trends across product families and techniques.
- Full accountant-approved month-end package.
- Social OAuth and automatic publishing after provider approval.
- Automated TikTok/YouTube publishing.
- Advanced loyalty, registry and wishlist marketing.
- Broader product recommendation and personalization systems.
- Automatic CMYK/prepress PDF generation with embedded/outlined fonts and printer marks.

# Authoritative official references reviewed for Build 222

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google title-link guidance: https://developers.google.com/search/docs/appearance/title-link
- Google merchant-listing structured data: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- Google Business Profile local ranking: https://support.google.com/business/answer/7091?hl=en-CA
- Health Canada cosmetic labelling: https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/labelling.html
- Health Canada industry labelling guide: https://www.canada.ca/en/health-canada/services/consumer-product-safety/reports-publications/industry-professionals/labelling-cosmetics.html
- Health Canada cosmetic notification: https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/notification-cosmetics.html
- Health Canada Cosmetic Ingredient Hotlist: https://www.canada.ca/en/health-canada/services/consumer-product-safety/cosmetics/cosmetic-ingredient-hotlist-prohibited-restricted-ingredients/hotlist.html
