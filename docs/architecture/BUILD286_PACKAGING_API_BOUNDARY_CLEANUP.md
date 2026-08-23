# Build 286 — Packaging API Boundary Cleanup

## Purpose

Build 285 proved that the real Packaging UI can consume Catalog, Inventory, and Content through declared owner contracts. Build 286 removes the unnecessary server work that Build 285 was still replacing after the fact.

## New healthy GET path

```text
legacy Packaging UI asks for /api/admin/packaging-studio
                    |
                    v
active Packaging module intercepts GET only
                    |
                    v
/api/admin/packaging-bootstrap
  - Packaging projects/templates
  - formulas/content/source-material libraries
  - printer/reference data
  - selected Packaging detail
  - linked product/component context only
                    |
       +------------+-------------+
       |            |             |
       v            v             v
 catalog-read  inventory-read  content-media
       |            |             |
       +------------+-------------+
                    |
                    v
legacy UI receives its familiar response shape
```

The healthy path never calls the legacy broad GET endpoint.

## Why a new endpoint instead of editing the old Function

`functions/api/admin/packaging-studio.js` is a mature, large compatibility surface that also owns all Packaging writes. Removing its broad read sections in the same step would couple a performance cleanup to a high-risk write-path edit.

Build 286 therefore introduces a narrow GET-only endpoint and leaves the legacy Function unchanged. The old GET becomes an explicit rollback path while existing POST actions remain authoritative and untouched.

## Ownership rule

The narrow endpoint may join Catalog or Inventory only for already-linked context required to describe a Packaging-owned record, for example:

- the SKU/status/image of the product already linked to a Packaging project;
- stock/unit context of an Inventory item already linked to a Packaging component.

It must not enumerate all Catalog products or all Inventory items. Those collections come only through `catalog-read` and `inventory-read`.

## Failure behavior

Normal:
- narrow Packaging endpoint succeeds;
- owner contracts succeed;
- `legacyEndpointBypassed = true`.

Continuity fallback:
- if the narrow endpoint fails, the module may issue the old broad GET once;
- if a contract fails and no session-cached contract value exists, the old broad GET may supply that collection once;
- status explicitly records the fallback;
- no fallback is treated as a successful modular boundary.

## Runtime efficiency

The bridge remains event-driven. It adds no recurring timer and no polling loop. The one-shot refresh remains only to resolve the existing page-load/module-activation race.

## Security

- Both Packaging GET endpoints require server-side Admin authentication.
- Contract endpoints remain server-authenticated.
- Client module state does not authorize data access.
- Packaging writes continue through the existing protected API.

## Out of scope

- deleting the legacy GET implementation;
- moving Packaging writes;
- schema changes;
- Packaging Studio visual redesign;
- Production promotion.

After Development parity is proven, the dormant broad GET can be removed or narrowed in a later build.
