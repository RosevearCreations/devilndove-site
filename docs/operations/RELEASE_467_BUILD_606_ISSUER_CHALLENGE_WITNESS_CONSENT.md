# Devil n Dove — Build 606: original issuer callback, independent witness and exact consent readiness

## Strict boundary

The Channel Trials Admin section 31 is **documentary and browser-local only**. A challenge ID and SHA-256 digest are references, not a challenge secret. The browser neither initiates callbacks nor verifies an issuer/witness signature or owner consent. The exact Build 605 issuer/witness/renewal chain is replayed before an additional review record is accepted. A stale, altered, substituted or mismatched original rejects the review. No provider, OAuth, database or published product is contacted or changed.

The existing QL-333 source manifest and QL-334 Comms Hub navigation remain available. Neither link means that a live authenticated peer connection is established.

## Owner review steps

1. Recompute Channel Trials sections 5–30 and select the unresolved exact-source case in section 31. Check the channel, shop/account, Product/SKU and proposed action.
2. **Original issuer callback challenge:** enter only a nonsecret challenge identifier, optional SHA-256 digest, independently obtained authority, callback channel reference, separate verifier, response receipt and relevant timestamps. Do **not** enter challenge secrets, OAuth tokens or passwords. Flag self-referential authority, reuse across cases, reported matches that are not independently authenticated, expired challenges and responses after expiry. This does not perform an actual issuer callback.
3. **Independent witness:** record the original witness identity and separately obtained authority, independent reviewer, reverification receipt and time. Compare with the Build 605 witness identity; identity substitutions, same-person checks and duplicate receipts remain exceptions. A claimed successful reverification remains untrusted.
4. **Exact owner renewed consent:** record signer, renewed signed receipt, separate witness, exact account/SKU/action, signature and expiry. The prior original and renewal handoff remain in scope. Flag signer substitutions, changed/reused receipts, non-independent witness, expired consent and consent due within 72 hours. A reported signature never enables a live trial.
5. Supply the next external review due date, record the remaining missing proof, explicitly acknowledge HOLD and save the local entry. Copy an **unsigned** source-pinned handoff for external issuer, witness and exact signed-owner validation.

## Verification and promotion

- The deterministic Build 606 suite covers challenge chronology/expiry, callback authority independence, cross-case reuse, identity conflicts, owner signer/receipt/expiry, source replay boundary rejection, unsafe token rejection, user interface controls and main deployment marker.
- Existing 602–605 tests and four protected `dev` workflows remain required. Production requires the exact green `dev` tree, Cloudflare Pages `main` success, live SHA/build marker and independent Production Live Resource Integrity Proof.
- All issuer, witness and owner authentication counters stay zero, and all trials remain `HOLD`. No Etsy/Meta draft/image mutations, publication, provider reads/writes, OAuth, D1 or uncertain-outcome retries are authorized.
