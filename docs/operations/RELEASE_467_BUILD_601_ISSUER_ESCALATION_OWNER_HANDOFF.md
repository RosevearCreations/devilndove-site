# Devil n Dove — Build 601: original issuer decision reconciliation, conflict escalation and exact owner handoff

## Release boundary
Build 601 adds Admin Channel Trials section 26. It independently recomputes the exact Build 600 decision register from the original local source chain, detects altered or stale packets, flags mismatched issuer identity/digest/custody, self-attested authority, reused closure evidence and conflicts among reviewer, witness and owner signer. It records only unresolved escalation follow-ups in browser-local storage. No local reference or matching SHA-256 constitutes independent authentication or a closed exception.

## Owner review
1. Recompute sections 5–25 in `/admin/channel-trials/`, then use section 26 to examine the source-pinned escalation queue.
2. Filter original issuer, exact owner, conflicting evidence, overdue, witness gaps or cases with no current escalation record.
3. Select the original still-open exception and proposed *pending* next action. Enter document locators, claimed authority, digest, custody and reviewer/witness identity without secrets or customer data.
4. Preserve the exact owner shop/account, Product/SKU and proposed action; do not substitute a scope or treat a local receipt reference as a signed owner authorization.
5. Set the next independent evidence-review date, explain outstanding proof and acknowledge HOLD before saving the local follow-up.
6. Export either the unresolved queue or an unsigned, source-pinned issuer escalation / exact owner authorization handoff packet for independent external review.
7. A separate, authenticated original issuer response, independently witnessed conflict-closure decision and explicit exact-scope owner authorization are still required before any provider trial. This build contains no mechanism that can grant that authorization.

## Verification and remaining hold
Node regression tests cover exact-source pinning, stale evidence, digest/custody/issuer substitution, self-attested closure, witness independence, exact owner scope, handoff flags and zero provider/D1 calls. The code runs in the pre-existing consolidated issuer module to preserve the production runtime file budget. All four protected Development workflows, production deployment, custom-domain smoke/marker, independent live integrity and source-tree identity must pass before the software release is GREEN.

**Etsy, Facebook and Instagram API trials, draft/image writes, publication, retries and D1 operations remain HOLD.** Production GREEN means only a successfully deployed software release, not issuer verification or owner consent.
