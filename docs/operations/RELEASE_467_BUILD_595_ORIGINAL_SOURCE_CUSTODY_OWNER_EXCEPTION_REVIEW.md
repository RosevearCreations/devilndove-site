# Devil n Dove Build 595 — independent original source, custody and owner decision review

## Owner procedure (no provider access)

1. In Admin → Channel Trials, recompute sections 5–19. Section 20 is locked to the
   exact Build 594 source intake. Changed, superseded, copied or outdated inputs
   require a fresh upstream review.
2. For each current source case, obtain the original provider record and original
   custody receipt through an authorized independent channel. Enter **locators**,
   not API tokens, passwords, personal secrets or document contents.
3. Select both documents locally and choose **Calculate local document SHA-256**.
   No file data is transmitted or retained by this feature. Compare the computed
   digests with independently supplied issuer and custody-log SHA-256 values.
   A matching digest establishes only that the selected bytes match those
   independently supplied fingerprints; it cannot authenticate the issuer or
   provider. Preserve the original evidence outside the browser.
4. Reconcile the provider response ID, original provider record, original receipt,
   issuer, custodian, handoff chronology, independent reviewer and separate witness
   against the exact Build 594 and 593 records. Each disagreement remains an open
   exception, including possible reuse of the same document fingerprint across
   different cases. Investigate duplicates before interpreting them.
5. For an owner decision, separately reconcile the signed decision locator and
   signer against the exact shop/account, Product/SKU and proposed action. Record
   only a follow-up status. An owner decision has **not** been authenticated by
   entering references or hashes. Missing, conflicting and overdue approvals
   remain pending, even if a document appears to say "approved".
6. Save the local unresolved evidence review or copy its JSON exception packet to
   the authorized review channel. Neither button contacts Etsy, Meta or D1.

## Release and safety boundaries

- This is a browser-local document-byte cross-check and source-pinned review, not
  cryptographic provider-signature validation, a verified owner authorization, or
  permission for live Etsy/Meta API calls.
- Failed/unknown provider outcomes, real external trials, OAuth exchanges, Etsy
  draft/image uploads, Meta publication, D1 data mutations and exception closure
  stay on **HOLD**, requiring separate authentic external evidence and exact owner
  authorization before any independent execution plan.
- Production GREEN means the static code deployed and live integrity gates passed;
  it does not mean that provider evidence, owner consent or a trial is GREEN.

## Proof locations

- `public/js/admin-channel-source-verification-595.mjs`
- `scripts/release467_build595_source_verification.test.mjs`
- `.github/workflows/current-application-quality.yml`
- `.github/workflows/production-pages-deploy-current.yml`
