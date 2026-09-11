# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 98 — Product Readiness Triage & Blocker Groups** is the current Development closure candidate.

Last fully verified Development is Build 97 — Product Readiness Work Queue & Blocker Navigation:
- `dev` `eef3c48a287cc919b1f4d964e8b504d4611e671e`
- tree `d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63`
- System Gate `34548442379` SUCCESS
- Current Application Quality `34548442377` SUCCESS
- I.T. Admin Runtime Proof `34548442359` SUCCESS
- Repository Branch Hygiene `34548442374` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 97:
- `main` `eef3c48a287cc919b1f4d964e8b504d4611e671e`
- tree `d2714d4e74fd7f85c9ca7efa0b63a366be1c4f63`
- Production Pages Deploy `34548574039` SUCCESS
- Production Live Resource Integrity `34548646961` SUCCESS.

## Build 98 scope

Build 98 extends the existing read-only readiness queue with browser-local blocker triage. The first blocker/help already rendered by the primary Product load is classified for workflow convenience into **Media**, **SEO**, **Commerce**, **Copy / story**, or **Other**. The original readiness result remains authoritative.

The selected group is saved only in the browser, live group counts are shown, and blocked Products remain ordered by lowest readiness score first inside the selected group. **Open next blocker** delegates to the existing Product-row blocker action. **Show next Product** reuses the explicit row-location behavior. No automatic Product switching, editing, publication or business-data mutation is introduced.

No extra Product/readiness API or database read is added. Build 97 readiness navigation, Build 96 Product search/focus, Build 95 current Product/table ergonomics, Build 94 responsive workspace navigation and Build 93 centered-shell/local-scroll protections remain active.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## Current external acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 98 closure sequence

1. Ingest Build 97 exact Development/Production closure into current restart authority.
2. Add browser-local blocker groups/counts and explicit next-blocker navigation without changing Product authority or adding data reads.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
7. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
8. Only then call Build 98 complete externally; Build 99 must ingest Build 98's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.
