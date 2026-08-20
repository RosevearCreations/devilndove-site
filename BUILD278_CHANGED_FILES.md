# Build 278 Changed Files — Page-Wide Edit Mode & Image Requirements

## Primary implementation

- `public/js/media-content-runtime.js`
  - replaces always-visible per-slot admin edit badges with one administrator-only page-wide Edit switch;
  - Edit OFF is a clean public-page preview;
  - Edit ON reveals exact image/text/link/colour locations and Media Studio deep links;
  - edit state is session/tab-scoped and still depends on `dd:admin-ready`.
- `css/styles.css`
  - page-wide edit toolbar and edit-mode visibility/outline rules;
  - live image-plan cards, priorities, responsive layouts and recommendation callouts.
- `functions/api/admin/media-content-studio.js`
  - adds bounded `mode=visual_plan` across active public/static image/background slots;
  - returns live D1 assignments without enumerating R2 or specialist Product/Inventory media.
- `public/js/admin-media-content-studio.js`
  - live Outstanding / Required first / All image checklist;
  - CSV export;
  - recommended dimensions shown on each visual slot;
  - checklist refreshes after image assignment/removal/upload.
- `admin/media-content-studio/index.html`
  - Build 278 image backlog panel and page-wide-edit guidance;
  - Build 278 cache versions.
- `public/data/media-content-slot-catalog.json`
  - version 278;
  - recommendation metadata for all 139 visual slots.

## New image-planning artifacts

- `docs/media-content/IMAGE_SPACE_REQUIREMENTS.md`
- `docs/media-content/IMAGE_SPACE_REQUIREMENTS.csv`
- `scripts/build278_generate_image_space_report.py`
- `scripts/build278_media_edit_mode_image_plan_test.py`

## Cache-bust-only public HTML updates

36 public/static HTML files that already load `media-content-runtime.js` now request `?v=278`. Their page copy/SEO content was otherwise unchanged.

## Documentation continuity

Updated current authorities/pointers to Build 278:

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `DEVELOPMENT_ROADMAP.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `RELEASE_NOTES.md`
- `docs/media-content/DEVIL_N_DOVE_MEDIA_CONTENT_MANAGEMENT_STUDIO.md`

## Admin navigation wording

- `admin/index.html` now describes Website Media & Content Studio as the page-wide edit/image-backlog authority.

## D1

No Build 278 migration. The feature uses the existing Media Studio slot/assignment tables.
