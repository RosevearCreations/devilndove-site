# Build 330 — Accounting Attachments Read Extraction

Build 330 makes `GET /api/admin/accounting-attachments` a non-mutating metadata read.

The legacy GET delegates to an Accounting-owned service and dedicated `accounting-attachments-read` contract. The service reads existing attachment metadata, preserves current filters and summary counts, and reports missing schema instead of creating or altering the table.

The explicit multipart upload POST remains unchanged in ownership and still performs write-side table readiness before R2/database mutation.
