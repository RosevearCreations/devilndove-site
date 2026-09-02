# Devil n Dove — Markdown / Authority Index

## Canonical current authority — Release 467 Build 10

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** is the active Development source candidate. The exact Development-green predecessor is **Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** at `d8a9ffba03f980b9632643d91d9aa69b25bd94fd`.

Read current authority in this order:

1. `current-development-authority.json` — machine-readable current Release 467 restart pointer and safety boundary.
2. `AI_HANDOFF.md` — exact restart instructions, current external HOLDs and next bounded work.
3. `release467-build10-it-control-tower-consolidation.json` — Build 10 source/runtime contract.
4. `PROJECT_STATUS_AND_ROADMAP.md` — current release/build progression.
5. `SANITY_HEALTH_CHECK.md` — current evidence and safety checklist.
6. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md` — canonical startup/preflight mechanics.
7. `docs/operations/RELEASE_467_BUILD_10_IT_CONTROL_TOWER.md` — Build 10 I.T. operations authority.
8. `release467-build9-historical-ci-retirement.json` — Build 9 CI retirement authority.
9. `docs/operations/RELEASE_467_BUILD_9_HISTORICAL_CI_RETIREMENT.md` — Build 9 rationale/evidence.
10. `release467-build8-authority-convergence.json` — locked Build 8 authority.
11. `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md` — Build 8 current-vs-compatibility rationale.
12. `release467-build7-external-commercial-acceptance.json` — commercial/provider acceptance bridge.
13. `release467-build6-access-acceptance-harness.json` — separate Development Cloudflare Access authority.
14. `release467-build5-production-promotion-readiness.json` — separate exact-candidate Production promotion HOLD/READY authority.
15. `development-release.json` — **inherited Release 466 regression compatibility evidence only; not the current Release 467 restart pointer**.

## Exact green predecessor

Release 467 Build 9 merged to `dev` at `d8a9ffba03f980b9632643d91d9aa69b25bd94fd` with tree `949f2523d31e0f47ed1e19ff7655de2762fbc1df`.

- System Gate `33633043297` — SUCCESS.
- Release 467 Build 9 Historical CI Retirement Proof `33633043229` — SUCCESS.
- Build 9 schema/D1/R2/provider/Access/main/Production mutation authority — NONE.
- Release 466 Build 1–6 proof workflows remain manual-only provenance.

## Build 10 I.T. boundary

Build 10 makes `/admin/it/` the current read-only operational first stop. It consolidates existing subsystem evidence into current release/deployment context and one prioritized recovery queue. It does not auto-repair D1, permissions, R2, providers, Access or Production.

The new runtime contract is `functions/api/admin/it-operations-control-tower.js`; the operator renderer remains `public/js/admin-it-control-tower.js`.

## Compatibility boundary

`development-release.json` intentionally remains top-level Release 466 because inherited regression assertions still consume historical convergence fields. The middleware runtime Release 466 header is also retained as explicit **INHERITED_RUNTIME_COMPATIBILITY**. Neither surface selects the current release; the selector remains `current-development-authority.json`.

Release 467 Build 8 — Authority Convergence and Restart Safety established this split. Do not rewrite historical compatibility evidence merely to make version labels newer.

## External boundaries

External acceptance remains truthful `HOLD_EXTERNAL` unless separately proven. Cloudflare Access service-token acceptance, Stripe Development, PayPal sandbox and Social/OAuth remain separate from source/runtime-green Release 467 work. CAIP private-media status comes from fresh Build 7 runtime evidence.

Production promotion remains separate and manual. Build 10 does not change `main`, Production data, D1/R2, providers, OAuth state, Cloudflare Access policy or secrets.

## Historical material

Release 466 and earlier release/build documents remain provenance and compatibility evidence. Release 466 Build 1–6 workflow definitions remain manual-only under Build 9; they cannot reopen historical migrations, authorize provider execution/publication, or authorize Production promotion.
