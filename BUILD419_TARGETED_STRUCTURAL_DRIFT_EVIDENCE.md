# Build 419 — Targeted Live Read-Only Structural Drift Evidence

## Status

**READY FOR LIVE READ-ONLY EVIDENCE / PRODUCTION WRITES CLOSED**

Build 418 completed successfully against both live D1 databases.

Recorded Build 418 results:

```text
Development user tables: 511
Production user tables: 512
Common tables: 510
CREATE-SQL-different common tables: 54

Core semantic signatures identical: 14
Core semantic signatures different: 40
```

Build 418 also showed that many rows in the 40-table bucket have no named column-attribute, foreign-key, or explicit-index difference. Those cases are consistent with column-order or historical CREATE-path differences and must not be treated as migration requirements without more evidence.

## Confirmed material findings from Build 418

### Gift Card schema

Production is missing current Gift Card protection schema:

- `gift_card_lookup_attempts` in Development has `lookup_email`, `code_suffix`, `ip_hash`, `user_agent`, and `result_status` columns that Production lacks.
- Development has `gift_card_lookup_lockouts`; Production does not.

`database_gift_card_runtime_parity.sql` is the current migration authority and the public Gift Card lookup readiness gate requires both lookup attempts and lockouts.

### Membership tier policies

Development is on the canonical Build 395 membership policy shape:

```text
policy_id
tier_code
title
short_description
benefits_json
badge_color
sort_order
is_visible
created_at
updated_at
```

Production still exposes the older naming shape including `membership_tier_policy_id`, `code`, `name`, and `display_title`. `database_membership_tier_policy_runtime_parity.sql` is the current authority. Build 410 already proved the data-preserving rebuild logic against Development; that helper remains Development-only and must not be pointed at Production.

### Notification outbox

Development contains `notification_outbox.metadata_json`; Production does not. Build 403 `database_notification_runtime_parity.sql` is the current shared notification authority and includes that column plus the current outbox indexes.

### CAIP metadata

Production contains 113 `caip_media_upload_files` rows:

```text
aborted    1 row     467.8 MiB
archived  66 rows    114.3 GiB
failed     1 row       3.8 GiB
uploaded  45 rows     91.9 GiB
```

All 45 uploaded rows are linked to Creative Assets. D1 contains metadata/state while binaries live in private R2. Do not copy these D1 rows alone into Development.

### One-sided tables

```text
__sql_test:                 Development MISSING / Production 0
search_query_terms:         Development MISSING / Production 5
gift_card_lookup_lockouts:  Development 0 / Production MISSING
```

Build 418 source scanning found references to the first two in `database_full_schema.sql`, so they require aggregate-schema execution-path review rather than immediate deletion or copy.

## Why Build 419 exists

Build 419 distinguishes three categories among the 54 stored CREATE differences:

1. exact core semantic matches;
2. column-order/history-only differences;
3. actual structural differences after ordinal position is ignored.

For each actual structural candidate it prints the exact Development and Production values for:

- type;
- NOT NULL state;
- default expression;
- primary-key flag;
- hidden/generated-column flag;
- foreign-key definitions;
- explicit index definitions.

This removes ambiguity from Build 418 messages such as `Changed column attributes: expense_date` by showing exactly what differs on each side.

## Run

From `dev`:

```bash
python -u scripts/build419_targeted_structural_drift_evidence.py 2>&1 | tee build419_structural_drift.txt
```

Build 419 reuses the Windows-safe Build 418 transport:

- pinned `npx --yes wrangler@4.126.0`;
- 1,800-character Windows SQL batches;
- process-tree timeout handling;
- exact temporary Development/Production D1 UUID bindings;
- SELECT / inspection-PRAGMA-only SQL guard.

## Safety boundary

Build 419 performs no migration, seed, data copy, DDL, provider call, or Production write.

Production promotion remains closed.

## Expected footer

```text
BUILD 419 TARGETED LIVE READ-ONLY STRUCTURAL DRIFT EVIDENCE: COMPLETE
No migration or data mutation was executed.
PRODUCTION PROMOTION: CLOSED
PRODUCTION DATA COPY: CLOSED
NEXT: map actual structural candidates to canonical migration authority and prepare a targeted Production rollout plan.
```

## Decision after Build 419

Do not attempt to make every stored CREATE statement byte-identical.

Only exact structural differences that are confirmed against current committed migration authority should enter the eventual Production migration plan. Column-order/history-only differences should remain untouched unless runtime behavior or canonical constraints require a rebuild.
