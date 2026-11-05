# Devil n Dove — Build 610: CI Runtime Optimization, Test Budgeting & Promotion Queue SLA

## Measured baseline: Build 609

Evidence: GitHub Actions quality run 41957197044, System Gate 41957196979, production deploy 41957863833 and independent integrity run 41957962008.

| Job or step | Exact Build 609 duration |
| --- | ---: |
| Current Application Quality job | 348 s |
| Source Gate job | 69 s |
| Development Preview job | 42 s |
| Build 602 evidence test | 90 s |
| Build 601 evidence test | 88 s |
| Build 600 evidence test | 40 s |
| Current application quality preflight | 43 s |
| Production Cloudflare job | 52 s |
| Independent live resource proof | 17 s |

The three source-replay steps alone consumed 218 s sequentially. This is source-derived timing, not an estimated projection.

## Build 610 implementation

- All 14 historical source-pinned Build 595–608 tests remain mandatory and execute as separate Node processes, scheduled with **three concurrent workers**. The largest source-replay cases start first; no assertion or test file is omitted.
- Original JavaScript source and each test-file syntax verification remain mandatory.
- Hard limits: **240 s per test file** and **420 s per complete concurrent batch**; any exception, process error, source mismatch, test failure, missing fixture or hard timeout fails closed.
- Soft budget: **180 s** for the batch. A miss is recorded as a warning for performance triage, not misrepresented as a passing timing SLA.
- Exact per-file timings and counts are written to `artifacts/build610-evidence-test-timings.json`, uploaded with retention for owner review.
- Read-only `scripts/release467_build610_promotion_sla.mjs` collects GitHub Actions source timestamps for the four Development checks and the two Production checks. It reports observed p95 queue wait, observed p95 runtime, slowest steps and warnings against monitoring targets (120 s queue wait, 300 s quality runtime and 180 s production runtime). If the source is unavailable the report explicitly says **UNAVAILABLE** and does not claim GREEN. The local test includes forged status and invalid-time rejection.
- Read-only telemetry needs only `actions:read`; no GitHub write, provider token, Cloudflare mutation, D1, or store publication is authorized. Reports are CI artifacts and job summaries.
- The Build 609 fan-out reduction (23 manual-only historical workflows consolidated into current Quality) is retained.

## Promotion invariants

No weakening of System Gate, Current Application Quality, I.T. Admin Runtime, Repository Branch Hygiene, branch-authorized exact-head checks, Development Preview, Production Pages Deploy, independent Live Resource Integrity or zero-D1 postdeploy boundary. Database proof PR #377 remains untouched. Etsy/Meta connections and exact owner consent remain **HOLD** until authenticated independently.

## Acceptance

1. Run Build 610 self-tests and check the full source-replay inventory and timing budgets.
2. Confirm all four exact `dev` Development workflows GREEN, including the mandatory Build 609 historical bundled proof.
3. Promote the same tested tree through `dev` → `main`; verify live Build 610 release marker, Cloudflare smoke and independent Live Resource Integrity.
4. Compare Build 610 observed timing against Build 609's 348 s quality baseline; report actual improvement or regression without claiming a measured win beforehand.

**Next candidate:** Build 611 — Evidence Fixture Reuse & Reconciliation Replay Profiling (only after independent speedups retain full test coverage).
