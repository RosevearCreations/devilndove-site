# AI Handoff — Release 447 Platform Convergence

Updated: 2026-08-28

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. These are the two mutable current-state Markdown authorities. `development-release.json` is the machine-readable release authority. Git history is the historical archive.

## Current release

- Development release: **Release 447 — Platform Convergence**
- Release track: **one current release**; historical Build numbers are provenance only
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Canonical modules: **Storefront, Creators, Socials, Financials, I.T.**
- Clients: **Web, Phone, Desktop** from the same responsive/PWA application
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Development convergence already completed

- Canonical five-module D1 convergence is **APPLIED AND VERIFIED** in Development.
- Legacy module registry rows are retired.
- Canonical role authority is 10 rows.
- I.T. role-derived access is denied; one active explicit I.T. manager exists.
- Storefront Home carousel tables are present.
- D1 foreign-key verification is clean.
- Read-only Cloudflare preflight proves the exact Development D1 and both Development R2 buckets are visible.
- Durable Cloudflare recovery command: `python scripts/cloudflare_development_access.py --auth-only`; use `--auth-mode oauth` when a stale environment API token overrides Wrangler OAuth.
- `wrangler.toml` must **not** contain `account_id`; the Pages Git deployment owns its account context. Local tooling pins `CLOUDFLARE_ACCOUNT_ID` separately.
- Release 447 source gate and exact Pages deployment were green on checkpoint `80efbdbf880f42838b0c6496432744125752c2b6` after the Pages configuration repair.

Do not rerun D1 merely because a new chat starts. Run read-only readiness/verification first and only use `database_platform_convergence.sql` if current evidence proves drift.

## Canonical repository gates

Run:

```bash
python scripts/repository_forward_sanity.py
python scripts/module_architecture_gate.py
python scripts/database_platform_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/product_inventory_tools_source_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
```

The active CI workflow is `.github/workflows/system-gate.yml`. CI never applies D1 and never mutates Cloudflare R2, payment providers, or Production.

## Current HOLDs

- **Release 447 runtime acceptance:** exact source/database/deployment are green. Authenticated browser evidence still needs D1/R2 readiness plus module/runtime acceptance on the deployed Development application before this release is considered fully live-accepted.
- **Stripe:** Development test credentials, signed webhook, owner-controlled checkout/return, reconciliation and duplicate replay/idempotency evidence.
- **PayPal:** sandbox credentials, approval/capture, return/webhook reconciliation and duplicate replay/idempotency evidence.
- **CAIP private media:** authenticated private R2 delivery, byte/range playback, exact timecode/range evidence and verified derived-artifact metadata.
- **Production:** promotion remains closed by policy until deliberately reviewed and authorized.

## Invariants

- D1 is operational write authority; no request-time DDL.
- Legacy JSON is not write authority.
- Public pages preserve one meaningful H1 and truthful canonical metadata/schema.
- Home carousel is Storefront-owned and may never inject a second H1.
- I.T. owns bindings, infrastructure readiness, API/provider configuration references, release diagnostics and recovery mechanics; secret values are never surfaced.
- Provider readiness probes are read-only; real money/provider mutations require deliberate test execution.
- Web/Phone/Desktop share the same responsive/installable application authority; notification permission is explicit opt-in and there is no idle background polling.
- Old build numbers never remain active requirements; unresolved work moves into the one current release.

## Workflow

1. Work on `dev` only.
2. Run the canonical `System Gate` on the exact resulting head.
3. Require Cloudflare Pages `devilndove-site-dev` success on the same SHA.
4. Use read-only D1/R2 readiness before any recovery or migration action.
5. Keep Production untouched without explicit authorization.
6. Keep this file, `PROJECT_STATUS_AND_ROADMAP.md`, `development-release.json`, and the I.T. page synchronized when release state changes.
