# Devil n Dove — Build 530 three-soap owner acceptance

30 October 2026 · Product Editor · `RosevearCreations/devilndove-site`

## Owner-facing single-screen flow

Use the expanded **Verify saved Etsy drafts, photos and tags** panel and enter the **exact saved Product IDs** for up to three failed soap saves. One explicit button performs read-only Product/Etsy GETs. For each Product the screen reports:

1. Saved Product name, SKU, slug, uniquely linked Etsy ID and stored verified OAuth shop.
2. Current D1 fields compared with a matching recent browser *uncertain Save* snapshot if one exists. Equality proves current values only; it is **not an old POST completion receipt**. If the browser snapshot is missing, the old Save outcome stays unknown. If different, use existing Build 521 Product Save recovery before approval.
3. Live unpublished Canada-only Etsy listing, category, title, description, CAD price, quantity, exact native tag comparison (conservative up-to-13, max-20-character Etsy rules) and original-to-Etsy photo IDs from current readback.
4. Existing owner audit receipt validity tied to the exact evidence fingerprint (stale receipts are not reused).

An individual Product shows **HOLD** on any mismatch. On a complete match, a separate unchecked, Product-specific owner confirmation permits **only the existing local approval audit**. The server performs its complete Etsy readback again and refuses a stale or mismatched listing. The same evidence fingerprint is idempotent; the previously recorded receipt is returned instead of duplicating it. No Product Save, draft create/update, photo upload, Etsy publication or automatic retry occurs.

The owner has not yet given the three newly failed soap Product IDs. Existing Product #53 (`4603838854`, original photos #344–346) is a *separate known case* and must retain its extra independent source-photo freshness gate; Product #54 has a separate Etsy history. Do not mark three-soap closure complete on the basis of regression fixtures, GitHub deployments, an empty image inventory, unverified credentials or a prior 409.

## Verification and next build

- `node scripts/release467_build530_three_soap_closure.test.mjs` and all inherited current application tests.
- Exact four dev SHA checks, PR merge, main Production Pages Deploy success and live release marker matching Build 530 main SHA.
- Cross-app QL proof/custodian and TEST-only gates remain separate and HELD.

**Next Build 531:** Product Editor owner trial completion, Etsy draft/photo/tag discrepancy remediation and Marketplace draft readiness without duplicate publications.
