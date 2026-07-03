# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## Known Gaps and Risks — Build 199

Read `PROJECT_STATUS_AND_ROADMAP.md` for current priorities. Active risks:

- Build 199 is not live until `database_build199_content_automation_studio.sql`, Pages Functions, and the smoke test complete successfully.
- Content Studio creates source-linked archive entries and render briefs; it does not create an encoded video file. A hosted renderer/provider, media-processing evidence, secure job delivery, output verification, and failure recovery remain required.
- No platform is auto-published. YouTube, Meta/Facebook/Instagram, TikTok, Google Business Profile, website gallery, and blog publishing require separate credentials/API/privacy/platform-preview testing.
- Media review labels in Content Studio do not replace source consent records. Treat all unknown/needs-review material as non-public until the correct consent/privacy choice is documented.
- The source archive does not prove a remote R2/public URL still resolves. Production smoke testing must verify access to a real image/video after deployment.
- Social Queue handoff requires a real `output_url` and an Approved deliverable. Do not bypass this gate.
- Existing live risks remain: real costs/fees/labour evidence, R2 derivatives, Stripe/email/webhook testing, Search Console/Google Business Profile evidence, and real device testing.
- Specialist Markdown is retained. `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` remain the canonical pair.

## Build 204 temporary operational requirement — D1 auth schema confirmation

The deployed D1 database must be verified through `/api/auth/login` after Build 204. If it reports `AUTH_LEGACY_SCHEMA`, take a D1 backup/export and run `database_auth_legacy_to_current_repair.sql` once. This migration intentionally invalidates legacy sessions because their raw tokens were never stored; it preserves member account rows and password hashes.
