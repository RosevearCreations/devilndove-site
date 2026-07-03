# 13 — Media Operations, Derivative Plans, and Secure Review

**Status:** Authoritative CAIP specification — Build 202 foundation implemented.  
**Applies to:** Devil n Dove Content Automation Studio → CAIP → Content Release Board.  
**Does not apply automatically to:** Rosie Dazzlers, customer jobs, external publishing, or any provider account until separate consent, account, and operating controls are implemented.

## 1. Purpose and boundary

Build 202 adds the operational safety layer that must exist before CAIP can ever send media to a renderer, thumbnail service, or publisher. The layer records technical evidence, writes immutable transformation plans, and serves protected administrator previews without creating a second media library.

It does **not**:

- read image/video bodies for visual inference;
- transcode, crop, resize, encode, watermark, synthesize, or copy a file;
- move, reorder, overwrite, delete, expose, or publish an R2 object;
- make an asset public, grant consent, or bypass Content Studio safety states;
- connect a renderer, model, social network, YouTube, Google Business Profile, or any external API;
- store an access token, provider secret, or raw secure-review token in D1.

CAIP remains a reference/control plane. `product_images`, `media_assets`, `content_project_media`, and their R2 source objects remain the source-media system of record.

## 2. Build 202 capability model

```text
Content Studio source reference
  → CAIP canonical asset
  → metadata / bound-R2-head observation
  → immutable derivative recipe + plan
  → internal plan approval
  → future provider adapter (not enabled)
  → future verified output record
  → Content Release Board / Social Queue review gate
```

The key distinction is intentional:

| Record | Meaning now | It does not mean |
|---|---|---|
| Technical observation | Recorded catalog values and, where available, a bound R2 object `head()` response were read | The file was visually analyzed, decoded, transcoded, or proven suitable |
| Derivative recipe | A fixed, reviewable specification was drafted | A thumbnail/video/image exists |
| Derivative plan | A future output is requested and tied to one source fingerprint | A provider was contacted or an output was generated |
| Internal plan approval | A human approves the planned intent | Public rights, publication, or provider execution are approved |
| Secure review grant | A temporary authenticated proxy route may serve the existing R2 source | The object is public or a shareable public URL exists |

## 3. Technical observation / probe design

### 3.1 Permitted Build 202 probe inputs

A probe may use only:

1. Existing CAIP/catalog metadata: MIME type, source filename, saved dimensions, orientation, recorded size, selected/featured flags, and source fingerprint.
2. A **bound R2 object key** associated with the asset through `media_assets`.
3. `R2Bucket.head(objectKey)` where the Cloudflare Pages/Workers binding is available.

No arbitrary source URL is fetched. This avoids treating Content Studio URLs as a generic server-side fetch service and avoids accidental private-data egress.

### 3.2 Recorded observation fields

`creative_asset_technical_observations` records:

- source fingerprint and CAIP project/asset identity;
- storage/bucket/object reference metadata;
- public URL reference where one already exists;
- MIME type, byte count, ETag, upload timestamp, saved width/height/orientation;
- recorded duration/codec only when already known in catalog metadata;
- probe scope/status and sanitized evidence JSON.

`head()` validates object existence and object metadata only. Duration, codec, frame rate, audio tracks, pixel quality, duplicate frames, and content facts remain **unknown** until a bounded approved provider exists.

### 3.3 Probe statuses

- `complete`: catalog metadata plus a bound R2 object header were recorded.
- `metadata_only`: no R2 key/binding was available; no external URL was fetched.
- `partial`: catalog metadata was recorded but a bound R2 header check errored.
- `missing`: a bound R2 key was checked and no object was found.

A `missing` probe is a CAIP observation, not a delete instruction and not automatic proof that the catalog record should be removed.

### 3.4 Retry/reconciliation policy

Build 202 records the job attempt and outcome synchronously for small internal volumes. It does not add a background queue. A future worker/queue must use:

- idempotency key: asset ID + source fingerprint + probe version;
- maximum three bounded retries with exponential delay;
- stale-job reconciliation; and
- no automatic source deletion after probe failure.

## 4. Immutable derivative recipe model

A recipe describes a future target. It is not an output and cannot write to R2 in Build 202.

### 4.1 Planned templates

| Template | Target | Intended output | Review rule |
|---|---|---|---|
| `website_gallery_webp` | 1600×2000, 4:5 | WebP gallery image | Source rights, crop, alt text, and public copy checked separately |
| `social_vertical_mp4` | 1080×1920, 9:16 | MP4 short-form output | Approved clips, captions/template, disclosure, platform check |
| `youtube_thumbnail_webp` | 1280×720, 16:9 | WebP thumbnail | Visual/title truth check; no unsupported claims |
| `internal_review_preview_webp` | 1200×1200, 1:1 | Internal-only preview | Does not become a public media URL |

The target values are production briefs only. Platform requirements can change and must be revalidated immediately before a real export/publish adapter is enabled.

### 4.2 Immutability and provenance

`creative_derivative_recipes` captures the source asset, source fingerprint, target role, format, dimensions, aspect ratio, transformation intent, and policy snapshot. A source change requires a new recipe key; it must never silently update an approved recipe.

`creative_asset_derivatives` is a planned-output record. Build 202 leaves all `output_*` fields empty and records `verification_status = not_created`. That is a mandatory honesty condition.

### 4.3 Future renderer contract

A real renderer may run only when all conditions are true:

