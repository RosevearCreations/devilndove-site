# Build 270 Validation — CAIP recovery-state clarity

Build 270 is a presentation/recovery hardening release on top of the Build 269 CAIP schema and duplicate-safe intake work. It does not add a D1 migration.

Validated:

- integrity-failed multipart rows are preserved but separated from normal project media;
- failed rows are labeled **Needs Re-upload**, not as an active transfer;
- their percent/parts progress is explicitly historical R2 forensic state;
- **Re-upload source safely** remains the repair action and creates a new recovery row/R2 key;
- older failed rows continue to collapse from the normal API view once a newer canonical recovery exists;
- browser asset cache-bust advanced to `v=270`;
- CAIP regression suites Build 241 and Builds 265–270 pass.

Database boundary: Build 269 migration remains authoritative; no Build 270 schema change is required.
