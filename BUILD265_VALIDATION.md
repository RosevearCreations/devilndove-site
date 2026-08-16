# Build 265 Validation

Build 265 is a code-only CAIP upload reliability release. No new D1 migration is introduced.

Validated:
- CAIP upload endpoint and helper JavaScript syntax: PASS
- New direct private-R2 upload route syntax: PASS
- Build 265 CAIP diagnostics/productless-project routing regression: PASS
- Files <= 90 MiB use bounded single-request R2 PUT; larger files retain multipart.
- CAIP POST failures return stage-specific error_code and stage fields.
- Creative Work Project IDs are no longer used as fallback CAIP Creative Project IDs.
- Existing Build 264 migration files in this package use the D1-safe split form; no statement exceeds D1's 100 KB statement limit.
