# Devil n Dove AI Handoff — Build 243

This is the **first of two canonical current project files**. Read this file first for architecture, data authority, safety, schema and deployment. Read `PROJECT_STATUS_AND_ROADMAP.md` second for current status, risks and ordered next work. Historical Build Markdown is evidence only and lives under `docs/archive/build-history/`.

## Build 243 in one paragraph

Build 243 is the Inventory Operations pressure/resilience pass prompted by clustered Cloudflare HTML 503 responses across unrelated admin APIs. Routine inventory/resource reads now deduplicate identical GETs, use bounded retry/backoff and stale read-only browser fallback, preserve unsaved inventory form drafts, and avoid nonessential admin social/analytics startup calls. Product-resource loading is split into bounded lightweight endpoints; routine Site Inventory, Product Stock and Purchase Lot routes no longer run schema DDL/PRAGMA repair. Controlled product/catalog/inventory classifications now use one lower-case authority and a migration non-destructively merges active inventory identities that differed only by source-type capitalization. Build 241 CAIP architecture remains retained.

## Current system authorities

| Concern | Authority |
|---|---|
| Product identity, public sellable facts | Product/catalog tables and admin Product Editor |
| Inventory quantity/lots/movements | Existing inventory tables/movements; Build 243 lower-case controlled classification and active identity policy |
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

## Build 243 schema boundary

For an **existing production D1**:

1. Back up D1 / record a recovery point.
2. Confirm prior ledger key `build241_caip_large_media_intake` exists. If Build 241 has not completed, do not skip directly to Build 243.
3. Apply **one** of:
   - `database_build243_inventory_resilience_case_normalization.sql`; or
   - byte-identical `database_upgrade_current_pass.sql`.
4. Do not apply both.
5. Confirm ledger key `build243_inventory_resilience_case_normalization`.
6. Verify active inventory identities are unique by case-normalized `source_type` + exact `external_key`.

Build 243 adds no parallel mutable inventory table. It normalizes controlled classifications, preserves duplicate inventory IDs as inactive merge-history rows, and adds the active case-insensitive identity/search indexes needed by the lighter admin read path. All three schema files are marked for Build 243. The complete aggregate `database_full_schema.sql` folds in the executable migration block; legacy/scoped `database_schema.sql` and `database_store_schema.sql` retain explicit Build 243 scope notes instead of executing inventory SQL against tables they do not define.

**Case policy:** database object identifiers and controlled classifications are lower-case. Product/item/supplier display names, URLs, ASIN/SKUs, order numbers, currencies, free-form notes and external identifiers intentionally preserve case.

**Runtime rule:** Inventory Operations, Product Resources, Product Stock and Purchase Lots do not install/alter/index schema during ordinary requests. Missing migration dependencies produce structured migration-required/unavailable JSON.

Build 241 CAIP tables/workstream/Startup gate remain current prerequisites and are not replaced by Build 243.

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

1. No request-time schema installation on current operational paths.
2. Missing D1/R2/provider dependencies return structured actionable JSON rather than HTML/blank responses whenever the application runtime receives control.
3. Shared admin GET transport deduplicates identical in-flight reads; temporary safe-read failures may retry with 500 ms → 1.5 s → 4 s backoff. Writes are never automatically replayed.
4. A stale browser-cache fallback is explicitly marked as stale/read continuity and must never be treated as proof that a write or database mutation succeeded.
5. Inventory forms retain a browser recovery draft on temporary failure and disable duplicate Save submission while a write is active.
6. Cloudflare HTML/non-JSON failures are converted to a useful status/Ray-ID diagnostic rather than a raw `JSON.parse` exception.
7. Runtime failures use `runtime_incidents` with sanitized details; never record passwords, tokens, cookies, raw binary bodies or unnecessary personal information.
8. Upload part failures preserve completed part state and expose retry/resume; private bucket absence leaves metadata safe and reports that binary upload cannot begin.
9. Temporary 5xx/auth verification errors do not automatically destroy a locally retained valid session.
10. Destructive operations remain bounded, explicit, auditable and reversible where business history requires reversal rather than deletion.

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

Build 243 retains the public SEO guardrails; run the current static public audit on every release and do not claim a deployed ranking result from local validation.

## Mobile/desktop rules

- Use responsive grids and `min-width:0` on contained panels.
- Avoid document-level horizontal overflow; wide data tables get local scroll containers.
- Touch actions should be at least comfortably tappable; important phone actions stack full width.
- CAIP batch intake shows per-file progress, retry, pause/resume and explicit offline/reselection guidance.
- Image/card layouts must retain readable aspect ratios and not push primary content below oversized static sections.
- Service-worker shell v20 is current; admin/API/auth routes remain network/no-store oriented rather than static-cache authorities.

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

1. Run Build 243 resilience/case audits plus retained regressions, public SEO/asset audit, predeploy sanity, deployment preflight and final blocker checks.
2. Generate/checksum the exact ZIP.
3. Back up production D1 and confirm ledger key `build241_caip_large_media_intake`.
4. Apply `database_build243_inventory_resilience_case_normalization.sql` **once** and confirm `build243_inventory_resilience_case_normalization`.
5. Deploy the complete Build 243 package and hard refresh the admin application.
6. Cold-load `/admin/inventory-operations/` with Network tools open; verify duplicate startup calls are gone and all failures are JSON/status/Ray-ID safe.
7. Run Amazon URL → metadata → save, inventory lot, product-resource and product-stock smoke tests.
8. Review Cloudflare Workers/D1 observability during the test; any remaining clustered 503 must be correlated with Ray IDs rather than assumed to be a SQL error.
9. Keep CAIP private-R2, payments, auth, email, packaging/laser, concurrency, restore and exact-image launch gates open until separately proven.

