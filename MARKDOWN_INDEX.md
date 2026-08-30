# Devil n Dove — Markdown Index

## Current authority — Release 461

Use this order and do not infer current state from older Build/Release documents:

1. **`development-release.json`** — machine-readable current release, exact Development infrastructure, evidence and forward queue.
2. **`AI_HANDOFF.md`** — concise startup handoff and safety boundary.
3. **`PROJECT_STATUS_AND_ROADMAP.md`** — current Development status and next-release direction.
4. **`docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`** — exact Cloudflare/D1/R2 boundary.
5. **`docs/operations/RELEASE_461_RUNTIME_SCHEMA_INVENTORY_CAIP_AUTHORITY.md`** — Release 461 scope and closure evidence.
6. **`SANITY_HEALTH_CHECK.md`** — current Release 461 health checklist.

These are the canonical current documents for **Release 461 — Runtime Schema Convergence, Inventory & CAIP Production Pipeline**.

## Current exact boundaries

- `dev` → `devilndove-site-dev` is Development.
- The Pages Production deployment of `devilndove-site-dev` is the Development application.
- Separate live `main` / `devilndove-site` remains closed.
- D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- `account_id` never belongs in `wrangler.toml`.
- Provider secret/token values never belong in D1/source/Markdown/browser output.
- Provider live authorization/execution/publication remains closed.
- Raw CAIP R2 deletion remains closed.

## Release 461 evidence anchors

- D1 convergence: run `33340698069` — 19 migrations, 77 tables, 93 indexes, zero missing objects, zero FK violations.
- Authenticated Development runtime: run `33342752757`, SHA `7200f421e0fc58842aed4003dc774ed30f910809` — PASS.
- Release 461 is the accepted Development checkpoint; new source feature work begins as Release 462.

## Historical/supporting Markdown

Older files remain useful for provenance, migrations and subsystem design, but they do not override the canonical files above and they never authorize historical migration replay.
