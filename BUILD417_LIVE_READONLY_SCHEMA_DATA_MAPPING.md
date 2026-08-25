# Build 417 — Live Read-Only Schema / Data Mapping Gate

## Status

**PASS — LIVE READ-ONLY EVIDENCE CAPTURE COMPLETE / CLASSIFICATION MOVED TO BUILD 418 / PRODUCTION WRITES CLOSED**

Build 417 completed successfully against both live D1 databases:

- Development: `devilndove-dev`
- Production: `devilndove-prod`

No migration, seed, copy, INSERT, UPDATE, DELETE, DDL, provider action or other data mutation was executed.

## Recorded live table inventory

```text
Development user tables: 511
Production user tables: 512
Common tables: 510
```

Production-only tables:

```text
__sql_test
search_query_terms
```

Development-only table:

```text
gift_card_lookup_lockouts
```

Common tables with identical normalized stored CREATE SQL:

```text
456
```

Common tables with different normalized stored CREATE SQL:

```text
54
```

A stored CREATE-SQL difference is evidence requiring semantic review; it is not automatically proof of structural drift. Build 418 owns the live column / foreign-key / explicit-index classification of these 54 tables.

## Recorded bounded business-data counts

```text
table                                   development   production     prod-dev
------------------------------------------------------------------------------
products                                         45           45           +0
site_item_inventory                            1041         1041           +0
packaging_projects                                7            7           +0
creative_work_projects                            5            5           +0
creative_projects                                23           23           +0
content_projects                                 20           20           +0
creative_assets                                  45           45           +0
caip_media_upload_files                           0          113         +113
orders                                            0            0           +0
order_items                                       0            0           +0
payments                                          0            0           +0
payment_refunds                                   0            0           +0
customer_documents                                0            0           +0
gift_cards                                        0            0           +0
gift_card_redemptions                             0            0           +0
membership_tier_policies                          3            3           +0
accounting_order_records                          0            0           +0
notification_outbox                               0            0           +0
```

## Business-data conclusion

The earlier assumption that Production business records still needed a broad copy into Development is no longer supported by the live evidence.

The principal Devil n Dove business anchors now match by count:

- 45 products;
- 1,041 inventory records;
- 7 packaging projects;
- 5 Creative Process projects;
- 23 CAIP creative projects;
- 20 Content Studio projects;
- 45 creative assets;
- 3 membership tier policies.

**Do not perform a broad Production-to-Development business-data copy.**

The only bounded business-data delta is `caip_media_upload_files` at `0 / 113`. CAIP raw-media D1 rows are metadata/state while binary originals remain in the private R2 binding, so those rows require an R2-aware portability decision and must not be copied as ordinary standalone D1 records.

## One-sided table authority

### `gift_card_lookup_lockouts`

This Development-only table is current canonical Gift Card schema, not accidental Development drift. `database_gift_card_runtime_parity.sql` creates it, and the current public Gift Card lookup readiness gate requires it. Its Production absence therefore represents a pending Production schema rollout item.

### `__sql_test`

Production-only. Current runtime/migration authority has not yet been established. Treat as a test/residue candidate pending Build 418 source-reference and row-count classification; do not copy it merely to make table counts match.

### `search_query_terms`

Production-only. No current exact repository reference was identified during the Build 417 follow-up search. Treat as historical/orphan candidate pending Build 418 source-reference and row-count classification; do not copy or drop it based on name alone.

## Build 417 helper and safety boundary

Canonical helper:

```bash
python scripts/build417_live_readonly_schema_data_mapping.py --run
```

Windows-safe launcher used for the recorded run:

```bash
python scripts/build417_live_readonly_schema_data_mapping_windows.py --run
```

The helper uses exact Development/Production D1 UUIDs through temporary one-binding Wrangler configs and permits only internally generated SELECT / inspection SQL. Production mutation capability is intentionally absent.

## Handoff to Build 418

Build 418 now owns the remaining classification:

1. compare the 54 CREATE-SQL differences using live column, foreign-key and explicit-index signatures;
2. classify `__sql_test`, `search_query_terms`, and `gift_card_lookup_lockouts` with row counts and current-source references;
3. aggregate the 113 Production CAIP upload rows by status/storage linkage without exposing filenames or object keys;
4. design only the targeted Production migration(s) that remain justified by that evidence.

Run:

```bash
python scripts/build418_live_semantic_schema_classification.py --run
```

## Production

```text
PRODUCTION PROMOTION: CLOSED
PRODUCTION DATA COPY: CLOSED
```

Build 417 authorizes no Production write. Any later Production change must be explicitly derived from Build 418 classification and reviewed as a targeted migration rather than a broad schema/data synchronization.
