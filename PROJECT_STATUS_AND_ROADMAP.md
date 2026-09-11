# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 102 — Product Work Manual Reorder & Accessibility** is the current Development closure candidate.

Last fully verified Development is Build 101 — Product Work Priority & Next-Action Ordering:
- `dev` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- System Gate `34603707283` SUCCESS
- Current Application Quality `34603707270` SUCCESS
- I.T. Admin Runtime Proof `34603707267` SUCCESS
- Repository Branch Hygiene `34603707269` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 101:
- `main` `73cd0d56071a60c562000d5804f819f6dde10a13`
- tree `2ef06219e4b1eeb1e525680fc45107eb6ebc5226`
- Production Pages Deploy `34603913028` SUCCESS
- Production Live Resource Integrity `34604002146` SUCCESS.

## Build 102 scope

Build 102 makes Build 101's Manual session order genuinely editable. Manual mode now exposes keyboard-accessible Move Up and Move Down controls for pinned Products, with disabled boundary controls for the first/last item and disabled reorder controls outside Manual mode.

The stored order remains inside `dd_catalog_work_session_v1`. Locate next Product and Open next blocker continue to consume the selected session order, so manual changes immediately control the operator's next-action sequence without changing Product records.

Build 101 priority/order modes, Build 100 work sessions, Build 99 saved work views/browser sort, Build 98 readiness triage, Build 97 readiness navigation and earlier Product ergonomics remain active. Build 102 reuses existing Product rows, `dd_admin_products_snapshot_v2`, and readiness already rendered by the primary Product loader; no additional Product/readiness API or database read is introduced.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## External acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 102 closure sequence

1. Build 101 exact Development and Production closure is ingested into source authority.
2. Add accessible browser-local manual Product session reordering while reusing existing Product/readiness projections.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 103 must ingest Build 102's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.