# Retained reference — current pointer refreshed in Build 207

## Use this first

For all active planning and implementation, start with:

1. `AI_HANDOFF.md` — current technical boundaries, deployment checks, security rules, and known live incidents.
2. `PROJECT_STATUS_AND_ROADMAP.md` — current business direction, release readiness, SEO/media guardrails, completed work, and priority backlog.

`MARKDOWN_INDEX.md` explains which specialist files matter for a specific task. This retained note is deliberately not a third planning source.

## Build 207 pointer

- The current catalog-media workspace now has a product-level **Content Studio → CAIP** handoff card.
- The bridge is read-only on load. Only explicit, audited administrator actions create/refresh a Content Studio package or refresh its CAIP reference project.
- Build 207 does not publish content, change original media, create derivatives, grant public rights, or require a D1 migration.
- Current public image selection is consent-aware: explicitly blocked or consent-needed images are excluded, while unannotated first-party product images remain compatible until reviewed data says otherwise.

## Keep this accurate

- Devil n Dove uses Cloudflare Pages Functions + Cloudflare D1 (`DB`), not Supabase.
- The unresolved `POST /api/auth/login` 500 needs the safe response body or matching Cloudflare Function log before any auth/database changes are attempted.
- Do not run legacy `members` migration scripts or `PRAGMA foreign_keys = OFF` batches; the selected live D1 database was confirmed to have current `users` and `sessions` tables and no `members` table.
