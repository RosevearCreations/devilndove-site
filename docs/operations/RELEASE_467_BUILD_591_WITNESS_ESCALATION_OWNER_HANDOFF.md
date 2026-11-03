# Devil n Dove Release 467 — Build 591

**Verified Witness Continuity Exception Escalation & Exact Owner Trial Gate Decision Handoff**

Build 591 adds section 16 to `/admin/channel-trials/` for independent-provider witness continuity exception escalation and source-matched owner trial decision handoff. It can request outside verification and owner decisions; it cannot claim either happened.

## Exact-source review

1. Refresh existing source-comparison, owner decision, custody and witness sections 3–15. Select a current exact Build 590 witness record. Replaced or changed source records stale older escalations.
2. Review outstanding witness gaps, missing original provider custody attestation, broken predecessor references, duplicate or ambiguous external case references and independent reviewer assignment.
3. Enter only safe external escalation/primary receipt locators. For an owner case, capture a separate exact-action decision handoff reference and match candidate provider account, Product and action to the pinned case.
4. Use provider witness escalation actions only for provider witness follow-ups; use owner trial-decision request, defer/decline or scope conflict escalation only for owner follow-ups. These request actions do not record actual consent or closure.
5. Record an unresolved reason and next independent review due time. Export the HOLD packet for authentication by the provider and an exact separate owner decision.

## Safety boundary

- Every local request is `independent_attestation:NOT_PERFORMED`, `owner_trial_authorization:NOT_GRANTED`, `provider_request_sent:false` and `exception_closed:false`.
- The packet's `authenticated_provider_witnesses`, `verified_owner_trial_signoffs`, `verified_exception_closures`, `trial_eligible_cases`, `provider_writes` and `d1_operations` remain zero regardless of complete or matching typed data.
- `documentary_handoff_packet_complete` means only that a typed worksheet has no detected missing field or discrepancy. It is not third-party authentication, legal authorization, an approved provider trial or actual case closure.
- No Etsy/Meta provider GET/POST, OAuth exchange, draft creation, photo upload, publication or D1 call is performed. Unknown Etsy outcomes stay read-before-retry; personal Facebook Marketplace classifieds stay manual.

## Validation

Run the Build 591 regression plus the entire Release 467 test suite and regenerate/check the Admin route inventory. Promote only after all required Development gates succeed. Production GREEN requires exact `dev`/`main` tree parity, successful Pages deployment, independent Production Live Resource Integrity Proof and live Build 591 marker.

## Next candidate

**Build 592 — External Witness Escalation Receipt Follow-Up & Owner Action Decision Evidence Reconciliation.** Proposed only; external provider actions require separate explicit authorization.
