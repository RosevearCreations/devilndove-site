# Build 289 — Packaging Write-Response Decoupling

## Objective

Remove the remaining broad Catalog and Inventory enumeration from the **active Packaging POST response path** without rewriting mature Packaging business-write logic.

Build 288 already made the legacy broad GET unreachable from the active module. Build 289 applies the same ownership rule after writes.

## Runtime flow

```text
Legacy Packaging UI
  POST /api/admin/packaging-studio
        |
        v
Build 289 write-response bridge
  -> POST /api/admin/packaging-write
        |
        v
Build 289 gateway
  -> delegates existing packaging-studio onRequestPost
  -> filtered D1 view suppresses only broad response lists
  -> Packaging-owned refresh/detail queries still execute
  -> successful response omits products + inventory
```

GET remains unchanged from Build 288:

```text
GET /api/admin/packaging-studio
  -> Build 286 bridge
  -> /api/admin/packaging-bootstrap
  -> catalog-read + inventory-read + content-media
  -> Build 288 guard blocks any broad rollback GET
```

## Why use a gateway instead of editing the mature Function now?

`functions/api/admin/packaging-studio.js` contains the mature Packaging POST authority and many write actions. Its successful response currently calls `listData()`, which mixes:

- Packaging-owned project/template/library/printer/reference refreshes;
- broad Product enumeration;
- broad Inventory enumeration.

A direct edit would couple response cleanup to a very large write surface. Build 289 instead delegates that proven write handler and filters only the three known cross-domain response-enumeration SELECTs.

This is a migration adapter, not the final server architecture.

## Suppressed queries

The response-boundary helper recognizes only:

1. broad active Product list ordered by name with `LIMIT 500`;
2. enriched active Inventory list ordered by item name with `LIMIT 1000`;
3. legacy fallback active Inventory list ordered by item name with `LIMIT 1000`.

Every other D1 operation passes through unchanged.

## Response contract

Successful Build 289 gateway responses:

- retain `ok`, `message`, `detail`, `projects`, `templates`, Packaging libraries and other Packaging-owned response data;
- omit `products`;
- omit `inventory`;
- include `write_boundary` evidence showing Build 289 and counts of suppressed broad queries.

The legacy client is compatible without modification:

- Product data is consumed from POST responses nowhere; it is populated by the initial contractized GET.
- The two POST handlers that inspect `data.inventory` use `data.inventory || state.inventory`, so omission preserves the existing contractized Inventory state.

An empty array is intentionally **not** returned because `[]` is truthy in JavaScript and would replace the existing Inventory state.

## Preserved boundaries

Build 289 does not modify:

- `functions/api/admin/packaging-studio.js`;
- `public/js/admin-packaging-studio.js`;
- Build 286 Packaging bridge;
- Build 287 artwork picker;
- Build 288 GET retirement guard;
- SQL/schema;
- Wrangler/bindings;
- R2 resources;
- Production.

The new Function is a migration gateway only. Authorization, write validation, audit behavior and incident handling remain in the delegated mature POST implementation.

## Failure behavior

The Build 289 runtime does **not** fall back to direct POST `/api/admin/packaging-studio` if the gateway fails. Falling back would restore the broad response enumeration that this build is retiring.

A gateway failure is therefore surfaced as a write failure and the existing browser-draft/error handling remains authoritative.

## Acceptance

Build 289 is accepted when local regression proves:

- syntax/imports resolve;
- the response D1 filter blocks exactly the broad Catalog/Inventory response lists while allowing normal SQL;
- successful decoupled payloads omit Product/Inventory collections;
- active Packaging POSTs are transported to `/api/admin/packaging-write`;
- no active POST reaches the original `/api/admin/packaging-studio` transport directly;
- Build 288 narrow GET + retirement behavior remains intact;
- Build 287 artwork picker remains composed;
- no legacy UI, mature Packaging Function, schema, binding or Production change occurs.

## Next

After runtime parity is proven, Build 290 can physically remove the dormant broad Product/Inventory list code from the mature Function. A later build can then extract the mature POST implementation into a dedicated Packaging write service and retire the temporary gateway delegation.
