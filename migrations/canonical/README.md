# Canonical D1 migration stream

This directory is the **only forward migration stream for schema changes after the proven Release 461 baseline**.

## Authority

- Cloudflare D1's native `d1_migrations` table is the authoritative applied-migration ledger.
- `app_schema_migration_proofs` records the SHA-256 identity, source SHA, environment and recovery-note hash for every canonical migration.
- `manifest.json` defines order, purpose and recovery guidance.
- `migrations/dev/` and root historical SQL files are provenance only. They are never startup actions and are never replayed because a chat, workstation, branch or deployment changes.

## Required order

1. Add the next monotonically numbered SQL file and its manifest entry.
2. Pass `scripts/migration_policy_gate.py` locally/CI.
3. Apply through `scripts/d1_migrate.py --target development --apply`.
4. Verify Development ledger, checksum proof and foreign keys.
5. Prove the exact Development source tree through System Gate and Preview runtime acceptance.
6. Promote that approved Development tree to `main`.
7. Production migration application first verifies the same checksum is proven in Development, applies the same canonical file to Production and verifies Production integrity.
8. Only then may dependent Production code deploy.

## Immutability

Once a canonical migration has been applied to Development, **do not edit, rename, reorder or delete it**. Any correction is a new numbered migration.

## Recovery

Every migration manifest entry must contain a concrete recovery note. Destructive or data-rewriting migrations require an explicit operator-reviewed recovery plan and must not be treated as routine automatic migrations.
