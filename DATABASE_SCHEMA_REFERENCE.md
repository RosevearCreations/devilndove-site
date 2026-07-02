# Database Schema Reference — Build 201

Use `database_full_schema.sql` for a fresh database. Use numbered migrations in order for an existing production database. The current migration is:

```text
database_build201_creative_asset_intelligence_platform.sql
```

Apply Build 201 after Build 199 and Build 200. The migration is additive and safe to rerun. It creates reference/control records only; it does not copy, move, delete, overwrite, reorder, feature, or publish product/R2/media records.

## Build 199 Content Automation Studio

- `content_projects` — one review-first content package per source (`product` now; future detailing jobs may use another source type).
- `content_project_media` — source-linked archive rows, selection score, reviewer safety state, and product/media references. No source media is deleted or relocated.
- `content_project_deliverables` — exact output plans, copy, scripts, output URLs, review states, and Social Queue link.
- `content_render_jobs` — provider-neutral rendering/export handoffs. Build 201 still uses manual export, not MP4 encoding.
- `content_project_events` — package audit activity.

## Build 200 Content Release Board

- `content_publications` — one public draft per content-project destination (`workshop_journal` or `website_gallery`), including copy, public media references, search title/description, safe path, release status, copy lock, and explainable manual metrics.
- `content_publication_events` — audit records for prepare, refresh, update, approve, publish, unpublish, and metric snapshot actions.

## Build 201 Creative Asset Intelligence Platform

- `creative_projects` — canonical CAIP project identity linked one-to-one to a `content_projects` package/source/product. Includes lifecycle/governance status, policy snapshot, and internal approval record.
- `creative_assets` — reference-only canonical asset records. Stores source IDs/URLs/fingerprint/logical archive path, inherited safety, local CAIP rights status, source role/selection/feature state, tags, notes, and source metadata.
- `creative_asset_analyses` — versioned deterministic metadata analysis/results: technical, story, reuse, total/confidence scores, reasons/evidence, and human-review requirement.
- `creative_asset_recommendations` — destination-role candidate records for website hero/gallery, YouTube thumbnail, and short-video use. They remain review candidates only.
- `creative_story_evidence` — source references and claim/fact records with verification/review/visibility/lock state.
- `creative_story_segments` — ordered editable/lockable story spine sections linked to evidence keys.
- `creative_policy_decisions` — source-integrity, rights, story provenance, and public-search readiness decision signals.
- `creative_intelligence_runs` — auditable sync/intelligence run records; Build 201 uses local metadata only.
- `creative_project_events` — immutable-style activity/event trail.

### Critical integrity boundary

`creative_assets` is **not** a media-file table. It is a reference/control layer. A source is never deleted when a CAIP asset is updated, a project is refreshed, an analysis is rerun, a recommendation is rejected, a story is edited, or a CAIP project is unapproved.

The established product-media integrity rules remain: ordinary product saves preserve media; only explicit media deletion can remove a product-image row; R2 source deletion remains a separate explicit asset-library action.
