# Build 341 — Platform DB Sanity Read Ownership Extraction

`/api/admin/db-sanity` was already non-mutating. Build 341 moves its read logic behind `platformDbSanityReadService.js` and a dedicated GET-only contract at `/api/admin/contracts/platform-db-sanity-read`. Ownership is intentionally `platform`, with Accounting and Administration as consumers, because the sanity report spans application-wide schema/runtime state rather than Accounting business rules. The service adds explicit build/owner/contract and schema-readiness metadata without creating or repairing schema.
