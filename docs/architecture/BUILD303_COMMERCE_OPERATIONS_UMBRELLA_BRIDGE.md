# Build 303 — Commerce & Operations Umbrella Runtime Bridge

## Status — COMPLETE IN DEVELOPMENT

Build 303 is the first runtime step after Build 302 normalized Devil n Dove to one shared Core plus exactly three top-level application modules.

Completed Build 302 handoff head:

```text
000b9617bc5141ba876ec667d4fbc653ea9ee556
```

Proven Build 303 runtime head:

```text
4fa2124cb89edff89c873c0dbdc1feee35a4e92b
```

Build 303 does not move Catalog, Inventory or Operations business logic into a new bundle. It makes the existing Core runtime aware of each domain's umbrella application-module parent while preserving current domain activation.

## Runtime behavior

Core now reports both:

```text
current domain
current top-level application module
```

Examples:

```text
catalog     -> commerce-operations
inventory   -> commerce-operations
operations  -> commerce-operations
packaging   -> creative-production
accounting  -> business-administration
```

The runtime exposes:

```text
DDModuleRuntime.build = 303
DDModuleRuntime.applicationArchitectureBuild = 302
DDModuleRuntime.getCurrentApplicationModule()
DDModuleRuntime.applicationModuleForDomain()
DDModuleRuntime.getApplicationModule()
```

The document root and Admin links receive umbrella classification metadata, and Core emits `dd:application-module-resolved` alongside the existing domain resolution event.

## Verified-auth reconciliation

The first Development browser proof showed Commerce & Operations classification working, but Packaging stayed at `activation-pending`. The cause was an event-order race: verified auth could complete before the asynchronous Core import attached its `dd:admin-ready` listener.

Build 303 corrected this by retaining both event-triggered and state-triggered verified-auth activation:

- `verifiedResolutionPromise` prevents duplicate concurrent activation;
- `requestVerifiedAdminResolution()` centralizes verified activation;
- `reconcileVerifiedAuthState()` reads retained `DDAuthUiState`;
- `bootstrap()` queues retained-state reconciliation;
- `dd:admin-ready` remains the normal path;
- `dd:auth-verified` also reconciles.

This correction adds no network request and changes no Packaging read/write/Save/Preview authority.

## Completed browser proof

Commerce & Operations on `/admin/products/`:

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

Packaging preservation on `/admin/packaging-studio/`:

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

## What does not change

The existing domain registry remains authoritative for actual activation. Build 303 does not change:

- domain IDs or route prefixes;
- service contract ownership;
- Catalog/Inventory/Operations API routes;
- `catalog-read`, `inventory-read` or `content-media` adapters;
- Packaging runtime entry;
- Build 301 Packaging compatibility behavior;
- Build 300 Save/Preview stabilization;
- SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Architectural significance

Build 303 proves that Core can run the application using the final **Core + three-module identity** while the historical domains continue to own their current implementations during migration.

That gives us a safe transition model:

```text
route
 -> historical domain owner
 -> top-level application-module parent
 -> current domain runtime/shadow behavior
```

## Next runtime step

The next bounded pass should create the first real **Commerce & Operations umbrella runtime boundary** and migrate only one internal domain at a time behind it. Catalog is the preferred first candidate because its read contract is already explicit and passive.

Do not convert Catalog, Inventory, Operations and Public simultaneously.
