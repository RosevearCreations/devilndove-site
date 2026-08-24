# Devil n Dove AI Context — Build 303 Completed Commerce & Operations Umbrella Bridge

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the broader functional roadmap.

Current modular architecture authority:

- `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`
- `docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md`
- `BUILD302_VALIDATION.md`
- `docs/architecture/BUILD303_COMMERCE_OPERATIONS_UMBRELLA_BRIDGE.md`
- `BUILD303_VALIDATION.md`

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Authoritative application structure

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

There is one shared Core + exactly three top-level application modules.

Historical domain IDs remain internal ownership/service boundaries during migration:

```text
Commerce & Operations
  public
  catalog
  inventory
  operations

Creative & Production
  creative
  caip
  packaging
  content

Business & Administration
  marketing
  accounting
  platform
  admin
```

## Core responsibilities

Core owns shared infrastructure only: auth/session awareness, authorization context, module registry/lifecycle, route resolution, shared API helpers, notifications/errors, environment/runtime state, shared service registration, and module availability.

Core must not absorb business-domain rules.

## Build 301 Packaging baseline — COMPLETE IN DEVELOPMENT

Build 301 remains the trusted Packaging compatibility baseline.

Runtime activation:

```text
e2be2209ed96b7a67e975feead37a768f0043cb5
```

Completed Build 301 handoff head:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
```

Live proof established native read/write status 200, verified Save Project, fitted Preview, zero failed verification, zero compatibility replay/block traffic, and write authority `packaging-domain-service`.

Build 299 remains NOT COMPLETE and its browser print-source controller remains rolled back.

## Build 302 — COMPLETE IN DEVELOPMENT

Proven Build 302 runtime/architecture baseline:

```text
cb68b71440f344c258809e79efe23bea65d0167f
```

Completed Build 302 documentation/handoff head:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Build 302 normalized the architecture to Core + exactly three application modules and added the passive grouping catalog.

## Build 303 — COMPLETE IN DEVELOPMENT

Proven Build 303 runtime head:

```text
4fa2124cb89edff89c873c0dbdc1feee35a4e92b
Build 303 record Packaging activation race correction
```

Build 303 is the first runtime bridge from historical domain-only classification to the three umbrella modules.

Runtime identity:

```text
DDModuleRuntime.build = 303
DDModuleRuntime.applicationArchitectureBuild = 302
```

Core continues to resolve/activate the existing domain definition while also reporting its top-level application-module parent.

Examples:

```text
catalog     -> commerce-operations
inventory   -> commerce-operations
operations  -> commerce-operations
packaging   -> creative-production
accounting  -> business-administration
```

### Verified-auth correction

The first Packaging browser proof remained at `activation-pending` because verified auth could finish before the asynchronous Core import attached its event listener.

Build 303 corrected this with retained-state reconciliation using `DDAuthUiState`, plus an in-flight guard against duplicate activation. No new network transport or Packaging business logic was added.

### Completed local proof

```text
BUILD 302 CORE + THREE MODULE ARCHITECTURE HISTORICAL REGRESSION: PASS (000b9617)
BUILD 303 COMMERCE & OPERATIONS UMBRELLA RUNTIME BRIDGE: PASS
No Cloudflare resource was contacted.
```

Working tree was clean after validation.

### Development deployment proof

```text
Project devilndove-site-dev
Source  4fa2124
Status  Active
```

### Commerce & Operations browser proof

On `/admin/products/`:

```text
runtime_build                   303
architecture_build              302
domain                          catalog
domain_mode                     shadow
application_module              commerce-operations
application_module_mode         domain-bridge
api_current_application_module  commerce-operations
active_domain_runtime           null
contracts_ok                    true
services_ok                     true
```

### Packaging preservation browser proof

On `/admin/packaging-studio/`:

```text
runtime_build                   303
architecture_build              302
auth_phase                      verified
auth_verified                   true
domain                          packaging
domain_mode                     active
application_module              creative-production
application_module_mode         domain-bridge
api_current_application_module  creative-production
active_domain_runtime           packaging
packaging_compatibility_build   301
packaging_compatibility_state   active
native_read_count               2
native_read_status              200
failed_verification_count       0
preview_mode                    fit
```

Build 303 changed no Packaging read/write/save implementation, so no additional write proof was required.

## Current separation state

```text
Core
  established; now umbrella-aware at runtime

Commerce & Operations
  umbrella identity proven at runtime
  catalog/inventory/operations implementations still domain/shadow

Creative & Production
  umbrella identity proven at runtime
  Packaging domain substantially extracted and active under Build 301
  creative/caip/content remain shadow/legacy

Business & Administration
  umbrella identity available through Core mapping
  domains remain shadow/legacy
```

## Next runtime direction

The next bounded pass should create the first real **Commerce & Operations umbrella runtime boundary** and migrate only one internal domain at a time behind it.

Preferred first candidate: **Catalog**, because `catalog-read` is already an explicit passive contract.

Do not convert Public, Catalog, Inventory and Operations simultaneously.

After Commerce & Operations is proven, establish Creative & Production around Packaging, then Business & Administration. Only after all three top-level runtimes are proven should redundant shadow/domain loaders and old compatibility layers be retired.

## Separate schema/data parity track — DO NOT MIX WITH MODULE EXTRACTION

There is a separate database parity problem: missing Production business data in Development and incomplete fresh-install schema. Priority remains schema parity first, then business-data migration. Do not combine that work with module-runtime extraction.
