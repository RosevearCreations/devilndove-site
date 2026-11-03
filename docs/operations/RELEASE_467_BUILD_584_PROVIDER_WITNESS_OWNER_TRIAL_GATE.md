# Devil n Dove Release 467 — Build 584

**Authenticated Provider Evidence Witness Review & Explicit Owner Trial Authorization Gate**

This release adds section 9 to `/admin/channel-trials/`. It prepares an **independent witness review** and an **owner-specific trial authorization decision request** against the exact Build 583 evidence packet.

## Owner walkthrough

1. Recompute all source readbacks and the Build 583 evidence intake in sections 3–8.
2. Select one open provider exception. Request independent witness review using the **exact redacted evidence locator** from section 8. Describe the provider account, permission scope, unknown result and independent inspection step.
3. Request separate owner action-specific sign-off (or defer/decline the trial). The account, Product and provider action are taken from the selected source-pinned claim; there is no local Approve or Execute option.
4. Recheck and copy the decision gate. A changed provider claim, stale evidence locator or mismatched owner action remains open and is flagged. Account and permission scope disagreements require independent resolution.

## Safety and verification boundary

- Witness notes and owner requests are local records, not authenticated provider receipts, electronic signatures or permissions to write. A typed `reviewer_reference` does not prove independent identity.
- The trial stays **HOLD** with `authenticated_provider_receipts:0`, `verified_identity_and_scopes:0`, `verified_owner_action_authorizations:0`, `trial_eligible_cases:0` and `closed_exceptions:0` until independently obtained live proof and separately authorized action-specific owner sign-off are available.
- The page never makes provider API requests, OAuth grants, Etsy draft/image writes, Meta posts, D1 queries or publications.
- Do not paste passwords, API keys, tokens, customer information or private media links. Unknown Etsy writes require authenticated provider readback before retry; Facebook Marketplace classified listings remain a manual seller action.

## Acceptance

`node --test scripts/release467_build584_witness_trial_gate.test.mjs` tests request-only witness and owner workflows, exact-source staleness, account/scope disagreements, mismatched actions, forged approvals, no-write UI and build marker. The full Release 467 test suite and current Admin route inventory remain required.

## Next candidate

**Build 585 — Source-Authenticated Provider Receipt Reconciliation & Owner Trial Decision Exception Follow-Up**. No provider trial or approval should be initiated without real independently authenticated evidence and a separately authorized exact action.
