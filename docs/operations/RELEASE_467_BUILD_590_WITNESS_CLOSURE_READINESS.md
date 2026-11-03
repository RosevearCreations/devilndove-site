# Devil n Dove Release 467 — Build 590

**Independent Custody Witness Continuity & Exact Owner Trial Decision Exception Closure Readiness**

Build 590 adds section 15 to `/admin/channel-trials/`, drawing each review from one source-pinned Build 589 custody entry. The browser-local review shows exact custody witness continuity, independent review concerns and owner account/Product/action scope exceptions, without claiming authentication or approval.

## Owner review

1. Recompute current source comparisons and owner/provider follow-ups in sections 3–14. Select a Build 589 custody recheck item.
2. Check original provider custody evidence, current witness and separate reviewer references. For a follow-up in the same exact custody case, match the preceding witness reference to the previous record. Missing, changed, repeated or cross-role witness references are raised as exceptions.
3. Review the exact owner account, Product and proposed action. Wrong or missing scope remains a closure blocker; a typed owner decision reference is not a signature.
4. Record an unresolved next step, due date and reason. Copy the packet for independent source-custody authentication and a separately signed owner decision outside this worksheet.
5. If exact source evidence, a witness, decision scope or chain changes, prior source-pinned requests become stale. No local row can authorize provider writes or close an external exception.

## Explicit HOLD boundary

- `independently_authenticated_custody_witnesses`, `verified_owner_trial_decisions`, `verified_closure_ready_cases`, `closed_exceptions`, `trial_eligible_cases`, `provider_writes` and `d1_operations` remain zero, even with matching local witness references.
- `documentary_recheck_complete` means only that typed checklist fields have no detected discrepancy. It is not independent authentication, evidence custody proof, legal consent, an approved Etsy/Meta trial or case closure.
- No Etsy/Meta provider calls, OAuth exchange, D1 read/write, new draft, photo upload, publication or token transmission occurs. Unknown Etsy POST outcomes remain read-before-retry. Personal Facebook Marketplace classifieds remain a manual handoff.

## Test and promotion requirements

`node --test scripts/release467_build590_witness_continuity.test.mjs` checks exact source custody pins, cross-role witness gaps, predecessor continuity, owner scope mismatch, stale and forged records, no-write interface and release markers. Complete the full Release 467 regression suite and regenerated Admin route inventory before guarded `dev`/`main` promotion. Production GREEN requires exact merged source, successful Pages deployment, independent Live Resource Integrity Proof and live marker.

## Proposed next build

**Build 591 — Verified Witness Continuity Exception Escalation & Exact Owner Trial Gate Decision Handoff.** This is a candidate for separate authorization; external provider action remains HOLD.