1. Source fingerprint still matches the approved plan.
2. Source rights and consent permit the internal/public destination.
3. Recipe is internally approved.
4. Provider profile is explicitly enabled through a separately reviewed deployment.
5. Per-run/monthly budget controls are active and within cap.
6. A signed input manifest, correlation ID, expiry, and idempotency key are present.
7. Output receives checksum, byte, MIME, duration/dimension, and accessible-preview verification.
8. Review succeeds before a Release Board or Social Queue handoff.

## 5. Secure review access model

### 5.1 Design decision

The current Pages deployment uses a bound R2 bucket but does not have an S3 credential/presign service configuration. Build 202 therefore uses a **same-origin authenticated proxy**, not a direct public or S3-presigned R2 link.

The URL form is:

```text
/api/admin/creative-asset-review?token=<opaque-token>
```

The raw token is returned once to the issuing administrator and never written to D1. D1 stores a SHA-256 hash, expiry, access cap, source fingerprint, bound administrator user ID, and audit metadata.

### 5.2 Grant controls

- Default lifetime: 30 minutes; allowed range: 5–120 minutes.
- Default maximum views: 25; allowed range: 1–100.
- The link requires an active admin session **and** the same administrator who created the grant.
- The proxy validates revocation, expiry, view cap, and linked R2 object before serving bytes.
- Every successful or denied use is recorded without saving the raw token.
- Responses are `private, no-store`, same-origin resource policy, no-referrer, no-frame, and content-type-sniffing protected.
- Revoke is immediate and does not delete the R2 object.

### 5.3 Prohibited secure-review behavior

Do not email, post, embed in public HTML, place in a sitemap, add to structured data, share outside authenticated admin review, or treat a review URL as an export URL. The proxy is for internal review only.

## 6. Provider and budget registry

Build 202 creates disabled, non-secret registry rows for:

- `r2_metadata_probe`
- `derivative_renderer`
- `thumbnail_builder`
- `social_export_adapter`

A registry row is not an integration. It holds no token, endpoint, or account secret. Secrets belong in Cloudflare encrypted environment variables only and a future adapter must validate the relevant secret at execution time.

`creative_execution_budget_controls` exists so later capability-specific caps can be applied in CAD. It starts disabled with zero caps. A zero cap never authorizes a paid call.

## 7. API contract additions

### Admin CAIP API

`GET /api/admin/creative-assets?creative_project_id=<id>` now returns the existing CAIP detail plus:

- technical observations;
- probe job history;
- derivative recipes and planned derivatives;
- secure-review grant metadata without token hashes/raw tokens;
- disabled provider registry and budget-control rows;
- current template options.

`POST /api/admin/creative-assets` adds these actions:

| Action | Result |
|---|---|
| `probe_asset` | Records catalog/R2-head observation only |
| `create_derivative_plan` | Creates immutable recipe and planned output record only |
| `approve_derivative_plan` | Marks plan internally approved; does not schedule a provider |
| `create_secure_review_link` | Returns one same-origin temporary administrator-bound URL |
| `revoke_secure_review_link` | Immediately invalidates a grant |

`manifest` now includes an operations section with sanitized observations, derivative plan states, grants without raw tokens, and disabled provider state.

### Secure proxy API

`GET /api/admin/creative-asset-review?token=<opaque-token>` requires admin session plus valid bound grant. It streams the existing R2 object only. It never redirects to R2, does not set permissive CORS, and does not make the object public.

## 8. SEO, accessibility, and public-release relation

Technical suitability does not establish SEO readiness. Before a generated/derived image or video becomes public, the Release Board must still ensure:

- real final URL and bytes are available to the intended public page;
- visible content, title/meta, caption, alt text, and structured data match the actual work;
- public source rights and media consent are explicitly approved;
- a video watch page has truthful thumbnail, description, upload date, duration, and crawlability where video search is desired;
- public content remains substantive on both mobile and desktop.

This carries forward Google Search guidance on useful image alt text/page context, truthful structured data, and crawlable video resources. It also prevents a CAIP plan from being mistaken for a published asset.

## 9. Operational acceptance criteria

Build 202 is accepted only when a real admin can demonstrate:

1. A CAIP project can be opened without altering any source `product_images`, `media_assets`, `content_project_media`, or R2 key.
2. A probe records metadata/R2 head result and never downloads/transcodes the source object.
3. A missing/unavailable R2 binding produces `metadata_only`/`partial` record, not a broken page or source deletion.
4. Creating/approving a derivative plan leaves output URL/object/checksum empty and status honest.
5. A secure review link is unavailable without login, unavailable to a different administrator, unavailable after expiry/revocation, and never appears in D1 raw form.
6. A secure proxy response is no-store/same-origin/no-referrer and serves the original object only.
7. Existing Content Studio, CAIP story/evidence, Release Board, public Gallery, and Workshop Journal paths still operate.

## 10. Next CAIP delivery wave

1. Live-deploy and prove the Build 202 acceptance criteria on a real retained product.
2. Add durable source hash verification only through bounded object reads/worker design with costs documented.
3. Add an approved image/video metadata extractor with model/version, privacy, retry, and cost evidence.
4. Add true derivative execution worker with input/output checksums, object-key namespace isolation, and before/after comparison.
5. Add a legal hold/retention review workflow before any lifecycle/deletion automation.
6. Add a renderer adapter with template disclosure controls and full output verification.
7. Add final platform-specific export validation at publish time, not only at recipe creation.
8. Add OAuth publish adapters only after provider accounts, privacy policy, consent, account ownership, preview/confirm, rollback, and audit requirements are met.
