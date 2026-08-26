# Devil n Dove Database Schema Reference — Build 438 Source / Build 437 Production Baseline

This file is the current database/schema authority summary. Historical Build-specific schema documents remain evidence only.

## Current release boundaries

```text
Production-proven application/database baseline: Build 437
Current source/development schema release:        Build 438
Build 438 Development D1 migration:               PENDING OWNER RUN
Build 438 Production D1 migration:                NOT AUTHORIZED
Broad Production promotion:                       CLOSED
```

Build 437 closed Product-number, Gift Card, Notification Build 403, Build 197 annotation-index and Membership Build 395 Production parity work. Do not reopen those migrations for unrelated feature failures.

## Fresh-install authority

`database_full_schema.sql` remains the large fresh-install base aggregate.

At the start of Build 438 source work, the aggregate does **not yet contain** the two new Build 438 module-control tables. The focused Build 438 migration is therefore the current explicit post-aggregate authority until the aggregate is synchronized and committed:

```text
database_build438_application_module_activation.sql
```

Build 438 includes a deterministic local helper:

```text
scripts/build438_sync_full_schema.py
```

The helper may only append the exact focused Build 438 migration block to `database_full_schema.sql` when the two Build 438 CREATE TABLE authorities are absent. It validates the resulting aggregate and is designed to no-op on rerun. It does not contact Cloudflare and does not apply D1 changes.

Once the generated aggregate change is committed, fresh installs should again use the synchronized aggregate directly. Until then, a fresh-install procedure must apply:

```text
1. database_full_schema.sql
2. database_build438_application_module_activation.sql
```

Do not claim Build 438 aggregate parity until the sync helper has run and its generated aggregate diff is committed.

## Build 438 module-control D1 authority

Focused migration:

```text
database_build438_application_module_activation.sql
```

Read-only verification:

```text
BUILD438_D1_VERIFICATION.sql
```

### `app_modules`

Top-level application-module state:

```text
module_key                     TEXT PRIMARY KEY
display_name                   TEXT NOT NULL
description                    TEXT NOT NULL DEFAULT ''
is_enabled                     INTEGER NOT NULL DEFAULT 1
requires_login                 INTEGER NOT NULL DEFAULT 1
default_route                  TEXT NOT NULL DEFAULT '/'
load_priority                  INTEGER NOT NULL DEFAULT 100
background_activity_enabled    INTEGER NOT NULL DEFAULT 0
created_at                     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at                     TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Index:

```text
idx_app_modules_enabled_priority
```

Expected three rows:

```text
commerce-operations
creative-production
business-administration
```

All three initially enabled. Background permission is OFF for all three.

### `app_module_role_access`

Role-to-module access authority:

```text
module_key      TEXT NOT NULL
role_code       TEXT NOT NULL
is_allowed      INTEGER NOT NULL DEFAULT 0
access_level    TEXT NOT NULL DEFAULT 'none'
created_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at      TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
PRIMARY KEY (module_key, role_code)
FOREIGN KEY (module_key) REFERENCES app_modules(module_key) ON DELETE CASCADE
```

Index:

```text
idx_app_module_role_access_role
```

Expected six rows cover current roles `member` and `admin` for all three modules.

Current defaults:

```text
member -> commerce-operations       allowed/member
member -> creative-production       denied/none
member -> business-administration   denied/none
admin  -> commerce-operations       allowed/manage
admin  -> creative-production       allowed/manage
admin  -> business-administration   allowed/manage
```

No per-user module override table exists yet.

## Build 438 runtime/schema ownership rules

1. Request handlers do **not** create/alter/drop Build 438 schema.
2. Module-control writes fail closed if the focused migration has not been applied.
3. Missing Build 438 schema during staged rollout may use all-enabled compatibility defaults for reads only.
4. A real later D1/module-authority read failure uses last-known module state when possible; otherwise module-owned access fails closed.
5. Disabling a module never deletes module business data.
6. Disabling a module clears its `background_activity_enabled` permission.
7. `background_activity_enabled` is permission only; it is not a scheduler.
8. Current user/session identity is request-scoped and is never stored as mutable global Worker state.

## Build 438 shared service-contract policy

The following are runtime/API contracts, **not additional database tables**:

```text
catalog-read
inventory-read
inventory-cost
inventory-post
inventory-reverse
accounting-read
content-media
```

A disabled owner module may still provide one of these narrowly reviewed contracts to another enabled consumer module. Direct owner pages and broad/legacy APIs remain disabled. Shared mutation contracts require a qualifying consumer with `manage` access.

This preserves module independence without duplicating Inventory, Catalog, Accounting or Content database authorities.

## Build 438 Development rollout

Preferred helper:

```text
scripts/build438_development_module_activation.py
```

It is hard-pinned to:

```text
branch:       dev
database:     devilndove-dev
database ID:  dbc1615b-dcbe-4951-973b-b47c99c73bfa
Wrangler:     4.126.0
```

It has no Production mode.

Exact post-apply verification requires:

```text
module_count               3
role_access_count          6
enabled_module_count       3
background_enabled_count   0
expected_index_count       2
verification_pass          1
```

Read `BUILD438_VALIDATION.md` for the full owner-run procedure.

## Retained major authorities

### Authentication

Current auth/session authority:

```text
users
sessions
```

Historical blog ownership still depends on:

```text
members_legacy
member_sessions_legacy
```

Do not recreate old active `members` / `member_sessions` authentication tables and do not remove the legacy compatibility tables while historical blog foreign keys/evidence depend on them.

### Catalog / Inventory

`catalog_items` is the descriptive tool/supply authority. `site_item_inventory` is the operational stock/cost/reservation authority. Fractional usage and reviewed production/material movements retain their dedicated movement/profile/evidence tables.

### Product media

`product_images` remains the preferred Product Editor gallery. `media_assets`, role assignments and annotation/history tables remain supporting/recovery authorities; do not create a second independent R2 inventory.

### Creative Process / CAIP / Content / Packaging

Creative Process owns project/process/material/time/cost facts; CAIP owns private source-media/evidence/story facts; Content Studio owns reviewed deliverables; Packaging owns label/package/formula/ingredient/translation-review presentation facts. Inventory references in Packaging are identity/provenance links, not stock consumption.

## Known structural/parity debt still separately locked

```text
Fractional Inventory / Creative Project numeric rebuilds   NOT AUTHORIZED
Product / foreign-key rebuilds                             NOT AUTHORIZED
Accounting default / nullability rebuilds                  NOT AUTHORIZED
Other remaining structural drift                           NOT AUTOMATICALLY NEXT
```

Start any future family with fresh read-only evidence. A generic `continue`, pasted log or feature request never authorizes Production DDL/DML.
