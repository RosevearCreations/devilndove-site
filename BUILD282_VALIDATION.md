# Build 282 Validation

## Purpose

Prove that the locked module taxonomy and Admin shadow resolver are safe before any real subsystem extraction.

## Local validation

Run:

```bash
python scripts/build282_module_architecture_test.py
```

Expected final lines:

```text
BUILD 282 ARCHITECTURE LOCK: PASS
No Cloudflare resource was contacted.
```

Then generate the revised ownership inventory:

```bash
python scripts/build282_module_inventory.py --write
```

This writes `.wrangler/build282/module-inventory.json` locally and contacts no Cloudflare resource.

## Browser validation on Development

After Development deployment and administrator login, open the browser console on representative Admin pages and inspect:

```js
document.documentElement.dataset.ddModuleMode
document.documentElement.dataset.ddModule
window.DDModuleShadow?.contractValidation
```

Expected:

- mode is `shadow` after administrator resolution;
- Packaging Studio resolves `packaging`;
- Operations resolves `operations`;
- Startup Readiness resolves `platform`;
- Accounting resolves `accounting`;
- contract validation reports `ok: true`.

The resolver may annotate Admin links with `data-dd-module-target`. There should be no visible page behavior change.

## Safety boundary

Build 282 must not contain a D1 migration, Functions change, binding/config change, runtime module entry point, module activation, fetch, or timer in the shadow resolver.
