# Release 467 Build 507 — Owner Etsy Draft Acceptance and Read-Only Gateway Trial

Date: 2026-10-27. **Product #53:** `Adventurine Argon`, SKU `DND-01130`, slug `adventurine-argon`. **Existing Etsy draft:** `4603838854`. The owner screenshot after Build 506 still reported `etsy_506_persistence_readback_hold` and `0/3` confirmed photos. Those are real-world **HOLDs**, not production deployment failures.

## Fixed and added

1. A D1 `first-primary` lookup now checks **one deterministic set of exact listing-ID claims**, instead of comparing two independently ordered `latest` rows. Exactly one row belonging to this Product can prove its saved receipt. Two rows, a foreign Product claim, or no row always **HOLD**. A bounded claim count/state is visible, but there is no opportunistic reassignment, deletion or new Etsy listing.
2. The read-only Product link endpoint can recover a **unique verified primary-backed candidate** when the legacy Product-key lookup is stale, while never accepting a candidate belonging to another Product. Link attempts automatically perform one read-only saved-state recheck after an uncertain local write. Actual remote verification, Canada-only shipping, exact draft status and explicit owner consent remain mandatory on POST.
3. New authenticated `GET /api/admin/product-etsy-owner-trial-507?product_id=53&listing_id=4603838854` compares the saved SKU/slug, exact local receipt state, real Etsy unpublished/Canada-only draft, title/category, Product description, CAD price/quantity, effective channel tags, approved originals #344–346, Etsy images and verified photo receipts. A failed provider GET is reported as a specific HOLD; it cannot become owner sign-off.
4. The Product Editor has an explicit **Compare existing Etsy draft, metadata and 3 photos (read only)** button. No automatic creation, relink, photo upload, publication, tag rewriting or owner consent.
5. Integration Contract `rosevear.integration.v1`: positive/negative synthetic independent server HMAC GET tests prove health/capabilities with separate nonces, durable duplicate nonce rejection, no product reference, events or commands. They do **not** represent a live AI Data Platform connection. Real production handshake still needs owner-provisioned per-environment server-only key ID/secret and independent gateway approval, following Build 506's documented canonical signature.

## Owner acceptance steps after Production GREEN

1. Open Product #53 → Etsy; **keep existing Etsy draft #4603838854**. Use **Recheck saved details**. The link is trusted only if the server confirms a single D1 primary receipt for Product #53.
2. If the claim is `multiple_local_claims`, `another_product` or `unclaimed`, stop. Do not use the Create option; record the displayed diagnosis for separate reconciliation.
3. In **Description**, enter the actual item's known materials, size, process and details. In **Storefront / SEO**, confirm whether “Soap bars” truthfully describes it; choose or edit the channel-specific Etsy tags based on facts. Save once, recheck; do not guess product details.
4. Press **Compare existing Etsy draft, metadata and 3 photos (read only)**. Inspect actual title, category, description, CAD price, quantity, Canada-only shipping and image counts. `0/3` is not accepted.
5. Use the existing **Compare existing Etsy photos** tool to view each approved original (#344, #345, #346) beside its Etsy image. Only record an exact match when actually witnessed. Unmatched photos require separate consent-safe handling, not a fake receipt.
6. **Final owner check** remains a separate action after all real Etsy readbacks succeed. Nothing in this build approves content or publishes Etsy.

## Safety and evidence

- No D1 migration or new database. The existing audit/receipt storage is retained.
- `scripts/release467_build507_etsy_metadata_photo_gateway_trial.test.mjs` covers stale-key recovery, foreign/duplicate claim HOLDs, metadata HOLDs, admin gating, GET-only provider operations, two separately signed read-only gateway calls, and nonce replay rejection.
- Also run Build 500–506 regressions and the canonical application quality gate before promotion; independently verify `dev`, `main`, Cloudflare Pages, the live editor asset version and post-deploy integrity.
- Neither the synthetic Etsy test data nor the gateway key samples are live production proofs.

**Next expected Build 508 — Product #53 Owner-Witnessed Etsy Final Acceptance, Verified Media Receipt Closeout & Gateway Credential Provisioning Review.**
