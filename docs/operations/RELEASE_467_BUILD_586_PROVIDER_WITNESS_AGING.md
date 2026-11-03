# Devil n Dove Release 467 — Build 586

**Independent Provider Receipt Witness Exception Aging & Exact Owner Authorization Follow-Up**

Build 586 adds section 11 to `/admin/channel-trials/` and a source-matched priority queue for pending independent provider witness checks, unknown/duplicate Etsy results and exact account/Product/action owner authorization follow-ups.

## Owner walkthrough

1. Recompute original receipts, provider comparison, owner decision, witness and receipt follow-ups in sections 3–10.
2. Select one open source-pinned provider case. Enter a provider request ID only if the current Build 585 case already contains that ID; otherwise leave it blank to request missing external evidence.
3. Select the independent witness, exact owner authorization, or unknown provider outcome follow-up type. Choose its matching safe next step, a due date and a reason.
4. Save locally. View overdue 1–7 day and 8+ day queues; stale source tuples and replaced provider correlation IDs remain separate.
5. Copy the redacted open-case packet for real independent verification and a separately recorded owner decision.

## Hard gates

- Browser-local requests have `verification:OPEN_UNVERIFIED`, `owner_signoff:NOT_GRANTED`, `closed_exceptions:0`, `verified_provider_receipts:0`, `verified_owner_action_authorizations:0`, `trial_eligible_cases:0`, `provider_writes:0` and `d1_operations:0`.
- A due date, typed witness record or owner follow-up cannot authenticate a provider, authorize a trial or resolve an Etsy unknown create/image result.
- No live provider call, OAuth grant, D1 operation, Etsy draft/photo write, Meta post or Marketplace classified publication is performed. Etsy unknown outcomes remain read-before-retry; Facebook Marketplace is manual.
- Never paste keys, tokens, passwords, private image URLs or customer records.

## Checks

`node --test scripts/release467_build586_witness_aging.test.mjs` verifies age buckets, priority ordering, stale exact source and provider correlations, unsupported owner approval, no-write UI and immutable production marker. The full current release test suite and Admin route inventory remain required.

## Next candidate

**Build 587 — Provider Receipt Provenance Aging Review & Explicit Owner Trial Authorization Exception Triage**. Still gated by authentic externally checked proof and separate owner permission before any provider write.
