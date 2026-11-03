# Devil n Dove Release 467 — Build 585

**Source-Authenticated Provider Receipt Reconciliation & Owner Trial Decision Exception Follow-Up**

Build 585 adds section 10 to `/admin/channel-trials/`. It prepares exact ID reconciliation of *claimed* external provider evidence against the original account, listing and individual image IDs, anchored to a current Build 584 witness request.

## Owner walkthrough

1. Recompute the exact source from sections 3–9, including the provider witness and owner decision requests.
2. Select the open case, enter its exact witness evidence locator and redacted provider correlation ID, and compare the externally observed shop/account, listing/draft, individual image IDs and permission scope.
3. Choose the unresolved external follow-up: independent authenticated provider readback, duplicate/unknown result escalation, exact image reconciliation, or separate owner action decision.
4. Review the source-matched output. Mismatched account, listing, image or scope, duplicate correlation IDs, changed provider claims and stale witness references remain outstanding.

## External authentication and owner authority remain separate gates

- A typed receipt, matching image IDs or witness name **never authenticates a provider**. This is a browser-local follow-up packet; no live Etsy/Meta API, OAuth, D1 operation or publishing request occurs.
- Only a separately checked **actual provider-issued** receipt, authenticated account and actual permissions can support future source authentication. The current app has no independent server-verified provider receipt available to Build 585, so counters remain zero.
- `authenticated_provider_receipts:0`, `verified_remote_images:0`, `verified_permissions:0`, `verified_owner_trial_authorizations:0`, `trial_eligible_cases:0`, `closed_exceptions:0`, `provider_writes:0` and `d1_operations:0` remain enforced.
- Owner approval must be a separate, explicit account/Product/action-specific authorization; it cannot be inferred from a saved form or a GREEN deployment.
- Unknown Etsy draft/image writes require a real provider readback before retry; Facebook Marketplace classified listings remain manual.

## Acceptance

`node --test scripts/release467_build585_receipt_followup.test.mjs` checks matching and mismatching IDs, duplicate correlation IDs, stale exact-source references, forged approval, secret-bearing entries and source marker. The complete Release 467 test suite and admin route inventory are mandatory.

## Next proposed build

**Build 586 — Independent Provider Receipt Witness Exception Aging & Exact Owner Authorization Follow-Up**, conditional on actual provider/owner evidence and separate authorization before any live external action.
