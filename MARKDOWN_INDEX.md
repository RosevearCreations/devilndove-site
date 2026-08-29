# Markdown Documentation Index — Release 453

## Current authorities

1. `development-release.json` — machine-readable current Development release and verified D1 state.
2. `AI_HANDOFF.md` — compact technical/current-state handoff.
3. `PROJECT_STATUS_AND_ROADMAP.md` — current execution roadmap and next enhancement queue.
4. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` — exact Development D1/R2/account startup authority and **new chat is not a migration event** rule.
5. `docs/operations/RELEASE_453_IT_PROVIDER_READINESS.md` — current Release 453 D1/application scope and remote proof.
6. `SANITY_HEALTH_CHECK.md` — current validation commands and expected safe state.
7. `.github/workflows/system-gate.yml` — canonical Development source/regression/SEO gate.
8. `.github/workflows/release453-source-gate.yml` — focused Release 453 source gate.
9. `.github/workflows/development-d1-release453.yml` — guarded Release 453 Development mutation authority; Release 453 is already applied and this workflow must now refuse replay.
10. `.github/workflows/release453-remote-verification.yml` — independent read-only Release 453 D1 verifier.

## Carried-forward authorities

- `docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md` — repository/UX/SEO convergence carried forward.
- `docs/operations/RELEASE_451_D1_STATE.md` — Release 451 source-only/no-migration provenance.
- Release 450 marketplace/SEO and Release 449 commerce/provider authorities remain canonical schema parents.
- Active Release 448 source/regression and Development transport helpers remain only where the current System Gate consumes them.

## Current database boundary

- Current release: **453 — I.T. Provider Readiness & Acceptance Authority**.
- Development D1 schema: **applied and independently verified through Release 453**.
- Release 453 migration: `migrations/dev/20260829_release453_it_provider_readiness.sql` — **already applied**.
- Mutation run: `33258377328` — SUCCESS.
- Independent verifier: `33258415391` — SUCCESS.
- Provider execution/publication: **closed**.
- Production promotion: **closed**.
- `wrangler.toml account_id`: **forbidden**.

## Repository streamlining policy

Git history is the archive. Do not recreate `docs/archive`, `docs/releases`, root `BUILD*.md`, root Build-era D1 verification SQL, retired compatibility pointers, stale generated release-package manifests, or backup/temp artifacts.

A file belongs in the active tree only when it is current runtime, current authority, a current regression/verification dependency, or active operational tooling.
