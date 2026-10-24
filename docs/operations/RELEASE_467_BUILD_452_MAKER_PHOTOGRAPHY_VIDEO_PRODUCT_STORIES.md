# Release 467 — Build 452: Maker Photography, Videos & Product Stories

## Scope and numbering

The owner's current direction explicitly names **Build 452 — Maker Photography, Videos & Product Stories**. This supersedes the historical 439–455 roadmap's proposed number 451 for this subject; the old list remains a historical snapshot, not an implementation authority. This build is a private Admin storyboard and release-review workflow, **not an image editor, upload pipeline, public maker blog or new Etsy channel publisher**.

## Admin workflow

1. Open `/admin/maker-media-stories/` from the Admin home screen. Authentication is required; the read API returns no information without a signed-in administrator.
2. Select a real Creative Project and view its canonical linked Products. A project may remain entirely internal, including noncommercial therapeutic practice, failed attempts and private customer discussions.
3. Create an immutable story revision. Types: Product story, workshop journal, tutorial or learning/failure. Record truthful copy and choose `internal_only` unless the Project's own `privacy_status=public_candidate` and `rights_status=public_allowed` have already been verified.
4. Add individual before, during, after, detail, tutorial or failure frames, with human-written captions and accessible alt descriptions, in a defined order. Sources are references to **active Creative Process photographed events** or the **selected canonical Product's** image, non-blocked attached video or non-deleted R2 media asset. Each revision may have at most one principal frame; no file is duplicated or renamed.
5. A frame marked as a future `public_candidate` requires the current original URL to match an existing consent receipt exactly, with an active grant or a genuine `not_required` assessment, an approved public-use scope and unexpired rights. Creative events must independently be flagged public candidates; videos must already be approved for the Product page. Private media can still be included in internal-only stories with no inferred public permission.
6. Record an accountable human editorial `hold`, `internal_only` or `approved_candidate` review with evidence. To approve a candidate, every frame must still be a valid public candidate, its exact URL and consent must still match, the Project must still allow public use, and linked Product quality may not have an unresolved hold. An approved storyboard is locked; further changes use a new revision.

## Canonical migration and application entry points

- Migration: `migrations/canonical/0047_release467_maker_photography_video_stories.sql`, canonical manifest version **47**.
- UI: `admin/maker-media-stories/index.html` and `public/js/admin-maker-media-stories.js`.
- Admin API: `functions/api/admin/maker-media-stories.js`; GET lists bounded project-linked source records and exact consent records, POST actions `create_revision`, `add_frame` and `review_story`, with same-origin restriction, actor-bound idempotent request keys and Admin audit logging.
- D1 records: `maker_media_story_revisions`, `maker_media_story_frames`, `maker_media_story_release_reviews` are append-only; they **do not** replace source Creative Process, Product, QA or Consent records.
- Regression: `python scripts/release467_build452_maker_media_sql_regression.py` and JavaScript syntax checks, required by Current Application Quality.

## Explicit safety and release boundaries

- **No new public route** for stories. `approved_candidate` is a private editorial state, **not a customer-visible publication event**. Owner approval and a separate reviewed future public publishing workflow are required.
- **No Etsy or Facebook calls, listing creation, channel activation, Product gallery mutation, order/stock change, R2 copy, upload or delete**. The existing provider tests and owner-held Etsy integration decisions stay on HOLD.
- For Product-facing media, project linkage is checked against actual canonical Product relationships, including QA and Creative Project associations. Missing/voided/cross-Product/blocked media is rejected, not silently fabricated.
- A video may remain in internal review even if it is usable as private evidence. No consent is inferred from its presence in a Product or R2 bucket.
- Private personal and workshop footage remains private even if another frame in the project has a valid public-use consent receipt. Revoke consent or void source media before a new human editorial approval; a previous approval is historical evidence, **not a continuous public licence**.
- Canada-only selling, CAD-based prices, checkout controls, order and shipping rules are untouched.

## Acceptance and rollback checklist

Before Development promotion, require the SQL regression to prove private learning stories stay private, exact-source consent, source reassessment at editorial review, blocked videos, wrong Product, voided frames, quality HOLD, immutable revisions and no physical stock/media side effects. Require JavaScript syntax and canonical manifest integrity.

Before marking Production **GREEN**, require exact tested-tree `dev`/`main` equivalence, mandatory GitHub checks, production D1 migration 47/47 with zero foreign-key violations, real Cloudflare deploy receipt for the merged `main` SHA, live authenticated Admin HTML/static JavaScript, unauthenticated API denial and `/release-version.json` showing that SHA and Build 452.

If a live issue is found: stop additional editorial work, retain all genuine media and append-only story evidence, use a new forward-only correction migration and safe deployment recovery. Do not delete Creative Process, Product images, R2 objects or Consent records to roll back a storyboard. **No real owner story, photo shoot, client consent, video approval or public publication can be marked accepted without operator evidence.**
