# Devil n Dove Release 467 — Build 589

**Provider Evidence Source-Custody Follow-Up & Owner Trial Decision Scope Revalidation**

Build 589 adds section 14 to `/admin/channel-trials/` and a new exact-source evidence-custody and owner scope recheck. Each candidate is pinned to the individual Build 588 disposition record; changes to source identity or the original provider case make older requests stale.

## Owner process

1. Refresh all local source comparison, independent witness, original receipt, aging and disposition sections 3–13. Do not assume local notes represent authentic third-party evidence.
2. Select an exact Build 588 disposition record. Recheck the original provider account, Product, proposed action and correlation as shown in that source.
3. Record the candidate original receipt locator, sending/receiving custodians, custody handoff record/time and independent witness reference for separate authentication. Missing or same-person custodians are explicitly flagged; duplicate handoff reference candidates are shown.
4. For an owner decision case, record only a candidate exact owner decision reference and account/Product/action; detect mismatch, missing scope, or expired candidate scope. Saving does not sign or authorize the action.
5. Record a separate safe next step, review due date and unresolved reason. Copy the HOLD packet for independent source and owner validation outside this worksheet. Changed exact dispositions leave older custody requests stale.

## Safety and acceptance

- All browser-local custody rows return `custody_authenticated:NOT_PERFORMED`, `owner_decision_authenticated:NOT_PERFORMED` and `owner_authorization:NOT_GRANTED`. Even matching source, handoff and owner references cannot establish authenticity.
- Global independent provider receipts, custody verification, verified owner trial authorizations, trial eligibility and closed exception counts remain zero.
- No Etsy/Meta provider GET/POST, OAuth exchange, draft creation, photo upload, Facebook/Instagram publishing, D1 operation or provider write is performed. Unknown Etsy POST outcomes stay read-before-retry; Facebook Marketplace classifieds stay a manual handoff.
- A successful source deployment is independent from explicit owner permission for a specific provider shop, Product and action.

## Validation

Run `node --test scripts/release467_build589_custody_recheck.test.mjs`, then the full Release 467 test suite and canonical Admin route inventory verification before protected `dev`→`main` promotion. Require all Development checks, exact production SHA deployment, independent Production integrity proof and live Build 589 marker before declaring GREEN.

## Next candidate

**Build 590 — Independent Custody Witness Continuity & Exact Owner Trial Decision Exception Closure Readiness.** This is a proposal only, not authorization to perform external provider trials or close unverified cases.
