# Retained reference — current pointer refreshed in Build 208

## Use this first

For all active planning and implementation, start with:

1. `AI_HANDOFF.md` — technical boundaries, deployment proof, security rules, and active incidents.
2. `PROJECT_STATUS_AND_ROADMAP.md` — business direction, public media/SEO rules, completed work, and priority backlog.

`MARKDOWN_INDEX.md` explains specialist references. This retained note is not a third planning source.

## Build 208 pointer

- Product Release Preflight now brings catalog facts, media status, Content Studio approval, CAIP evidence/governance, and Release Board conditions into a protected read-only workspace.
- It distinguishes release-package handoff from publication readiness and does not create or publish anything.
- Catalog Media now offers an explicit, audited Featured Image Sync only when a real existing gallery/media-library asset resolves but the stored product URL is blank.
- Build 208 has no required D1 migration.

## Keep this accurate

- Devil n Dove uses Cloudflare Pages Functions + Cloudflare D1 (`DB`), not Supabase.
- The unresolved `POST /api/auth/login` 500 needs the safe response body or matching Cloudflare Function log before any auth/database change is attempted.
- Do not run legacy `members` migrations or `PRAGMA foreign_keys = OFF` batches. The selected live D1 database was confirmed to have current `users` and `sessions` tables and no `members` table.
