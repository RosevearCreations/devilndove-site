# Devil n Dove Build 720 — Provider Binding Freshness & Source Drift Alerts, Independent Custody Reviewer Receipt Recovery and Protected Owner Evidence Ledger Approval Gate

## Baseline
The exact last Production GREEN baseline is Build 719 main `7a37e1165c919a6ba6f1440404e3e8474ee2b457` with Production Pages Deploy #43616246521 and independent Live Resource Integrity #43616332791 both successful. This build is the next distinct software release; GREEN never implies an independently signed external custody document or bookkeeping close.

## What changes
An existing authenticated I.T. Admin function (Build 406) now supports on-demand `GET /api/admin/production-variable-audit-406?review=720`. It preserves existing default Build 406 audits and never returns secret values. Build 720 emits:
- required `SESSION_SECRET` presence; D1 `DB` and both R2 resource binding names, not live bucket data;
- optional provider groups as NOT_CONFIGURED_OPTIONAL (safe until activated), INCOMPLETE_REVIEW_HOLD, or PRESENT_UNVERIFIED;
- production Etsy redirect match result without returning the URL value, and PayPal `PAYPAL_SECRET` canonical runtime name with legacy `PAYPAL_CLIENT_SECRET` warning;
- metadata-only alerts for missing required settings, missing D1/R2 binding, incomplete opt-in provider, absent/mismatched active Etsy callback or unsupported legacy PayPal credential name;
- explicit UNVERIFIED freshness and no-source HOLD for independently signed ninth and outside custody evidence, source-authenticated live signed R2 media, and owner ledger approval.

The existing I.T. Integrations page gains a manual Review button and readable diagnostic result. It directs an authorized owner to the **original Build 718** independently signed `financial718` audit in the Financials Admin page and original authenticated camera/media source. This page does **not** forge third-party receipts, create reviewer signatures, persist approvals, silently overwrite Cloudflare secrets, read D1 financial rows, or call outside providers. It is a review/readiness gate; an actual owner ledger approval must be recorded by a separately authorized, source-bound write workflow with independent proof, never guessed from a clicked status.

## Owner workflow
1. Open `https://devilndove.com/admin/it-integrations/` and log in as an active administrator.
2. Click **Build 720 — Review binding differences and renewal HOLDs**. Compare reported binding NAME/status to the approved Cloudflare Production dashboard, not to pasted credential strings. A PRESENT credential is not proof of provider authorization or freshness.
3. If `CORE_REQUIRED_MISSING` or `RESOURCE_BINDING_MISSING` appears, repair only the actual missing Cloudflare Production secret/resource binding using owner-controlled dashboards and controlled deployment. Do not add duplicates to GitHub when the workflow already names the value.
4. If Etsy OAuth is configured but callback mismatched, confirm the canonical `https://devilndove.com/api/social/oauth/etsy/callback` in the Etsy Developer app and Cloudflare Production; do not rotate unrelated credentials.
5. If PayPal credentials are enabled, the application payment runtime requires `PAYPAL_SECRET`, not just the older `PAYPAL_CLIENT_SECRET`. Sandbox first, provider execution remains separately gated.
6. To review a missing ninth or separately signed external custody reviewer receipt, open `https://devilndove.com/admin/social-publishing/`, select the original financial campaign and use the Build 718 authenticated audit and approved independent signing handoff. Absent, invalid, expired or signer-identical receipt remains HOLD; a human owner note is not an outside signature.
7. To review original media, open `https://devilndove.com/admin/mobile-product/` and explicitly rerun the original 709–718 signed D1/live R2 HEAD source and owner 702 attestation checks. Missing/stale source remains HOLD.
8. Ledger approval/financial close remains **NOT RECORDED** by Build 720. Only a genuinely authorized, separately reviewed durable approval with original source provenance can change that fact.

## Security / release acceptance
Fail closed on invalid source and missing secrets, distinguish optional from required keys, return no secret values or fingerprints, preserve original authentication/no-store response and provider locks. Negative contract tests cover absent core/bindings, absent/partial/mismatched Etsy, PayPal legacy naming, secret non-disclosure, no automatic external call, no fabricated independent receipt/owner approval. Protected feature PR exact SHA CI, protected dev merge and exact-dev full mandatory checks, protected dev-to-main PR and exact new main Production Pages Deploy/public smoke plus separate Live Resource Integrity workflow success are all required for software Production GREEN. D1 migrations: none. R2 writes: none. Provider execution: none.

## Next possible Build 721
Owner-approved credential lifecycle age evidence with provider-issued rotation receipts, source-pinned independent original custody recovery handoff and durable owner-approval ledger **only after** real independent issuer/source authority and owner consent. Never claim externally verified renewal or owner approval from CI fixtures.
