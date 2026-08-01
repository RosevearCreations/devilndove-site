# Devil n Dove AI Handoff — Build 227

This is one of two canonical handoff files. Read this first for architecture, data authority, routes, safety boundaries and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for completed work, current risks and the next 20 steps. Specialist operating specifications remain in `STARTUP_GO_LIVE_GUIDE.md` and `PACKAGING_STUDIO.md`; they are not competing roadmaps.

## Build 227 outcome

Build 227 moves the application from broad feature accumulation toward controlled business operations.

1. **Startup Readiness:** all 37 gates now return preparation, numbered test, gate-specific failure correction, evidence, retest/reopening and pass instructions. The initial filter is All statuses, preventing completed D1 rows from producing a confusing “No readiness items match these filters” screen. The Cloudflare Pages Function newline failure remains corrected.
2. **Labeling & Packaging:** `/admin/packaging-studio/` is the single application authority for soap ribbons, general product labels, candle labels, jewelry cards and package inserts. `/admin/packaging/soap-labels/` is a compatibility route only.
3. **Packaging inventory/cost:** each project can store a packaging bill of materials with inventory link, component type, quantity per finished unit, waste percentage, unit cost, lot-tracking flag, supplier and notes. Saving a BOM does not consume inventory.
4. **Client documents:** `/admin/customer-documents/` issues sequential immutable invoices, receipts, packing slips, credit notes and refund confirmations from order/refund snapshots. Voiding preserves the source snapshot and requires a reason.
5. **Meta tests:** Social Publishing can run read-only Facebook Page and Instagram professional-account identity tests. Optional app credentials add Page-token validity, app-ID, expiry/data-access-expiry and scope evidence. No test publishes content or returns a secret.
6. **SEO/visual/mobile:** public SEO rules remain unchanged; Build 227 adds only admin noindex routes and descriptive admin planning placeholders. New layouts include mobile stacking, table overflow and touch-target protections.

## Current authorities

- Startup status: D1 `startup_readiness_items` and `startup_readiness_history`, operated at `/admin/startup-readiness/`.
- Startup instructions: the API `STARTUP_ITEMS` array; `scripts/generate-startup-guide.mjs` regenerates `STARTUP_GO_LIVE_GUIDE.md` from it.
- Product/order/payment/refund facts: existing `products`, `orders`, `order_items`, `payments`, `payment_refunds`, inventory movement/reservation and accounting records.
- Client documents: immutable `customer_documents.source_snapshot_json`; order changes do not rewrite an issued document.
- Packaging: `packaging_projects`, structured soap rows when applicable, `packaging_components`, versions, exports and print tests.
- Packaging specification: `PACKAGING_STUDIO.md`.
- Current plan: `PROJECT_STATUS_AND_ROADMAP.md`.

## Important routes

- `/admin/startup-readiness/` — all 37 launch gates and D1 evidence.
- `/admin/packaging-studio/` — unified labeling, packaging BOM/cost, previews, versions, exports and print tests.
- `/admin/customer-documents/` — invoices, receipts, packing slips, credit notes and refund confirmations.
- `/admin/social-publishing/` — product drafts, privacy review, provider setup and Meta read-only tests.
- `/admin/orders/` — order/payment/refund operations.
- `/admin/accounting/` — journal, reconciliation, statements, tax review and accountant exports.
- `/admin/inventory-operations/` — physical count, lots, stock units and reviewed movements.
- `/admin/release-preflight/`, `/admin/deployment-preflight/`, `/admin/post-deploy-smoke-tests/` — product, deploy and live checks.

## Build 227 database change

Back up D1, then apply **one** of these identical files:

- `database_build227_unified_business_operations.sql`
- `database_upgrade_current_pass.sql`

The migration assumes the Build 225 readiness/packaging baseline is already installed. It adds:

- `packaging_components`
- `customer_document_sequences`
- `customer_documents`
- four general packaging templates
- migration-ledger key `build227_unified_business_operations`

