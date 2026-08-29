# Markdown Documentation Index — Release 452

## Current authorities

1. `development-release.json` — machine-readable current Development release, D1 state, workstreams, and acceptance boundary.
2. `AI_HANDOFF.md` — compact technical/current-state handoff.
3. `PROJECT_STATUS_AND_ROADMAP.md` — current execution roadmap, completed Release 452 batch, and deferred acceptance queue.
4. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md` — exact Development D1/R2/account startup authority and the **new chat is not a migration event** rule.
5. `docs/operations/RELEASE_452_APPLICATION_STREAMLINING.md` — Release 452 source-only convergence authority.
6. `SANITY_HEALTH_CHECK.md` — current validation commands and expected safe state.
7. `.github/workflows/system-gate.yml` — canonical Development CI/System Gate.
8. `.github/workflows/release452-source-gate.yml` — focused Release 452 source gate.

## Carried-forward authorities

- `docs/operations/RELEASE_451_D1_STATE.md` — confirms Release 451 required no new D1 migration.
- Release 450 marketplace/SEO migration and verification assets remain the last D1 schema-changing release authority.
- Active Release 448 source/regression gates and exact Development transport helpers remain because the canonical System Gate still consumes them.
- Older Build-numbered runtime/regression files may remain only where a current gate or runtime path demonstrably uses them; Build numbers are provenance, not current release identity.

## Repository streamlining policy

Git history is the archive. Do not recreate:

- `docs/archive` or `docs/releases`;
- root `BUILD*.md` or root Build-era D1 verification SQL;
- `AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md`, or `KNOWN_GAPS_AND_RISKS.md` compatibility pointers;
- stale generated release-package manifests;
- backup/temp files such as `.bak`, `.old`, `.tmp`, `.orig`, `.rej`, or editor `~` files.

A file must justify its place in the active tree as current runtime, current authority, current regression/verification dependency, or active operational tooling.

## Current database boundary

- Current release: **452 — Application Streamlining & UX/SEO Depth**.
- Development D1 schema: independently verified through **Release 450**.
- Release 451 D1 migration: **none**.
- Release 452 D1 migration: **none**.
- Production promotion: **closed**.
- Provider publication/execution: **closed**.
- `wrangler.toml account_id`: **forbidden**.
