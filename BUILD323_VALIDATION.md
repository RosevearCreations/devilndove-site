# Build 323 Validation — Accounting Page Runtime Audit / Shadow Bridge

## Status — STAGED / VALIDATION REQUIRED

Build 323 must prove that `/admin/accounting/` joins the verified Core module bridge without falsely activating the top-level `business-administration` runtime.

## Local regression

```bash
git pull --ff-only origin dev
python scripts/build323_accounting_page_runtime_audit_test.py
git status --short
```

Expected:

```text
BUILD 323 ACCOUNTING PAGE RUNTIME AUDIT / SHADOW BRIDGE: PASS
No Cloudflare resource was contacted.
```

`git status --short` should be empty before making any later local edits.

## Development browser proof

Open `/admin/accounting/`, wait for administrator verification, then run:

```js
(() => {
  const r = window.DDModuleRuntime;
  const current = r?.getCurrent?.();
  const app = r?.getCurrentApplicationModule?.();
  console.table({
    pathname: location.pathname,
    domain: current?.id || null,
    domain_mode: document.documentElement.dataset.ddModuleMode || null,
    application_module: app?.id || null,
    application_mode: document.documentElement.dataset.ddApplicationModuleMode || null,
    active_application_module: r?.getActiveApplicationModuleId?.() || null,
    business_runtime_status: r?.getApplicationModuleRuntimeStatus?.('business-administration') || null,
    core_runtime_build: r?.build || null,
    contracts_ok: r?.contractValidation?.ok === true,
    services_ok: r?.serviceRegistration?.ok === true,
  });
})();
```

Expected after verified auth:

```text
pathname                    /admin/accounting/
domain                      accounting
domain_mode                 shadow
application_module          business-administration
application_mode            domain-bridge
active_application_module   null
business_runtime_status     null
core_runtime_build          305
contracts_ok                true
services_ok                 true
```

The important proof is that the page is classified by the verified runtime bridge while `business-administration` remains inactive.

## Safety boundary

Do not use Build 323 browser validation to post journals, save expenses, upload evidence, lock periods, import statements, or mutate any Accounting record.

Build 323 does not claim that all Accounting page reads are migrated. The page audit found remaining automatic legacy reads, including a confirmed read-time schema mutation in `accounting-journal` GET. Those blockers must be retired before top-level runtime activation.
