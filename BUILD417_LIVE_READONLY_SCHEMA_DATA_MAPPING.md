# Build 417 — Live Read-Only Schema / Data Mapping Gate

## Status

**READY FOR LIVE READ-ONLY EVIDENCE / PRODUCTION WRITES CLOSED**

Build 416 Development source and browser gates are complete. Build 417 is the next evidence gate before any Production promotion or Production-to-Development business-data copy decision.

Build 417 intentionally performs **inspection only** against both live D1 databases:

- Development: `devilndove-dev`
- Production: `devilndove-prod`

It does not apply migrations, copy records, seed defaults, or modify either database.

## Why this gate exists

Earlier comparison work established that two different issues must not be mixed together:

1. Production contains business records that are not present in the newly initialized Development database.
2. Production historically contained tables/shapes that the fresh-install schema did not reproduce.

Builds 393–410 repaired a substantial part of the schema-authority/fresh-install problem, and Build 416 proved the current Customer Documents, Gift Cards, Orders and payment boundaries in the live Development browser.

The remaining decision needs fresh live evidence showing what differences still exist **now**, after those repairs. We must not assume the earlier Production-only table count is still current.

## Helper

Run from the `dev` branch:

```bash
python scripts/build417_live_readonly_schema_data_mapping.py --run
```

The helper deliberately requires `--run` because it contacts both remote D1 databases.

## Safety boundary

The helper has a fail-closed SQL guard. It permits only internally generated `SELECT` statements and narrowly recognized inspection PRAGMAs. It rejects mutation-capable SQL tokens including:

```text
INSERT UPDATE DELETE REPLACE CREATE ALTER DROP TRUNCATE VACUUM
ATTACH DETACH REINDEX ANALYZE BEGIN COMMIT ROLLBACK SAVEPOINT RELEASE
```

The remote target is also isolated through a temporary Wrangler config containing exactly one `DB` binding for each database UUID. The positional Wrangler target is always the binding name `DB`; the script does not choose a remote database by an ambiguous name at execution time.

Temporary configs are deleted automatically when the helper exits.

## Evidence collected

### 1. Live user-table inventory

For each D1, Build 417 reads `sqlite_schema` and records user table names plus their stored `CREATE TABLE` SQL text.

System `sqlite_%` and `_cf_%` tables are excluded from the business-schema comparison.

The helper reports:

- Development user-table count
- Production user-table count
- common tables
- Production-only tables
- Development-only tables
- common tables whose normalized stored CREATE SQL differs

A CREATE-SQL difference is **evidence requiring review**, not automatically proof that one side is wrong. Historical creation order or semantically equivalent SQL text can differ. Build 417 therefore reports compact schema digests rather than attempting an automatic Production mutation.

### 2. Bounded business-data anchors

Build 417 captures row counts only for this bounded set when the table exists:

```text
products
site_item_inventory
packaging_projects
creative_work_projects
creative_projects
content_projects
creative_assets
caip_media_upload_files
orders
order_items
payments
payment_refunds
customer_documents
gift_cards
gift_card_redemptions
membership_tier_policies
accounting_order_records
notification_outbox
```

These counts are mapping evidence only. A positive Production-minus-Development delta does **not** authorize copying that table.

Identity, session and security tables are deliberately excluded from the business-data-copy anchor list. They require separate authority and must not be swept into a broad copy operation.

## Expected final footer

A successful evidence run ends with:

```text
BUILD 417 LIVE READ-ONLY SCHEMA / DATA MAPPING: EVIDENCE CAPTURE COMPLETE
No migration or data mutation was executed.
PRODUCTION PROMOTION: CLOSED
PRODUCTION DATA COPY: CLOSED
NEXT: review Production-only tables, CREATE-SQL differences, and business-data deltas before any rollout decision.
```

`EVIDENCE CAPTURE COMPLETE` is intentionally not called a parity PASS. Differences are expected to be reviewed after the output is captured.

## Stop rules

Stop and preserve the output if:

- Wrangler authentication fails;
- Cloudflare returns authorization code 7403;
- either target cannot be queried;
- the SQL safety guard rejects a command;
- a remote query returns no parseable Wrangler result;
- the configured Development target no longer matches `devilndove-dev` and its expected UUID.

Do not work around a failure by adding write SQL, exporting/importing Production, applying an old aggregate migration to Production, or restoring request-time DDL.

## After Build 417 evidence

Review in this order:

1. **Production-only tables** — determine whether each still has current runtime authority, is historical/archive-only, or is already covered under a different canonical schema authority.
2. **Development-only tables** — determine whether they are expected post-repair/newer schema additions.
3. **Common CREATE-SQL differences** — inspect only the materially relevant tables; do not equate text differences with semantic drift automatically.
4. **Business-data row-count deltas** — classify records that eventually need a controlled Development copy, records that should remain Production-only, and records that should be rebuilt/seeded rather than copied.
5. Only after the mapping is classified should a Production rollout or a one-way business-data-copy plan be designed.

## Production

Production remains frozen for schema/data mutation during Build 417. Reading Production metadata and bounded row counts is permitted by this gate; writing Production is not.
