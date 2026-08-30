# Release 461 Candidate — Public Runtime Schema Authority

## Scope

Release 461 candidate work begins the post-checkout runtime-schema audit with public/customer request paths first. Its first migration-owned slice covers:

- `/api/checkout-recovery-lead`
- `/api/custom-request-consent`

Both handlers previously created or altered D1 schema during customer traffic. That behavior is forbidden by the current Development release policy.

## Authority change

`migrations/dev/20260829_release461_public_runtime_schema_authority.sql` now owns the current schema used by:

- `checkout_recovery_leads`
- `custom_request_fulfillment_prompts`

The public handlers only perform read/write business operations after a read-only schema-readiness check. They never create a table, add a column, or create an index.

When required schema is unavailable, the handler fails closed with HTTP 503. A customer request is never treated as a migration trigger.

## Drift and migration rule

The Release 461 Development D1 workflow is manual-dispatch-only. Before any write it verifies the exact Development project/database identity and probes the existing table shapes read-only.

If an existing table is structurally older than the Release 461 contract, the workflow stops. That condition requires a deliberate new forward repair migration. Historical migrations must not be replayed and runtime code must not self-repair the table.

If the table is absent, or if an existing table is structurally compatible but Release 461 indexes are missing, the additive Release 461 migration may be applied after the read-only preflight.

## Boundaries

- Development branch/project only.
- Separate live Production remains untouched.
- Provider authorization remains closed.
- Provider execution/publication remains closed.
- No historical D1 replay.
- No automatic D1 migration trigger.

## Continuing audit

After this slice, continue through `functions/api/**` with public/customer routes first. Search each request owner and every shared helper it calls for `CREATE TABLE`, `ALTER TABLE`, `CREATE INDEX`, `ensure*Schema`, and equivalent hidden schema mutation. Move discovered schema authority into explicit forward migrations or read-only readiness services before proceeding to admin-only mutation paths.

## Current-release metadata

`development-release.json` remains on Release 460 until the Release 461 Development D1 authority is explicitly accepted. This avoids claiming schema release 461 while its migration has not been run.
