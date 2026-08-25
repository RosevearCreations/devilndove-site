# Build 327 — Accounting GIFI Notes GET Schema-Mutation Retirement / Read Extraction

## Purpose

Remove request-time table creation from the GIFI review-notes GET while keeping the explicit save path compatible.

## Before

```text
GET /api/admin/accounting-gifi-notes
  -> ensureAccountingGifiNotesTable()
  -> CREATE TABLE / CREATE INDEX if needed
```

## After

```text
GET /api/admin/accounting-gifi-notes?year=YYYY
  -> readAccountingGifiNotes()
  -> schema readiness + SELECT only
```

Dedicated contract:

```text
GET /api/admin/contracts/accounting-gifi-notes-read?year=YYYY
build       327
owner       accounting
mutation    false
```

If `accounting_gifi_review_notes` or required columns are absent, the GET returns readiness evidence and an empty notes list; it does not repair schema.

The existing POST save path still calls the write-side ensure helper before inserting/updating notes. Mutation authority is not moved by this build.

## Remaining nearby blocker

`/api/admin/accounting-gifi-summary` still calls `ensureGlSchema()` from GET and therefore remains a request-time DDL blocker for a later bounded extraction.
