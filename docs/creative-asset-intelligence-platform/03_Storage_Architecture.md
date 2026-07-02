# 03 — Storage Architecture

## Current storage model

Build 201 is **reference-only**. CAIP stores database metadata about existing source objects. It does not create R2 folders or object copies even though it displays a logical archive path.

| Logical class | Current physical home | CAIP behaviour |
|---|---|---|
| Original source image/video | Existing R2/product/media path | Store pointer/fingerprint only |
| Product gallery display image | Existing `product_images` URL | Store pointer; never reorder/delete |
| Content Studio archive reference | `content_project_media` | Ingest as canonical CAIP asset reference |
| Rendered video/export | Not implemented | Future provider output, must be a separate object and verified URL |
| Proxy/thumbnail | Not implemented | Future derivative record; never replace original URL silently |
| Public publication media | Existing verified public URL | Release Board remains authority |
| Private review media | Future signed/private adapter | Must not be exposed through public URLs |

## Future target namespaces

When object writes are deliberately enabled, use immutable source and derivative namespaces such as:

```text
originals/{source-type}/{source-id}/{asset-fingerprint}/{filename}
proxies/{asset-fingerprint}/{recipe-version}/{filename}
derivatives/{asset-fingerprint}/{recipe-version}/{format}/{filename}
exports/{creative-project-key}/{deliverable-key}/{export-version}/{filename}
review/{creative-project-key}/{request-id}/{filename}
```

Do not store a public URL as the permanent source identity. Store provider, bucket, object key, checksum/fingerprint, and generated access URL separately.

## Future R2 controls

Before enabling private transfers or upload workflows, require:

- short-lived method-specific presigned URLs;
- Content-Type and size restrictions;
- browser CORS configured for the exact production origins;
- source checksum/fingerprint capture;
- quarantine/scan state for new uploads;
- explicit retention class, legal hold, and delete-review state;
- failure/retry/error audit rows;
- never expose account credentials to browser JavaScript.

Cloudflare documents that presigned URLs grant time-limited permission to a specific object/action, and browser use also requires CORS configuration. See the official links in `README.md`.

## Integrity posture

CAIP detects a changing source fingerprint on refresh but does not overwrite history or “repair” a source object. Any future copy/derivative must carry `derived_from_asset_id`, recipe version, operator/provider, timestamp, and immutable output fingerprint.
