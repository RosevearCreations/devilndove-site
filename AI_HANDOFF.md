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

Always resolve the exact current `dev` SHA from GitHub rather than copying an old checkpoint SHA into a new handoff.

## Development convergence already completed

- Canonical five-module D1 convergence is **APPLIED AND VERIFIED** in Development.
- Legacy module registry rows are retired.
- Canonical role authority is 10 rows.
- I.T. role-derived access is denied; one active explicit I.T. manager exists.
- Storefront Home carousel tables are present.
- D1 foreign-key verification is clean.
- Read-only Cloudflare preflight has proved the exact Development D1 and both Development R2 buckets are visible.
- Durable Cloudflare recovery command: `python scripts/cloudflare_development_access.py --auth-only`; use `--auth-mode oauth` when a stale environment API token overrides Wrangler OAuth.
- `wrangler.toml` must **not** contain `account_id`; the Pages Git deployment owns its account context. Local tooling pins `CLOUDFLARE_ACCOUNT_ID` separately.

Do not rerun D1 merely because a new chat starts. Run read-only readiness/verification first and only use `database_platform_convergence.sql` if current evidence proves drift.

## Release-independent runtime acceptance

The active authority is now:

```bash
python scripts/development_runtime_acceptance.py --self-check
python scripts/development_runtime_acceptance.py --anonymous-check --evidence-json evidence/runtime-anonymous.json
python scripts/development_runtime_acceptance.py --evidence-json evidence/runtime-authenticated.json
```

Use `LIVE_TESTING_GUIDE.md` for the complete procedure. Authenticated execution takes the Development session cookie only from `DND_DEV_SESSION_COOKIE`; no password/token/cookie CLI option exists. The harness hard-refuses Production/custom hosts and performs GET requests only.

The authenticated pass covers D1/R2 readiness without migration, Storefront, Creators, Socials canonical authority, Financials, I.T. and safe Stripe/PayPal configuration readiness. Provider configuration readiness is deliberately separate from transaction acceptance.

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
python scripts/development_runtime_acceptance.py --self-check
```

The active CI workflow is `.github/workflows/system-gate.yml`. CI never applies D1 and never mutates Cloudflare R2, payment providers, or Production.

## Current HOLDs

- **Release 447 authenticated runtime execution:** deterministic Development-only harness and runbook exist; a fresh authenticated deployed-runtime evidence file is still required before this portion is closed.
- **Stripe:** configuration readiness may be probed read-only, but test checkout/return, signed webhook, reconciliation and duplicate replay/idempotency evidence are still required.
- **PayPal:** configuration readiness may be probed read-only, but sandbox approval/capture/return, verified webhook, reconciliation and duplicate replay/idempotency evidence are still required.
- **CAIP private media:** authenticated private R2 delivery, byte/range playback, exact timecode/range evidence and verified derived-artifact metadata remain required.
- **Production:** promotion remains closed by policy until deliberately reviewed and authorized.

Do not label any of these PASS from source inspection alone.

## Release 448 preparation — scoped but not open

Release 448 is **prepared only**. No Release 448 D1 migration is authorized while Release 447 remains live-acceptance HOLD unless a proven 447 defect requires a repair.

Prepared workstreams:

1. **Product material lineage.** New in-house-created products must ultimately prove raw-material inventory already existed and record real consumption through the existing inventory ledger before publication. Existing products may be `legacy_pending`. Antiquity/resale/external finished goods can be explicitly inventory-exempt. Never invent historical consumption.
2. **Product tool/mold lineage.** Record durable tools and molds used during creation separately from consumables; associating a tool must not consume it.
3. **Manufacturer/provenance/company reviews.** Link tools and raw goods to manufacturer/vendor provenance. Store Devil n Dove-authored purchased-item reviews locally with ASIN/external identifier/source link as appropriate; do not scrape/copy marketplace review text or make Amazon a runtime dependency.
4. **I.T. integration registry.** I.T. will own social/provider integration configuration references: provider/platform, purpose, secret or binding **name only**, callback/webhook, scopes, environment, configured/tested state, last test/error and correction mechanics. Secret values never belong in D1 or the UI.
5. **Carousel reuse for Movies.** Generalize the Storefront carousel presentation so Movie pages can use it without creating a duplicate carousel authority and without injecting an extra public H1.
6. **Movie data convergence.** Correct provably wrong names/core fields and explicitly mark unknown/incomplete data instead of guessing.
7. **Unverified-process states.** New schema must reserve states such as `pending`, `legacy_pending`, `exempt`, `unverified`, `verified` plus evidence references so unfinished processes cannot masquerade as complete.

## Invariants

- D1 is operational write authority; no request-time DDL.
- Legacy JSON is not write authority.
- Public pages preserve one meaningful H1 and truthful canonical metadata/schema.
- Home carousel is Storefront-owned and may never inject a second H1.
- I.T. owns bindings, infrastructure readiness, API/provider configuration references, release diagnostics and recovery mechanics; secret values are never surfaced.
- Socials owns publication/content workflows; I.T. owns the credentials/configuration references those workflows depend on.
- Provider readiness probes are read-only; real money/provider mutations require deliberate test execution.
- Web/Phone/Desktop share the same responsive/installable application authority; notification permission is explicit opt-in and there is no idle background polling.
- Old build numbers never remain active requirements; unresolved work moves into the one current release.

## Workflow

1. Work on `dev` only.
2. Run the canonical `System Gate` on the exact resulting head.
3. Require Cloudflare Pages `devilndove-site-dev` success on the same SHA.
4. Use read-only D1/R2 readiness before any recovery or migration action.
5. Execute authenticated runtime acceptance against Development only when a valid Development session is available.
6. Keep Stripe, PayPal and CAIP provider/media evidence separate from configuration/source readiness.
7. Keep Production untouched without explicit authorization.
8. Keep this file, `PROJECT_STATUS_AND_ROADMAP.md`, `development-release.json`, `LIVE_TESTING_GUIDE.md` and the I.T. page synchronized when release state changes.
