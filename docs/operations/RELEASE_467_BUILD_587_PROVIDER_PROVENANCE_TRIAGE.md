# Devil n Dove Release 467 — Build 587

**Provider Receipt Provenance Aging Review & Explicit Owner Trial Authorization Exception Triage**

Build 587 adds section 12 to `/admin/channel-trials/`. It reconciles the exact Build 586 open follow-up queue against current evidence/witness and provider ID conflicts. It surfaces overdue and duplicate-correlated provider source exceptions and the exact owner authorization gap, without pretending a local reference is provider-authenticated.

## Owner-safe review

1. Recompute the source-matched provider comparison, independent witness request, receipt reconciliation and aging queue in sections 3–11.
2. Select one current source-pinned follow-up. Review exact provider account, listing, individual images and scope conflicts, unknown/duplicate result, missing original provider receipt and unsatisfied owner sign-off.
3. Request primary provider receipt verification or escalation for witness items; use request/defer/decline only for an exact owner-authorization follow-up. Neither is a verified approval or execution authorization.
4. Copy the owner-safe packet to support separate provider proof and a separate explicit owner action decision. Old follow-up pins become stale when original source identity or provider correlation changes.

## Non-negotiable boundaries

- Every local triage row has `evidence_authentication:NOT_PERFORMED`, `owner_authorization:NOT_GRANTED`.
- `authenticated_provider_receipts:0`, `verified_owner_trial_signoffs:0`, `closed_exceptions:0`, `trial_eligible_cases:0`, `provider_writes:0` and `d1_operations:0` remain explicit.
- No Etsy/Meta requests, OAuth grants, D1 operations or publishing are performed by this worksheet. Unknown Etsy POST outcomes remain read-before-retry. Facebook Marketplace classified listings remain manual.
- Never enter tokens, passwords, client secrets, customer details or private media URLs.

## Validation

`node --test scripts/release467_build587_provenance_triage.test.mjs` covers source-pinned conflict/aging review, exact owner action scoping, stale follow-ups, failed forged evidence, no-write UI and production marker. The full Release 467 suite and Admin route inventory must pass before promotion.

## Next candidate

**Build 588 — Independent Provider Receipt Provenance Disposition & Owner Trial Authorization Decision Evidence Recheck**. Actual provider verification and owner write authorization remain separate external gates, not an automatically started trial.
