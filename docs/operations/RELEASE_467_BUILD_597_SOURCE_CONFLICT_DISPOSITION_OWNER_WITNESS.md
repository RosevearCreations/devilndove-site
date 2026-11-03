# Devil n Dove — Build 597 issuer conflict disposition & exact owner witness reconciliation

## Purpose and verified boundary

Build 597 adds a **documentary-only** follow-up to Build 596's independent evidence workboard. It does not authenticate an Etsy/Meta provider, receive a signed owner decision from the provider, or permit provider reads, writes, trial activation, publications, unknown-outcome retries, or D1 changes.

Production GREEN is a code, deployment and live-resource assertion. Provider authenticity, source custody, independent reviewer/witness independence and signed exact owner trial permission remain **HOLD** until trustworthy external evidence and separate owner authorization are actually observed.

## Operator review

1. Open `/admin/channel-trials/` and recompute source sections 5–21; the Build 597 area is section 22. If any upstream packet is missing or changed, stop and refresh the earlier original chain first.
2. Filter for original issuer, document digest, owner signature, independent witness or overdue owner cases. The selected exception must already be open on the exact source-pinned Build 596 case.
3. For an issuer case, record the expected authority reference, the original issuer attestation request or received-document locator, any locally computed SHA-256 digest and the separate custody receipt/digest. An attestation reference entered by an operator is **not** authenticated issuer evidence.
4. Assign an independent reviewer and distinct witness. Conflicts with issuer, custodian, signer, existing receipts, original digest and signer/witness equality remain explicitly listed. Use a disposition such as `ORIGINAL_ISSUER_REPLY_PENDING` or `PROPOSED_DISPOSITION_NEEDS_VERIFICATION` to route work; neither closes the case.
5. For exact owner sign-off, record the *same* account, Product/SKU and action as the case. Keep the signer reference, signed document receipt, local SHA-256 and separate witness in their own fields. Wrong-scope actions are rejected.
6. Confirm the HOLD acknowledgement, provide a specific reason and next follow-up deadline, then save locally. Export the unresolved review JSON, or prepare a **still-unsigned** exact owner witness reconciliation packet for external review. A copied packet is not an owner approval.

## Source and safety checks

- The new module recomputes the entire Build 595 → 596 exact source chain before accepting Build 597 follow-ups. Stale/forged upstream packets, wrong exceptions, owner/provider scope swaps and authorization claims fail closed.
- Issuer and custody digests are compared only to preexisting original/local bytes; a matching digest never proves the issuing party's authenticity. Duplicate document fingerprints cannot silently clear an exception.
- Issuer, reviewer, witness, custodian and owner signer contradictions remain outstanding. Owner receipt references and signed-looking digests are not a substitute for independently authenticated exact-scope permission.
- All Build 597 records are browser-local documentary follow-ups. The new module makes no outbound request and never invokes D1 or provider actions.

## Promotion evidence

`node --test scripts/release467_build597_source_disposition_witness.test.mjs` covers source pins, document-digest conflicts, signer/witness independence, forged approvals, scoped records and the Admin release marker. The protected release additionally requires the exact `dev` gates, `main` production deployment and independent live-resource integrity proof.
