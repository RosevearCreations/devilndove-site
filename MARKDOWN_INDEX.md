# Markdown Documentation Index — Build 440

Use this index to avoid treating historical build records as current instructions.

## Canonical mutable documents

Only these two files should carry the full current state:

1. `AI_HANDOFF.md` — architecture, authority boundaries, release/deployment rules, current technical handoff.
2. `PROJECT_STATUS_AND_ROADMAP.md` — ordered status, open acceptance work, next steps and closure criteria.

When those two disagree with an older Build document, the canonical pair wins unless live source/CI proves the canonical pair itself is stale.

## Compatibility pointers

These exist so old links/chats continue to work, but they must remain lightweight:

- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `MARKDOWN_INDEX.md` (this file)

They point to the canonical pair rather than maintaining independent roadmaps.

## Current Development release authority

- `development-release.json` — **Build 440**
- `.github/workflows/build440-source-gate.yml`
- `scripts/build440_development_release_alignment_test.py`
- `scripts/build440_release_contract_integrity_test.py`
- `scripts/build440_cross_mutation_responsive_acceptance_test.py`
- `scripts/build440_product_inventory_tools_source_gate.py`
- `scripts/build440_current_sanity_check.py`
- `database_full_schema.sql` plus required ledgered/focused migrations and aggregate-schema synchronization
- `docs/architecture/IT_MODULE_ARCHITECTURE.md` — approved post-Build-440 fourth-module boundary; not current runtime evidence

Currentness is not pinned to a historical SHA. Every `dev` head must pass the Build 440 gate and the Cloudflare Pages `devilndove-site-dev` deployment check on that same commit.

## Legacy compatibility SQL

`database_upgrade_current_pass.sql` is a retained Build 264-era compatibility snapshot used by older regression coverage. Despite its historical filename, it is **not** the current Development migration, not the Build 440 release authority, and must not be relabeled to Build 440 without matching SQL content.

## Production records

`RELEASE_NOTES.md` currently describes the **Build 437 Production baseline**. That is intentional; Development being Build 440 does not rewrite Production release evidence before promotion.

## Historical evidence

Treat these as history/provenance unless a canonical document explicitly says otherwise:

- numbered `BUILD*.md` files
- numbered `database_build*.sql` migrations
- build-specific regression filenames such as `build232_*`, `build243_*`, `build244_*`, `build253_*`
- `docs/archive/build-history/**`
- prior release validation/change manifests

Historical numbers must not become active runtime cache majors or current release labels merely because a retained test/file name contains them.

## Current status summary

- Development: **Build 440**
- Build 440 source/CI: **GREEN**
- Exact-head Development Pages deployment: **GREEN**
- Development live/authenticated acceptance: **NEXT**
- Build 439 CAIP media/video live-browser acceptance: **OPEN / SEPARATE**
- Production baseline: **Build 437**
- Production promotion: **CLOSED**
