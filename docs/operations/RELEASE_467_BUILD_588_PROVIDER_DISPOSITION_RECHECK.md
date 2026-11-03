# Devil n Dove Release 467 — Build 588

**Independent Provider Receipt Provenance Disposition & Owner Trial Authorization Decision Evidence Recheck**

Build 588 adds section 13 to `/admin/channel-trials/` and a source-bound evidence recheck for the Build 587 independent provider witness and exact owner-action follow-up cases. This is a real Admin review interface with local-only, unverified evidence candidates and an explicit safe next-disposition queue, not a provider integration trial.

## Owner review process

1. Refresh current authenticated-provider-independent source comparison, witness requests, reconciliation, aging and provenance triage in Admin sections 3–12.
2. Select a current Build 587 triage request. The recheck pins to the original exact follow-up and the individual triage record, including its date, reason and external case locator. Replaced, altered or stale source records do not inherit previous disposition notes.
3. Enter candidate evidence fields for account, Product, trial action and provider correlation only from records that will be authenticated independently. Compare their identifiers with the pinned case. Conflicts are surfaced, and missing primary evidence or an independent witness remain open.
4. For an owner-authorization follow-up, request a separate exact shop/Product/action decision, keep trial HOLD or request an external decline record. An owner reference typed into this page is not a signature or authorization.
5. Record next review time and unresolved reason, then copy the packet for independent source/owner review. Overdue local rechecks are shown separately from overdue original witness requests.

## Release and authorization boundary

- All typed `disposition_reviews` remain `source_authentication:NOT_PERFORMED` and `owner_authorization:NOT_GRANTED` regardless of matching IDs or supplied locators.
- Rechecks cannot set `provider_receipts_authenticated`, `verified_owner_trial_decisions`, `closed_exceptions`, `trial_eligible_cases`, `provider_writes` or `d1_operations` above zero.
- No Etsy/Meta API GET/POST, OAuth grant, photo upload, draft creation, publication, Cloudflare D1 mutation or trial permission is issued by this release.
- Unknown Etsy create/upload outcomes require independent signed-in provider readback before retry. Personal Facebook Marketplace classifieds remain manual.
- Only independently validated source evidence and separately explicit owner consent for the precise provider account, Product and action could support a subsequent externally authorized trial. A production GREEN software deployment alone does not.

## Tests

`node --test scripts/release467_build588_disposition_recheck.test.mjs` exercises exact source-pin recheck, identity/correlation conflicts, missing owner decision evidence, overdue disposition review, stale/forged requests, secret rejection, no-write boundaries, Admin wiring, CI and live release marker. The full Release 467 test suite and regenerated Admin route inventory are required before `dev`→`main` promotion.

## Proposed next build

**Build 589 — Provider Evidence Source-Custody Follow-Up & Owner Trial Decision Scope Revalidation.** This is a candidate for separate authorization, not permission to run external provider trials.
