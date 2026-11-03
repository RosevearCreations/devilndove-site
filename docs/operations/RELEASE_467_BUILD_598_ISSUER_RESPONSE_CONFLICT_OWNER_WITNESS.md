# Devil n Dove Build 598 — Original issuer response, conflict closure proof and owner witness readiness

## Release boundary

Build 598 adds a browser-local, review-only stage after Build 597. It **does not** independently authenticate an issuer response or owner signature, grant a trial, close evidence exceptions, upload provider images, perform an API request, or alter D1.

## Owner review procedure

1. Open Admin → Channel Trials. Recompute exact source sections 5–22 first. Build 598 is section 23 and rejects stale or modified Build 597 receipts.
2. Select the current unresolved issuer or exact owner case and an exception from its actual source-pinned queue. Record the original issuer reply locator, original issuer identity, document SHA-256, separate attestation locator and custody receipt reference. Do not paste tokens, keys or private customer details.
3. Compare the reply fingerprint with the pinned original source; a local match verifies bytes only, **not** the issuing authority. Mismatched identities, reused documents and conflicting custody references remain open.
4. Record independent reviewer and different witness references. If the case concerns owner permission, enter the exact shop/account, Product/SKU and requested action from the current source case. Signer/reviewer/witness collisions and substituted owner receipt references remain unresolved.
5. State the unresolved issue and next review date. Tick the HOLD acknowledgment and save locally. A proposed closure is still **awaiting external evidence** and retains the original conflict list.
6. For owner cases only, prepare or copy the **unsigned** witness-readiness packet. Secure independent issuer evidence, separately authenticated owner consent and exact-scope authorization outside this worksheet before considering any future actual API trial.

## Verification and promotion

Run the targeted Build 598 Node tests and Admin route inventory. Required release controls: all exact-SHA Development checks, production Cloudflare Pages deployment, immutable live release marker, production smoke, and independent live-resource integrity proof. The new worksheet uses no fetch, OAuth, D1, provider read/write, publish, or automatic exception closure. Production GREEN confirms the code-only application release, not provider authenticity.
