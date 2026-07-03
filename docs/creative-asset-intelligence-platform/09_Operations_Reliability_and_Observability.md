# 09 — Operations, Reliability, and Observability

## Reliability requirements

- CAIP must be additive: an outage cannot block catalog, product approval, Content Studio, or public storefront operations.
- Content Studio calls CAIP as best-effort after its own successful source-package operation and captures a warning incident if CAIP sync fails.
- CAIP UI should provide a clear retry/synchronize action instead of silently showing stale results as current.
- No scheduled background worker is assumed in Build 201.

## Observability

Track, at minimum:

| Signal | Meaning |
|---|---|
| synchronization completed/failed | source-to-CAIP ingestion health |
| source asset count vs CAIP asset count | completeness check |
| source fingerprint changed | media pointer/material source change detected |
| blocked/needs-review/public candidates | governance workload |
| evidence/segment lock count | editorial preservation check |
| provider/render/publish failure count | future adapter reliability |
| output URL verification status | future delivery integrity |
| storage/provider cost per project | future cost guardrail |

## Error policy

- Show an actionable internal error; do not fall back to a blank gallery or a fabricated generated result.
- Log an incident with subsystem, project/source IDs, operation, and safe error details.
- Treat a 4xx validation/rights error as a user-correctable state, not a retry queue candidate.
- Treat a provider timeout/5xx as retryable only once idempotency and cost controls are implemented.

## Performance and scale strategy

Build 201 calculates small metadata-only scores synchronously. Future high-volume operations must use queues and bounded batches:

1. ingest lightweight metadata synchronously;
2. enqueue technical/semantic work in batches;
3. use project/asset locks and idempotency keys;
4. persist progress checkpoints;
5. expose partial states honestly;
6. never keep a user waiting on an unbounded full-library scan.

## Backup/recovery posture

Database records are recoverable metadata, not the only copy of source media. R2/source backup, database backup, migration ledger, output manifests, audit events, and provider output lineage must all be part of release recovery planning before any destructive lifecycle automation is enabled.

## Build 202 observability additions

Track at minimum:

- probe status by scope (`complete`, `metadata_only`, `partial`, `missing`);
- R2 binding availability and object-missing counts;
- derivative plans by `planned`/`approved_plan`/future verified state;
- secure-review grants created, served, expired, denied, and revoked;
- attempts to use a grant from the wrong account or after expiry;
- any future provider being enabled while its budget control remains disabled/zero.

Never log raw secure-review tokens, R2 credentials, cookies, authorization headers, original customer filenames when sensitive, or full source URLs in public telemetry. Runtime incidents record `raw_token_not_logged: true` for proxy errors.
