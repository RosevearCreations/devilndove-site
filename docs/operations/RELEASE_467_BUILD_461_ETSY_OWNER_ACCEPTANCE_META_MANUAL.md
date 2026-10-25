# Devil n Dove Build 461 — Etsy Draft Owner Acceptance & Marketplace Manual Boundary

**Admin route:** `/admin/etsy-owner-acceptance/`; link from Maker Workbench **Real owner review** section. Etsy connection OAuth acceptance remains on the previously selected **main-site** `/admin/it-integrations/`, not an untrusted Preview OAuth callback.

## Bounded scope

- New **read-only acceptance cockpit** for one exact saved Product ID and original local Etsy draft UUID. It reuses the existing authenticated Admin **GET-only** endpoints: `/api/admin/etsy-oauth-acceptance`, `/api/admin/etsy-trial-409`, `/api/admin/etsy-remote-draft-evidence`, and `/api/admin/etsy-publication-packet`. They retain their existing canonical D1/one-attempt/operator record authorities. There is no second draft engine, new D1/R2 schema, credential exposure, automatic provider polling, provider POST, token transfer, listing publication or pricing/shipping update.
- The presentation checks current stored main-site OAuth shop identity/CAD, exact Product and UUID, local one-attempt claim, linked Etsy listing ID, historical provider-verification receipt, publication packet and the **`US_SHIPPING_DISABLED`** policy label. Conflicts, missing evidence and prior-attempt uncertainty become **HOLD**. It never claims a stored policy proves today's remote shipping destinations.
- A real owner must use authenticated Etsy read controls to verify that the **specific listing ID is still a DRAFT**, still associated with the correct shop, selected images and Canadian-dollar price, and that the **actual Etsy shipping profile includes Canada and excludes United States**. Existing Build 409 one-attempt authorization and Builds 399–405 provider GET/reconciliation control any genuine unpublished draft. A missing/unknown earlier attempt must be investigated, not retried blindly.
- Five accessible, optional owner checks are **in-memory only** and disabled without verified existing source records. The page itself has no approval action. Full owner sign-off lives in the existing original authenticated Etsy decision/evidence flows. No listing is published/activated or automatically moved toward Etsy/Meta.
- **Meta/Facebook Marketplace** remains `HOLD_SUPPORTED_API_PERMISSION_UNVERIFIED`. Until an actual supported posting API and intended account's permission are reviewed, the supported fallback is manual Product Editor copy/paste, manual image choice and human Meta UI publication. Do not assume ordinary Marketplace personal seller posting accepts third-party API writes.
- U.S. shipping remains suspended for Devil n Dove. Canadian listing conditions and costs are still an individual seller/owner review. A successful technical production deployment does **not** establish that Etsy actually accepted a real draft.

## Real owner acceptance runbook

1. Open [Devil n Dove I.T. Integrations](https://devilndove.com/admin/it-integrations/) on `main`. Verify that the linked Etsy shop is the intended account, CAD and valid scopes. Do not authorize credentials from a Preview domain.
2. In the Product Editor, select exactly one saved, physical, Canada-first Product; verify its CAD price, stock, public-cleared images and existing Etsy local draft ID. If an earlier draft attempt has an unknown result, STOP and reconcile first.
3. Enter the Product ID and local draft UUID on Build 461, or choose **Find recent saved Etsy drafts** to load one manual bounded GET of the original `etsy-product-syndication` register (200 latest records, no provider calls). Press **Review existing evidence**. Examine the original stored one-attempt claim and historical provider proof; where absent, keep HOLD.
4. In the **original** authenticated Etsy trial/remote-draft controls, make at most the single expressly owner-authorized unpublished-draft attempt when all prerequisites and no-duplicate checks truly pass. Confirm the remote shop/listing IDs, state `draft`, photos, CAD price and Canada-only shipping destinations through a fresh authenticated read. A CREATE is never initiated by Build 461.
5. Complete real owner review/receipt in the existing Etsy workflow. Keep Product QA, consumer safety, consent, provider publication and actual sale separate. If Meta API eligibility remains unverified, use the original Product Editor manual copy fields and decide publication in the Meta UI yourself.

## Local regression

```text
node --check public/js/etsy-owner-acceptance-policy-461.mjs
node --check public/js/admin-etsy-owner-acceptance-461.js
node --test scripts/release467_build461_etsy_owner_acceptance.test.mjs scripts/release467_build457_maker_workbench.test.mjs
python scripts/current_application_quality_gate.py
```

Tests use synthetic shop/product/draft/consent fixtures only; even a complete historic receipt packet remains **HOLD** until a human rechecks the remote seller account and explicitly records acceptance. The tests also assert no browser/provider write path and independent manual Meta boundary. Build 461 **technical GREEN** requires dev PR/Preview, same-tree protected `main`, Production Pages and independent live integrity proof; genuine external Etsy/Meta owner acceptance is separate and remains HOLD until real records are supplied.

**Next proposed Build 462:** Canadian Product Safety & Label operator review (category-specific, no automatic certification).
