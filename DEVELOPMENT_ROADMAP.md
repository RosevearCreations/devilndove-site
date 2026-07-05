# Retained reference — current pointer refreshed in Build 207

For all current planning, start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. This file is retained for historical/specialist evidence and must not override the Build 207 catalog-media, public-media consent, CAIP, deployment, or auth rules.

---

# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## Development Roadmap Pointer — Build 199

The current roadmap is `PROJECT_STATUS_AND_ROADMAP.md`. Build 199 adds the review-first Content Automation Studio, documented operationally in `CONTENT_AUTOMATION_STUDIO.md`. Keep this short pointer so future chats do not treat older detailed lists as the active backlog.

## Build 204 completion — authentication compatibility

Completed: explicit D1 auth readiness/legacy-schema detection, user-visible stable error codes, and a reviewed one-time migration path from the historic `members`/hashed-session structure to the current `users`/session-token structure.

Required live action: deploy Build 204, visit `/api/auth/login`, and only run the legacy repair SQL if the endpoint reports `AUTH_LEGACY_SCHEMA`. Do not rerun the repair once the endpoint reports `AUTH_READY`.
