# Release 467 — Build 439: Etsy Live Draft Creation & Connection Acceptance

**Repository:** `RosevearCreations/devilndove-site`

**Scope:** Admin Product Editor › Etsy, authenticated draft creation only

**Owner policy:** Canada-only delivery; U.S. sales and shipping suspended

**Code acceptance:** Unit and mocked HTTP regression, JavaScript syntax, source release gates and Cloudflare verification
**External Etsy acceptance:** **PENDING** until an owner-authorized product produces a real remote Etsy listing with `state=draft` and the matching listing ID is seen in Etsy's Drafts. CI cannot stand in for this receipt.

## Observed issue and implementation

On 2026-10-23 the owner demonstrated a working live Etsy OAuth shop connection and selected a category from the existing Build 438 Etsy Product Editor tab. Product #54 was held by its missing **saved description**; the editor also displayed a **$0.00 confirmation warning**, and the canonical Product gallery showed images blocked from distribution. None of those fields should be silently fabricated or overridden for a live test.

Build 438's `createDraftListing` payload omitted the Etsy **`shipping_profile_id`** and **`readiness_state_id`** required for a physical item. Build 439 corrects that source omission, loads actual Etsy shipping and processing profiles with the already-granted token, validates selected IDs again immediately before the write, and shows the selected saved name, description, price and stock.

Build 439 also inspects the actual selected shop shipping profile plus its full destination list in live read-only requests. A physical draft is permitted only when the active profile originates in Canada and **every** verified destination is Canada (`CA`), without regional/worldwide destinations. If the destinations are incomplete, mixed, unavailable, or include the United States, the action holds before any remote Etsy write. The operator must explicitly confirm that the U.S. shipping suspension remains in place. This code **never edits Etsy shipping policies**.

The owner explicitly confirms a single **unpublished** draft. A D1 atomic per-product claim protects the attempt against double clicks, concurrent sessions and unknown provider outcomes; the server never automatically retries after a claim. Provider response and local listing ID are reconciled and recorded in existing `marketplace_syndication_drafts` and `admin_action_audit`. Draft creation does **not** activate/publish a listing or upload unapproved Product images. Canonical gallery image approvals remain separate from the Etsy draft endpoint. Meta/Facebook posting is unchanged and remains gated by supported provider authorization.

## Acceptance test sequence

1. In `https://devilndove.com/admin/product-editor/?product_id=54`, open **Etsy**. In **Description**, save the real product text; in **Basics**, save its genuine positive CAD price and available quantity. Do not use fabricated values just to make the test pass.
2. Return to **Etsy**. Press **Test Etsy connection & load categories**. Confirm correct verified shop ID, connected scope and expiry, live Etsy taxonomy and available shop shipping/processing profiles.
3. Select the correct taxonomy, maker attributes, **shipping profile** and **processing profile**. Press **Verify this profile delivers to Canada only**. It must return verified Canadian destinations with no worldwide/U.S. entries. If no such profile exists, stop with **HOLD** until Etsy's shipping setup is fixed under owner control.
4. Review the saved Product title, description preview, CAD price and quantity. Check both owner confirmations and click **Create unpublished Etsy draft** **once**.
5. Record the exact returned listing ID and draft state. Verify independently in the owner's Etsy Draft Listings and match that ID. Confirm it is not active/public. If Etsy rejects or the result is unknown, **do not click again**: preserve the claim and reconcile manually with Etsy.
6. Verify Cloudflare `main` Production exact-SHA source deployment separately. Provider acceptance only becomes `ACCEPTED` when step 5 succeeds; otherwise report `HOLD`/`PENDING` even if the code deployment is green.

## Failure behavior and test coverage

| Condition | Safe outcome |
| --- | --- |
| Missing Product description, price or inventory | Block and describe fields to fix/save; no Etsy POST |
| Missing/expired grant, missing write scope, wrong shop | Block before remote write; refresh/reconnect guidance |
| Missing taxonomy, shipping profile or processing profile | Block; load actual Etsy options instead of guessing IDs |
| U.S., worldwide, other-country or incomplete shipping destinations | Block before claim; show reason; no Etsy POST |
| Source Product changes between preflight and creation | Reject stale fingerprint; retest |
| Double click or previous remote claim/listing | Reject duplicate; reconcile first |
| Provider rejects POST | Hold claimed attempt and record rejection metadata, without automatic retry |
| Provider times out or returns uncertain response | Hold for manual Etsy Drafts reconciliation, do not retry |
| Etsy confirms `state=draft` and listing ID | Save local remote-ID receipt; still not public |

### Implementation references

- [Etsy Open API v3 reference](https://developers.etsy.com/documentation/reference/): physical listing creation fields, shipping profile and processing profile endpoints, shop-scoped destinations.
- [Etsy listing tutorial](https://developers.etsy.com/documentation/tutorials/listings/): draft listing creation and separate image upload / publication steps.
- Existing internal controls: `functions/api/admin/product-etsy-draft.js`, `functions/api/_lib/etsyProductDraft438.mjs`, `public/js/admin-product-marketplace-drafts-v438.js`, `admin/product-editor/index.html`.
- Regression: `scripts/test_product_etsy_draft_438.mjs`, `scripts/test_product_etsy_endpoint_438.mjs`; mandatory `.github/workflows/current-application-quality.yml`.

## Release and stuck-job check

At the start of Build 439, repository Actions had **no** active `queued`, `in_progress`, `waiting`, `pending` or `requested` runs on the current first-page/70-run inspection. The prior `main` was `11bd1af888e1b988f4daca8bae73cdb986ca5a17`, with completed green Production Pages Deploy and Live Resource Integrity Proof runs. This is historical evidence, **not** the result of Build 439.

Check exact SHA and jobs again before/after promotion. Do not cancel unrelated runs, lower mandatory gates, launch indefinite pollers, or claim that a local/CI simulation proves an authorized Etsy write.
