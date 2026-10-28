# Build 508 — Product #53 owner-witnessed Etsy final closeout and gateway credential review

## Scope and authority

- Keep Product #53 (`DND-01130`, `adventurine-argon`) and the **existing unpublished** Etsy draft **#4603838854**. Never create a replacement to resolve an uncertain local receipt, claim or remote photo mismatch.
- Separate technical verification from genuine owner decisions. This software build does **not** claim the owner actually reviewed Etsy, approved the description/category/shipping, or matched the three original photos; only the signed-in owner can do that.
- Do not auto-publish Etsy, upload/re-upload photos, post to Facebook Marketplace, enable cross-business Product sharing or provision secrets in the browser.

## Etsy Build 508 final acceptance

1. Save factual Product description, materials, dimensions, item details and appropriate Etsy search tags. Recheck the existing listing ID, local D1 claim and the actual unpublished Etsy draft. Do not claim the old name-only description or “Soap bars” tag is correct without owner evidence.
2. Match the canonical original Product photographs **#344, #345 and #346** to the actual Etsy images, using independently confirmed existing image receipts. A local gallery count or upload attempt alone does not prove remote acceptance.
3. Complete the separate Build 504 **Final owner check** only after inspecting the actual Etsy draft, Canadian delivery, photos, quantity, title/description, tags and CAD price. A fresh owner-signoff audit receipt now stores a digest of all those details and photo receipts; a legacy sign-off without the digest will not satisfy the stricter Build 508 closeout.
4. Click **Read final Etsy and original-photo evidence (no changes)** in Build 508. The endpoint reads the live draft and original-photo receipts afresh, matches the prior owner approval to this listing and three original IDs, and returns an evidence SHA-256 fingerprint. No provider write is made.
5. Only when the result says **READY FOR OWNER REVIEW**, individually confirm the exact draft, every original photograph, actual metadata and unpublished Canada-only delivery. Click **Record separately witnessed final closeout**. The server re-fetches and compares the exact fingerprint and pre-existing owner receipt, then records one idempotent local audit `etsy_508_verified_owner_closeout`. If anything differs, it returns **HOLD** and makes no provider change.

Both Build 508 routes are verified-Admin only; the POST additionally requires same-origin, a fresh UUID, exact listing number, four explicit confirmations and an independent saved Build 504 sign-off. A local closeout proves only the recorded evidence and owner's explicit in-app acknowledgement at that moment; it cannot by itself establish that Etsy has approved or published the listing.

## Read-only gateway credential provisioning review

- Admin-only GET `/api/admin/integration-gateway-readiness-508` reports **DISCONNECTED**, **CONFIGURED**, **TESTING** or **REVOKED**. It does not issue, return or rotate credentials.
- Configure `ROSEVEAR_INTEGRATION_KEY_ID_V1`, `ROSEVEAR_INTEGRATION_HMAC_SECRET_V1` (unique random server-only secret, at least 32 characters) and `ROSEVEAR_INTEGRATION_ENVIRONMENT_V1` through secure environment binding management. If revoked, do not reuse the key; rotate through a separately authorized secret-management workflow.
- Signed and replay-protected **GET** `/api/integration/v1/health` and `/api/integration/v1/capabilities` are the only v1 capabilities currently accepted from `ai-data-platform` for `devilndove`. The Build 508 review reads existing accepted nonces for both paths and current matching key/environment. **TESTING is never CONNECTED**, even when both handshake receipts exist.
- Customer/product data, events, commands, or live cross-business dispatch remain disabled. A separate owner security approval and independent multi-system verification are required before any future authority expansion.

## Validation and release evidence

Run `node scripts/release467_build508_etsy_owner_closeout_gateway_credentials.test.mjs`, all relevant Build 500–507 regression tests and the repository quality workflow. Merge only after `dev` checks are GREEN, then confirm protected `main` checks, successful Cloudflare Pages publication and the live editor showing `v=508`. Those software checks do not replace a real owner Etsy acceptance or production gateway credential handoff.

**Next expected Build 509 — Product #53 Independent Final Owner Trial Exception Resolution, Original-Photo Evidence Freshness & Gateway Security Approval Handoff.**
