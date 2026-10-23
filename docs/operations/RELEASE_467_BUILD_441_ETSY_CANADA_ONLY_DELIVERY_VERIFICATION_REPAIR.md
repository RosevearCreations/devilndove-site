# Devil n Dove — Build 441: Etsy Canada-Only Delivery Verification Repair

**Date:** 2026-10-23  
**Scope:** Etsy live shipping-profile validation only. No product, order, shipping,
OAuth, D1, R2, Facebook/Meta or Etsy publication mutation.

## Symptom and documented API value

The Product Editor reported `HOLD — This shipping profile includes a non-Canadian,
regional or worldwide destination` after the operator created and selected **Devil n Dove —
Canada Only** in Etsy. The visible Etsy selection showed Canada checked and the U.S.
and other regions unchecked. This does **not** prove the exact Etsy API response.

The previous validation in `canadaOnlyShippingProfile` rejected every non-empty
`destination_region`, including Etsy's documented `none` enum value. Etsy describes
`destination_region` values `eu`, `non_eu`, and `none` in its official Listings API tutorial:
https://developer.etsy.com/documentation/tutorials/listings/#adding-a-shipping-profile-to-a-listing

## Correction

Treat `destination_region: 'none'` as an absent regional selection **only if** the
associated destination row has `destination_country_iso: 'CA'` and the profile is
active, matches the selected ID, and originates in Canada. Accept `null` or an
empty region under the same explicit-Canada condition. Never accept a blank country,
the United States, a broad region, a worldwide destination, a mismatched profile ID,
or missing/incomplete destination results. These checks apply to the explicit
read-only verification button and are **re-run** before the single-attempt Etsy draft
write. The application does not create or publish a draft during verification.

## Regression evidence

`node --test scripts/test_product_etsy_draft_438.mjs scripts/test_product_etsy_endpoint_438.mjs`

Coverage now includes legitimate `none`/`NONE` alongside nullable regions and
negative tests for U.S., missing destination country, broad international regions,
mixed Canada/U.S. rows and incomplete results.

## Operator acceptance after Production deployment

1. Open existing saved Product **#54 — Bar Soap Sweet Orange** in Production.
2. Test the Etsy connection and reload Etsy shipping/processing profiles.
3. Select **Devil n Dove — Canada Only** and click **Verify this profile delivers
   to Canada only**. If Etsy returns only country `CA` and an empty/`none` region,
   verification must succeed.
4. If HOLD persists, do not override it. Inspect a *sanitized* read-only Etsy
   destination response to determine whether Etsy still includes an international
   destination; no draft attempt is allowed until the exact situation is known.
5. Creating an unpublished Etsy draft requires an independent explicit owner click
   and the existing one-attempt ledger. No publication is authorized in Build 441.

**Production GREEN is proven only** by the exact four Development checks,
successful `main` Production Pages Deploy and matching Production Live Resource
Integrity Proof. Passing local tests or merging branches is not enough.
