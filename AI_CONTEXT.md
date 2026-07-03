# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## AI Context Pointer — Build 199

Current technical context is in `AI_HANDOFF.md`. Current business/roadmap context is in `PROJECT_STATUS_AND_ROADMAP.md`. Content Automation Studio details are in `CONTENT_AUTOMATION_STUDIO.md`. Retained history remains under `docs/archive/`.

## Build 204 authentication schema compatibility safeguard — 2026-07-03

- Devil n Dove auth uses Cloudflare Pages Functions plus D1 binding `DB`; it does not use Supabase.
- The observed `POST /api/auth/login 500` is past route activation: the live GET probe confirms Functions and `DB` exist.
- A historic bootstrap still exists in source that created `members` and an incompatible hashed-token `sessions` table. The current app expects `users` and `sessions(user_id, session_token, token, ...)`.
- Build 204 detects that state as `AUTH_LEGACY_SCHEMA` before it performs a query/insert, returns a safe actionable code/hint, and exposes those values in the browser login message.
- `database_auth_legacy_to_current_repair.sql` is a one-time, preservation-first migration: it copies `members` to `users`, archives the old `sessions` table, creates current sessions, and intentionally requires fresh sign-in because raw legacy session tokens cannot be recovered from hashes.
