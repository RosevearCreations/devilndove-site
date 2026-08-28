# Development Runtime Acceptance

Updated: 2026-08-28

This is the active runtime-acceptance procedure for the one current Development release. Historical numbered testing guides remain Git-history provenance only and are not operating instructions.

## Allowed target

- Branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Allowed runtime host: `https://devilndove-site-dev.pages.dev`
- Development D1: `devilndove-dev`
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Separate Production: `main` / `devilndove-site`

`scripts/development_runtime_acceptance.py` hard-refuses Production, custom-domain, HTTP and arbitrary hosts. Runtime acceptance performs GET requests only.

## 1. Repository and infrastructure preflight

Run the canonical source gates first:

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

Then use the read-only Cloudflare resource preflight:

```bash
python scripts/cloudflare_development_access.py --auth-only
```

This verifies the exact Development account, D1 and both R2 buckets without applying a migration. Do not reapply `database_platform_convergence.sql` unless read-only readiness proves actual schema drift.

## 2. Anonymous authorization boundary

The acceptance harness can prove that authenticated Development contracts reject anonymous access without sending a password or token:

```bash
python scripts/development_runtime_acceptance.py --anonymous-check --evidence-json evidence/runtime-anonymous.json
```

Expected result: protected infrastructure, module and shared-service routes return 401/403. The harness never targets Production.

## 3. Authenticated Development runtime

Use a fresh authenticated Development browser session. Put only the complete Development session-cookie header value in the environment variable `DND_DEV_SESSION_COOKIE`. Do not put a password, cookie, API key or token in a script, Markdown file, shell argument, Git commit or evidence file.

PowerShell example using a placeholder only:

```powershell
$env:DND_DEV_SESSION_COOKIE = 'session=<development-session-value>'
python scripts/development_runtime_acceptance.py --evidence-json evidence/runtime-authenticated.json
Remove-Item Env:DND_DEV_SESSION_COOKIE
```

The harness verifies, using GET/read-only contracts only:

- the exact Development Pages target;
- authenticated D1 plus both R2 bindings;
- no current D1 migration requirement;
- D1/R2/provider mutation policy disabled;
- the five canonical modules and 10 role-access rows;
- Storefront catalog read authority;
- Creators content/media read authority;
- Socials presence in the authenticated canonical module authority without publishing;
- Financials accounting read authority;
- I.T. infrastructure/module authority;
- safe public Stripe/PayPal configuration readiness.

The generated evidence is deliberately sanitized and does not contain the session cookie or provider secrets.

## 4. Stripe acceptance is separate

A runtime result of `Stripe configuration_readiness: READY` means only that Development-safe credential references, test mode and webhook configuration appear ready through the non-secret provider endpoint. It does **not** close Stripe acceptance.

Stripe acceptance requires a deliberate owner-controlled Development test covering:

1. test-mode checkout creation;
2. owner-controlled completion/return;
3. signed webhook receipt;
4. order/payment reconciliation;
5. duplicate event replay/idempotency;
6. evidence containing provider/event references but no secrets or customer information.

If any item remains unproven, Stripe remains HOLD.

## 5. PayPal acceptance is separate

A runtime result of `PayPal configuration_readiness: READY` means only that sandbox credential references and webhook configuration appear ready through the non-secret provider endpoint. It does **not** close PayPal acceptance.

PayPal acceptance requires a deliberate sandbox test covering:

1. approval flow;
2. capture;
3. owner-controlled return;
4. verified webhook receipt;
5. reconciliation;
6. duplicate replay/idempotency;
7. sanitized provider/evidence references.

If any item remains unproven, PayPal remains HOLD.

## 6. CAIP private-media acceptance is separate

Do not substitute public media or R2 bucket visibility for private-media evidence. Closure requires authenticated private object delivery, HTTP Range/seek behavior, exact timecode/range evidence, verified derived-artifact metadata and proof that provider-off/error behavior fails closed where required.

## 7. Evidence and release decision

A deterministic core runtime `PASS` closes only the authenticated read-only runtime portion of the current release. Provider transaction acceptance and CAIP private-media acceptance stay separate until their real Development evidence exists.

After any source change:

1. require the canonical GitHub `System Gate` to pass on the exact `dev` SHA;
2. require Cloudflare Pages `devilndove-site-dev` to deploy that same SHA successfully;
3. rerun authenticated runtime acceptance if runtime behavior changed;
4. update `development-release.json`, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md` and the I.T. status surface when evidence changes;
5. keep Production untouched until explicit promotion authorization.

## Permanent rules

- Historical build numbers are provenance only, never current acceptance requirements.
- Runtime acceptance is Development-only and GET/read-only.
- No embedded passwords, tokens, cookies or provider secrets.
- D1/R2 readiness never implies permission to migrate or write.
- Provider readiness never implies provider acceptance.
- Production mutation is forbidden until a deliberate promotion decision.
