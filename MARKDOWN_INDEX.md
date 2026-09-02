# Devil n Dove — Markdown / Authority Index

## Canonical current authority — Release 467 Build 11

**Release 467 Build 11 — Admin Operations Command Center** is the active Development source candidate. The exact Development-green predecessor is **Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** at `cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a`.

Read current authority in this order:

1. `current-development-authority.json` — machine-readable current Release 467 restart pointer and safety boundary.
2. `AI_HANDOFF.md` — exact restart instructions, current external HOLDs and next bounded work.
3. `release467-build11-admin-operations-command-center.json` — Build 11 admin runtime/UI contract.
4. `PROJECT_STATUS_AND_ROADMAP.md` — current release/build progression.
5. `SANITY_HEALTH_CHECK.md` — current evidence and safety checklist.
6. `docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md` — Build 11 operator authority.
7. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md` — canonical startup/preflight mechanics.
8. `release467-build10-it-control-tower-consolidation.json` — Build 10 technical first-stop authority.
9. `docs/operations/RELEASE_467_BUILD_10_IT_CONTROL_TOWER.md` — Build 10 I.T. operations authority.
10. `release467-build9-historical-ci-retirement.json` — Build 9 CI retirement authority.
11. `docs/operations/RELEASE_467_BUILD_9_HISTORICAL_CI_RETIREMENT.md` — Build 9 rationale/evidence.
12. `release467-build8-authority-convergence.json` — locked Build 8 authority.
13. `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md` — Build 8 current-vs-compatibility rationale.
14. `release467-build7-external-commercial-acceptance.json` — commercial/provider acceptance bridge.
15. `release467-build6-access-acceptance-harness.json` — separate Development Cloudflare Access authority.
16. `release467-build5-production-promotion-readiness.json` — separate exact-candidate Production promotion HOLD/READY authority.
17. `development-release.json` — **inherited Release 466 regression compatibility evidence only; not the current Release 467 restart pointer**.

## Exact green predecessor

Release 467 Build 10 merged to `dev` at `cba1fbe1c0acc71c9f2f0d29bdb6d5bef09e380a` with tree `c2de52782f96fa43d1e5d2eabd80b30a23c62ecd`.

- System Gate `33635318725` — SUCCESS.
- Release 467 Build 10 I.T. Control Tower Proof `33635318747` — SUCCESS.
- Exact Development Preview deployment/binding/smoke phase — SUCCESS in the same System Gate.
- Build 10 schema/D1/R2/provider/Access/main/Production mutation authority — NONE.

## Build 11 admin boundary

Build 11 makes `/admin/` the daily cross-business operating first stop by mounting the existing Today Tasks contract on desktop. It adds filters, module ownership, direct work links and explicit Done/Ignore/Snooze controls while keeping the full `/admin/today-tasks/` workspace available.

Today Tasks read ownership remains separate and unchanged. Today Task write ownership remains `/api/admin/today-task-actions`; Build 11 does not rewrite that endpoint or invoke it automatically.

The four admin operator workspaces remain Storefront, Creator, Finance and I.T. The underlying application permission architecture remains five modules because Socials/CAIP is independently permissioned even though its operator navigation is grouped with Creator.

## Locked Build 8 / compatibility boundary

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains retained provenance. `development-release.json` intentionally remains top-level Release 466 because inherited regression assertions still consume historical convergence fields. The middleware runtime Release 466 header is retained as explicit **INHERITED_RUNTIME_COMPATIBILITY**. Neither surface selects the current release; the selector remains `current-development-authority.json`.

Do not rewrite historical compatibility evidence merely to make version labels newer.

## External boundaries

External acceptance remains truthful `HOLD_EXTERNAL` unless separately proven. Cloudflare Access service-token acceptance, Stripe Development, PayPal sandbox and Social/OAuth remain separate from source/runtime-green Release 467 work. CAIP private-media status comes from fresh Build 7 runtime evidence.

Production promotion remains separate and manual. Build 11 does not change `main`, Production data, D1/R2, providers, OAuth state, Cloudflare Access policy or secrets.

## Historical material

Release 466 and earlier release/build documents remain provenance and compatibility evidence. Release 466 Build 1–6 workflow definitions remain manual-only under Build 9; they cannot reopen historical migrations, authorize provider execution/publication, or authorize Production promotion.