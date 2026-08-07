# Devil n Dove AI Handoff — Build 241

This is the **first of two canonical current project files**. Read this file first for architecture, data authority, safety, schema and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for current status, risks and ordered next work. Historical Build Markdown is evidence only and lives under `docs/archive/build-history/`.

## Build 241 in one paragraph

Build 241 converts the supplied Rosie Dazzlers DAIP large-media concept into Devil n Dove's Creative Asset Intelligence Platform (CAIP). CAIP now accepts intentional raw Creative Project photos/video/audio into a dedicated **private** R2 binding, stores upload/governance/processing state in D1, resumes multipart uploads from recorded parts, creates internal-only immutable raw asset records, plans future proxy/frame/audio/transcript work without claiming a provider ran, and allows only a review request—not an automatic public copy—for promotion. Existing catalog/Content Studio source media remains reference-first and unchanged.

## Current system authorities

| Concern | Authority |
|---|---|
| Product identity, public sellable facts | Product/catalog tables and admin Product Editor |
| Inventory quantity/lots/movements | Existing inventory tables and operational movement authorities |
| Orders/payments/refunds | Existing order/payment/refund authorities |
| Packaging design/content/versions | Labeling & Packaging tables and `PACKAGING_STUDIO.md` |
| Creative Project process/material/time evidence | Creative Process / Creative Automation specialist tables |
| Creative media, rights, evidence, story selection | CAIP |
| Private raw Creative Project media | Build 241 CAIP tables + private R2 object |
| Deliverable package/output plan | Content Studio |
| Publication approval/provider reconciliation | Content Release Board / Social Queue / provider-result records |
| Launch gates | `startup_readiness_items` + history |
| Operational evidence/idempotency/support/SEO continuity | Build 240 Operational Continuity tables |
| Cross-project architecture/deployment | **This file** |
| Current business status/next steps | **`PROJECT_STATUS_AND_ROADMAP.md`** |

Mutable business status belongs in D1 whenever a live table exists. JSON/Markdown can be reproducible fixtures, design authority or release evidence, but must not compete with D1 as a second mutable source of truth.

## Build 241 CAIP architecture

### Existing media path

Existing product/catalog/Content Studio media stays reference-first. CAIP may preserve source identity, fingerprint, rights state, technical observations, evidence and recommendations, but does not reorder, overwrite or delete those source records.

### New raw-media path

```text
Creative Project
      ↓
CAIP Private Raw Media Intake
      ↓
D1: session/file/part/governance state
      +
CAIP_PRIVATE_MEDIA_BUCKET: binary raw original
      ↓
verified internal-only CAIP asset
      ↓
planned proxy / thumbnail / frame / audio / transcript work
      ↓
CAIP evidence/story selection
      ↓
Content Studio / Release Board review
      ↓
rights + consent + privacy approval
      ↓
approved public media/provider
```

### R2 bindings

- `PRODUCT_MEDIA_BUCKET` — existing approved/public product/media path.
- `CAIP_PRIVATE_MEDIA_BUCKET` — new Build 241 private raw-media binding. It must not have public `r2.dev` or a public custom domain enabled.

The private binding is intentionally commented in `wrangler.toml`; create/bind the real bucket in Cloudflare before binary intake can pass production Startup evidence.

### Private object keys

Build 241 uses generated project/file IDs rather than customer/personal names:

```text
projects/{creative_project_id}/raw/photos/{file_key}-{sanitized_filename}
projects/{creative_project_id}/raw/video/{file_key}-{sanitized_filename}
projects/{creative_project_id}/raw/audio/{file_key}-{sanitized_filename}
```

The original filename remains metadata. Completed `raw/*` originals are immutable through the intake control. Transformations must create new proxy/extracted/derived/export objects.

### Current upload transport

Build 241 implements authenticated same-origin Worker-streamed R2 multipart uploads with:

- 32 MiB default part size;
- two-part conservative parallelism;
- D1 part ranges/status/ETags/attempts;
- interrupted upload recovery;
- exact Content-Length validation;
- 256 MiB maximum on the Worker-streamed fallback route;
- automatic part-size growth when needed to stay within the 10,000-part R2 ceiling.

After a full browser close, the owner may need to reselect the same local file because a website cannot silently regain local-file access. Server/R2 part state remains available.

The **preferred future** architecture is short-lived direct browser→R2 S3 multipart authorization. That adapter is not implemented yet and must not be presented as live.

### Processing boundary

On verified private upload CAIP creates planned work such as metadata, thumbnail, proxy video, frame extraction, audio extraction and transcription. Provider key remains `not_configured` until a real adapter exists. A planned row is not generated media or AI analysis.

### Public-promotion boundary

Build 241 can create a `needs_review` promotion request that snapshots rights, consent and privacy. It creates no public object and no public URL. A future executor must re-check current governance immediately before any public copy/publish action.

Detailed authority: `docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md`.

## Build 241 schema boundary

For an **existing production D1**:

1. Back up D1 / record a recovery point.
2. Confirm prior ledger key `build240_operational_evidence_continuity` exists. Build 241 is incremental and assumes Build 240 foundations.
3. Apply **one** of:
   - `database_build241_caip_large_media_intake.sql`; or
   - byte-identical `database_upgrade_current_pass.sql`.
