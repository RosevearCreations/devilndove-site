# Devil n Dove — Build 600: independent issuer authenticity decision register, exception aging and exact owner readiness

## Release boundary
Build 600 adds Admin Channel Trials section 25: a source-pinned, browser-local original issuer decision register, independent conflict review aging and exact owner trial readiness dashboard. Locally entered decision references, source identities, hash matches and signed-looking documents are never issuer authentication, evidence closure, owner consent or permission to run Etsy/Meta APIs. Provider operations, unknown-outcome retries and D1 writes remain HOLD.

## Steps for owner review
1. Recompute sections 5–24 on /admin/channel-trials/. The new section 25 checks Build 599 original issuer receipts against the exact Build 598 and earlier source chain, rejecting changed or stale packets.
2. Filter by original issuer, owner, disputed digest/custody, overdue deadline, absent receipt or missing independent reviewer/witness. Review priority, aging bucket and unresolved blockers on the dashboard.
3. Select an exact source-pinned case and its current unresolved exception. Choose a pending issuer/owner decision classification, never an authenticated or approved status.
4. Enter the original issuer and custody references, claimed external authority, decision note and any SHA-256. Inspect substitutions, self-referential authority, duplicate identities, digest mismatch and witness independence.
5. For exact owner sign-off cases, copy the original shop/account, Product/SKU and proposed action without alterations. Separate the signer from the reviewer and witness.
6. Add an evidence-follow-up due date, written explanation and HOLD acknowledgment before saving locally. Export the unresolved register or unsigned, exact-scope owner-readiness packet.
7. Obtain independently authenticated original issuer proof, conflict-closure evidence and separately verified owner signature outside this worksheet; an explicit later authorization is needed for any live provider trial.

## Quality and production gates
Targeted Node tests validate immutable-source recomputation, aging, receipt/custody/issuer contradictions, owner signer independence, forbidden approval claims and zero network/D1 behavior. This is implemented in the existing consolidated issuer review runtime JavaScript asset to remain within the runtime file budget. System Gate, Current Application Quality, I.T. Admin Runtime and Branch Hygiene must pass on dev. The identical source must pass Cloudflare Production Pages deploy, custom-domain smoke and version receipt, and independent live resource integrity on main.

Production GREEN indicates only the code-only release; provider or owner authorization remains HOLD.
