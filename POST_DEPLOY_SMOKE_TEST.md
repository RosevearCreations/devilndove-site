# Build 254 current smoke-test note

After Build 254 migration/deploy, first verify: authenticated Startup Readiness GET returns compact JSON rather than a webpage; browser-only readiness changes synchronize in one batch; the complete 46-gate guide remains visible from the browser asset; Post-Deploy Smoke Tests GET returns structured JSON and no request-time DDL is attempted; Quick Run remains limited to same-origin URLs; and handled D1/runtime failures return structured diagnostic JSON. Then retain the Build 250–253 product media, per-use/batch, kit/component, inventory runtime and linked-item regression checks. Retain Cloudflare Ray IDs and Pages Function logs for any residual 5xx/1102.

## Retained Build 245 auth/media-resilience smoke note

Retain the established auth/media-resilience assertions when testing the current Build 254 package. In addition to the retained smoke suite, refresh protected admin pages and verify temporary auth 5xx produces a degraded/session-retained state rather than a false login screen; reopen known products with multiple supporting images; test the Product Readiness blocker link; and inspect any residual 503/1102 by Cloudflare Ray ID. The Startup cockpit currently carries 46 gates.

## Post-Deploy Smoke Test — retained Build 241 foundation

Use the complete stage procedure in `PRELAUNCH_PROCESS_PLAYBOOKS.md`. After deploying the exact package:

1. Confirm domain, HTTPS, canonical routes, service-worker shell v23 and no stale asset failures.
2. Run public page checks: exactly one H1, unique title/description/canonical, crawlable descriptive links, useful nearby images/alt text and no phone/desktop overflow.
3. Sign in and verify all **46** Startup gates with All statuses, including `operational_continuity_evidence_center` and `caip_private_large_media_intake`.
4. Open `/admin/operational-continuity/`; confirm twenty-one D1 workstreams, evidence case/event creation, safe error fallback and no request-time schema creation.
5. Test one idempotency claim twice; the second attempt must not create a duplicate sensitive result.
6. Test representative packaging reservation, formula link, release lock and prepress result without treating them as physical print proof.
7. Test provider-result, notification-attempt and mobile-draft records with sanitized evidence only.
8. Re-run bounded login, product autosave/recovery, archived-product removal protection, payment/refund/exact-once inventory, email and restore procedures.
9. Confirm `/admin/image-manifest/`, product media roles and deployed asset checks remain honest; representative fallbacks are not item-specific proof.
10. Record deployment ID, route, device/browser, expected/actual result and non-secret evidence. Any failure pauses promotion and requires correction plus retest or rollback.

---


# Build 206 — Catalog/Media/CAIP smoke test

1. Sign in as admin. On `/admin/catalog/`, search a known Product ID and test Draft, Revision / needs changes, Approved, and Archived filters plus each sort option.
2. Load a product with a populated `media_assets.public_url` and an empty `products.featured_image_url`. Confirm the Featured image URL field is filled, source-labelled, and previewed. Save, reload, and confirm it persists.
3. Open `/admin/catalog-media/?product_id=34#product-media-workflow` (replace `34` with a real record). Confirm the top reference card matches the product and downstream panels show the same Product ID.
4. Confirm HST/tax class displays as `13%` in product dropdowns, taxonomy manager, and table rows.
5. Use the CAIP link. Confirm `/admin/creative-assets/?product_id=<id>` opens an already-linked project if one exists; otherwise it clearly reports no linked project and does not auto-create one.
6. Do not treat these tests as login proof. Run the separate sanitized login response/log process in `AUTH_LOGIN_500_TROUBLESHOOTING.md`.

---

# Post-Deploy Smoke Test — Build 201

Run after `database_build201_creative_asset_intelligence_platform.sql` and the complete Pages deployment. Test on the deployed domain while signed in as an administrator. Record date, user, browser/device width, product/content-project/creative-project IDs, public URLs, and Cloudflare request/error IDs.

## 1. Migration and safe start