4. Do not apply both.
5. Confirm ledger key `build241_caip_large_media_intake`.
6. Confirm 21 active operational workstreams and 46 active Startup gates.

Build 241 adds/owns:

- `caip_media_intake_settings`
- `caip_media_upload_sessions`
- `caip_media_upload_files`
- `caip_media_upload_parts`
- `caip_media_processing_jobs`
- `caip_media_public_promotion_requests`

The migration also idempotently ensures the shared `media_assets` dependency exists for fresh/scoped aggregate paths, seeds CAIP provider profiles, adds workstream `caip_large_media_intake`, and adds Startup gate `caip_private_large_media_intake`.

All three aggregate schema files are synchronized through `scripts/sync-build241-aggregate-schema.mjs`. CAIP runtime routes **verify** schema; they do not create tables/indexes at request time.

## Primary routes

- `/admin/creative-automation/` — master seven-stage orchestration.
- `/admin/creative-process/` — process/material/time specialist authority.
- `/admin/creative-assets/` — CAIP asset/evidence/private-media intake authority.
- `/admin/content-studio/` — deliverable packages.
- `/admin/content-publications/` — publication/release board.
- `/admin/packaging-studio/` — whole-business labels and packaging.
- `/admin/operational-continuity/` — production evidence/idempotency/fallback/operations centre.
- `/admin/startup-readiness/` — 46 launch gates.
- `/admin/image-manifest/` — mutable visual requirements/evidence authority.

Admin routes remain `noindex,nofollow` and must have one H1.

## Error-handling rules

1. No request-time schema installation.
2. Missing D1/R2/provider dependencies return structured actionable JSON rather than HTML/blank responses.
3. Browser fallbacks must say **Unsynced/Unavailable/Unknown** and disable writes; never infer success from an empty response.
4. Runtime failures use `runtime_incidents` with sanitized details; never record passwords, tokens, cookies, raw binary bodies or unnecessary personal information.
5. Upload part failures preserve completed part state and expose retry/resume.
6. Private bucket absence leaves metadata safe and reports that binary upload cannot begin.
7. Temporary 5xx/auth verification errors do not automatically destroy a locally retained valid session.
8. Destructive operations remain bounded, explicit, auditable and reversible where business history requires reversal rather than deletion.

## SEO/local-search guardrails

Every public pass should verify:

- exactly one H1 per exposed/indexable page;
- distinctive concise title and meta description;
- canonical URL;
- crawlable descriptive internal links;
- descriptive alt text and resolvable representative images;
- visible facts consistent with structured data;
- phone and desktop content parity/readability;
- truthful Southern Ontario/local service wording only where relevant;
- no generated/editorial image masquerading as an exact product or real-project proof;
- no promise of first-page placement.

Local visibility is improved through relevance, accurate Business Profile/service facts, useful local pages, real reviews/prominence and measurement. Distance is not controllable, and first-page ranking cannot be guaranteed.

Build 241 static audit: 36 public indexable pages, 36 passed, zero warnings/failures; `/assets/` reference audit has zero missing files.

## Mobile/desktop rules

- Use responsive grids and `min-width:0` on contained panels.
- Avoid document-level horizontal overflow; wide data tables get local scroll containers.
- Touch actions should be at least comfortably tappable; important phone actions stack full width.
- CAIP batch intake shows per-file progress, retry, pause/resume and explicit offline/reselection guidance.
- Image/card layouts must retain readable aspect ratios and not push primary content below oversized static sections.
- Service-worker shell v19 is current; admin/API/auth routes remain network/no-store oriented rather than static-cache authorities.

## Packaging retained authority

Labeling & Packaging remains the whole-business editor. Five adopted packaging source directions and reusable soap/candle/round/label templates remain retained. Physical formula/INCI/bilingual, dimensions, laser/material, print/wrap and regulatory proof remain live Startup work; a screen preview is not physical acceptance.

## Documentation authority

### Read first

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

### Scoped specialist documents

Use specialist guides only for their named concern: CAIP, Packaging, Startup/Prelaunch, Cloudflare, SEO, Social Publishing, image requirements, database reference and similar operations.

### Historical evidence

Build-specific validation/changed-file records older than the current Build pair belong under `docs/archive/build-history/`. Historical prose cannot override current architecture or roadmap.

## Safe deployment order

1. Run local Build 241 regressions, public SEO audit, asset audit, predeploy sanity, deployment preflight and final blocker checks.
2. Generate/checksum the exact ZIP.
3. Back up D1 and confirm `build240_operational_evidence_continuity`.
4. Apply Build 241 migration once.
5. Create/bind `CAIP_PRIVATE_MEDIA_BUCKET` before attempting private binary intake.
6. Deploy the complete package and hard refresh to service-worker shell v19.
7. Run Post-Deploy Smoke Tests and confirm all 46 Startup gates load.
8. Run the dedicated CAIP private-media gate with real interruption/recovery evidence.
9. Keep payments, auth, email, packaging/laser, concurrency, restore and real-image launch gates open until separately proven.
