# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## Devil n Dove Live Testing Guide — Build 193

Use this document after deploying Build 193. It explains the owner tests that cannot be completed from a local zip because they require Cloudflare bindings, real provider accounts, real devices, or real business data.

The same test cards are available inside:

```text
/admin/command-center/
```

## Safety before testing

1. Use a **draft/test product**, not a customer order, when testing mobile uploads or marketplace export gates.
2. Use only an **owner-controlled email inbox** for email tests.
3. Use non-sensitive images for R2 tests.
4. Never paste API keys, Stripe secrets, Cloudflare tokens, or customer personal data into result notes.
5. Save a screenshot or stable internal evidence URL for every failed or passed live check.
6. Keep customer automation disabled unless you deliberately finish its permission/cooldown workflow.

## A. First-time Cloudflare checks

### 1. Confirm API routing and login

1. Open the deployed URL:
   ```text
   https://devilndove-site.pages.dev/api/auth/login
   ```
2. Expected: JSON response, not the homepage and not HTTP 405.
3. If it fails, confirm root `_routes.json` includes `/api/*`, then redeploy.
4. Save the response/status as test evidence.

### 2. Confirm D1 and R2 bindings

1. In Cloudflare go to:
   ```text
   Workers & Pages → devilndove-site → Settings → Bindings
   ```
2. Confirm D1 binding name is exactly:
   ```text
   DB
   ```
3. Confirm R2 binding name is exactly:
   ```text
   PRODUCT_MEDIA_BUCKET
   ```
4. Do not add these as encrypted variables; they must remain bindings.
5. Open `/admin/command-center/` and check the environment-presence cards.

## B. Entering real fees and costs

### 3. Add one reviewed payment/channel fee

1. Open the provider account that supplies the fee, such as Stripe or Etsy.
2. Find the actual fee rate and fixed fee that apply to your account/currency.
3. In `/admin/command-center/`, open the fee/cost controls.
4. Enter one channel fee only.
5. Use a short source note such as:
   ```text
   Stripe Canada account pricing checked June 2026
   ```
6. Save and record the effective date.
7. Refresh Product Readiness.
8. Confirm the fee row changes from “needs review” to “configured.”

### 4. Add one product-family cost default

1. Pick a familiar product family, such as resin jewellery, candles, or engraved gifts.
2. Enter realistic average values for:
   - materials
   - labour
   - packaging
   - overhead
   - waste
3. Do not guess at a final price yet.
4. Save the cost row and open a related product.
5. Confirm margin status updates.
6. For unusual/custom one-off products, later add product-specific cost overrides.

### 5. Test a marketplace margin block

1. Use a draft test product with incomplete cost data or an intentionally low price.
2. Go to `/admin/marketplace-exports/`.
3. Attempt to download the export.
4. Expected: export is blocked with a clear margin/cost reason.
5. Do not bypass a real problem with an override.
6. If testing an override, set a short expiry and write a factual reason.
7. Confirm the override is logged.

## C. Mobile product draft and image tests

### 6. Test D1 mobile draft recovery

1. On a phone or narrow browser, open:
   ```text
   /admin/mobile-product/
   ```
2. Enter:
   - product name
   - temporary reference
   - short description
3. Choose **Save partial draft**.
4. Reload the page.
5. Choose the saved draft from the draft list.
6. Confirm the fields reappear and missing approval fields are listed.
7. Record any lost field, overlap, or unreadable control in the Live Readiness Playbook.

### 7. Test resumable mobile image upload

1. Save a **text-only** product draft first.
2. Reopen that saved draft in `/admin/mobile-product/`.
3. In the Photos field, choose one non-sensitive image under 50 MB.
4. In **Safer large-photo upload**, choose **Start or resume selected images**.
5. Wait until at least one part is visible in the upload status.
6. For a true interruption test, briefly disable Wi-Fi/mobile data.
7. Re-enable connectivity.
8. Re-select the **same file** in the Photos field; browsers do not permit restoring file bytes after reload.
9. Choose **Start or resume selected images** again.
10. Expected:
    - prior completed parts are skipped
    - the upload completes
    - the product draft receives one image
    - the first image becomes featured only if no featured image existed
11. Refresh the draft list and confirm no duplicate image rows.
12. Delete test media if it should not remain in the catalog.

