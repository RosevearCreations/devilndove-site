# Release 467 Build 104 — Product Work Session Focus Views

## Starting authority

Build 103 — **Product Work Session Paging & Full Coverage** is externally GREEN at exact SHA `8c5d73cbf9edbd5e40d1e2e03e3bd350df5b0146` / tree `f4e7b2071710c50cfdd3b33ca84bbb85650d86ee`.

Development proof:
- System Gate `34617580379` — SUCCESS
- Current Application Quality `34617580435` — SUCCESS
- I.T. Admin Runtime Proof `34617580311` — SUCCESS
- Repository Branch Hygiene `34617580348` — SUCCESS
- exact Preview deployment, canonical Development D1 proof, read-only Development data authority, Preview bindings, non-secret smoke and regression evidence — SUCCESS.

Production proof:
- Production Pages Deploy `34617779013` — SUCCESS
- Production Live Resource Integrity `34617890313` — SUCCESS.

Build 104 ingests that exact Build 103 external closure before introducing any new candidate behavior.

## Purpose

Build 103 made all 60 allowed pinned Products directly reachable through 20-item pages. Build 104 adds a presentation-only focus layer so operators can work the same session as **All, Active, Blocked, Ready or Done** without changing Product authority or adding another data source.

## Product work-session focus views

- `dd_catalog_work_session_v1` remains the only work-session state authority.
- The maximum session size remains 60 Product IDs.
- Focus modes are **All**, **Active**, **Blocked**, **Ready** and **Done**.
- Focus state is browser presentation state and is not written to Product or Inventory records.
- Changing focus returns focused paging to page 1.
- Build 103's 20-item Previous/Next paging runs against the focused result set.
- The live page summary reports the focused Product range, focused total and complete session total.
- Active contains only incomplete Products.
- Done contains only completed Products.
- Blocked and Ready reuse readiness already rendered by the primary Products loader.
- Marking done, undoing done, removing Products or clearing completed Products re-renders and safely clamps the focused page.
- **Locate next Product** and **Open next blocker** continue to scan the complete ordered work session rather than the active focus.
- Manual **Move Up / Move Down** is enabled only when Session order is Manual and Session focus is All, preventing hidden focused items from making the stored sequence ambiguous.

## Retained Product workflow

Build 104 preserves:
- Build 103 full-session paging and cross-page coverage;
- Build 102 accessible manual Move Up / Move Down controls;
- Build 101 Urgent / High / Normal / Low priority and Priority / Blockers / Readiness / Recent / Manual ordering;
- Build 100 browser-local Product work sessions and completion progress;
- Build 99 saved work views/browser sort;
- Build 98 readiness triage;
- Build 97 readiness navigation and earlier Product workspace protections.

The implementation reuses already-rendered Product rows, the shared `dd_admin_products_snapshot_v2` snapshot, and readiness already rendered by the primary Products loader.

## Safety boundary

Build 104 adds no Product or readiness API/database read. It performs no Product, Inventory, D1, R2, binding, payment, provider, publication or Production-business-data mutation. Focus state is presentation-only browser memory and is not a new business-data authority.

Canonical D1 migrations remain exactly:
1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

There is no migration `0005` and no request-time schema mutation.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Closure lifecycle

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 104 source is only a closure candidate. It must earn exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene, including exact Preview/D1/binding/smoke/regression proof. Only that exact GREEN SHA/tree may fast-forward to `main`, followed by Production Pages Deploy and Production Live Resource Integrity.

Build 104 may not self-record its later external closure. **Build 105 must ingest Build 104's final exact Development and Production proof.**
