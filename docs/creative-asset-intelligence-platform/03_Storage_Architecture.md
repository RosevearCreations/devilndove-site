# 03 — CAIP Storage Architecture

## Current Build 241 model

CAIP uses a hybrid storage model:

| Media class | Physical home | CAIP behavior |
|---|---|---|
| Existing catalog/product source | Existing public/private media path | Reference/fingerprint only; CAIP does not reorder or overwrite |
| New raw Creative Project media | `CAIP_PRIVATE_MEDIA_BUCKET` | Multipart private upload; canonical immutable original |
| Product/gallery/public media | `PRODUCT_MEDIA_BUCKET` or verified existing URL | Public only after separate approval/promotion |
| Proxy/extracted/derived media | Planned namespace in private bucket | Records may be planned; no output exists until provider verification |
| Secure review | Authenticated no-store CAIP proxy | Does not create public access |

D1 stores metadata, part/upload state, governance, evidence, processing plans, and promotion requests. R2 stores binary objects.

## Private raw-media namespace

```text
projects/{creative_project_id}/
  raw/photos/
  raw/video/
  raw/audio/
  proxy/video/
  proxy/images/
  extracted/frames/{file_key}/
  extracted/audio/
  extracted/transcripts/
  derived/photos/
  derived/thumbnails/
  derived/video/
  derived/shorts/
  derived/reels/
  derived/social/
  exports/youtube/
  exports/facebook/
  exports/instagram/
  exports/tiktok/
  exports/pinterest/
  exports/website/
  exports/google-business/
  manifests/
  archive/
```

Only `raw/*` write behavior is implemented in Build 241. Other prefixes are deterministic future-output destinations.

## Source identity

Do not use a public URL as permanent identity. Persist:

- storage provider;
- bucket binding/alias;
- object key;
- project/file IDs;
- fingerprint/checksum state;
- MIME/size/ETag;
- original filename as display metadata;
- governance state.

## Immutability

Completed `raw/*` objects are never overwritten by CAIP. Abort is allowed only for unfinished multipart sessions. Corrections create a new raw object; transformations create a new proxy/derived/export object.

## Public/private boundary

`CAIP_PRIVATE_MEDIA_BUCKET` must remain private. `PRODUCT_MEDIA_BUCKET` is the existing public/approved path. A promotion request snapshots privacy/consent/rights but creates no public object in Build 241.

## Upload transports

- **Current:** authenticated same-origin Worker-streamed multipart parts, default 32 MiB, two in parallel.
- **Future preferred:** short-lived direct S3-presigned multipart so large binary data travels browser→R2. This needs a separate signing/CORS/credential implementation and is not active in Build 241.

See `16_Private_Raw_Media_Intake.md` for full behavior and operator steps.
