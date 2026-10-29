# Devil n Dove Build 524 — real owner draft trial and QL-258 private custody gate

## What is actually implemented

- The new Product flow reads the **primary D1 Etsy claim** on initial Product Editor load and with **Verify saved Etsy ID (read only)**. The visible Product ID, SKU and slug are paired with the actual saved Etsy listing ID and receipt ID only when the original primary claim uniquely confirms it.
- After the owner deliberately acknowledges and POSTs one **unpublished** Etsy draft, Build 524 re-reads `/api/admin/product-etsy-existing-draft?product_id=...` and requires the same numeric listing ID, saved Product identity and primary receipt ID. A mismatch/503 is **HOLD**: no blind retry or new duplicate draft.
- Facebook Marketplace preparation revalidates the same authoritative Product/gallery and lists **every** original photo ID, approved HTTPS image URL, alt text and measured dimensions in saved order. The handoff is **manual**; there is no authorized Meta Marketplace API POST and no claim that any Facebook item was published.
- Old trial Products **#48 and #53** and their two prior Etsy drafts are owner-managed and **excluded from the new send path**. No cleanup, unlink, publish, remote update or provider POST against those trial drafts occurs in Build 524 CI.

## The next *real-owner* Etsy acceptance trial (not yet performed by CI)

1. Create **a fresh Product** (not #48 or #53) with item facts, CAD price, stock, actual weight and clear long description. Upload its genuine original photos once into Media. Approve every image for Store, Etsy and Marketplace, with descriptive alt text and independently measured dimensions of at least **800 × 800 px**. Etsy permits at most ten photos in this flow; an excessive/partial gallery blocks submission.
2. Tick Etsy (and optionally Marketplace) and save the Product and destination preferences. No Etsy provider POST is performed by Save.
3. Use **Check Product and all photos (read only)** and fill the real Etsy shop's taxonomy, Canada-only shipping profile, processing profile, and parcel weight/dimensions. If a check fails, correct the source; do not bypass the gate.
4. Acknowledge the exact unpublished draft creation and press **POST** once. If it times out or returns an uncertain result, stop and check Etsy and **Verify saved Etsy ID** before any retry.
5. Record the **new Product ID, SKU, slug, returned numeric Etsy listing ID, primary D1 receipt ID, original photo IDs/count, saved real draft state and Canada-only shipping result**. Independently compare Etsy's real images/content; only then can the owner accept this trial.
6. If Marketplace was checked, use **Prepare manual Marketplace handoff**. Compare the on-screen list of originals and transfer each one manually inside Facebook. No automated Meta publishing is claimed.

These are operator instructions, **not a witnessed real trial result**. The only automated evidence is the source tests and the eventual `dev`/`main` CI and Cloudflare deployment.

## QL-257 handoff received 29 October 2026 and QL-258 reality

Comms Hub's document `ROSEVEAR_QL257_SIX_RESPONSE_VARIABLE_PLACEMENT_OWNER_ACTIONS` reports the **Devil n Dove signer status `SIGNER_STATUS_UNKNOWN`**. The original `docs/integration/ql246-source-proof.json` remained 404 at the reviewed prior main. This file and CI do **not** provision a genuine source Ed25519 key or appoint a human identity.

`scripts/ql257_private_witness_intake_523.mjs` already checks a true five-minute public-key possession challenge when the actual private-witness materials are provided. `scripts/ql258_independent_custody_decision_524.mjs` now evaluates a sanitized status-only source packet for the **specific missing custody/witness/pin/tenant prerequisites**, but even a structurally complete packet is not independent authenticated proof. Its result is deliberately **`independent_custody_accepted: false`, `owner_test_decision: NOT_GIVEN`, `integration: DISCONNECTED / HOLD`** until external private review.

### The next specific blocker, not a generic green label

We still require an **owner-approved distinct Devil n Dove private signer key custodian**, a separately authenticated **witness** who issues the real nonce and verifies the public SPKI pin out-of-band, a separately authenticated **reviewer**, and a restricted persistent private key store. They must independently attest the actual isolated **nonproduction** tenant and original signed source proof in an approved private channel. None of that evidence was in the supplied QL-257 status document. **Do not** store private keys or HMAC secrets in GitHub Actions public variables, Cloudflare static/build variables, browser `VITE_*` code or this repository.

Only after the authenticated private signer/pin review and separately authenticated owner TEST-only authorization may the coordinator schedule a future bounded read-only nonproduction GET window. No such network trial is authorized in Build 524.

### Runtime variables/bindings — factual scope

- The existing Product/Etsy APIs need a deployed D1 binding reachable as **`DB`** or **`DD_DB`**, and the existing **server-only Etsy API key/shared-secret and OAuth token storage**. This build adds **no new secret or Cloudflare binding**. The actual deployed secret *values* are not publicly readable and are not reported here.
- The new Etsy primary-receipt GET uses the existing Admin authorization and D1 database. It never needs a new credential or makes an Etsy POST.
- Original QL-246 private signer keys are a **separate, not-yet-approved private operator responsibility**; no new GitHub/Cloudflare variables are requested to clear QL-258.

## Suggested next build

**Build 525 — Fresh Product Owner Trial Evidence Acceptance, Full Original Image Readback and Etsy Draft Identity Exception Resolution, plus QL-259 Independent Original Signer/Custody Decision Handoff (HELD until real private evidence).**
