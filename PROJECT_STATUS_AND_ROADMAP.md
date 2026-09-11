# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 103 — Product Work Session Paging & Full Coverage** is the current Development closure candidate.

Last fully verified Development is Build 102 — Product Work Manual Reorder & Accessibility:
- `dev` `7325c093f47c29aafaef0cff3da88f1b273227`
- tree `f7c1e97b1b811af68c2701db985ccc824e11abca`
- System Gate `34606547840` SUCCESS
- Current Application Quality `34606547841` SUCCESS
- I.T. Admin Runtime Proof `34606547865` SUCCESS
- Repository Branch Hygiene `34606547882` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 102:
- `main` `7325c093f47c29aafaef0cff3da88f1b273227`
- tree `f7c1e97b1b811af68c2701db985ccc824e11abca`
- Production Pages Deploy `34606720131` SUCCESS
- Production Live Resource Integrity `34606812380` SUCCESS.

## Build 103 scope

Build 103 removes the first-20-only limitation from the browser-local Product work-session panel. The session continues to hold at most 60 Products under `dd_catalog_work_session_v1`, but now exposes those Products through 20-item pages with keyboard-accessible Previous and Next controls and a visible page/range summary.

Page state is presentation-only. Sort changes return to the first page; shrinking the session automatically clamps the active page; and a Manual Move Up/Move Down that crosses a page boundary follows the moved Product onto its destination page. Locate next Product and Open next blocker continue to operate against the complete ordered session rather than the current page.

Build 102 manual reorder, Build 101 priority/order modes, Build 100 work sessions, Build 99 saved work views/browser sort, Build 98 readiness triage, Build 97 readiness navigation and earlier Product ergonomics remain active. Build 103 reuses existing Product rows, `dd_admin_products_snapshot_v2`, and readiness already rendered by the primary Product loader; no additional Product/readiness API or database read is introduced.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## External acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 103 closure sequence

1. Build 102 exact Development and Production closure is ingested into source authority.
2. Add browser-local Product work-session paging so all 60 allowed pinned Products are reachable without changing Product authority.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity on that exact SHA.
7. Build 104 must ingest Build 103's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.
