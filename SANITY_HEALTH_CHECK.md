# Sanity Health Check — Release 452 Development

Release 452 — **Application Streamlining & UX/SEO Depth** — is the current Development release. `development-release.json` is the machine authority.

## Canonical source checks

```bash
python scripts/repository_forward_sanity.py
python scripts/repository_hygiene_gate.py
python scripts/release452_application_streamlining_gate.py
python scripts/release451_marketplace_calibration_gate.py
python scripts/release450_marketplace_seo_gate.py
python scripts/public_seo_gate.py
python scripts/public_seo_depth_gate.py
python scripts/product_inventory_tools_source_gate.py
python scripts/development_runtime_acceptance.py --self-check
node --check public/js/product-breadcrumb-seo.js
git diff --check
```

The full canonical authority is `.github/workflows/system-gate.yml`.

## Required repository state

- current release: **452**;
- Development branch: `dev`;
- Development Pages: `devilndove-site-dev`;
- D1 schema current/verified through: **Release 450**;
- Release 452 new D1 migration: **NONE**;
- `docs/archive` and `docs/releases`: **ABSENT**;
- root historical `BUILD*.md`: **ABSENT**;
- root Build-era D1 verification SQL: **ABSENT**;
- stale compatibility pointers (`AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md`, `KNOWN_GAPS_AND_RISKS.md`): **ABSENT**;
- stale `data/site/release-package-manifest.json`: **ABSENT**;
- `database_full_schema.sql`: **PRESENT**;
- active Release 448 regression/transport authorities required by the System Gate: **PRESENT**;
- `wrangler.toml account_id`: **ABSENT / FORBIDDEN**;
- provider execution/publication: **DISABLED**;
- Production mutation capability in canonical CI: **NONE**.

## Development infrastructure verification

Canonical read-only identity preflight:

```bash
python scripts/cloudflare_development_access.py --auth-only
```

Canonical transport-only CI check:

```bash
python scripts/cloudflare_development_access.py --transport-preflight
```

Expected Development identities:

- D1 `DB` -> `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`;
- R2 `PRODUCT_MEDIA_BUCKET` -> `devilndove-toolshed-images-dev`;
- R2 `CAIP_PRIVATE_MEDIA_BUCKET` -> `devilndove-caip-media-dev`.

> **A new chat is not a migration event.** Never replay Releases 447–450 merely because a conversation/workstation changes. Release 451 and Release 452 have no migration to apply.

## Current deferred acceptance

Provider credentials remain non-blocking for source development. The remaining live/test-environment acceptance queue includes authenticated Development runtime acceptance, Stripe test acceptance, PayPal sandbox acceptance, CAIP private-media evidence, Etsy/provider acceptance, Meta/Pinterest/TikTok provider acceptance, and eventual deliberate Production promotion rehearsal.
