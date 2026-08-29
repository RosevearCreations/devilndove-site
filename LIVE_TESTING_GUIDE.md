# Development I.T. Test Environment

Updated: 2026-08-28/29

This is the release-independent Development testing procedure for deferred I.T. runtime/provider/media evidence. It is **non-blocking** for normal forward release development, but real accepted evidence is required before a strict promotion-ready result. Historical numbered testing guides remain Git-history provenance only and are not operating instructions.

The application continues through one current release even when an external credential, provider sandbox, authenticated browser session or private-media acceptance task is pending. Those tasks stay visible in I.T. authority and carry forward; they do not become old-release gates.

## Allowed target

- Branch: `dev`
- Cloudflare Pages project: `devilndove-site-dev`
- Allowed runtime host: `https://devilndove-site-dev.pages.dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Separate Production: `main` / `devilndove-site`

`scripts/development_runtime_acceptance.py` hard-refuses Production, custom-domain, HTTP and arbitrary hosts. Runtime acceptance performs GET requests only.

## Current Release 448 activation boundary

Release 447 convergence is already applied and verified. Release 448 currently has six additive migrations:

1. `database_release448_product_lineage.sql`
2. `database_release448_media_it.sql`
3. `database_release448_storefront_merchandising.sql`
4. `database_release448_caip_content_handoff.sql`
5. `database_release448_tool_lifecycle.sql`
6. `database_release448_supply_sourcing.sql`

The exact-Development workflow is `.github/workflows/development-d1-release448.yml`. It is deliberately guarded by the GitHub Actions repository secret `CLOUDFLARE_API_TOKEN`, exact database name and exact database ID, and it performs no automatic write retry.

Latest proven remote result: workflow run **33227149444** stopped at the credential guard because `CLOUDFLARE_API_TOKEN` was empty. The D1 auth probe and all migration/verification steps were skipped. Therefore none of the six migrations is remotely proven applied yet.

Never paste the token into chat, Markdown, source, a shell argument or an evidence file. Once the secret exists, rerun the guarded workflow and require its final read-only verification before updating D1 status.

## Forward-development rule

For ordinary feature implementation, treat required Development provider/key **references** as available or use the existing safe mock/provider abstraction. Do not block Storefront, Creators, Socials, Financials, CAIP, Inventory, Supplies, Tools or client work merely because real provider acceptance has not yet been performed.

This does **not** mean a real Stripe, PayPal, social, Amazon or other credential has been verified. External I.T. validation remains a dedicated acceptance activity.

## Canonical read-only repository/infrastructure checks

```bash
python scripts/repository_forward_sanity.py
python scripts/release448_expansion_authority_gate.py
python scripts/module_architecture_gate.py
python scripts/database_platform_gate.py
python scripts/release448_fresh_install_gate.py
python scripts/product_lineage_gate.py
python scripts/apply_development_product_lineage.py --transport-preflight
python scripts/release448_media_it_source_gate.py
python scripts/apply_development_release448_media_it.py --transport-preflight
python scripts/release448_storefront_merchandising_gate.py
python scripts/apply_development_release448_storefront_merchandising.py --transport-preflight
python scripts/release448_caip_content_handoff_gate.py
python scripts/apply_development_release448_caip_content_handoff.py --transport-preflight
python scripts/release448_inventory_intelligence_gate.py
python scripts/release448_tool_lifecycle_gate.py
python scripts/apply_development_release448_tool_lifecycle.py --transport-preflight
python scripts/release448_supply_sourcing_gate.py
python scripts/apply_development_release448_supply_sourcing.py --transport-preflight
python scripts/release448_calibration_gate.py
python scripts/release448_promotion_rehearsal.py --source-check
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

This verifies the exact Development account, D1 and both R2 buckets without applying a migration. Do not reapply `database_platform_convergence.sql` merely because a release or chat changed.

## Anonymous protection acceptance

Before using an authenticated session, the runtime harness can prove protected GET routes refuse anonymous access:

```bash
python scripts/development_runtime_acceptance.py --anonymous-check
```

It checks the canonical infrastructure/module/contracts plus the current Release 448 operational reads and expects HTTP 401/403.

## Authenticated Development runtime

Use a fresh authenticated Development browser session. Put only the complete Development session-cookie header value in the environment variable `DND_DEV_SESSION_COOKIE`. Do not put a password, cookie, API key or token in a script, Markdown file, shell argument, Git commit or evidence file.

