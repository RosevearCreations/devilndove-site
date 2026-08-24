# Build 302 Validation — Core + Three Application Modules Normalization

## Status — STAGED / LOCAL VALIDATION REQUIRED

Build 302 is an architecture-normalization pass. It does **not** change the completed Build 301 Packaging runtime.

Completed Build 301 head pinned by this build:

```text
a81f8d6af0004d847174fa27043c11e159ca3d10
Build 301 set completed compatibility baseline handoff
```

Real Production remains frozen at Build 280.

## Build 302 target

The authoritative application structure is now:

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
              +----------------+----------------+
              |                |                |
              v                v                v
       COMMERCE &         CREATIVE &       BUSINESS &
       OPERATIONS          PRODUCTION      ADMINISTRATION
```

Current domain grouping:

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

Packaging Build 301 remains the first proven extracted domain inside Creative & Production.

## Runtime rule

Build 302 adds the passive target catalog:

```text
public/js/core/dd-application-module-groups.mjs
```

It is not imported by the current live module runtime in Build 302.

Therefore Build 302 must not change:

- Packaging page script order;
- Build 301 compatibility facade;
- Build 300 Save/Preview stabilizer;
- Build 298 native client/editor;
- Build 297 compatibility/startup layers;
- current `dd-module-definitions.mjs` route/domain catalog;
- current `dd-admin-module-runtime.mjs` behavior;
- Packaging server read/write authorities.

## Local validation

After pulling `dev`, run:

```bash
python scripts/build301_packaging_compatibility_checkpoint_test.py
python scripts/build302_core_three_module_architecture_test.py
```

Expected Build 301 ending:

```text
BUILD 301 PACKAGING COMPATIBILITY HISTORICAL REGRESSION: PASS (a81f8d6a)
No Cloudflare resource was contacted.
```

Expected Build 302 ending:

```text
PASS: Build 302 architecture catalog JavaScript syntax
PASS: Build 302 catalog is passive and defines Core + three application modules
PASS: all current domains are assigned exactly once across the three application modules
PASS: authoritative architecture is normalized to Core + three modules
PASS: Build 302 documents the migration state without claiming runtime conversion is complete
PASS: completed Build 301 compatibility proof is historically pinned
PASS: Build 301 Packaging and current Core/domain runtime behavior are unchanged
PASS: exact Build 302 architecture-normalization changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 302 CORE + THREE MODULE ARCHITECTURE NORMALIZATION: PASS
No Cloudflare resource was contacted.
```

## Expected changed-file boundary

From completed Build 301 head `a81f8d6a...`, Build 302 must contain exactly:

```text
AI_CONTEXT.md
BUILD302_CHANGED_FILES.md
BUILD302_VALIDATION.md
docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md
docs/architecture/BUILD302_CORE_THREE_MODULE_NORMALIZATION.md
public/js/core/dd-application-module-groups.mjs
scripts/build301_packaging_compatibility_checkpoint_test.py
scripts/build302_core_three_module_architecture_test.py
```

No active Packaging page/runtime file is in the boundary.

## Development deployment

Because the repository is connected to the Development Pages project, documentation/passive-catalog commits may still produce a Development deployment record.

No browser behavior change is expected or required for Build 302 completion because the new catalog is intentionally not loaded by the live runtime yet.

If checking deployments, use only:

```text
devilndove-site-dev
```

Do not contact or promote real Production.

## Completion decision

Build 302 is complete when both local regressions pass and the exact changed-file/safety boundary is confirmed.

A browser Save/Preview proof is **not** repeated for Build 302 because no proven Build 301 runtime file is changed. The historical Build 301 regression protects that baseline instead.

## Next runtime work after Build 302

Do not immediately delete old Packaging compatibility layers.

The next runtime phase should begin migrating from twelve top-level domain classifications toward the three umbrella application modules, one bounded route/service group at a time.

Recommended first runtime target:

```text
Commerce & Operations
```

because it owns the Catalog/Inventory/Operations services that other modules already consume. Packaging remains preserved inside Creative & Production while that shared-service boundary is made explicit.
