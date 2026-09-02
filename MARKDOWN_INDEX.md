# Devil n Dove — Markdown / Authority Index

## Canonical current authority — Release 467 Build 8

**Release 467 Build 8 — Authority Convergence and Restart Safety** is the active Development source candidate. The exact Development-green predecessor is Release 467 Build 7 at commit `5eef764a67466dc2989a4681c6a7cc782b9d4df9`.

Read current authority in this order:

1. `current-development-authority.json` — machine-readable current Release 467 restart pointer and exact safety boundary.
2. `AI_HANDOFF.md` — current restart instructions, current external HOLDs and next bounded work.
3. `release467-build8-authority-convergence.json` — Build 8 source contract.
4. `PROJECT_STATUS_AND_ROADMAP.md` — current release/build progression and forward direction.
5. `SANITY_HEALTH_CHECK.md` — compact current evidence and safety checklist.
6. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md` — canonical startup/preflight mechanics.
7. `docs/operations/RELEASE_467_BUILD_8_AUTHORITY_CONVERGENCE.md` — why the authority split exists and how it is proved.
8. `release467-build7-external-commercial-acceptance.json` — current commercial/provider acceptance authority.
9. `release467-build6-access-acceptance-harness.json` — separate Development Cloudflare Access service-token authority.
10. `release467-build5-production-promotion-readiness.json` — separate exact-candidate Production promotion HOLD/READY authority.
11. `development-release.json` — **inherited Release 466 regression compatibility evidence only; not the current Release 467 restart pointer**.

## Exact green predecessor

Release 467 Build 7 merged to `dev` at `5eef764a67466dc2989a4681c6a7cc782b9d4df9` with tree `f7327733dc423982016829d717521ceab2029f35`.

- System Gate `33591744817` — SUCCESS.
- Release 467 Build 7 Proof `33591744787` — SUCCESS.
- Build 7 provider/payment/Access/main/Production mutation authority — NONE.

## Compatibility boundary

`development-release.json` intentionally remains top-level Release 466 because inherited Release 466 regression gates still assert its historical convergence fields. Its role is compatibility, not current release selection. Build 8 introduces `current-development-authority.json` so new chats and tooling no longer misread those historical fields as the current Development release.

Do not rewrite historical compatibility evidence merely to make version labels look newer. Migrate a dependent regression gate first, then retire its compatibility assertion deliberately.

## External boundaries

External acceptance remains truthful `HOLD_EXTERNAL` unless separately proven through its bounded workflow/operator path. Cloudflare Access service-token acceptance, Stripe Development, PayPal sandbox, Social/OAuth and native repository rules remain separate from source-green Build 8. CAIP private-media status must come from fresh current runtime evidence rather than stale historical wording.

Production promotion remains separate and manual. Build 8 does not change `main`, Production data, D1/R2, providers, OAuth state, Cloudflare Access policy or secrets.

## Historical material

Release 466 and earlier release/build documents remain provenance and regression evidence. They cannot override the Release 467 current authority above, reopen historical migrations, authorize provider execution/publication, or authorize Production promotion.
