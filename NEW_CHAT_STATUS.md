# Retained new-chat pointer — refreshed in Build 208

## Start in this order

1. Read `AI_HANDOFF.md`.
2. Read `PROJECT_STATUS_AND_ROADMAP.md`.
3. Use `MARKDOWN_INDEX.md` to open only the specialist reference needed for the task.

This file is a compact orientation note, not an additional roadmap.

## Current status

- Current build: **Build 208**.
- Core release direction: accurate catalog → approved real media/rights review → Content Studio package → CAIP evidence/governance → Release Preflight → explicit Release Board action.
- New Release Preflight is read-only. It does not create packages, approve work, publish, render, grant rights, or connect to providers.
- The explicit Featured Image Sync writes only a known existing resolved URL back into `products.featured_image_url` after confirmation/audit.
- The canonical unresolved incident remains `POST /api/auth/login` 500; capture its sanitized JSON response or Cloudflare Function log before changing code/D1 schema.

## Immediate next validation

Deploy Build 208, follow `BUILD208_VALIDATION.md`, then re-run `POST_DEPLOY_SMOKE_TEST.md` and the Build 206/207 catalog/media consent checks.
