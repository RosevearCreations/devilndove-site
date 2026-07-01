# Database Schema Reference — Build 199

Use `database_full_schema.sql` for a fresh database. Use numbered build migrations in order for an existing deployed database. The current build migration is:

```text
database_build199_content_automation_studio.sql
```

Apply Build 199 after Builds 196, 197, and 198. The migration is additive and safe to rerun.

## Content Automation Studio tables

- `content_projects` — one review-first content package per source (`product` now; a future detailing job can use another source type).
- `content_project_media` — source-linked archive records, selection score, reviewer safety state, and product/media references. These rows do not delete or relocate source media.
- `content_project_deliverables` — exact platform/output plans, copy, scripts, output URLs, review states, and Social Queue link.
- `content_render_jobs` — provider-neutral rendering/export handoffs. Build 199 uses `manual_export`; it does not encode MP4 files.
- `content_project_events` — audit-friendly package activity.

The established product-media integrity rules remain: ordinary product saves preserve media; only explicit media deletion can remove a product-image row; R2 source deletion remains a separate explicit asset-library action.
