# 18 — CAIP Operator Workflow Guide

**Implementation boundary:** Build 273  
**Audience:** owner/operator using CAIP for a standalone/social Creative Project with private photo/video footage.


## Build 273: how Gray Hair reaches Content Studio

Do **not** create another Gray Hair project. Open Content Studio and use **Creative Process projects** to choose the existing project. **Create / refresh package from this project** creates/updates the Content Studio package, attaches it to the existing standalone CAIP project, and imports CAIP media as private/reference-only archive rows. It may create a draft package before timeline evidence is selected; this does not approve story claims or make media public.

The Creative Process **Automatic Output Blueprint** is a cross-system destination dashboard:

- Creative Process contributes project facts, time, Inventory and cost;
- CAIP contributes source assets, probes, reviewed evidence, story segments and derivative recipes;
- Content Studio contributes channel deliverables;
- Release/publication stays separately review-controlled.

A planned output or immutable derivative recipe does not mean media was watched, rendered or published.

## The short version

CAIP separates **storage**, **technical verification**, **future-output planning**, **editorial evidence**, and **publication**. Those stages are intentionally different so a button click cannot silently turn private raw footage into public content.

```text
Private upload
  ↓
registered CAIP asset
  ↓
safe technical probe
  ↓
(optional) immutable derivative plan
  ↓
(optional) internal approval of that plan
  ↓
evidence review
  ↓
story structure
  ↓
Content Studio handoff
  ↓
separate release/publication approval
```

## What each action means

### Upload / registered source
The private original is transferred into the CAIP R2 bucket and, after multipart and size verification, receives a canonical `creative_assets` record. The raw original remains private and immutable. Uploading is **not** public approval.

### Run safe probe
A safe probe reads trusted catalog metadata and/or the bound R2 object header. It records technical facts such as MIME type, size, ETag and known dimensions/orientation. It does **not** watch the video, infer what is in a frame, transcribe speech, edit the source or make a public claim.

### Create immutable plan
A derivative plan records a future recipe such as:

- vertical 9:16 social video;
- YouTube thumbnail;
- website gallery image; or
- internal review preview.

The recipe is tied to the source snapshot/fingerprint and is kept immutable for auditability. Creating the plan does **not** render a derivative and does not alter the raw source.

### Approve plan
Internal approval says that the recorded recipe is acceptable to execute later. It still does **not** call an external provider, render an output or publish anything.

A derivative plan is optional. Do not create or approve one for every uploaded file merely because the file exists. Keep footage as evidence until there is a real intended reuse/output.

### Evidence review
Evidence is where the operator decides what the footage actually proves or supports: process, technique, material use, mistakes, repairs, outcomes, efficiency, lessons, or other project facts. Rights/privacy/consent remain separate review dimensions.

### Story structure
Reviewed evidence is organized into story segments. This is where a social/content project becomes a coherent narrative rather than a folder of media.

### Content Studio handoff
Once evidence and story structure are reviewed, CAIP can hand a reviewed package/context forward to Content Studio. Release/publication remains a separate explicit decision.

## Standalone project selector rule

Build 271 distinguishes two selectors:

1. **Open CAIP project** — lists every CAIP project, including standalone/social projects with no Product and no Content Studio package.
2. **Content Studio package** — exists only inside the create/refresh panel and is used to create or refresh CAIP records that originate from Content Studio.

A standalone project must never disappear merely because it has no `content_project_id`.

## Derivative-plan list rule

All derivative plans must remain reachable. Build 271 removes the six-row presentation cap and shows the complete list inside a bounded scroll region. Plans still in `planned` state are shown first so pending approvals remain actionable.

## Recommended operating order for a large social project

1. finish duplicate-safe raw-media intake;
2. confirm every wanted source is registered, intentionally skipped as an existing duplicate, or explicitly failed/recovery-required;
3. run safe probes on the sources you may use;
4. review asset role, privacy, consent and rights;
5. begin evidence selection;
6. create derivative plans only when a real output use is known;
7. approve only the plans you are comfortable executing later;
8. build/review story segments;
9. hand reviewed context to Content Studio;
10. approve publication separately through the release path.

## What not to infer

- **Uploaded** does not mean public.
- **Probed** does not mean visually analyzed.
- **Plan created** does not mean derivative rendered.
- **Plan approved** does not mean published.
- **Provider disabled** means no external rendering is currently being claimed.

## Build 272 upload-prerequisite rule

Before **Select and Upload** is enabled, CAIP must verify all three production prerequisites:

1. the Build 241 private-media tables are present;
2. the Build 269 duplicate-safe columns (`content_fingerprint`, `content_fingerprint_version`, `recovery_of_file_id`) are present on `caip_media_upload_files`; and
3. the Production Pages environment exposes the private R2 binding `CAIP_PRIVATE_MEDIA_BUCKET`.

A missing prerequisite is an operator/configuration state, not a media-transfer failure. The UI must disable the upload action and name the exact missing prerequisite before any intake session or R2 transfer begins. Build 272 adds this readiness contract after a production `create_session` request returned HTTP 400 while the page itself remained usable.
