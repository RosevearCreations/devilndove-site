# Build 337 — Accounting Sales Tax Filing Read Extraction

`/api/admin/accounting-sales-tax-filing` GET now delegates to an Accounting-owned schema-aware read service. It no longer ensures reconciliation schema during a read; missing schema is reported for the separate parity track.
