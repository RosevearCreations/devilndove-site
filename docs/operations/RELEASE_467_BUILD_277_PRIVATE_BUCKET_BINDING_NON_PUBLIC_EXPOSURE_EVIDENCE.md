# Release 467 Build 277 — Private Bucket Binding & Non-Public Exposure Evidence

Build 277 proves one of the three current-release CAIP private-media acceptance dimensions without reading private objects or changing any Cloudflare/R2 setting.

## Exact predecessor

Build 276 **CAIP Acceptance Evidence Freshness Baseline** is fully GREEN:

- Development SHA `073ee3cacb7e7b7cac70e0e23db9ebebf386099f`
- Production main SHA `1bfcb248a8baf8cea42467a75c0dac53884ec5c3`
- shared tree `baed3242d5757a83832ab8526f940c971983bd73`
- Development proofs: System `36214675702`, Quality `36214675663`, I.T. `36214675743`, Hygiene `36214675846`, Build 276 `36214675710`
- Production proofs: Pages `36214858334`, Live Resources `36214894567`, Product Browser `36214894586`, Product Route `36214894631`, Build 276 `36214858270`

## Current-release evidence contract

The dedicated Build 277 workflow must prove all of these on the controlled runtime:

1. the Production Pages project exposes a deployed `CAIP_PRIVATE_MEDIA_BUCKET` R2 binding;
2. an unauthenticated HEAD-only request to the direct R2 S3 bucket endpoint is denied with HTTP `400`, `401`, or `403`, without listing or downloading any object;
3. an unauthenticated request to the same-origin secure-review proxy is denied with HTTP `401`;
4. the proxy source remains administrator-bound and its successful media responses retain private/no-store, same-origin, no-referrer and frame-deny controls.

The runtime artifact is sanitized. It records booleans/counts and HTTP boundary results only. It does not record Cloudflare token values, R2 object keys, object listings, object bytes, bucket IDs or domain names. The current CI tokens receive HTTP `403` from the R2 public-domain configuration API; Build 277 records that permission limitation without interpreting it as either public or private.

## Acceptance interpretation

A GREEN current-release runtime proof satisfies **1/3** fresh CAIP acceptance dimensions. It does not complete CAIP private-media acceptance. Authenticated private review/range-streaming and interruption/reconnect/reselection/resume remain separately required.

Bucket presence alone remains insufficient for acceptance.

## Safety

No D1 business query, schema change, R2 object list/get/put/delete, bucket exposure change, public copy, provider execution/publication, Product publication, Inventory/Finance movement, payment/refund or secret capture is authorized.

## Successor

The queue remains open. Next: **Build 278 — Authenticated Private Review & Range-Streaming Acceptance Refresh**.
