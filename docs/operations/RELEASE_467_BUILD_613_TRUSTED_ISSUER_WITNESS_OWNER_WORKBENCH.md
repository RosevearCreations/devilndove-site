# Devil n Dove — Build 613: Trusted-source Evidence Intake, Independent Witness Review & Exact Owner Consent Decision Workbench

## Scope and security boundary

Build 613 adds **Channel Trials section 34**, a working review-first intake for original provider/issuer references, independently sourced authority/reviewer/witness details, SHA-256 document digests, and shop/account + product/SKU + exact action owner decision claims.

**This is not an actual issuer authentication service or a legally binding e-signature verifier.** No provider-side readback, registered trusted issuer key, authenticated witness identity, signature certificate, trusted timestamp, authenticated administrator approval, protected append-only consent ledger or D1 production migration is currently available within this release. Those prerequisites cannot be fabricated from typed fields, copied notes or local browser state. Build 613 does **not** lift the external HOLD. The visible Admin workbench clearly marks all locally entered claims **UNVERIFIED**.

## Owner workflow

1. Open [Admin → Channel Trials](https://devilndove.com/admin/channel-trials/), sign in as permitted, and refresh the existing source-review sections 5–33.
2. At **section 34**, refresh the exact Build 608 source-pinned review. Select the actual channel/shop, product/SKU, proposed action and unresolved case.
3. **Original issuer review**: Enter the official original receipt/reference, independently sourced issuer authority locator, a distinct reviewer and witness, and a lowercase SHA-256 hash of the original document. Obtain and preserve the actual provider original separately through its trusted account/portal/support channel. References written in this worksheet cannot authenticate themselves.
4. **Independent witness review**: Record a separate witness review for the same original case. The witness, owner signer and original provider issuer cannot simply authenticate their own claims. A duplicate receipt, wrong hash, self-referential authority or shared identity remains a conflict.
5. **Exact owner decision**: The actual account owner signs a **specific shop/account + product/SKU + permitted action** decision outside this worksheet. Record the original signed receipt, signer, signature and expiry dates, and a review outcome of pending, *reported approval (unverified)*, declined or revoked. Creating an Etsy draft is separate from publishing. Expired, revoked, unscoped or merely claimed approvals never authorize provider operations.
6. Enter missing-proof reasons, acknowledge the HOLD, and save a **browser-local, editable documentary note**. Click **Prepare independent verification handoff** to copy the unsigned packet for secure processing. Keep original documents and signed consent in an approved access-controlled evidence system, not plaintext site fields.

## Controls implemented in Build 613

- A source validator rejects extra/forged authorization flags, malformed SHA-256, invalid/future/chronologically wrong signing dates, suspicious credentials, wrong account/SKU/action and owner-type mismatches.
- A pure source-replay path verifies Build 608 against the exact Build 607 input chain before reviewing any locally entered notes.
- Cross-case reused original receipts/signatures and matching reviewer/witness, issuer/witness and owner/witness identities are flagged, not silently closed.
- Every response and owner handoff is marked `UNVERIFIED_DOCUMENTARY_INTAKE`, with **zero** authenticated issuer, authenticated witness, signed owner approval, authorized trial, provider read/write or D1 operation.
- A new section 34 in the existing Admin route reuses the **existing** issuer-response runtime module. No new runtime assets were created and the Release 465 **18 MB runtime source** budget remains enforced; harmless whitespace-only reductions in two existing product UI modules offset the Admin addition. No behavior is intentionally removed.
- The required Quality gate includes Build 613 focused regressions and all historical 595–612 tests. Independent System Gate/Preview, I.T. Admin Runtime, Branch Hygiene, Cloudflare production and separate Live Resource Integrity remain mandatory.

## What would actually clear the external HOLD?

Build a separately approved trustworthy verification and release workflow: securely enrol an **externally verified original provider public key or authenticated official provider readback**; verify document signatures/receipts against those trusted records and original custody; enrol **independent authenticated reviewer and witness identities**; authenticate the actual **owner's identity and signature** for the exact channel, shop/account, SKU and action; record explicit approval/decline/revocation and expiry in a **tamper-evident server-side append-only ledger**, with least-privilege roles and audit receipts; verify provider response independently; and separately have the owner authorize each actual provider operation. No arbitrary user-entered key, signature image, screenshot or local consent can replace these steps.

Do not activate Etsy/Meta drafts/images, uncertain-outcome retry, publication, sensitive database changes or production trial just because a worksheet contains plausible entries. The existing Production D1 proof PR #377 is still on HOLD and must not be bypassed.

## Proposed next Build 614

**Trusted Authority Enrollment, Server-Side Issuer/Witness Signature Proof & Exact Scoped Owner Decision Ledger** — securely enrol real verification roots and authenticated reviewer roles, perform actual cryptographic/provider evidence verification and separate explicit owner approval, while keeping provider operations gated until all necessary original evidence is independently verified. Production database migration and consent must be separately authorized.

## Release reference

Build 612 baseline: [GitHub Actions Quality run #42156786399](https://github.com/RosevearCreations/devilndove-site/actions/runs/42156786399), [Production #42157039340](https://github.com/RosevearCreations/devilndove-site/actions/runs/42157039340) and [Independent integrity #42157135084](https://github.com/RosevearCreations/devilndove-site/actions/runs/42157135084).
