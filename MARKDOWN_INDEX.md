# Markdown Documentation Index — Build 446

## Current authorities

1. `AI_HANDOFF.md` — technical/current-state handoff.
2. `PROJECT_STATUS_AND_ROADMAP.md` — current roadmap and HOLD register.
3. `SANITY_HEALTH_CHECK.md` — current validation commands/status.
4. `NEW_CHAT_STATUS.md` / `AI_CONTEXT.md` / `DEVELOPMENT_ROADMAP.md` — compact compatibility pointers.
5. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md` — technical release procedure.
6. `development-release.json` — active Development release identity.
7. `.github/workflows/build446-system-gate.yml` — active CI gate.

## Historical policy

Git history is the archive. Do not recreate `docs/archive`, `docs/releases`, root `BUILD*.md`, per-build validation/change reports, or permanent copies of old system gates.

Standalone Build 440/442/443 SQL/scripts are retained only where the current guarded D1 recovery or CI path still consumes them. Everything else must justify its presence as current runtime, current authority, current recovery or active operational tooling.