## D. Visual proof and SEO tests

### 8. Replace one visual placeholder

1. Open `/admin/visual-enrichment-studio/`.
2. Select a visible placeholder from the approved media replacement plan.
3. Use an owned workshop/product photograph or a customer image with explicit public-use consent.
4. Compress the image, then write a precise alt text description.
5. Check the image on both phone and desktop.
6. Confirm it appears near relevant product/process copy.
7. Confirm page H1 remains unchanged.
8. Publish only after consent, compression, alt text, and visual review are marked complete.

### 9. Import a Search Console CSV

1. Open Google Search Console.
2. Go to Performance / Search results.
3. Choose a useful date range.
4. Export pages and queries as CSV.
5. Open `/admin/local-seo-review/`.
6. Use the import preview.
7. Confirm headers, date range, and sample rows before save.
8. Create one factual action, for example improving a page title/description where impressions exist but clicks are weak.
9. Do not use imported data to promise a ranking position.

### 10. Record monthly Google Business Profile evidence

1. Open the Business Profile.
2. Check:
   - business name
   - primary category
   - hours
   - service area
   - phone
   - website
   - photos
   - reviews/replies
   - useful current posts
3. In Command Center, add a GBP evidence row with the month and what was actually checked.
4. Add screenshot/link evidence where possible.
5. Create a follow-up task for factual corrections only.

## E. Payment, email, R2, and performance tests

### 11. Stripe webhook signature test

1. In Stripe Dashboard, open:
   ```text
   Developers → Webhooks
   ```
2. Confirm the app endpoint and `STRIPE_WEBHOOK_SECRET` exist in Cloudflare encrypted variables.
3. Use Stripe’s own **Send test event** control.
4. Open `/admin/webhook-events/`.
5. Confirm the event ID is verified/logged.
6. Send the same test event only if Stripe allows it and confirm no duplicate effect occurs.
7. Record only status/event reference—not a secret.

### 12. Email provider owner-only test

1. Keep customer automation disabled.
2. Confirm `EMAIL_PROVIDER` and the matching encrypted API key are present in Cloudflare.
3. Send a test to an inbox controlled by you.
4. Check sender address, subject, content, delivery, and spam/junk folder.
5. Record delivery evidence in the Command Center.
6. Do not test gift card/review reminders on customers.

### 13. R2 signed read and delete test

1. Use the R2/private evidence health area.
2. Upload a tiny non-sensitive test object.
3. Open the signed URL while authorized.
4. Wait until its expected expiry, if configured, and confirm it no longer works.
5. Delete the test object.
6. Confirm it is not retrievable.
7. Save the result in the playbook.

### 14. Lighthouse/PageSpeed and real devices

1. Run PageSpeed Insights or Lighthouse for:
   - homepage
   - shop
   - gallery
   - one local landing page
2. Run both mobile and desktop.
3. Record score, date, and the few warnings that matter most.
4. Check a narrow phone, large phone, tablet, laptop, and large desktop.
5. Test:
   - navigation
   - product images
   - cart
   - login
   - mobile product capture
   - one scrollable admin table
6. Confirm no horizontal clipping, overlap, tiny targets, or unreadable text.
7. Save screenshots/notes for defects.

## F. Before retiring older admin pages

1. Use Command Center in normal work for several weeks.
2. Check the usage rows inside the Build 193 panel.
3. List any workflow still requiring an older detailed page.
4. Keep detailed pages until their essential actions are accessible elsewhere.
5. Archive, redirect, or hide a route only after a written decision and no unresolved dependency.

## Reference sources

- Google Search SEO Starter Guide
- Google Image SEO Best Practices
- Google Business Profile local ranking guidance
- Google Search Console export guidance
- Etsy Seller Handbook listing photography and title guidance

See `LOCAL_SEO_PLAYBOOK.md` and `COMPETITIVE.md` for project-specific notes.

## Build 194 alignment

This is a supporting reference. Start with `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` for current decisions; preserve this document for specialist history and handoff detail.


## Build 194 testing reference

Use `docs/archive/build-history/BUILD194_TESTING_GUIDE.md` after deployment for the homepage, shop quick filters, product listing facts, media-role scoring, workshop journal, visual placeholders, and SEO/H1 verification.
