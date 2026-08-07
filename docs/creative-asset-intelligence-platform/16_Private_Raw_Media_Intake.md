# 16 — Devil n Dove CAIP Private Raw Media Intake

**Implementation boundary:** Build 241  
**Authority:** This document rewrites the Rosie Dazzlers DAIP large-media design for Devil n Dove CAIP.  
**Primary operating route:** `/admin/creative-assets/`  
**Schema:** `database_build241_caip_large_media_intake.sql`

## Purpose

Devil n Dove creates many kinds of source media: jewelry close-ups, wax carving, casting, forging, laser engraving, CNC and 3D work, soap/candle making, restoration experiments, voice narration, mistakes, repairs, packaging, and finished-product footage. CAIP needs the original evidence without forcing multi-gigabyte video through ordinary product-image storage or making private material public.

Build 241 therefore separates **raw project media** from **approved public media**.

## Storage authority

### Existing public/approved media binding

```text
PRODUCT_MEDIA_BUCKET
```

Use it only for media deliberately approved for a public role, such as:

- product and gallery images;
- approved workshop/process images;
- thumbnails;
- public social exports;
- approved final videos and website media.

### New private raw-media binding

```text
CAIP_PRIVATE_MEDIA_BUCKET
```

This is the physical home for raw CAIP project files. The corresponding R2 bucket should not have `r2.dev` or a public custom domain enabled. D1 stores metadata, state, rights, evidence, and object references; R2 stores the binary file.

The recommended production bucket name is descriptive but not an application secret, for example:

```text
devilndove-caip-media
```

The application refers to the binding name, not a hard-coded bucket URL.

## R2 prefix layout

R2 uses object-key prefixes rather than real folders. Build 241 uses generated project/file identifiers rather than customer or personal names.

```text
projects/{creative_project_id}/
  raw/
    photos/
    video/
    audio/
  proxy/
    video/
    images/
  extracted/
    frames/{file_key}/
    audio/
    transcripts/
  derived/
    photos/
    thumbnails/
    video/
    shorts/
    reels/
    social/
  exports/
    youtube/
    facebook/
    instagram/
    tiktok/
    pinterest/
    website/
    google-business/
  manifests/
  archive/
```

Build 241 writes only the `raw/*` namespace. Proxy, extracted, derived, and export paths are recorded as planned destinations until an approved processor/provider exists.

## Upload record model

Before binary upload begins, D1 records:

- Creative Project ID;
- original filename;
- MIME/media type;
- byte size;
- last-modified/capture date when known;
- Devil n Dove media role;
- upload device;
- upload/session state;
- fingerprint/checksum state;
- privacy, consent, and rights states;
- generated R2 key;
- multipart part plan and uploaded-part ETags.

The original filename is retained as metadata. It is not used as the authoritative project path.

## Supported Build 241 file families

- JPG/JPEG, PNG, WebP, HEIC/HEIF, AVIF;
- MP4, MOV, M4V, WebM;
- WAV, M4A, MP3, AAC.

Build 241 intentionally rejects unknown binary types rather than accepting everything silently.

## Devil n Dove media roles

```text
before
during
after
material
tool
process
mistake
repair
finished_product
packaging
narration
b_roll
reference
miscellaneous
```

These replace detailing-specific roles such as vehicle interior/exterior/damage.

## Multipart and recovery design

### Current transport — implemented

```text
browser
  → authenticated same-origin CAIP part request
  → one bounded multipart part
  → CAIP_PRIVATE_MEDIA_BUCKET
  → D1 records ETag/progress
```

Default part size is 32 MiB with conservative parallelism of two parts. The server automatically increases part size for extremely large objects so the R2 10,000-part ceiling is not exceeded. The fallback route refuses parts larger than 256 MiB.

A completed part is represented in D1 by its part number, byte range, status, attempt count, and R2 ETag. If Wi-Fi fails, already completed parts remain recorded and are not intentionally sent again.

Browser security does not let a website silently reopen a local file after the browser is closed. Therefore server/R2 multipart state survives, while the owner may need to reselect the same local file to continue after a full browser restart. The UI says this explicitly rather than promising impossible background access.

### Preferred future transport — not yet implemented

```text
browser
  → authenticated signing/control request
  → short-lived scoped S3 multipart authorization
  → browser uploads directly to private R2
  → CAIP records verified completion
```

This is the preferred future path for multi-gigabyte originals because binary data would no longer traverse a Pages Function. It requires a separately reviewed signing/CORS/credential adapter. Build 241 does **not** claim direct S3-presigned multipart is live. The reserved future transport mode key is `direct_s3_presigned_multipart`.

