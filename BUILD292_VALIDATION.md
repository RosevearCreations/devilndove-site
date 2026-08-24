# Build 292 Validation

## Local regression

Run:

```bash
python scripts/build292_packaging_legacy_post_retirement_test.py
```

Expected proof:

- Build 292 server JavaScript syntax passes.
- Shared Build 291 Packaging domain service is unchanged.
- Legacy Packaging POST no longer delegates to the shared write service.
- Legacy Packaging POST preserves admin auth and returns explicit 410 retirement metadata after authentication.
- Legacy Packaging GET still delegates temporarily to the shared service.
- Native Packaging write gateway still imports the shared service directly.
- Native gateway reports Build 292 endpoint authority while preserving Build 291 write-service provenance.
- Build 290 broad-read removal remains intact.
- Build 290 browser/runtime compatibility stack remains unchanged.
- Build 291 historical regression is pinned to final Build 291.
- Exact Build 292 changed-file boundary passes.
- No SQL/schema, Cloudflare binding/config, legacy UI, bootstrap, shared-service, or client-runtime change.

## Development deployment

Deploy only to `devilndove-site-dev` after the local gate passes.

Unauthenticated runtime checks should show:

- static Packaging client/runtime files HTTP 200;
- `/api/admin/packaging-write` POST HTTP 401;
- `/api/admin/packaging-studio` POST HTTP 401;
- `/api/admin/packaging-studio` GET HTTP 401;
- `/api/admin/packaging-bootstrap` GET HTTP 401.

## Authenticated retirement proof

With a verified Development admin session, a direct POST to `/api/admin/packaging-studio` must return HTTP 410 and JSON containing:

```json
{
  "ok": false,
  "error_code": "packaging_legacy_post_retired",
  "build": 292,
  "legacy_post_retired": true,
  "replacement_path": "/api/admin/packaging-write"
}
```

Do not use the retired endpoint for application writes.

## Authenticated normal-write proof

Use the normal Packaging UI Save action. The Build 289 browser bridge should continue routing the mature UI POST to `/api/admin/packaging-write` without the UI encountering the 410 legacy response.

The successful write boundary should report:

- `gateway_build: 292`
- `write_service_build: 291`
- `write_authority: packaging-domain-service`
- `shared_write_service: true`
- `legacy_post_route_is_adapter: false`
- `legacy_post_route_retired: true`
- `legacy_post_retirement_build: 292`
- `legacy_post_error_code: packaging_legacy_post_retired`
- `legacy_broad_reads_removed: true`
- `legacy_broad_reads_removed_build: 290`
- `broad_catalog_queries_skipped: 0`
- `broad_inventory_queries_skipped: 0`
- HTTP 200.

## Production safety

Production remains frozen at Build 280. No Production deployment or Production resource contact is part of Build 292 validation.
