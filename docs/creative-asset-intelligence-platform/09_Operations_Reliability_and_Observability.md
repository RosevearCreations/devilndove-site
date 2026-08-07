# 09 — CAIP Operations, Reliability, and Observability

## Reliability goals

1. No request-time CAIP schema creation.
2. No false success when D1/R2/provider dependencies are unavailable.
3. Multipart progress survives network/page interruption through D1 part/ETag state.
4. Completed raw originals are immutable.
5. Provider work remains planned/blocked until verified.
6. Private media never becomes public because of a UI shortcut.

## Error handling

Build 241 uses the shared `runtime_incidents` authority. CAIP GET/POST and part-upload failures return structured JSON and record sanitized incident details. Binary data, credentials, session cookies, and raw multipart upload IDs must not be placed in incident evidence.

## Upload recovery

Each file has:

- session/file state;
- R2 upload ID held server-side;
- expected part ranges;
- per-part status/ETag/attempt/error;
- uploaded byte/part totals;
- session totals.

Failed parts can be retried. Completed parts remain complete. The browser may require file reselection after a full restart.

## Duplicate detection

Metadata fingerprints produce a warning, not destructive deduplication. Future stronger hashing must be memory-bounded and preserve evidence provenance.

## Private bucket health

Startup/production evidence should prove:

- `CAIP_PRIVATE_MEDIA_BUCKET` is bound in production;
- public access is disabled on the raw bucket;
- initiate/upload/complete/HEAD works;
- secure review uses the correct private binding;
- public promotion does not create a public object in Build 241.

## Processing observability

Planned proxy/frame/audio/transcript jobs record job key, provider key, status, attempts, input object key and output prefix. A provider adapter must add observable provider IDs/results before `complete` can be trusted.

## Retention

Build 241 intentionally does not auto-delete completed raw originals. A later retention/archive policy must define backup, legal/privacy deletion, supersession and evidence requirements before destructive workers are added.
