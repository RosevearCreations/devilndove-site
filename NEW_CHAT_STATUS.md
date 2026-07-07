# New Chat Status — Build 210

Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.

## Current status

- Current build: **Build 210**.
- Core workflow: factual catalog → approved real media/rights review → inventory context → Content Studio → CAIP evidence/governance → Release Preflight → explicit Release Board action → optional review-first social draft → explicit platform post/manual publish → UTM learning.
- New workspace: `/admin/social-publishing/`.
- Product social automation is disabled by default. When enabled, one eligible product creates a review-first social queue draft; it does not auto-publish.
- Existing direct queue paths can be configured for Facebook Page, Instagram Professional single-image, Pinterest image Pins, and X text/link posts.
- TikTok and YouTube remain manual until their complete dedicated OAuth/upload workflows are built.
- Read `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md` before adding credentials.
- Current Meta Graph default is v25.0; environment override remains `META_GRAPH_API_VERSION`.
- Inventory Operations remains scoped/readable/mobile-safe as of Build 209.
- The canonical unresolved incident remains `POST /api/auth/login` 500; obtain its sanitized JSON response or Cloudflare Function log before changing login code or D1 schema.

## Immediate validation

Deploy Build 210. Follow `BUILD210_VALIDATION.md`, then test a non-sensitive Active + Approved product with a real product image. Confirm one draft appears but no social post is published until human privacy/approval steps are completed.
