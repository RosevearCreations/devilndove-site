# Build 326 — Accounting Journal GET Schema-Mutation Retirement / Read Extraction

## Purpose

Retire the confirmed request-time DDL path from Accounting journal GET while preserving explicit journal write actions.

## Before

```text
GET /api/admin/accounting-journal
  -> fetchJournal()
  -> ensureJournalSchema()
  -> CREATE/ALTER/INDEX at request time
```

## After

```text
GET /api/admin/accounting-journal?month=YYYY-MM
  -> readAccountingJournal()
  -> schema inspection + SELECT only
```

Dedicated contract:

```text
GET /api/admin/contracts/accounting-journal-read?month=YYYY-MM
build       326
owner       accounting
mutation    false
```

The read service requires existing journal entry/line tables and their read columns. Missing tables or columns are returned as readiness evidence with empty journal data.

## Write-side compatibility retained

Explicit POST actions remain on `/api/admin/accounting-journal`:

```text
sync_month
validate_month
post_month
```

Those write paths may still call `ensureJournalSchema()` as compatibility behavior. Build 326 does not claim mutation-authority extraction. The architectural invariant is narrower and now satisfied: GET/read paths do not create or alter schema.
