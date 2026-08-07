# 08 — CAIP API, Event, and Manifest Contracts

## Primary CAIP route

`GET/POST /api/admin/creative-assets`

Retains project/asset intelligence, governance, evidence, story, probe, derivative-plan, secure-review, and manifest behavior.

The exported CAIP manifest now includes:

```json
{
  "media_operations": {},
  "private_media_intake": {
    "raw_original_policy": "immutable",
    "sessions": [],
    "files": [],
    "processing_jobs": [],
    "public_promotion_requests": []
  }
}
```

Multipart R2 upload IDs are not included in the portable manifest.

## Build 241 media-intake control route

`GET /api/admin/caip-media-intake?creative_project_id=<id>`

Returns project choices, non-secret intake settings, sanitized sessions/files/parts, planned processing jobs, promotion requests, and whether the private R2 binding is present.

`POST /api/admin/caip-media-intake`

Actions:

- `create_session`
- `initiate_file`
- `complete_file`
- `abort_file` — unfinished uploads only
- `update_governance`
- `request_public_promotion`

All are admin-authenticated, no-store, and produce structured JSON errors. Runtime failures are recorded through the shared incident system without storing binary bodies or secrets.

## Multipart binary route

`PUT /api/admin/caip-media-upload-part?file_id=<id>&part_number=<n>`

Rules:

- active admin session required;
- same-origin only for the Worker-streamed fallback;
- exact `Content-Length` must match the D1 part plan;
- fallback part limit is 256 MiB;
- R2 multipart upload must already be initiated;
- successful R2 ETag is persisted before progress is treated as complete;
- binary request bodies are never logged.

## Events

Build 241 appends Creative Project events for important transitions including:

- private media session created;
- private raw file uploaded;
- public promotion requested.

The events are evidence/audit records, not publication records.

## Stable error rule

A missing Build 241 schema or private R2 binding returns an explicit actionable error and a degraded UI. The application must never display missing schema/binding as a successful empty media library.
