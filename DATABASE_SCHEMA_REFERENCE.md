# Database Schema Reference — Build 200

Use `database_full_schema.sql` for a fresh database. Use numbered migrations in order for an existing production database. The current migration is:

```text
database_build200_content_publication_release_board.sql
```

Apply Build 200 after Build 199. The migration is additive and safe to rerun.

## Content package and public release tables

### Build 199 Content Automation Studio

- `content_projects` — one review-first content package per source (`product` now; future detailing jobs may use another source type).
- `content_project_media` — source-linked archive rows, selection score, reviewer safety state, and product/media references. No source media is deleted or relocated.
- `content_project_deliverables` — exact output plans, copy, scripts, output URLs, review states, and Social Queue link.
- `content_render_jobs` — provider-neutral rendering/export handoffs. Build 200 still uses manual export, not MP4 encoding.
- `content_project_events` — package audit activity.

### Build 200 Content Release Board

- `content_publications` — one public draft per content-project destination (`workshop_journal` or `website_gallery`), including copy, public media references, search title/description, safe path, release status, copy lock, and explainable manual metrics.
- `content_publication_events` — audit records for prepare, refresh, update, approve, publish, unpublish, and metric snapshot actions.

Public release is intentionally separate from source creation. `content_publications` stores references/URLs only; it must never be used to delete, replace, re-order, or feature a product image/video.

The established product-media integrity rules remain: ordinary product saves preserve media; only explicit media deletion can remove a product-image row; R2 source deletion remains a separate explicit asset-library action.
