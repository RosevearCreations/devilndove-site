# Devil n Dove — Markdown / Authority Index

## Canonical current authority — Release 467 Build 9

**Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** is the active Development source candidate. The exact Development-green predecessor is **Release 467 Build 8 — Authority Convergence and Restart Safety** at `94a891d3cb0608a91550c90fb04acea05cff75b3`.

Read current authority in this order:

1. `current-development-authority.json` — machine-readable current Release 467 restart pointer and safety boundary.
2. `AI_HANDOFF.md` — exact restart instructions, current external HOLDs and next bounded work.
3. `release467-build9-historical-ci-retirement.json` — Build 9 source contract.
4. `PROJECT_STATUS_AND_ROADMAP.md` — current release/build progression.
5. `SANITY_HEALTH_CHECK.md` — current evidence and safety checklist.
6. `docs/operations/RELEASE_467_BUILD_9_HISTORICAL_CI_RETIREMENT.md` — Build 9 CI retirement authority.
7. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md` — canonical startup/preflight mechanics.
8. `release467-build8-authority-convergence.json` — locked Build 8 authority.
9. `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md` — Build 8 authority-convergence rationale.
10. `release467-build7-external-commercial-acceptance.json` — commercial/provider acceptance bridge.
11. `release467-build6-access-acceptance-harness.json` — separate Development Cloudflare Access authority.
12. `release467-build5-production-promotion-readiness.json` — separate exact-candidate Production promotion HOLD/READY authority.
13. `development-release.json` — **inherited Release 466 regression compatibility evidence only; not the current Release 467 restart pointer**.

## Exact green predecessor

Release 467 Build 8 merged to `dev` at `94a891d3cb0608a91550c90fb04acea05cff75b3` with tree `09d9f822c9987d3422921e819c913427af664184`.

- System Gate `33631757568` — SUCCESS.
- Release 467 Build 8 Authority Convergence Proof `33631758140` — SUCCESS.
- Build 8 schema/D1/R2/provider/Access/main/Production mutation authority — NONE.

Build 8 itself retains locked Release 467 Build 7 evidence at `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`.

## Build 9 CI boundary

Release 466 Build 1–6 workflow files remain in `.github/workflows` for manual provenance only. They no longer auto-run on `dev` pushes or pull requests. Their `scripts/release466_build*_gate.py` proof source and historical GitHub Actions evidence remain available.

Current automatic CI is governed by the canonical `System Gate` and current Release 467 workflows. Historical Release 466 workflow conclusions cannot override current Release 467 authority.

## Compatibility boundary

`development-release.json` intentionally remains top-level Release 466 because inherited regression assertions still consume historical convergence fields. Its role is compatibility, not current release selection. The current selector remains `current-development-authority.json`.

Do not rewrite historical compatibility evidence merely to make version labels newer.

## External boundaries

External acceptance remains truthful `HOLD_EXTERNAL` unless separately proven. Cloudflare Access service-token acceptance, Stripe Development, PayPal sandbox and Social/OAuth remain separate from source-green Release 467 work. CAIP private-media status comes from fresh current runtime evidence.

Production promotion remains separate and manual. Build 9 does not change `main`, Production data, D1/R2, providers, OAuth state, Cloudflare Access policy or secrets.

## Historical material

Release 466 and earlier release/build documents remain provenance and compatibility evidence. Release 466 Build 1–6 workflow definitions are now manual-only; they cannot reopen historical migrations, authorize provider execution/publication, or authorize Production promotion.
