# Build 333 — Accounting Statement Provider Profiles Read Extraction

`/api/admin/accounting-statement-provider-profiles` GET now delegates to `accountingStatementProviderProfilesReadService.js` and no longer seeds defaults into D1 during reads.

The read returns the six built-in defaults in memory and overlays stored provider profiles when the table is ready. It reports `defaults_materialized=false`, schema readiness and `request_time_schema_mutation=false`.

Explicit POST seeding/saving remains the only path that materializes provider-profile rows.

Dedicated contract: `/api/admin/contracts/accounting-statement-provider-profiles-read`.
