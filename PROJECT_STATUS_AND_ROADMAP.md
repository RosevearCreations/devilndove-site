# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 104 — Product Work Session Focus Views** is the current Development closure candidate.

Last fully verified Development is Build 103 — Product Work Session Paging & Full Coverage:
- `dev` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- System Gate `34617580379` SUCCESS
- Current Application Quality `34617580435` SUCCESS
- I.T. Admin Runtime Proof `34617580311` SUCCESS
- Repository Branch Hygiene `34617580348` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 103:
- `main` `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146`
- tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`
- Production Pages Deploy `34617779013` SUCCESS
- Production Live Resource Integrity `34617890313` SUCCESS.

## Build 104 scope

Build 104 adds browser-local focus views across the existing Product work session: **All, Active, Blocked, Ready and Done**. Focus filtering is presentation-only and uses the existing session state, rendered Product rows and rendered readiness evidence.

The selected focus resets paging to page 1 and Build 103's 20-item paging operates against only the focused items. The page summary reports the focused range plus the complete session total. Session progress remains global.

Locate next Product and Open next blocker remain full-session actions, independent of focus. Manual ordering remains fail-clear by requiring All focus before Move Up / Move Down is enabled.

Build 103 paging, Build 102 manual reorder, Build 101 priority/order modes, Build 100 work sessions, Build 99 saved work views/browser sort, Build 98 readiness triage and earlier Product ergonomics remain active. No additional Product/readiness API or database read is introduced.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## External acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 104 closure sequence

1. Build 103 exact Development and Production closure is ingested into source authority.
2. Add browser-local Product work-session focus views without changing Product authority.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 105 must ingest Build 104's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.