Runtime endpoints defensively create their Build 227 tables, but migration evidence is still required before launch.

## Required/optional production variables added to the operating checklist

- Business documents: `BUSINESS_LEGAL_NAME`, `BUSINESS_ADDRESS_LINE1`, `BUSINESS_ADDRESS_LINE2`, `BUSINESS_CITY`, `BUSINESS_PROVINCE`, `BUSINESS_POSTAL_CODE`, `BUSINESS_COUNTRY`, `BUSINESS_EMAIL`, `BUSINESS_PHONE`, `BUSINESS_WEBSITE`, and the accountant/owner-verified `BUSINESS_GST_HST_NUMBER`.
- Meta Page/Instagram: `FACEBOOK_PAGE_ID` or `META_PAGE_ID`; `FACEBOOK_PAGE_ACCESS_TOKEN` or `META_PAGE_ACCESS_TOKEN`; `INSTAGRAM_USER_ID`, `IG_USER_ID`, or `INSTAGRAM_BUSINESS_ACCOUNT_ID`; optional `INSTAGRAM_ACCESS_TOKEN`.
- Optional Meta token debug: `META_APP_ID`, `META_APP_SECRET`; optional reviewed `META_GRAPH_API_VERSION` (fallback `v26.0` in this build).

Never place secret values in Markdown, D1 evidence, screenshots, browser code or Git.

## Safety and accounting boundaries

- A recorded refund is the source for credit-note/refund-confirmation issue. The UI does not initiate a provider refund.
- Confirm credit-note fields, tax adjustment and the business registration number with the owner/accountant. Issuance is operational support, not professional accounting advice.
- Issued documents are immutable snapshots. A correction requires a new document and formal void of the wrong one; do not overwrite history.
- Packaging BOM cost is an estimate. Purchase-lot evidence and physical count remain the source for actual inventory cost.
- General packaging previews are working layouts, not printer-approved dielines. Soap approval still requires formula/INCI/bilingual review, saved version and passed measured 100%-scale physical print proof.
- Social publishing remains human-reviewed. A successful credential test is not app review, permission approval or publish evidence.

## SEO and visual rules that remain mandatory

- One H1 per exposed HTML page; distinctive title and useful meta description.
- Canonical URLs and structured data must match visible public facts.
- Product structured data and Open Graph images must use approved real product media, not planning placeholders.
- Descriptive filenames, contextual alt text and relevant representative product images; no keyword stuffing or generic image substitution.
- No guaranteed local ranking claims. Keep business facts, reviews, photos, links and local service wording accurate.
- Admin pages remain `noindex,nofollow`.
- Preserve mobile/desktop layouts, keyboard focus, touch targets, table overflow, low-bandwidth fallbacks and honest unsynced/degraded labels.

## Deploy and verify

1. Back up D1.
2. Apply one Build 227 migration file and confirm its ledger/table/template results.
3. Deploy the complete Build 227 package.
4. Run Deployment Preflight and Post-deploy Smoke Tests.
5. Open Startup Readiness with All statuses and confirm all 37 gates load.
6. Create an owner-controlled packaging project, save one BOM row, reload and confirm its calculated unit cost.
7. Issue/print an owner-controlled invoice and packing slip; link a recorded test refund before issuing a credit note/refund confirmation; formally void only a deliberately disposable test document.
8. In Social Publishing, run the read-only Meta test and record only IDs/status/scopes/expiry evidence, never secrets.
9. Follow `BUILD227_VALIDATION.md` and then work the production-only gates in `PROJECT_STATUS_AND_ROADMAP.md`.

## What is deliberately not claimed complete

Code can prepare and observe the workflows, but it cannot supply production credentials, approve regulations, perform physical counts/print tests, confirm tax advice, create real customer evidence, or prove live provider behavior from an offline archive. Those remain explicit Startup Readiness gates.
