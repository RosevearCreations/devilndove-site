# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 101 — Product Work Priority & Next-Action Ordering** is the current Development closure candidate.

Last fully verified Development is Build 100 — Product Work Session & Progress:
- `dev` `20400309f3ab450cc256769870e8f963f8d3de3c`
- tree `3344c8e4d8c177820ea5077f4b429ff1e832d881`
- System Gate `34598663510` SUCCESS
- Current Application Quality `34598663549` SUCCESS
- I.T. Admin Runtime Proof `34598663501` SUCCESS
- Repository Branch Hygiene `34598663509` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 100:
- `main` `20400309f3ab450cc256769870e8f963f8d3de3c`
- tree `3344c8e4d8c177820ea5077f4b429ff1e832d881`
- Production Pages Deploy `34598827876` SUCCESS
- Production Live Resource Integrity `34598920977` SUCCESS.

## Build 101 scope

Build 101 extends the browser-local Product work session with Urgent / High / Normal / Low priorities and selectable session ordering: Priority, Blockers, Readiness, Recent and Manual. The next Product and next blocker actions follow the selected session order so the operator can work the most important Products first without changing Product records.

Priority and ordering persist only in `dd_catalog_work_session_v1`. Existing Build 100 sessions default missing priority to `normal`. Build 101 reuses existing Product rows, `dd_admin_products_snapshot_v2`, and readiness already rendered by the primary Product loader; no additional Product/readiness API or database read is introduced.

Build 100 work sessions, Build 99 saved work views/browser sort, Build 98 readiness triage, Build 97 readiness navigation, Build 96 search/focus, Build 95 current Product context/table ergonomics, Build 94 responsive navigation and Build 93 shell protections remain active.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## External acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 101 closure sequence

1. Build 100 exact Development and Production closure has been ingested into source authority.
2. Add browser-local Product priority and next-action ordering while reusing the existing Product snapshot/readiness projection.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 102 must ingest Build 101's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.