PowerShell example using a placeholder only:

```powershell
$env:DND_DEV_SESSION_COOKIE = 'session=<development-session-value>'
python scripts/development_runtime_acceptance.py --evidence-json evidence/runtime-authenticated.json
Remove-Item Env:DND_DEV_SESSION_COOKIE
```

The Release 448 harness validates:

- exact Development target;
- D1 schema and both Development R2 bindings;
- no runtime migration requirement;
- read-only mutation policy;
- five canonical modules with 10 canonical role rows;
- Storefront, Creators and Financials read contracts;
- Product Lineage list/read authority;
- Product Photography catalog-summary authority;
- Storefront merchandising authority;
- Inventory Intelligence authority and no duplicate write ledger;
- Tool Lifecycle authority;
- Supply Sourcing authority and `stock_mutation_capability: none`;
- Release 448 Calibration Cockpit with zero schema-blocked areas after D1 activation;
- I.T. integration registry;
- safe Stripe/PayPal configuration readiness.

Provider transaction acceptance and CAIP private-media acceptance remain explicitly `NOT_PERFORMED` in this GET-only harness. Generated evidence is sanitized.

## Real-data calibration after D1 activation

Open `/admin/release448-calibration/` after authenticated runtime is green. It is derived/read-only and creates no second calibration ledger.

Work through:

1. Product Photography — score remaining Product sets, review low scores/duplicates, calibrate thresholds.
2. Product Lineage — verify required new handmade material/tool provenance; reconstruct legacy only where evidence exists.
3. Storefront — review Collection membership, Collage composition, mobile rendering and public SEO against real Products.
4. CAIP — prepare/review source-backed Content Studio handoffs; private-media transport remains separate evidence.
5. Inventory — resolve linked stockouts, reorder, provenance and usage-profile gaps.
6. Tools — establish condition/service/replacement state without consuming Tool quantity.
7. Supplies — calibrate reorder/target/safety stock, source cost/lead time and reviewed substitutions; ordering remains manual.
8. I.T. — record real configuration/test evidence without storing secrets.

## Deferred Stripe test

Stripe provider acceptance later covers:

1. test-mode checkout creation;
2. owner-controlled completion/return;
3. signed webhook receipt;
4. order/payment reconciliation;
5. duplicate event replay/idempotency;
6. sanitized evidence references.

Until performed, record Stripe as `deferred`/unaccepted in the I.T. test environment. Do not infer acceptance from readiness/configuration.

## Deferred PayPal sandbox test

PayPal provider acceptance later covers:

1. sandbox approval flow;
2. capture;
3. owner-controlled return;
4. verified webhook receipt;
5. reconciliation;
6. duplicate replay/idempotency;
7. sanitized evidence references.

Until performed, record PayPal as `deferred`/unaccepted. Do not infer acceptance from readiness/configuration.

## Deferred CAIP private-media evidence

Later I.T./CAIP acceptance covers authenticated private object delivery, HTTP Range/seek behavior, exact timecode/range evidence, verified derived-artifact metadata and provider-off/error behavior. Public media or simple bucket visibility is not equivalent evidence.

## Promotion rehearsal

Normal source CI runs:

```bash
python scripts/release448_promotion_rehearsal.py --source-check
```

This validates the readiness authority while allowing an expected HOLD during active Development.

When D1 activation, real-data calibration and all required external/private acceptance have genuine evidence, run:

```bash
python scripts/release448_promotion_rehearsal.py --strict
```

`--strict` must remain HOLD/non-zero until those states are complete. The rehearsal has no Production mutation capability; a PASS only supports a later deliberate promotion decision.

## I.T. authority direction

The I.T. page/registry is the single place to hold safe provider/platform metadata:

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

- Historical Build numbers are provenance only, never current acceptance requirements.
- There is one current forward release.
- Deferred I.T. test work is non-blocking for ordinary source development and required for strict promotion readiness.
- Runtime acceptance is Development-only and GET/read-only.
- No embedded passwords, tokens, cookies or provider secrets.
- D1/R2 readiness never authorizes an unrelated migration.
- Provider readiness never implies provider acceptance.
- Supply sourcing never implies provider purchasing or stock mutation.
- Production mutation is forbidden until a deliberate promotion decision.
