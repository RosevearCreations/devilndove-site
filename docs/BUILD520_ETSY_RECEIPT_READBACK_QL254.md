# Build 520 — three-photo diagnostic closure, owner acceptance readback and QL-254 HOLD continuity

## Product #53 / existing unpublished Etsy draft #4603838854

This is a software release, **not** a claim that a human owner has already verified the listing.

The visible Etsy workflow now displays a separate read-only observation for each approved original photo (`#344`, `#345`, `#346`), its recorded remote Etsy image ID (if any), the real remote image count and unresolved upload claims. It distinguishes **the photo exists on Etsy**, **a local owner-witnessed mapping has been recorded**, **independent live detail/receipt reads pass**, and **the real owner has explicitly accepted the draft**. These are different checks, not interchangeable GREEN labels.

When the final live verification runs, three existing GET endpoints are reported individually. A failure (including Cloudflare HTTP 503) means that specific read is unavailable; it never means the photo is missing or that a write may be repeated. Successful live GETs alone never approve the Etsy listing.

The new authenticated `GET /api/admin/product-etsy-owner-acceptance-520?product_id=53&listing_id=4603838854` reads the latest genuine saved local owner action from the D1 primary session, then independently re-reads current unpublished Canada-only Etsy details, original-photo receipts, and the exact approval fingerprint. If the receipt is absent, stale or live Etsy cannot be read, it returns **HOLD**. It never creates a consent, drafts, listings, photos or gateways. The ordinary final owner button still requires live three-GET evidence and a real owner checkbox; after a successful owner action it now checks the saved approval via a separate GET using the one-time request key. If confirmation fails, we show **uncertain / HOLD** and instruct a **read-only** receipt check instead of resending the owner decision.

**Owner trial, in order:**

1. Open Product #53 → Etsy, verify the saved draft link is exactly `4603838854`, and save the Product first.
2. Press **Compare existing Etsy photographs (read only)** and review all three original IDs and current Etsy image IDs. If an exact match exists but was never recorded, inspect the side-by-side pictures and explicitly record only the **local matching receipt**; no Etsy upload is performed.
3. Press **Verify / retry live draft & all 3 photos (read only)**. Review the individual result for each source and the actual item content, CAD price, category, search tags and Canada-only unpublished status. If any part is HOLD, do not approve or upload more images automatically.
4. The owner personally opens and inspects the actual Etsy draft, checks the three pictures, then voluntarily checks the owner-approval box and presses **Record owner approval (never publish)**. A different GET confirms its persisted D1 audit plus the fresh Etsy fingerprint. The separate **Check saved owner approval receipt (read only)** button can safely recover an uncertain result without sending a second owner action.

No real owner action or authenticated Etsy provider call was performed by the Build 520 code, its tests or its promotion pipeline. No real owner approval is inferred from CI or a synthetic fixture.

## QL-254 — independent original proof / exception aging

The attached QL-253 handoff observed `main` `962cd59efe8ebfeda623b6f82b95c030adfc3ab4` at **2026-10-29T02:43:00Z** (28 October, 10:43 p.m. Eastern). An independent public GitHub recheck at that immutable SHA still returned **HTTP 404** for `docs/integration/ql246-source-proof.json`.

The previously verified GitHub CI run [40794862120](https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120) has exact `head_sha=340d6da39abed229094527dfc91a7fd423fabd02` (source **A**), completed GREEN. This alone is not proof **B**, an Ed25519 signature, key custody, owner approval or a gateway test.

`scripts/ql254_proof_exception_520.mjs` retains the observed QL-253 snapshot and records elapsed minutes to a **new actual public-GitHub-only** recheck; it distinguishes HTTP 404/absent from a valid public origin *candidate*. A public 200 still leaves `DISCONNECTED / HELD` without separate authenticated private custody/witness and test consent. Optional operator command (no gateway requests):

```sh
node scripts/ql254_proof_exception_520.mjs --public-get <full-current-main-SHA> [full-proof-commit-B-SHA]
```

### Sanitized handoff to Rosevear Comms Hub

```yaml
application_name: Devil n Dove
repository: RosevearCreations/devilndove-site
source_sha_A: 340d6da39abed229094527dfc91a7fd423fabd02
source_ci_run_url: https://github.com/RosevearCreations/devilndove-site/actions/runs/40794862120
source_ci_exact_head_green: true
proof_commit_sha_B: NOT_AVAILABLE
immutable_public_proof_url: HTTP 404 at 962cd59efe8ebfeda623b6f82b95c030adfc3ab4
exact_proof_bytes_sha256: NOT_AVAILABLE
public_spki_sha256: NOT_AVAILABLE
out_of_band_registry_snapshot_sha256: NOT_AVAILABLE
out_of_band_registry_receipt_id: NOT_AVAILABLE
out_of_band_custody_receipt_id: NOT_AVAILABLE
distinct_independent_witness_receipt_id: NOT_AVAILABLE
owner_test_decision: NOT_GIVEN
owner_test_receipt_id: NOT_AVAILABLE
real_health_and_capabilities_get_receipts: NOT_RUN
original_seven_negative_denial_receipts: NOT_VERIFIED
connection_state: DISCONNECTED
```

Only publish a **genuine** privately signed QL-246 source proof commit **B** as a descendant of tested **A**, with B distinct from A and the signed payload referring to A. Then perform independent public raw-byte, source CI, ancestry, SPKI registry, custodian and distinct witness checks. A trusted real owner TEST-only decision is **not given**; any future trial must be separately authenticated, scoped to a named nonproduction business, a 30-minute-or-shorter future UTC window, `GET` only and exactly `/api/integration/v1/health` and `/api/integration/v1/capabilities`. Do **not** run the requests, a 24/7 home relay, private gateways or any Etsy data write as part of this QL-254 hold.

**Next proposed Build 521:** Etsy exact-image identity witness recovery & persisted owner receipt continuity, plus QL-255 authentic proof-origin/custodian escalation (HELD).
