# Creative Asset Intelligence Platform (CAIP) — Authoritative Design Specification
## Build 273 current operating boundary

For standalone/social projects, one Creative Process project owns the identity. CAIP holds private source media/evidence/story; Content Studio creates/refreshes a package from that **existing** project and attaches it to the existing CAIP row. Do not create a second project because a package is missing. Creative Process Inventory selectors are searchable, and its Automatic Output Blueprint now reports the CAIP/Content Studio records feeding each destination; it remains a checklist, not a renderer/publisher. Private CAIP media remains reference-only until reviewed public promotion/derivative work exists.


**Current implementation:** Build 271 duplicate-safe private raw-media intake + standalone-project navigation + operator workflow guidance + complete derivative-plan access, with retained CAIP asset intelligence, rights/evidence, derivative planning, secure review, catalog bridge, project-first inventory context, and release preflight.  
**Primary route:** `/admin/creative-assets/`  
**Business roadmap:** `../../PROJECT_STATUS_AND_ROADMAP.md`  
**Technical handoff:** `../../AI_HANDOFF.md`

## Purpose

CAIP is Devil n Dove's governed creative-media and evidence layer. It is designed around the whole creative process—not only finished products. A Creative Project may include raw photos/video/audio, material/tool evidence, mistakes, repairs, finished work, packaging, narration, lessons, story segments, and downstream content candidates.

CAIP now has **two source paths**:

1. **Existing source references** from catalog/Content Studio remain reference-first and are not copied or reordered by CAIP.
2. **New raw Creative Project media** may intentionally enter through Build 269 Private Raw Media Intake and become the canonical immutable private original in a dedicated R2 bucket.


## Build 271 operating rule — standalone/social projects

A Creative Project does **not** need a physical sellable end product. A content-only, education, research, archive, experiment, or other productless Creative Process project can own a CAIP workspace, record inventory/material usage and internal project costs in Creative Process, upload private media in CAIP, select reviewed evidence, build story structure, and hand a reviewed package to Content Studio. CAIP must never fabricate a product merely to make this path work.

Build 269/271 retains the duplicate-safe intake boundary before binary transfer:

- the browser computes `sample_sha256_v1` from bounded start/middle/end samples plus exact file size;
- same-project strong matches are classified as **skip existing**, **registration only**, **resume existing**, **clean recovery**, or **new upload**;
- legacy filename/size/modified/MIME fingerprints remain fallback compatibility only;
- a finalized/truncated R2 object is never resumed or blessed as complete; it requires a new recovery object;
- existing uploaded R2 objects can receive the stronger fingerprint through bounded ranged reads without downloading or re-uploading the whole original.

The content-sample fingerprint is a high-confidence duplicate-prevention identifier, not a substitute for a definitive whole-file checksum when legal/archive-grade binary equivalence is required. Physical duplicate-R2 deletion still requires the existing verified-checksum and no-downstream-reference safeguards.

## Authority boundaries

- Product/catalog tables remain product truth.
- Creative Process remains project/process/material/time truth.
- CAIP is source-media, rights, evidence, technical observation, story-selection, private-media-intake, and derivative-plan truth.
- Content Studio is deliverable/package truth.
- Content Release Board/Social Queue remain publication approval truth.
- Public media storage/providers become authoritative only after reviewed promotion/publication.

CAIP cannot invent consent, rights, product facts, outcomes, or published status.

## Governing principles

1. **Preserve the source.** Referenced source media stays unchanged; Build 241 raw originals are immutable after successful upload.
2. **Private first.** Raw project media is private by default and has no public URL.
3. **Metadata in D1, binaries in R2.** Never place multi-gigabyte video bodies into D1/Postgres.
4. **Generated keys, human filenames as metadata.** R2 paths use project/file IDs rather than personal/customer names.
5. **Evidence before prose.** Public claims and stories must trace to product/process/source evidence.
6. **Recommendation is not decision.** Scores and planned jobs are review aids, not proof that a file was visually analyzed or rendered.
7. **Processing honesty.** A proxy/transcript/frame/derivative remains planned until a real provider returns verified output.
8. **Review before public promotion.** A public-promotion request is not a public copy or publication.
9. **One authority per concern.** Avoid duplicating mutable status across JSON, Markdown, and D1.
10. **Recoverability.** Upload state, parts, ETags, errors, audit events, and evidence must support interrupted home/mobile connections.

## Build 241 architecture

```text
Creative Project
      │
      ├── existing catalog / Content Studio media → reference-only CAIP asset
      │
      └── new raw workshop media
                 ↓
          CAIP Private Raw Media Intake
                 ↓
       CAIP_PRIVATE_MEDIA_BUCKET
           raw originals (immutable)
                 ↓
       metadata / planned processing
          ┌──────┼────────┐
          ↓      ↓        ↓
        proxy  extracted  evidence/story
          └──────┼────────┘
                 ↓
             derivatives
                 ↓
          Content Studio / Release Board
                 ↓
       rights + consent + privacy review
                 ↓
         approved public media/provider
```

Read `16_Private_Raw_Media_Intake.md` for the Devil n Dove rewrite of the supplied Rosie Dazzlers DAIP large-media architecture.

## Current implemented capabilities

- canonical CAIP projects/assets/evidence/story segments;
- deterministic metadata review/scoring with explicit limitations;
- rights/safety inheritance and manual governance;
- technical observations and bound-R2 HEAD probes;
- immutable derivative recipes/plans;
- authenticated same-origin secure review grants;
- product/catalog bridge and release preflight;
- private D1-backed raw-media sessions/files/parts;
- R2 multipart initiate/resume/complete/abort for unfinished uploads;
- internal-only asset creation after verified private upload;
- default planned proxy/frame/audio/transcript/thumbnail/metadata jobs;
- review-only public-promotion requests;
- JSON manifest extension containing sanitized private-media intake state;
- responsive CAIP intake UI with drag/drop, progress, pause/resume/retry and degraded fallback.

## Deliberately not claimed as implemented

- direct browser-to-R2 S3 multipart signing;
- automatic video proxy/transcoding;
- real frame/audio extraction or transcription;
- external AI vision/LLM execution;
- automatic public copy/promotion;
- direct social/YouTube/Google Business Profile publication from raw intake;
- consent inference, copyright clearance, claim validation, or ranking guarantees.

## Required reading order

1. This README.
2. `16_Private_Raw_Media_Intake.md` for current media-ingestion/storage design.
3. `00_Project_Charter.md` through `12_Testing_and_Acceptance.md` for core CAIP design.
4. `13_Media_Operations_Secure_Review.md` for technical observations, derivative plans and secure review.
5. `14_Catalog_Media_CAIP_Bridge.md` and `15_Product_Release_Preflight.md` for catalog/release relationships.
6. `../../AI_HANDOFF.md` and `../../PROJECT_STATUS_AND_ROADMAP.md` for deployment and current priorities.

## Build 279 CPU hardening note

CAIP upload integrity rules are unchanged, but the Worker-streamed multipart fallback is less expensive: successful schema readiness is cached per isolate, individual part responses are narrow, session-wide progress aggregation runs every eighth part or at the file boundary, and selected control-plane actions return compact file updates until the final canonical refresh. Never weaken the exact expected-parts/ETag/contiguous-range/byte-total guard or the post-completion R2 HEAD-size check to save CPU.
