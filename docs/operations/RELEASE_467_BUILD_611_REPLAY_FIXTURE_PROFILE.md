# Devil n Dove — Build 611: Exact Evidence Fixture Reuse, Reconciliation Replay Profiling and CI Runtime Reduction

## Baseline (measured, not estimated)
GitHub Actions Build 610 [Current Application Quality Proof #41963999084](https://github.com/RosevearCreations/devilndove-site/actions/runs/41963999084) completed in **239 seconds**. Its 14-file bounded source-replay batch took **133 seconds** (three workers). The most expensive files were Build 601 (131.4 s), Build 602 (127.2 s) and Build 600 (64.1 s), with CPU contention under parallel scheduling.

## Safe fix: reuse a freshly replayed fixture, not a durable cache
Builds 595–602 each replay the prior exact original-source packet, serialize/compare the result against the supplied packet, then redundantly call the same reconciliation again to derive the current state. For **identical timestamps only** Build 611 reuses the result that was *just recomputed and compared in the same function call*; for different timestamps it recomputes normally. The validation always takes place before reuse. There are **no cache entries across calls, no persisted snapshots, no use of unverified caller packets as current evidence, no weakened external signature or witness checks and no skipped source reconciliation**. The eight stages are:
- Build 595: independently validated Build 594 result
- Build 596: independently validated Build 595 result
- Build 597: independently validated Build 596 result
- Build 598: independently validated Build 597 result
- Build 599: independently validated Build 598 result
- Build 600: independently validated Build 599 result
- Build 601: independently validated Build 600 result
- Build 602: independently validated Build 601 result

The existing Build 595–608 test suites continue to execute completely under the **mandatory Current Application Quality** gate, including tampered source, signer/witness conflict, wrong owner scope, expired or changed date, and external-authentication HOLD scenarios. Build 611 adds explicit exact-time reuse and changed-clock/forged-source tests.

## Profiling and acceptance
The Build 610 timed runner still requires all **14** suites, **three workers**, a **240-second per-file hard budget**, and **420-second batch hard budget**; missing or failing tests, absent source data, or exceeded hard budgets fail the release. Build 611 adds `scripts/release467_build611_replay_profile.mjs`, which only accepts a complete successful test report and writes `artifacts/build611-source-replay-profile.json` with a transparent before/after comparison, durations for Builds 595–602 and remaining hotspots. A measured regression is visible, never disguised as GREEN; correct tests and required checks remain the release criteria. Reports are uploaded by the existing workflow; no additional per-push workflow is created.

Build 609's fan-out optimization (23 legacy workflows manual-only) and Build 610's read-only source-grounded queue SLA remain enabled. The latest QL-336 integration source and proposed migration are preserved.

## Deployment safeguards
The source-dependent Channel Trials JavaScript cache token and static Build identity advance to **611**, with no runtime asset additions. Exact `dev` proof remains four independent checks: System Gate/Preview, Current Application Quality, I.T. Admin Runtime and Branch Hygiene. `main` promotion is gated on those checks, exact tree match, Cloudflare Pages smoke, live Build 611 source marker and a separate independent Live Resource Integrity workflow with **zero D1 operations**.

No provider calls, OAuth, Etsy/Meta draft/image publication, D1 schema mutation or automatic owner trial authorization are introduced. Original issuer, witness and exact signed owner approval remain **HOLD** until independently verified.

## Next recommended build
**612 — Source-Replay Graph Profiling & CPU Contention Guardrails:** benchmark additional source-chain overlap only after exact Build 611 timings establish remaining hotspots; keep all mandatory checks fail-closed.
