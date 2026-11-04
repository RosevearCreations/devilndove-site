# Devil n Dove — Build 602: independent external issuer intake, conflict witness and owner exception recheck

## Release boundary
Build 602 adds Admin Channel Trials section 27. It recomputes the exact Build 601 source chain before accepting browser-local documentary follow-ups. It compares claimed original issuer identity, authority, document SHA-256, custody and closure decisions; it detects reused/self-attested proof, reviewer/witness overlap and changes to the exact owner account, Product/SKU or proposed action.

An optional local file SHA-256 is computed with browser Web Crypto, with an 8 MB limit. File bytes are not stored or uploaded, and a digest match does **not** verify who issued the file, close a conflict, validate a witness or authorize an Etsy/Meta trial.

## Owner workflow
1. Recompute Admin Channel Trials sections 5–26, then open section 27. Select an exact current issuer/witness or owner case and a still-open exception.
2. Identify the claimed original provider/issuer source and the independently checkable authority/custody references. Enter no tokens, credentials, household details or customer information.
3. Optionally choose a local original artifact and calculate its SHA-256. Compare it to separately obtained, trusted issuer originals outside the worksheet. The file stays on the device.
4. Record the claimed reviewer and **different** witness identities, witness attestation reference and chronology; a typed reference is not independently authenticated testimony.
5. For an owner case, preserve the exact shop/account, Product/SKU and proposed action; mismatched scope is rejected. Keep owner signature claims distinct from reviewer/witness records.
6. Explain unresolved proof, set the next follow-up deadline and acknowledge HOLD before saving locally. Export an unsigned original-source packet for separate external authority review.
7. Only separately authenticated original issuer evidence, independently confirmed conflict closure and explicit signed exact-scope owner approval can support a later, independently authorized nonproduction trial.

## Checks and release meaning
Regression tests cover stale source-chain rejection, substitutions, reused evidence, review-party independence, owner scope mismatches, local SHA-256 correctness and zero provider/D1 access. The consolidated runtime asset avoids a new JavaScript delivery file. Protected Development and Cloudflare production gates must be GREEN, including exact SHA custom-domain marker and independent resource integrity.

**Production GREEN means code release only.** All provider reads/writes, OAuth, Etsy draft/image mutations, Meta publishing, unknown-outcome retries and D1 operations remain HOLD. The separate Production Rollback Readiness workflow requires explicit manual dispatch and is not part of a code-only promotion.
