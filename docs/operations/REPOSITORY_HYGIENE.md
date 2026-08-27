# Repository Hygiene Authority — Build 441

The repository root is for active runtime/configuration and the small canonical documentation set. Historical build reports do not belong in the active root merely because they remain useful evidence.

## Rules

- Historical Build validation/change/manifest Markdown belongs in `docs/archive/build-history/`.
- Git history is permanent provenance; removing an archived duplicate from the working root does not erase history.
- Never delete a migration, runtime file, regression, authority document or business data file merely because its build number is old.
- Generated logs and CI diagnostics should be temporary artifacts, not committed root files.
- Before retirement, verify either an exact archive copy exists or the file is provably generated/superseded and unreferenced.
- `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` are the two full mutable current-state authorities. Compatibility pointers stay thin.
- New release evidence belongs under `docs/releases/`; new operational guidance belongs under `docs/operations/`.

`build441_repository_hygiene_test.py` fails when an exact historical `BUILD*.md` copy exists both in root and `docs/archive/build-history/`. This prevents the duplicate-root accumulation from returning.