1. Confirm `schema_migration_ledger` contains `build_199_content_automation_studio`, `build_200_content_publication_release_board`, and `build_201_creative_asset_intelligence_platform`.
2. Confirm `/admin/content-studio/`, `/admin/creative-assets/`, and `/admin/content-publications/` load as authenticated admin pages and their APIs return JSON rather than 503.
3. Confirm admin pages are `noindex,nofollow`, public pages retain one visible H1, and Service Worker version is refreshed after deploying.
4. Confirm the CAIP list loads safely with no projects; it should show an empty state, not a hard failure.

## 2. Source-media integrity and automatic handoff

1. Use a disposable approved product with at least three images and, when available, one video. Record all `product_images`, `media_assets`, URLs, sort order, and Featured Image URL before testing.
2. Approve the product through one of the supported paths: review screen, create already approved, or editor status transition.
3. Confirm one Content Studio package exists and one CAIP creative project appears for it. Confirm repeating the approval/refresh does not create a second CAIP project.
4. In Content Studio, mark a safe test item selected and `Public allowed`; change lead selection, then save/refresh. Confirm CAIP reflects the source state and original product/media rows remain unchanged.
5. In CAIP, perform **Sync / refresh CAIP**. Confirm source URL, source ID, sort/role, and original image/video count remain intact.
6. Check Cloudflare logs. A deliberate CAIP sync failure must record a warning but must not roll back product approval or remove the already-created Content Studio package.

## 3. CAIP rights, evidence, story, and manifest

1. Load the CAIP project at `/admin/creative-assets/`.
2. Confirm every asset card identifies source/reference state and does not show a file-delete/move/replace action.
3. On an upstream non-public or needs-review source, try setting CAIP rights to public. Confirm it is rejected or reduced to a non-public review state. Confirm a blocked source remains blocked.
4. Review score rationale: confirm it is labelled as metadata/deterministic/review aid and not as an AI or legal/quality guarantee.
5. Add internal tags/note and set a restrictive status on one disposable asset. Save and reload; confirm the product image/video source still remains unchanged.
6. Edit one evidence record and one story segment. Lock the story text, sync CAIP again, and confirm locked wording remains intact.
7. Confirm recommendation candidates have a destination and intended role, but do not appear publicly or automatically enter a queue.
8. Download the CAIP manifest. Confirm it contains references and governance/evidence data only; it must not claim a finished render, published URL, automatic consent, or copied source object.
9. Use **Approve internal CAIP** only after review. Confirm this does not publish a Product, Workshop Journal story, Gallery item, social post, or platform upload.

## 4. Existing Build 197–200 protections

1. Edit an existing inventory item and confirm the original inventory ID updates instead of a duplicate record.
2. Confirm a blank product Featured Image URL repairs from the first retained image without removing photos/videos.
3. Confirm Shop cards remain image-first and the mobile menu is a compact accordion/popup—not a long visible page list.
4. Confirm a Content Studio social deliverable cannot enter the Social Queue until it is Approved and contains a real finished output URL.
5. Prepare/publish/unpublish a disposable Content Release Board record. Confirm product/source media remain unchanged.

## 5. Mobile and SEO checks

At about 360 px, 768 px, 1024 px, and desktop, test `/admin/creative-assets/`, Content Studio, Content Release Board, Shop, Gallery, and Workshop Journal. Verify actions remain visible/reachable, no horizontal trap/overlap appears, form labels remain associated, status signals remain readable, and visual placeholders stay neutral.

## 6. Live-only evidence still required

Local tests cannot prove Cloudflare D1/R2 bindings, remote public media resolution, signed R2 access, object retention, actual rendering, OAuth publishing, Google Business Profile acceptance, Search Console indexing, Merchant Center eligibility, Stripe/email/webhook flows, assistive technology, or device performance. Keep these as separate live evidence tasks.

## Build 202 — CAIP media operations and secure review

