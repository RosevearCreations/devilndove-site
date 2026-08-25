# Build 401 — Active Runtime Table Parity Audit

## Purpose

Historical Production-only lists were useful evidence, but they can become stale when an aggregate repair lands or when an old consumer is retired. Build 401 replaces manual table-name assumptions with a reproducible source audit:

```text
scripts/build401_active_runtime_table_parity_audit.py
```

The script scans every current `functions/**/*.js` source file for literal:

```sql
CREATE TABLE IF NOT EXISTS <table>
```

and compares those runtime-created table names against all committed root `database*.sql` authorities.

## Critical authorities pinned by Build 401

The audit fails if any of these current migration authorities no longer define their expected tables:

```text
database_gift_card_runtime_parity.sql
database_today_task_actions_runtime_parity.sql
database_membership_tier_policy_runtime_parity.sql
database_customer_documents_runtime_parity.sql
database_accounting_runtime_parity.sql
```

This covers the Build 384 and 393–399 parity work, including current `accounting_order_records`.

## Runtime-only output

The script intentionally **reports** remaining runtime-only table creators instead of auto-creating migration files for them. Each reported item requires one of two deliberate decisions:

1. create/migrate a real schema authority; or
2. retire the runtime schema creator if another current authority already exists.

This is especially important for shared notification infrastructure where historical table shapes conflict.

## Production boundary

Build 401 does not query or mutate Production D1. Production remains frozen. A table appearing in the source audit does not authorize Production data copy.

Build 402 uses the committed schema sources to perform a clean local fresh-install execution smoke; the Production data-copy gate remains closed until source/fresh-install parity and a deliberate live read-only Production comparison are both clean.
