# Devil n Dove Build 594 — source-verification intake and owner exception aging

## Owner review workflow

1. Open Admin → Channel Trials and recompute sections 5–18 in order. The section 19
   matrix requires a byte-for-byte recomputable Build 593 packet and all original
   upstream sources; stale or modified upstream data must be reviewed again.
2. Select an exact provider response or owner scope case. Record **candidate**
   original provider response/issuer/custody references and a separate reviewer and
   witness. The source identifiers must be checked against the underlying documents
   by an independent person outside this worksheet.
3. For owner cases, record the exact account, Product/SKU and proposed action along
   with the separately signed decision document and signer candidate. Missing proof
   or a mismatch is an open exception, not an owner approval.
4. Record the next review due date and review the `NOT_DUE`, `DUE_SOON`, `OVERDUE`,
   `OVERDUE_SEVERE` or `UNKNOWN_DUE_DATE` classification. Escalate overdue owner
   decisions while preserving the original response and document provenance.
5. Export/copy the local unresolved exception packet to the authorized owner
   review channel. The browser-local save does not transmit it externally.

## Safety and release criteria

- Exact Build 593 source reproduction, typed source locators and independent-party
  mismatch checks are **reference checks**, not independent provider authentication.
- Provider responses, custody, original receipts and owner decisions are **not
  verified** by this build. All Etsy/Meta API trials, retries of uncertain uploads,
  live publishing, D1 mutations and exception closures remain **HOLD**.
- Owner approval requires separate authentic source evidence and an explicit
  authorized trial decision for the exact account, Product and action.
- Production GREEN means the static application release is healthy; it does not
  signify external API credentials, provider trial authorization or publication.

## Evidence references

- Source logic: `public/js/admin-channel-authenticity-matrix-593.mjs` and
  `public/js/admin-channel-intake-aging-594.mjs`.
- Deterministic regression: `scripts/release467_build594_intake_aging.test.mjs`.
- Protected quality gate: `.github/workflows/current-application-quality.yml`.
- Independent live proof and deployment: `.github/workflows/production-pages-deploy-current.yml`.