1. Confirm Builds 199–202 appear once each in `schema_migration_ledger`.
2. Sign in as admin and open `/admin/creative-assets/`. Confirm projects load and mobile/desktop panels do not overflow.
3. Select one CAIP asset already linked to an R2 upload. Click **Run safe probe**. Confirm the technical observation records a status and no product image/media rows, gallery order, or R2 source key changes.
4. Test an asset without an R2 object key. Confirm it reports `metadata only`/warning instead of a 500 error or external URL fetch.
5. Create every derivative plan type. Confirm output URL/object/checksum are blank and each record says planned/not created.
6. Approve one derivative plan. Confirm it becomes internal approved only; no provider job, output, social post, or public release appears.
7. Create a secure review link for a bound R2 asset. Confirm it opens while signed in as the issuing admin, streams the original file, and has no-store/same-origin/no-referrer headers.
8. Use another admin account or signed-out browser if available. Confirm the same link is denied.
9. Revoke the grant and confirm the link fails immediately. Create a new grant with a short expiry and confirm expiry denial after the time passes.
10. Confirm `GET /api/admin/creative-assets` never returns a raw token/token hash, and the downloaded manifest contains only sanitized grant metadata.
11. Recheck `/admin/content-studio/`, `/admin/content-publications/`, `/gallery/`, and `/workshop-journal/`; confirm no source media disappeared and existing releases stay unchanged.

## Build 221 smoke tests
- Open `/admin/products/`, confirm the Draft & Archive Cleanup Centre loads both draft and archived candidates, and run preflight on a disposable test row.
- Confirm a product with protected history is Archive-only and an unused row can reach typed/password confirmation.
- Open `/admin/packaging-studio/`, create a scalloped soap-ribbon project, apply the reference example, save, save a review version, and test SVG/PNG/JPG/Print-PDF preparation.
- Confirm the preview reports a 279.4 mm × 50 mm canvas and the medallion is not clipped.
- Open Tools & Supplies → Lots, save a lot, record reconciliation without changing on-hand, then use a disposable item to test the typed `APPLY LOT TOTAL` path.


## Build 222 smoke test — Soap Label Studio and Startup Readiness

1. Open `/admin/` and confirm **Startup Readiness Guide** and **Soap Label Studio** cards are visible.
2. Open `/admin/startup-readiness/`; confirm all 46 gates render and direct links work.
3. Open `/admin/packaging/soap-labels/`; confirm the approved Glacial Purple reference loads without a broken image.
4. Create a disposable soap-label project using the photo-fit profile.
5. Add, reorder and remove English/French ingredient and claim rows; save and reload from D1.
6. Confirm the preview shows the continuous English → front oval → French → rear seal → claims/weight order.
7. Switch between the photo-fit and 50 mm profiles and confirm the dimension warning changes.
8. Save a review version and prepare SVG and WebP exports; confirm export/checksum history appears.
9. Attempt approval without a passed print test; approval must be refused.
10. Record a failed test, then a passed 100%-scale test with all physical checks passed; approve the version.
11. Temporarily interrupt the API and confirm a browser-local recovery draft is offered without claiming a D1 save succeeded.
12. Review runtime incidents and admin audit evidence for deliberate failures and successful approval.
# Build 227 focused smoke tests — historical

1. Open `/admin/startup-readiness/`; confirm All statuses is selected, all 46 gates render, and each gate expands to Before you begin, Test steps, Correction, Evidence, Retest and Pass condition.
2. Set a temporary search/filter that returns no rows, select Show all gates, and confirm the complete list returns.
3. Open `/admin/packaging-studio/`; create an owner-controlled non-soap project, select a general template, save, reload, and confirm the generic SVG preview remains.
4. Open Components & Cost; link an inventory item, confirm name/SKU/cost/supplier suggestions, save, reload, and verify component count and estimated per-unit cost.
5. Open `/admin/packaging/soap-labels/` and confirm it clearly points to the unified system without loading a second editor.
6. Open `/admin/customer-documents/`; select an owner-controlled order and issue/preview an invoice and packing slip.
7. Select an existing recorded test refund before issuing a credit note/refund confirmation. Confirm sequential number, business/recipient identity, original order date, reason, refund amount and tax adjustment.
8. Formally void a disposable test document with a reason. Confirm Preview / print shows VOID and the original source snapshot remains.
9. Open `/admin/social-publishing/`; select Test Facebook + Instagram. Confirm no secret is displayed and no post is created. Record Page/account ID-match and optional token validity/scope/expiry evidence.
10. Open Operations > Release Sanity and confirm Build 227 packaging BOM, client-document and Meta credential-presence checks render.
