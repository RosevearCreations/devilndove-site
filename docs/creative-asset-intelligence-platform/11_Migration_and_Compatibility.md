# 11 — Migration and Compatibility

## Build 201 migration

Run after Build 199 and Build 200:

```text
database_build201_creative_asset_intelligence_platform.sql
```

It is additive and rerunnable. It creates CAIP-only tables and indexes plus a migration-ledger entry. It does not modify rows in `products`, `product_images`, `media_assets`, `content_projects`, `content_project_media`, `content_project_deliverables`, or `content_publications`.

## Runtime fallback

`ensureCreativeAssetIntelligenceSchema()` creates the same CAIP tables defensively when the admin API loads. This improves resilience during a partially staged deployment, but it is not a substitute for running the migration and checking the ledger in production.

## Compatibility rules

- Existing Content Studio and Release Board records continue to work when no CAIP record exists.
- Build 201 only attempts CAIP sync after Content Studio succeeds.
- A failed CAIP sync logs a warning; it does not roll back product approval or Content Studio archive work.
- CAIP source media pointers are refreshed from Content Studio. CAIP does not backfill/repair missing product images or asset records.
- Existing Content Studio safety state remains the source authority. CAIP may apply a stricter local restriction.

## Fresh-install schema

Build 201 schema definitions must stay synchronized in:

- `../../database_full_schema.sql`
- `../../database_schema.sql`
- `../../database_store_schema.sql`
- `../../database_upgrade_current_pass.sql`
- `../../DATABASE_SCHEMA_REFERENCE.md`

Any future CAIP table change requires all five artifacts plus this specification, the migration ledger, release notes, handoff, roadmap, and smoke tests to be updated together.

## Build 202 migration

Run `database_build202_caip_media_operations_secure_review.sql` after Build 201. It is additive and rerunnable. It creates operational metadata/control tables only and does not write media objects or change existing source asset rows.

Rollback is operational, not destructive: disable/remove the Build 202 Pages code path, revoke outstanding secure review grants, and leave historical records for audit. Do not drop operational tables without a reviewed retention/export decision; they are evidence of review/planning activity, not source files.
