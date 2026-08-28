# Development I.T. Test Environment

Updated: 2026-08-28

This is the release-independent Development testing procedure for deferred I.T. runtime/provider/media evidence. It is **non-blocking** for normal forward release development. Historical numbered testing guides remain Git-history provenance only and are not operating instructions.

The application continues to move through one current release even when an external credential, provider sandbox, authenticated browser session or private-media acceptance task is still pending. Those tasks remain visible on the I.T. page until completed; they do not become old-release gates.

## Allowed target

- Branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Allowed runtime host: `https://devilndove-site-dev.pages.dev`
- Development D1: `devilndove-dev`
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Separate Production: `main` / `devilndove-site`

`scripts/development_runtime_acceptance.py` hard-refuses Production, custom-domain, HTTP and arbitrary hosts. Runtime acceptance performs GET requests only.

## Forward-development rule

For ordinary feature implementation, treat required Development provider/key **references** as available or use the existing safe mock/provider abstraction. Do not block Storefront, Creators, Socials, Financials, CAIP, Inventory, Supplies, Tools or client work merely because real provider acceptance has not yet been performed.

This does **not** mean that a real Stripe, PayPal, social, Amazon or other credential has been verified. It means external I.T. validation is deferred to the dedicated test environment while source/database/client development continues.

## Read-only repository and infrastructure checks

The canonical source gates remain normal release checks:

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

Use the read-only Cloudflare resource preflight when infrastructure work requires it:

```bash
python scripts/cloudflare_development_access.py --auth-only
```

This verifies the exact Development account, D1 and both R2 buckets without applying a migration. Do not reapply `database_platform_convergence.sql` merely because a release changed. New current-release D1 migrations are allowed when current feature work actually requires them and they pass their migration/regression gates.

## Deferred authenticated Development runtime

When I.T. work is scheduled, use a fresh authenticated Development browser session. Put only the complete Development session-cookie header value in the environment variable `DND_DEV_SESSION_COOKIE`. Do not put a password, cookie, API key or token in a script, Markdown file, shell argument, Git commit or evidence file.

PowerShell example using a placeholder only:

```powershell
$env:DND_DEV_SESSION_COOKIE = 'session=<development-session-value>'
python scripts/development_runtime_acceptance.py --evidence-json evidence/runtime-authenticated.json
Remove-Item Env:DND_DEV_SESSION_COOKIE
```

The harness verifies D1/R2 readiness, the five canonical modules, Storefront/Creators/Financials read contracts, Socials/I.T. module authority and safe Stripe/PayPal configuration readiness. Generated evidence is sanitized.

## Deferred Stripe test

Stripe provider acceptance later covers:

1. test-mode checkout creation;
2. owner-controlled completion/return;
3. signed webhook receipt;
4. order/payment reconciliation;
5. duplicate event replay/idempotency;
6. sanitized evidence references.

Until performed, record Stripe as `deferred` in the I.T. test environment—not as a release HOLD.

## Deferred PayPal sandbox test

PayPal provider acceptance later covers:

1. sandbox approval flow;
2. capture;
3. owner-controlled return;
4. verified webhook receipt;
5. reconciliation;
6. duplicate replay/idempotency;
7. sanitized evidence references.

Until performed, record PayPal as `deferred` in the I.T. test environment—not as a release HOLD.

## Deferred CAIP private-media evidence

Later I.T./CAIP acceptance covers authenticated private object delivery, HTTP Range/seek behavior, exact timecode/range evidence, verified derived-artifact metadata and provider-off/error behavior. Public media or simple bucket visibility is not equivalent evidence.

## I.T. test-environment direction

The I.T. page is the future single place to complete external-platform setup and evidence. It should eventually hold safe configuration metadata for each provider/platform:

- platform/provider and capability;
- consuming module/workflow;
- Development/Production environment;
- secret/binding **reference name only**;
- callback/redirect/webhook locations;
- requested/granted scopes;
- configured state;
- tested/accepted state;
- last safe test result/error;
- correction/recovery mechanics;
- evidence reference.

Actual secret values never belong in D1, visible HTML, source control, logs or evidence output.

## Permanent rules

- Historical build numbers are provenance only, never current acceptance requirements.
- There is one current forward release.
- Deferred I.T. test work is non-blocking and carries forward automatically until completed.
- Runtime acceptance is Development-only and GET/read-only.
- No embedded passwords, tokens, cookies or provider secrets.
- D1/R2 readiness never authorizes an unrelated migration.
- Provider readiness never implies provider acceptance.
- Production mutation is forbidden until a deliberate promotion decision.
