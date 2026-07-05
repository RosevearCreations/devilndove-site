# Retained new-chat pointer — refreshed in Build 207

## Start in this order

1. Read `AI_HANDOFF.md`.
2. Read `PROJECT_STATUS_AND_ROADMAP.md`.
3. Use `MARKDOWN_INDEX.md` to open only the specialist reference needed for the task.

This file is a compact orientation note, not an additional roadmap.

## Current status

- Current build: **Build 207**.
- Core release direction: accurate product data → approved real media → catalog review → Content Studio / CAIP review package → explicit release approval.
- CAIP remains evidence-led, rights-aware, reference-only, and human-reviewed. It has no active external vision, rendering, social publishing, or paid provider integration.
- The Catalog Media workspace now shows the selected product’s Content Studio / CAIP state, counts, and safe direct links. Explicit refresh actions leave source media and public release unchanged.
- The canonical unresolved incident is the Devil n Dove login `POST /api/auth/login` 500. Capture its sanitized JSON response or Cloudflare Function log before changing code or D1 schema.

## Immediate next validation

Deploy Build 207, then follow `BUILD207_VALIDATION.md` and `POST_DEPLOY_SMOKE_TEST.md`. Verify the public media gate using approved, blocked, consent-needed, unannotated, and explicitly public-use-permitted media examples.
