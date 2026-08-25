# Builds 373–382 — Custom Requests Read-Surface Cleanup

## Goal

Finish the dedicated `/admin/custom-request/` read surface without moving any quote, payment, order, fulfillment, consent, marketplace-pack, or review mutation authority.

The Build 370 startup contract was already non-mutating and browser-proven. The remaining read-side risk was the older marketplace CSV GET on `/api/admin/custom-requests?format=marketplace_csv`, which still calls the legacy schema/preset ensure path.

## Ten-update execution batch

### Build 373 — safe marketplace CSV export

Adds:

```text
GET /api/admin/contracts/operations-custom-requests-marketplace-export
```

The endpoint reads already-prepared `custom_request_marketplace_export_packs` rows only. It does not create tables, seed presets, create export packs, or publish listings.

### Build 374 — export readiness read

Adds:

```text
GET /api/admin/contracts/operations-custom-requests-marketplace-export-read
```

The endpoint uses read-only `PRAGMA table_info` checks and reports:

```text
schema_ready
missing_tables
optional_schema_ready
optional_missing_tables
export_pack_count
marketplace_preset_count
export_routes
request_time_schema_mutation=false
mutation_ownership_moved=false
seeds_marketplace_presets=false
```

### Build 375 — dedicated page diagnostics bootstrap

`custom-requests-page-tools.mjs` automatically reads the already-proven Build 370 startup contract on `/admin/custom-request/`.

### Build 376 — safe export toolbar

The dedicated page exposes safe CSV links for all channels, Etsy, Facebook, Pinterest, and manual listing export.

### Build 377 — legacy CSV-link rewrite

Any legacy link matching:

```text
/api/admin/custom-requests?format=marketplace_csv
```

is rewritten on the dedicated page to the Build 373 safe export route.

### Build 378 — startup schema visibility

The page visibly reports Build 370 startup readiness instead of allowing missing tables to look like empty panels.

### Build 379 — export schema visibility

The page visibly reports export-pack readiness and optional marketplace-preset readiness.

### Build 380 — dedicated-page guard

A MutationObserver catches marketplace links rendered later by the mature Custom Requests UI. A capture-phase click guard prevents the legacy CSV GET from being used on this dedicated page.

There is no timer or polling loop.

### Build 381 — regression

`build373_382_custom_requests_read_surface_test.py` verifies:

- Build 373/374 endpoints are GET-only and contain no DDL/DML;
- page tools use only owned read/export routes;
- legacy marketplace CSV links are rewritten;
- Commerce runtime remains Build 371 / activation 372;
- Custom Requests mutation ownership remains false;
- the mature compatibility POST remains unchanged.

### Build 382 — rolling execution roadmap

Adds `docs/architecture/NEXT_20_BUILDS.md` and changes the development cadence to:

```text
10 builds in the active execution batch
20 future builds kept visible in Markdown
```

## Ownership boundary

Unchanged compatibility mutation authority:

```text
POST /api/admin/custom-requests
```

The mature workflow still owns review updates, quotes, jobs, product plans, payment candidates, payment links, order drafts/conversion, fulfillment prompts, consent/public-proof actions, marketplace pack creation, and marketplace preset edits.

The new export endpoints are read-only and do not create marketplace packs. A pack must already have been created through the retained reviewed workflow before it appears in CSV output.

## Runtime boundary

Builds 373–382 do **not** advance the shared Commerce runtime:

```text
runtime build       371
activation build    372
```

The already browser-proven `/admin/custom-request/` lifecycle gate remains:

```text
operations-custom-requests-read
```

The new export readiness/page tools are dedicated-page read UX and do not become mutation or top-level Core ownership.

## Legacy compatibility note

The old marketplace CSV branch remains present in `functions/api/admin/custom-requests.js` for compatibility. The new dedicated page no longer needs to use it. A later cleanup may retire that branch only after compatibility impact is audited.
