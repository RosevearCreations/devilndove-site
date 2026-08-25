# Build 345 — Accounting Period Summary Export Read Extraction

`/api/admin/accounting-period-summary-export` now renders quarter/year CSV output from the shared Accounting export read authority.

The dedicated service validates quarter/year ranges, reports schema readiness and logical column alternatives instead of swallowing incompatible SQL, and performs no request-time schema mutation. The legacy CSV route retains download behavior plus diagnostic build/owner/schema/mutation headers.

A JSON contract at `/api/admin/contracts/accounting-period-summary-export-read` and passive runtime service provide the owned read boundary.
