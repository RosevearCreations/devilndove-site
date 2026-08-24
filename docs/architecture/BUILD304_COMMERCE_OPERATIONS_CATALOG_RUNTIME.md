# Build 304 — Commerce & Operations Catalog Umbrella Runtime

## Status — COMPLETE IN DEVELOPMENT

Build 304 is the first build in which one of the three top-level application modules has a proven real runtime lifecycle.

The authoritative structure remains:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Build 304 activates `commerce-operations` for the internal `catalog` domain only.

## Proven Build 304 heads

Core/Commerce runtime implementation head:

```text
395eb722a9b060d904b28b1a917f66dc7120f64c
```

Validated Build 304 handoff/deployment source:

```text
af0993ef9b4da807d9d1f32c63988dc28b07f1f8
```

The commits after `395eb722...` corrected historical regression markers, shared-loader version pins, and documentation. They did not modify the new Commerce & Operations runtime implementation.

## Catalog behind the umbrella runtime

On a verified Admin Catalog route, Core maintains separate internal-domain and top-level application-runtime concepts:

```text
domain classification          catalog
active domain runtime          none
application module             commerce-operations
active application runtime     commerce-operations
```

Catalog remains an explicit internal ownership/service boundary. The top-level Commerce & Operations runtime wraps the Catalog route and becomes the application-level lifecycle owner.

Build 304 does not rewrite Catalog business logic or APIs. Existing Catalog JavaScript and `/api/admin/contracts/catalog-read` remain authoritative.

## Why Catalog is first

Catalog already exposes a stable cross-module read contract:

```text
catalog-read
```

Consumers can therefore depend on Catalog facts through an explicit contract without importing Catalog implementation details. This made Catalog the safest first domain for proving the top-level runtime pattern.

## Runtime catalog

`public/js/core/dd-application-module-groups.mjs` retains architecture build:

```text
BUILD = 302
```

and adds Build 304 runtime metadata:

```text
RUNTIME_CATALOG_BUILD = 304
commerce-operations.entry = ../modules/commerce-operations/runtime.mjs?v=304
commerce-operations.runtimeDomains = [catalog]
```

Inventory, Operations and Public remain grouped under Commerce & Operations but are not yet activated through its runtime.

Creative & Production and Business & Administration remain bridge-only at the top-level runtime layer. Packaging continues to use its proven domain runtime beneath Creative & Production.

## Commerce & Operations runtime

Build 304 adds:

```text
public/js/modules/commerce-operations/runtime.mjs
```

Its responsibilities are intentionally narrow:

- identify itself as `commerce-operations`;
- support only `catalog`;
- require the already-registered `catalog-read` service;
- expose lifecycle status through `window.DDCommerceOperations`;
- emit load/active/inactive diagnostics;
- create no network transport;
- own no Inventory or Operations behavior yet.

The runtime fails closed if Core attempts to activate it for an unsupported domain.

## Core lifecycle

`public/js/core/dd-admin-module-runtime.mjs` now maintains a separate top-level application-module lifecycle in addition to the existing domain registry.

Core can report independently:

```text
active domain runtime
active application-module runtime
```

Final Catalog proof:

```text
runtime_build                        304
architecture_build                   302
runtime_catalog_build                304
auth_phase                           verified
auth_verified                        true
domain                               catalog
domain_mode                          shadow
application_module                   commerce-operations
application_module_mode              active
active_domain_runtime                null
active_application_runtime           commerce-operations
application_runtime_state            active
application_runtime_domain           catalog
application_runtime_services_ready   true
facade_build                         304
facade_state                         active
facade_catalog_boundary_active       true
contracts_ok                         true
services_ok                          true
```

This is the first proof that one of the three umbrella modules is actually active as a runtime owner.

## Verified-auth reconciliation

Build 303's retained verified-auth reconciliation remains mandatory. Build 304 reuses it so both domain and top-level application-runtime activation recover correctly if `/api/auth/me` finishes before the async Core import attaches its event listeners.

## Shared-loader delivery correction

The first Build 304 browser attempt incorrectly remained on Core 303 even though the Build 304 code was present in GitHub.

The Products and Packaging Studio pages still referenced historical shared-loader URLs:

```text
Products         /public/js/admin.js?v=245
Packaging Studio /public/js/admin.js?v=296
```

Build 304 changes only those two script query strings to:

```text
/public/js/admin.js?v=304
```

The regression verifies each HTML file changed by exactly that one line.

A later served-asset audit proved the Development Pages alias was still serving an older artifact, including an older `/public/js/admin.js`, despite the Pages deployment list showing source `af0993e` as active.

The clean local `af0993ef...` tree was therefore directly uploaded to the **Development project only** with Wrangler. The upload compiled the Worker, uploaded assets, `_headers`, `_redirects`, the Functions bundle and `_routes.json`.

Validated Development deployment:

```text
Id      6effd1eb-9a1f-4538-b7d3-3cdc18b54328
Project devilndove-site-dev
Branch  dev
Source  af0993e
Status  Active
```

After direct upload, both the Development alias and exact deployment returned:

```text
Products HTML       admin.js?v=304
Packaging HTML      admin.js?v=304
Shared admin.js      Core ?v=304 import present
Build 304 marker     present
HTTP                 200
```

This recovery touched no real Production resource.

## Packaging preservation

Final Packaging proof:

```text
runtime_build                   304
architecture_build              302
runtime_catalog_build           304
domain                          packaging
domain_mode                     active
application_module              creative-production
application_module_mode         domain-bridge
active_domain_runtime           packaging
active_application_runtime      null
packaging_compatibility_build   301
packaging_compatibility_state   active
native_read_count               2
native_read_status              200
failed_verification_count       0
preview_mode                    fit
```

Build 304 does not modify Packaging transport, native client, compatibility facade, Save/Preview stabilizer, runtime service, or server authorities. No new Packaging write proof was necessary.

## Safety boundary

Build 304 does not change:

- `dd-module-registry.mjs`;
- `dd-module-definitions.mjs`;
- domain contract ownership;
- default domain service adapters;
- Catalog API implementation;
- Inventory/Operations/Public runtime extraction;
- Packaging read/write/save/preview implementation;
- SQL/schema;
- Cloudflare bindings/config;
- R2 bindings/data;
- real Production.

The final Build 304 changed-file boundary from completed Build 303 is exactly 12 files, including the two one-line validation-page cache-version pins.

## Completion decision

**Build 304 is COMPLETE IN DEVELOPMENT.**

Catalog is now the first internal domain proven beneath a genuine top-level application runtime.

## Next bounded migration

The next Commerce & Operations pass should add **Inventory** to the same already-proven top-level runtime while preserving Inventory as an explicit domain/service authority.

Do not migrate Operations or Public in the same pass.

A future Core release gate should validate shared `admin.js` version integrity so a new Core build cannot be considered deployable while active Admin pages still point at an older shared loader version.
