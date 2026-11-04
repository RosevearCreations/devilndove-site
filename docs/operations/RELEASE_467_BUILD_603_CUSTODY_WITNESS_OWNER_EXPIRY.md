# Devil n Dove — Build 603: chain-of-custody, separate witness identity and exact owner expiry

## Scope and original-source boundary

Admin Channel Trials section 28 replays the complete original Build 602 evidence chain, including independently claimed issuer source, original digest and open exception list. Modified/stale upstream packets, a wrong exception, the wrong shop/Product/action, or a non-owner sign-off are rejected. The source-owned read-only integration manifest introduced in QL-333 is preserved on `dev`.

The Build 603 queue is **browser-local documentary follow-up only**. Nothing calls an Etsy or Meta provider, performs OAuth, uploads original evidence, mutates D1, publishes, retries an uncertain operation, verifies an identity or grants owner consent. A local record, witness name, matched digest, custody receipt or future expiry date is **not** independent authentication.

## Owner review steps

1. Recompute Admin Channel Trials original sections 5–27, then section 28. Select a current original evidence exception; confirm the exact provider channel, account, Product/SKU and intended action.
2. Select **Custody handoff**. Record claimed original artifact and issuer authority locators, SHA-256, the custody origin and transfer receipt references, distinct custodians and chronological observation/transfer times. The queue flags receipt substitutions, digest conflicts, self-transfers, missing links and reversed events. Independently confirm each original using trusted external evidence.
3. Select **Witness identity follow-up**. Record reviewer and distinct witness identity references, separate authority locator, external follow-up receipt, and contact/response times. Self-referential or reused receipts and shared reviewer/custodian/issuer/owner identity are flagged; the entry remains unverified until independent outside confirmation.
4. For an exact owner case, select **Owner sign-off expiry**. Preserve the original shop/account, Product/SKU and proposed action. Note claimed signer, signed receipt, signed time and expiry time. Expired, within-72-hours, missing, not-yet-effective and future-expiry **unverified** states are calculated; none imply that the original owner signed or authorized a trial.
5. State the outstanding uncertainty and follow-up deadline, acknowledge HOLD, then save the note locally. Use an **unsigned handoff** to coordinate independently verifiable originals, a distinct witness and renewed exact-scope owner consent outside the application.

## Acceptance and promotion

The Build 603 test suite exercises rejected stale/malformed replay inputs; custody digest, identity and receipt gaps; witness self-attestation; owner scope and expiry; forged authorization rejection; chronological consistency; local-only UI boundaries; and the production marker. The runtime entrypoint independently recomputes and compares the complete Build 602 source packet before calling the pure documentary audit. Inherited Build 602 tests cover the original-source replay itself. These are part of the protected Current Application Quality gate alongside System Gate, I.T. Admin Runtime Proof and Branch Hygiene.

`main` Production GREEN refers solely to the deployed, source-matched application and independent Cloudflare resource-integrity checks. Original issuer authentication, custody continuity, witness identity, conflict closure, signed exact owner permission, provider trial authority, Etsy/Meta writes and D1 operations remain **HOLD** until separately verified and explicitly authorized.
