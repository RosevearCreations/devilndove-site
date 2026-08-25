# Build 418 — Live Read-Only Semantic Schema Classification

## Status

**READY FOR LIVE READ-ONLY CLASSIFICATION / PRODUCTION WRITES CLOSED**

Build 417 completed against both live D1 databases and materially narrowed the migration problem.

Recorded Build 417 baseline:

```text
Development user tables: 511
Production user tables: 512
Common tables: 510
Production-only tables: 2
  - __sql_test
  - search_query_terms
Development-only tables: 1
  - gift_card_lookup_lockouts
Common CREATE-SQL differences: 54
```

The main business-data anchors are already aligned by row count:

```text
products                     45 / 45
site_item_inventory        1041 / 1041
packaging_projects            7 / 7
creative_work_projects        5 / 5
creative_projects            23 / 23
content_projects             20 / 20
creative_assets              45 / 45
membership_tier_policies      3 / 3
```

The only bounded business-data delta found by Build 417 was:

```text
caip_media_upload_files       0 / 113
```

Orders, order items, payments, refunds, Customer Documents, Gift Cards, Gift Card redemptions, accounting order records and notification outbox were all 0 / 0.

Therefore **do not bulk-copy the main Production business tables into Development**. Build 417 evidence shows that the records previously thought missing are now present at matching counts.

## Why Build 418 exists

A stored `CREATE TABLE` text difference does not prove semantic schema drift. Historical migration order can leave equivalent tables with different SQL text.

Build 418 compares the 54 Build 417 differences using live read-only signatures for:

- table columns via `pragma_table_xinfo(...)`;
- foreign keys via `pragma_foreign_key_list(...)`;
- explicit index SQL from `sqlite_schema`.

It then separates:

1. tables whose core semantic signatures are identical despite different stored CREATE SQL;
2. tables with actual column / foreign-key / explicit-index differences;
3. one-sided tables requiring authority classification;
4. the CAIP metadata delta, aggregated without printing filenames or object keys.

Build 418 still does not modify either database.

## Important authority findings before the live run

### `gift_card_lookup_lockouts`

This Development-only table is current schema, not accidental drift.

`database_gift_card_runtime_parity.sql` creates `gift_card_lookup_lockouts`, and the current Build 413 public Gift Card balance lookup requires it in its readiness gate before serving requests.

Production therefore has a pending Gift Card schema requirement. Do not remove the table from Development simply to make table counts match.

### `__sql_test`

No current runtime or canonical migration authority has yet been established for this Production-only table. Build 418 reports its row count and local current-source references so it can be classified as active, historical or test residue without guessing.

### `search_query_terms`

No current exact repository reference was returned in the Build 417 follow-up search. Build 418 reports its row count and current-source references before any retirement or migration decision.

### CAIP 113-row delta

The CAIP raw-media architecture deliberately separates metadata from binaries:

- D1 stores metadata/upload/evidence state;
- binary originals remain in the private `CAIP_PRIVATE_MEDIA_BUCKET` R2 binding.

Development and Production use separate private R2 buckets. Therefore the 113 Production `caip_media_upload_files` rows must **not** be copied to Development as ordinary rows unless their corresponding R2 objects and downstream linkage are explicitly mapped. Copying metadata alone could create dangling media references.

Build 418 aggregates CAIP rows by upload status, storage provider and bucket alias and reports only counts/total bytes/link counts/object-key presence.

## Run

From `dev`:

```bash
python scripts/build418_live_semantic_schema_classification.py --run
```

The script is Windows-console safe directly; no separate launcher is required.

## Safety boundary

Build 418 uses temporary one-binding Wrangler configs for the exact Development and Production D1 UUIDs and permits only internally generated `SELECT` / inspection PRAGMA statements.

It rejects mutation-capable SQL tokens including:

```text
INSERT UPDATE DELETE REPLACE CREATE ALTER DROP TRUNCATE VACUUM
ATTACH DETACH REINDEX ANALYZE BEGIN COMMIT ROLLBACK SAVEPOINT RELEASE
```

No migration, seed, copy, Production write, or provider action is permitted.

## Expected footer

```text
BUILD 418 LIVE READ-ONLY SEMANTIC SCHEMA CLASSIFICATION: EVIDENCE COMPLETE
No migration or data mutation was executed.
PRODUCTION PROMOTION: CLOSED
PRODUCTION DATA COPY: CLOSED
NEXT: classify core semantic drift, one-sided-table authority, and CAIP R2/D1 portability before any Production mutation.
```

## Decision rule after Build 418

Only tables reported under **Core semantic signatures different** are candidates for targeted schema migration analysis.

Tables whose columns, foreign keys and explicit indexes are identical remain definition-text/constraint-review items; do not rebuild them merely to make stored CREATE SQL text identical.

Production promotion remains closed until:

1. real semantic drift is mapped to current migration authority;
2. `gift_card_lookup_lockouts` Production rollout is included safely;
3. Production-only `__sql_test` and `search_query_terms` are classified;
4. the CAIP 113-row metadata/R2 relationship is deliberately handled or explicitly left Production-only;
5. a targeted Production migration plan is reviewed before any write.
