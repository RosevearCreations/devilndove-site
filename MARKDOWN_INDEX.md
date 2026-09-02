# Devil n Dove — Markdown / Authority Index

## Canonical current authority — Release 467 Build 12

**Release 467 Build 12 — Finance Operations Command Center** is the active Development source candidate. Exact Development-green predecessor: Release 467 Build 11 at `ce42f3b2ea553b69085705f500a9e2bd2f689818`, tree `191e4a92ebcbc94b29cfbf6a83259acd4981d302`, System Gate `33637049566`, Build 11 Proof `33637049079`.

Read current authority in this order:

1. `current-development-authority.json` — current Release 467 restart pointer and safety boundary.
2. `AI_HANDOFF.md` — exact restart instructions and external HOLDs.
3. `release467-build12-finance-operations-command-center.json` — Build 12 Finance runtime/UI contract.
4. `PROJECT_STATUS_AND_ROADMAP.md` — current release/build progression.
5. `SANITY_HEALTH_CHECK.md` — current evidence and safety checklist.
6. `docs/operations/RELEASE_467_BUILD_12_FINANCE_OPERATIONS_COMMAND_CENTER.md` — Build 12 operating authority.
7. `release467-build11-admin-operations-command-center.json` — Build 11 daily Admin command authority.
8. `docs/operations/RELEASE_467_BUILD_11_ADMIN_OPERATIONS_COMMAND_CENTER.md` — Build 11 operator details.
9. `release467-build10-it-control-tower-consolidation.json` — Build 10 I.T. technical-first-stop authority.
10. `release467-build9-historical-ci-retirement.json` — Build 9 CI retirement authority.
11. `release467-build8-authority-convergence.json` — current-vs-compatibility authority model.
12. `release467-build7-external-commercial-acceptance.json` — external commercial acceptance bridge.
13. `release467-build6-access-acceptance-harness.json` — Development Cloudflare Access acceptance authority.
14. `release467-build5-production-promotion-readiness.json` — exact-candidate Production promotion HOLD/READY authority.
15. `development-release.json` — **inherited Release 466 regression compatibility only; not current authority**.

## Build 12 boundary

`/admin/finance/` now mounts the existing read-only Accounting Financial Operations engine. It provides month selection, reconciliation/exception/cost/close/evidence summaries, financial snapshots, severity-sorted work and owner links while preserving the existing Finance workspace links.

Finance is a read projection. `/admin/accounting/` remains the write owner for reconciliation, statement imports, costing, close and ledger operations. Build 12 does not add a second financial authority.

## Compatibility boundary

`development-release.json` intentionally remains Release 466 **INHERITED_REGRESSION_COMPATIBILITY**, and the middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**. `current-development-authority.json` is the current selector. Release 467 Build 8 remains the locked provenance for that separation.

## External / Production boundary

Cloudflare Access service-token, Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL` until deliberately proven. CAIP private-media status uses fresh Build 7 evidence.

Build 12 adds no schema migration, new D1/R2 mutation authority, provider execution/publication, Access policy mutation, `main` mutation, Production contact or secret exposure. Production Promotion Readiness remains a separate Build 5 authority.

## Historical material

Release 466 and earlier files remain provenance/compatibility evidence. Release 466 Build 1–6 workflows remain manual-only under Build 9 and cannot override Release 467 Build 12 authority.
