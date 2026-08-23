# Build 285 Validation

Build 285 is accepted only when all of the following pass.

## Local/static gate

Run:

```bash
python scripts/build285_packaging_contract_consumption_test.py
```

Expected:

```text
PASS: Build 285 JavaScript syntax
PASS: Packaging GET bootstrap contract consumer bridge
PASS: Packaging writes remain untouched and fallback remains available
PASS: one-shot event-driven contract refresh with no polling timer
PASS: exact Build 285 changed-file boundary
PASS: no Functions, D1 migration, or Cloudflare binding/config change
BUILD 285 PACKAGING CONTRACT CONSUMPTION: PASS
No Cloudflare resource was contacted.
```

## Development asset gate

Verify the Development Pages deployment serves:

- `/public/js/admin.js?v=285`
- `/public/js/core/dd-admin-module-runtime.mjs?v=285`
- `/public/js/modules/packaging/index.mjs?v=285`

The module must contain `contract-consumer-bridge`, `PACKAGING_BOOTSTRAP_PATH`, `module_contracts`, and `legacy-fallback` markers.

## Browser gate

On the logged-in Development Packaging Studio, verify:

- `window.DDModuleRuntime.build === 285`
- Packaging is `active`
- `window.DDPackagingContracts.getStatus().bridgeInstalled === true`
- `getBootstrapStatus().contractized === true`
- `catalogSource === "contract"`
- `inventorySource === "contract"`
- Content media is either `contract` or a clearly reported `legacy-fallback`
- a visible `Modular data active` status panel is present

The existing Packaging Studio must still load projects, product choices, Inventory-linked ingredients/components, templates and current editing workflows normally.

## Safety boundary

Build 285 must not modify Functions, D1 schema, migrations, Wrangler configuration, bindings, Production, Packaging POST actions, or Inventory quantities.
