# Build 418 — Live Read-Only Semantic Schema Classification

## Status

**PASS — LIVE READ-ONLY EVIDENCE COMPLETE / PRODUCTION WRITES CLOSED**

Build 418 completed successfully against both live D1 databases. No migration or data mutation was executed.

## Live baseline

```text
Development user tables: 511
Production user tables: 512
Common tables: 510
CREATE-SQL-different common tables: 54
```

All Development/Production table inventory, column-signature, foreign-key, explicit-index, one-sided-table, and CAIP aggregate reads completed successfully.

## Semantic result

```text
CREATE-SQL differences inspected: 54
Core semantic signatures identical: 14
Core semantic signatures different: 40
```

The 14 core-identical tables have matching ordered columns, foreign keys, and explicit indexes despite different stored CREATE text. They must not be rebuilt merely to make stored SQL text identical.

The 40-table bucket still mixes genuine structural drift with harmless creation-history differences. Several entries report no named column-attribute, FK, or index difference, which is consistent with column-order/history-only drift. Build 419 therefore performs the exact structural classification before any migration plan is authored.

## Confirmed material findings

### Gift Card schema

Production is behind the current Gift Card authority:

- `gift_card_lookup_attempts` lacks Development columns `lookup_email`, `code_suffix`, `ip_hash`, `user_agent`, and `result_status`;
- `gift_card_lookup_lockouts` exists in Development and is missing from Production.

`database_gift_card_runtime_parity.sql` is the current migration authority. Current public Gift Card readiness requires the lookup attempts and lockout tables.

### Membership tier policies

Development is on the canonical Build 395 shape while Production retains the older naming shape. Current authority is `database_membership_tier_policy_runtime_parity.sql`.

Build 410 already proved a data-preserving Development-only compatibility rebuild. Do not point the Build 410 helper at Production.

### Notification outbox

Development contains `notification_outbox.metadata_json`; Production does not. Current shared notification authority is `database_notification_runtime_parity.sql`.

### One-sided tables

```text
__sql_test:                 Development MISSING / Production 0
search_query_terms:         Development MISSING / Production 5
gift_card_lookup_lockouts:  Development 0 / Production MISSING
```

Build 418 source scanning found `database_full_schema.sql` references for both Production-only tables. They therefore require aggregate-schema execution-path review rather than automatic deletion or copy.

### CAIP metadata / R2 boundary

Development has no `caip_media_upload_files` rows. Production has 113:

```text
aborted    1 row     467.8 MiB   linked assets 0
archived  66 rows    114.3 GiB   linked assets 0
failed     1 row       3.8 GiB   linked assets 0
uploaded  45 rows     91.9 GiB   linked assets 45
```

All rows use the private CAIP R2 storage profile. D1 contains metadata/state while binaries remain in private R2. Do not copy these D1 rows alone into Development.

## Business-data decision

The broad Production-to-Development data-copy idea remains cancelled. Build 417 already established matching counts for products, site inventory, packaging projects, creative work/projects/content/assets, and membership policy rows. Build 418 found no evidence that those main business datasets need a blanket copy.

## Next gate

Build 419 is the targeted exact structural drift evidence gate:

```bash
python -u scripts/build419_targeted_structural_drift_evidence.py 2>&1 | tee build419_structural_drift.txt
```

It reuses the Windows-safe Build 418 transport and remains read-only.

Production promotion remains closed until the actual structural candidates are mapped to current committed migration authority and a targeted rollout plan is reviewed.
