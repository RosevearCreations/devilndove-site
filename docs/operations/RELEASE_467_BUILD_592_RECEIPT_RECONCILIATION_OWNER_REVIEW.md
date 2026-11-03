# Devil n Dove Release 467 — Build 592

**External Witness Escalation Receipt Follow-Up & Owner Action Decision Evidence Reconciliation**

Build 592 adds section 17 to `/admin/channel-trials/`. This is a browser-local, source-pinned evidence reconciliation worksheet. It does **not** authenticate an external response, sign owner authorization, perform an Etsy/Meta trial or close an exception.

## Owner review and independent source follow-up

1. Recompute the prior source/evidence sections through Build 591 (sections 5–16). Select an exact unresolved escalation; a missing escalation cannot be reconciled here.
2. Compare the provider account, Product, exact proposed action, independent external case ID, original provider receipt ID and assigned independent reviewer with the source escalation. A mismatch stays listed as an exception.
3. Enter a separate candidate external response reference and independent witness identity. An independent reviewer may not be their own witness. A response reference or witnessed claim typed locally is **not** source-authenticated evidence.
4. For an owner-action escalation, record the candidate separately signed decision locator, signer and the precise account/Product/action. A typed record is neither a signed authorization nor a verified decline.
5. Record the still-open discrepancy, next external action and independent review due date. Export the resulting HOLD packet for actual outside evidence validation and a separately authorized owner decision.

## Safety and proof boundary

- The new worksheet recomputes the exact Build 591 escalation with its source arguments. Forged, changed, stale or superseded source references are rejected or explicitly called out.
- Source conflicts, missing primary receipts, absent independent witnesses, incomplete owner scope, overdue reviews and repeated candidate response IDs remain visible.
- `receipt_authentication`, `owner_decision_authentication` and all downstream proof claims remain `NOT_PERFORMED`/false; aggregate authenticated receipts, verified owner decisions, closed exceptions, trial eligibility, provider writes and D1 operations remain zero.
- No provider GET/POST, OAuth token grant, Etsy draft/image upload, Meta post or D1 operation is implemented. Unknown Etsy outcomes still require real authenticated readback before retry. Personal Facebook Marketplace classifieds remain manual.

## Release acceptance

Run Build 592 and the full Release 467 regression suite, regenerate/check Admin route inventory and wait for all four current Development gates. Merge only the exact accepted `dev` head to `main`; Production GREEN requires successful Pages deploy, independent live-integrity proof and the correct live Build 592 commit marker.

## Next proposed build

**Build 593 — Independent Provider Response Authenticity Exception Matrix & Exact Owner Scope Decision Readiness.** Proposal only; no live external trial is implied.
