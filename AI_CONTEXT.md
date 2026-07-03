# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## AI Context Pointer — Build 199

Current technical context is in `AI_HANDOFF.md`. Current business/roadmap context is in `PROJECT_STATUS_AND_ROADMAP.md`. Content Automation Studio details are in `CONTENT_AUTOMATION_STUDIO.md`. Retained history remains under `docs/archive/`.

## Build 203 login reliability repair (July 3, 2026)

- Devil n Dove authentication is Cloudflare Pages Functions + D1 (`DB` binding), not Supabase.
- `/functions/api/auth/login.js` now exposes safe runtime readiness on GET and stable response codes/hints on POST.
- A live diagnostic showed the preview endpoint serving homepage HTML at `/api/auth/login`; that indicates Pages Functions were not active from the deployed project root.
- Deploy from the folder that directly contains `functions/`, `_routes.json`, `wrangler.toml`, and `index.html`; do not leave these inside an extra archive folder unless Cloudflare Root directory is set to that folder.
- Added `AUTH_LOGIN_500_TROUBLESHOOTING.md` and `database_auth_runtime_diagnostics.sql`.
