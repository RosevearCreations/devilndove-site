# Creative Asset Intelligence Platform (CAIP) — Authoritative Design Specification

**Current implementation:** Build 228 specialist asset/rights/evidence stage within Creative Automation Studio; Build 208 CAIP controls retained  
**Design status:** authoritative subsystem specification  
**Primary business roadmap:** `../../PROJECT_STATUS_AND_ROADMAP.md`  
**Technical deployment handoff:** `../../AI_HANDOFF.md`

## Purpose

CAIP is Devil n Dove’s governed creative-asset layer. It turns a completed Content Studio package into a searchable project record that explains:

- which source photo/video references exist;
- where each source comes from and why CAIP believes it may suit a role;
- whether a source is blocked, internal-only, needs review, or may be considered for public use;
- which factual statements support a story, caption, SEO field, or publication draft;
- how a project can become a reusable set of gallery, article, thumbnail, video, and educational candidates without re-uploading or mutating original files.

CAIP is **not** a second media library, a public publisher, a content-claim generator, an AI provider, a video renderer, or a permission engine that can invent consent.

## Build 228 master-process placement

CAIP is stage 3 of `/admin/creative-automation/`. The master workflow may record the owner, stage status and a safe evidence reference, but CAIP remains the sole asset/rights/evidence authority and every existing CAIP feature remains available at `/admin/creative-assets/`. A master Complete review cannot elevate restricted media or replace CAIP evidence; source readiness must also pass. See `../../CREATIVE_AUTOMATION_STUDIO.md`.

## Governing principles

1. **Reference, do not duplicate.** CAIP stores source URLs, source IDs, fingerprints, and logical archive paths only. It does not copy, move, delete, overwrite, reorder, or feature product/R2 media.
2. **Source consent is authoritative.** CAIP can preserve or tighten a source restriction, but it cannot create public rights where Content Studio/source consent is not public-cleared.
3. **Evidence before prose.** Claims, scripts, captions, blog sections, SEO text, and public releases must trace to a product field, consent record, selected source media, or manually confirmed evidence.
4. **Recommendation is not decision.** Metadata scores are transparent review aids, not visual truth, legal clearance, quality certification, or a promise of performance.
5. **Human approval remains explicit.** CAIP internal approval does not publish a product, public page, image, social post, video, or Google Business Profile item.
6. **One system of record per concern.** Product records remain product truth; Content Studio remains package/deliverable truth; CAIP remains asset/evidence/intelligence truth; Content Release Board remains public-release truth.
7. **Operational honesty.** Do not show an encoded file, AI analysis, SEO result, consent, sale, or published post as complete unless a real provider/process has completed and been verified.

## Current implementation scope — Builds 201–208

Implemented:

- one CAIP project linked one-to-one to a Content Studio project;
- canonical, non-destructive asset references for existing `content_project_media`;
- deterministic metadata-only analysis with transparent component scores and reasons;
- source-rights inheritance and stricter manual CAIP handling;
- evidence ledger, editable/lockable story spine, policy signals, audit events, and JSON manifest;
- destination-specific reuse candidates for website hero/gallery, YouTube thumbnail, and short-video roles;
- mobile and desktop admin console at `/admin/creative-assets/`;
- automatic CAIP refresh when an approved product creates/refreshes a Content Studio package or when its source media review changes.

Not implemented and deliberately not claimed:

- external AI vision/transcription/LLM execution;
- file copies, proxies, derivatives, transcoding, background removal, or video rendering;
- direct public publishing or platform OAuth;
- automatic consent inference, copyright clearance, claim validation, or SEO-indexing guarantees;
- signed upload/download URLs, retention workers, or private-media transfer jobs.

## Architecture at a glance

```text
Product / source records
        ↓  (existing source ownership)
Creative Automation Studio stage 4 / Content Studio
        ↓  (source-linked package + deliverable plans)
CAIP
  ├─ Creative project identity
  ├─ Canonical source-asset references
  ├─ Rights / safety inheritance
  ├─ Metadata evidence & transparent scoring
  ├─ Story evidence + segments
  ├─ Reuse recommendations
  ├─ Policy/readiness signals + audit trail
  └─ Exportable CAIP manifest
        ↓  (human chooses approved candidates)
Creative Automation stages 4–7 / Content Release Board / Social Queue / future adapters
```

## Required reading order

1. This README for CAIP boundaries and current implementation.
2. `00_Project_Charter.md` through `12_Testing_and_Acceptance.md` for the detailed design.
3. `../../AI_HANDOFF.md` for deployment/migration order.
4. `../../CREATIVE_AUTOMATION_STUDIO.md` for the master stage contract.
5. `../../PROJECT_STATUS_AND_ROADMAP.md` for current business priority and ordered next steps.

## Official external design references

The design uses current official guidance as constraints rather than as a promise of ranking or platform approval:

- Google image SEO: <https://developers.google.com/search/docs/appearance/google-images>
- Google structured-data policies: <https://developers.google.com/search/docs/appearance/structured-data/sd-policies>
- Google mobile-first indexing: <https://developers.google.com/search/docs/crawling-indexing/mobile/mobile-sites-mobile-first-indexing>
- Cloudflare R2 Workers metadata: <https://developers.cloudflare.com/r2/api/workers/workers-api-reference/>
- Cloudflare R2 presigned URLs: <https://developers.cloudflare.com/r2/api/s3/presigned-urls/>
- YouTube thumbnails policy: <https://support.google.com/youtube/answer/9229980>
- YouTube altered/synthetic-content disclosure: <https://support.google.com/youtube/answer/14328491>

CAIP does not automatically perform actions based on any of these sources; they inform its future governance and provider-adapter requirements.

## Build 202 — media operations and secure review extension

Build 202 makes the design executable beyond the initial intelligence layer without turning CAIP into a media store or an ungoverned automation tool. Read `13_Media_Operations_Secure_Review.md` after the core architecture documents.

The current authoritative CAIP implementation has four layers:

1. **Source/intelligence:** Content Studio references, canonical CAIP assets, rights inheritance, evidence, story segments, and recommendations.
2. **Technical observation:** catalog metadata plus optional bound-R2 object headers only; no arbitrary URL fetching or binary visual inference.
3. **Future-output planning:** immutable derivative recipes and planned outputs with no output URL/object until a verified provider actually produces one.
4. **Internal secure review:** short-lived same-origin, authenticated-admin proxy grants; raw tokens never enter D1 and do not make R2 objects public.

The Build 202 routes and records are documented in `13_Media_Operations_Secure_Review.md`, `02_Database_Architecture.md`, `03_Storage_Architecture.md`, `05_Governance_Rights_Privacy.md`, `08_API_Event_and_Manifest_Contracts.md`, and `12_Testing_and_Acceptance.md`.


## Build 206–208 catalog-media and release bridge

- `14_Catalog_Media_CAIP_Bridge.md` — product-context handoff from Catalog Media to CAIP. It is read-only/reference-first and does not create or modify source media.
- `15_Product_Release_Preflight.md` — a read-only operator checklist across catalog, source media, Content Studio, CAIP evidence, and Release Board conditions. It does not approve, publish, mutate source media, or create rights.