## Raw-original immutability

`raw/` is immutable after successful completion.

CAIP may abort an unfinished multipart upload. Once the object is complete, the CAIP upload control provides no delete/overwrite operation. Any change creates a new object, for example:

```text
projects/74/raw/video/<file>.mov
projects/74/proxy/video/<file>-720p.mp4
projects/74/derived/video/<file>-stabilized.mp4
projects/74/derived/shorts/<file>-short-01.mp4
```

That creates a defensible evidence chain for lessons learned, product stories, before/after work, and future content.

## Processing model

```text
PRIVATE RAW ORIGINAL
        ↓
metadata / thumbnail plan
        ↓
PROXY (future provider)
        ↓
EXTRACTED frames / audio / transcript (future provider)
        ↓
CAIP evidence, story and selection
        ↓
DERIVED CONTENT
        ↓
Content Studio / Release Board review
        ↓
rights + consent + privacy review
        ↓
APPROVED PUBLIC MEDIA
```

Build 241 creates planned processing-job records. It does not falsely mark proxy generation, transcription, frame extraction, or AI analysis complete when no provider is configured.

## Possible downstream outputs

Approved CAIP evidence can eventually support:

- YouTube long video and Shorts;
- Facebook videos;
- Instagram Reels;
- TikTok videos;
- Pinterest assets;
- website gallery/product/process photos;
- Google Business Profile photos;
- blog/workshop-journal images;
- thumbnails;
- captions and SEO descriptions.

These are content goals, not Build 241 automatic-publishing claims.

## Privacy and public promotion

Private raw media stays private even when it has public-use rights. Build 241 can create a **public promotion request**, but the request creates no public copy. It snapshots rights, consent, and privacy state and stays `needs_review`.

Promotion must follow:

```text
PRIVATE RAW
  → CAIP processing/review
  → rights + privacy + consent review
  → approved derivative/public candidate
  → Release Board / operator approval
  → PRODUCT_MEDIA_BUCKET or verified public provider
```

Secure review uses the existing authenticated, no-store CAIP review path and resolves the private bucket binding for private CAIP objects.

## Duplicate handling

Build 241 computes a stable browser-metadata fingerprint from filename, byte size, last modified time, and MIME type when no stronger fingerprint is supplied. It warns about an already-uploaded candidate with the same fingerprint/size. It does not silently delete or deduplicate evidence.

A later enhancement should add true client SHA-256 streaming for smaller files and a chunked/native fingerprint path for very large files without forcing an entire multi-gigabyte object into browser memory.

## Operator workflow

1. Create or open a Creative Project.
2. Open CAIP → **Private Raw Media Intake**.
3. Select/drop a batch of media.
4. Choose media role and default governance states.
5. Create the D1 upload session.
6. Start multipart upload.
7. Pause/retry/resume as needed; after a full restart, reselect the same file if the browser requests it.
8. Complete and verify the R2 object.
9. Review the new internal-only CAIP asset and secure preview.
10. Correct role/privacy/consent/rights as evidence permits.
11. Review processing plans; do not treat planned jobs as generated outputs.
12. Request public promotion only when appropriate; use Release Board/provider workflows for actual publication.

## Production setup required before binary upload

In Cloudflare Pages production bindings, create and bind a private R2 bucket:

```toml
[[r2_buckets]]
binding = "CAIP_PRIVATE_MEDIA_BUCKET"
bucket_name = "devilndove-caip-media"
preview_bucket_name = "devilndove-caip-media"
```

The repository leaves this example commented in `wrangler.toml` so deploying the code cannot assume a bucket already exists. Configure the real binding before the Startup gate can pass.

## Official implementation references

- Cloudflare R2 object uploads: https://developers.cloudflare.com/r2/objects/upload-objects/
- R2 multipart uploads with Workers: https://developers.cloudflare.com/r2/api/workers/workers-multipart-usage/
- R2 Workers API: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
- R2 public/private bucket controls: https://developers.cloudflare.com/r2/buckets/public-buckets/
- R2 S3 presigned URLs: https://developers.cloudflare.com/r2/api/s3/presigned-urls/

## Acceptance boundary

Build 241 code can be accepted locally when schema/idempotency tests, one-H1/noindex checks, JavaScript syntax, CSS containment, and aggregate/current migration tests pass. The Startup gate remains open until the real production private R2 binding, multipart interruption/recovery, authenticated review, privacy review, phone/desktop behavior, and evidence recording are proven on the deployed environment.
