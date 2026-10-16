# Release 467 Build 409 — Destination-Specific Remote Draft Operator Trial, Explicit Publish Isolation & Provider Reconciliation Controls

## Delivered
- Build 409 operator approval integrated with existing Build 399 one-attempt Etsy draft creation; *no silent provider calls*.
- Build 409 source check reads original Product, canonical gallery, destination intent, distribution owner consent, Build 408 acceptance and prepared local draft, stored Etsy shop/permissions, and one existing staged Etsy draft.
- Stored verified Etsy credentials/scopes and shop owner relationship are required. Operator cannot invent provider credentials by checking a box.
- Owner must independently verify that the selected Etsy shipping profile EXCLUDES the United States. Profile names are not reliable evidence of shipping destinations, so the operator must attest to checking the actual Etsy profile.
- The 409 authorization is bound to original Product/image source fingerprint, local staged draft fingerprint, shop identity, selected shipping profile and review receipt; it expires after 15 minutes. Any changed source or stale permission aborts.
- The 399 remote POST now **refuses to send** unless the matching fresh 409 receipt is supplied. Exactly one existing 399 claim remains the provider attempt ledger. No automatic retries on partial/unknown responses.
- Build 400 remains the only manual verified Etsy GET and draft link, and Build 409 adds separate click-only acknowledgement of its saved verification evidence. No extra provider calls for the 409 acknowledgement.
- No provider-facing publishing, activation, inventory updates, price writes or social cross-posting. Facebook Marketplace remains HOLD: provider listing permissions are not established.
- The feature does not create a second Product or introduce a D1 schema migration.

## Owner acceptance (Production)
1. Save Product in the editor, opt Etsy in under Build 405 and review approved canonical media and non-US shipping under Build 406.
2. In Build 408, record destination acceptance, prepare LOCAL draft evidence, and reconcile local preparation.
3. In I.T. Integrations, stage one local Etsy draft; select Product and draft in Build 399.
4. Read Etsy profiles by explicit click, choose an actual shipping profile and inspect its destinations in Etsy Shop Manager. Only check US-exclusion if true.
5. Click **Read Build 409 Product/draft acceptance**, inspect blockers, then click **Record trial authorization** (local receipt).
6. If ready, separately consent to the original Build 399 one-shot remote unpublished Etsy draft. A real Etsy draft is a provider write; NEVER retry a lost or ambiguous response.
7. In Build 400 verify that Etsy received the *unpublished* draft (GET-only); reconcile the local link. Then reload Build 409 and explicitly record the verified evidence.
8. If any stage blocks, do not bypass it by changing Product status or enabling US shipping. Facebook remote adapter remains unavailable.

**GREEN in GitHub means tests/deployment passed; it does not claim a real operator executed an Etsy trial or that Etsy permissions/shipping destinations were externally verified.**

## Next proposed
Build 410 — Provider Draft Outcome Exception Resolution, Safe Manual Recovery & Destination Evidence Dashboard.
