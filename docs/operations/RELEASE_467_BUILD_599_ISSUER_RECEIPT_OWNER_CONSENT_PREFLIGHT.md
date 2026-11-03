# Devil n Dove — Build 599: Original issuer receipt intake, independent conflict witness and exact owner consent preflight

## What this does

Build 599 adds section 24 of the Admin Channel Trials worksheet. It indexes claimed original issuer receipt references, response fingerprints, custody evidence, independent source-channel claims and follow-up due dates. A separate conflict witness packet identifies the still-open exceptions. The exact owner consent preflight pins the account, Product ID/SKU and requested action.

**Documentary-only:** an entered official portal, support reference, file digest, issuer name or signed-looking owner receipt is *not independently authenticated*. This worksheet cannot close evidence exceptions, grant trial consent, access Etsy/Meta, upload images, authorize publication, retry unknown outcomes or change D1. Production GREEN means the application release deployed successfully; it is not provider or owner authorization.

## Owner review steps

1. Open /admin/channel-trials/ and recompute sections 5–23. Section 24 rejects modified or stale Build 598 source packets.
2. Select an exact unresolved issuer or owner case and one of its open exceptions. For an owner case, keep account, Product/SKU and action identical to the original source.
3. Record a *reference* for the original issuer receipt, original issuer authority and independent verification source. Choose how a future external check would be performed. Record the locally calculated SHA-256 fingerprint and custody reference; the worksheet does not upload source files.
4. Assign a separate independent reviewer and witness. Review flagged mismatches, repeated receipt references, identity collisions and missing proof. Even identical SHA-256 fingerprints only confirm matching bytes, never issuer identity.
5. Record the next deadline and unresolved follow-up notes, acknowledge HOLD, then save the record locally in this browser.
6. Export the unresolved conflict-witness packet. For an owner case, export the **unsigned** exact account/Product/action consent preflight.
7. Authenticate the original issuer, conflict closure evidence and separately signed owner authorization *outside* this worksheet, against authoritative records, before any separately authorized real provider trial.

## Verification

Run the Build 599 Node test suite and the Admin route inventory. On exact development SHA, System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Branch Hygiene must pass. After merging through dev to main, production Cloudflare Pages deployment, zero-D1 code-only proof, custom-domain smoke/version and independent live-resource integrity must pass. Live Etsy/Meta and owner consent remain HOLD regardless of deployment state.

Runtime performance note: Build 599 is consolidated in the existing public/js/admin-channel-issuer-response-598.mjs asset, cache version 599, to retain the enforced 1,800 runtime source-file ceiling. Build 598 APIs and the independent safety checks are preserved.
