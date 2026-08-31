# Canonical D1 migration stream

This directory is the **only forward migration stream for schema changes after the proven Release 461 baseline**.

## Current Development proof

Release 465 Build 1 Development has applied and verified:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`
4. `0004_release465_storefront_quality.sql`

The first Build 1 green run (`33428268265`, source `4359862e1d7a9d8dfc53841d0d25c6a219f134c3`) proved 4 native `d1_migrations` rows, 4 `app_schema_migration_proofs` rows, 583 non-SQLite tables, 4 Release 465 publication triggers and 0 foreign-key violations. Migration 0004 was the only newly applied file in that run.

## Authority

- Cloudflare D1's native `d1_migrations` table is the authoritative applied-migration ledger.
- `app_schema_migration_proofs` records SHA-256 identity, source SHA, environment and recovery-note hash.
- `manifest.json` defines exact order, purpose and recovery guidance.
- `migrations/dev/` and root historical SQL files are provenance only and are never startup actions.

## Required order

1. Add the next monotonically numbered SQL file and append its manifest entry without changing applied entries.
2. Pass `scripts/migration_policy_gate.py` and canonical source gates.
3. Apply through `scripts/d1_migrate.py --target development --apply`.
4. Verify Development ledger, checksum proof and foreign keys.
5. Prove the exact Development source tree through System Gate and Preview runtime acceptance.
6. Promote only that approved Development tree to `main` when deliberately authorized.
7. Production migration application first verifies the same checksum is proven in Development, applies the same canonical file to Production and verifies Production integrity.
8. Only then may dependent Production code deploy.

## Immutability

Once a canonical migration has been applied to Development, **do not edit, rename, reorder, delete, or rewrite its manifest recovery identity**. Any correction is a new numbered migration.

Release 465 Build 1 demonstrated the pre-application exception correctly: the first 0004 attempt failed with D1 `incomplete input` before ledger application, so its trigger syntax could still be corrected. After the successful Development apply, 0004 became immutable.

## Recovery

Every migration manifest entry must contain concrete recovery guidance. Destructive or data-rewriting migrations require an explicit operator-reviewed recovery plan and must not be treated as routine automatic migrations.

Production canonical migrations 0001–0004 remain unapplied until deliberate Production promotion.
