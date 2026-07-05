# Retained reference — current pointer refreshed in Build 208

For all current planning, start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. This file is retained for historical/specialist evidence and must not override the Build 208 release-preflight, catalog-media, public-media consent, CAIP, deployment, or auth rules.

---

# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## Development Roadmap Pointer — Build 199

The current roadmap is `PROJECT_STATUS_AND_ROADMAP.md`. Build 199 adds the review-first Content Automation Studio, documented operationally in `CONTENT_AUTOMATION_STUDIO.md`. Keep this short pointer so future chats do not treat older detailed lists as the active backlog.

## Historical Build 204 authentication note — superseded

The live Devil n Dove database was later confirmed to have the current `users` and `sessions` structure and no `members` table. The old `database_auth_legacy_to_current_repair*.sql` files are retained only as Build 207 safety stubs and must **not** be used to change the schema. Investigate any remaining login `500` from the sanitized HTTP response and matching Cloudflare Function log only.
