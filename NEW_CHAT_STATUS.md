# New Chat Status — Build 209

Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.

## Current status

- Current build: **Build 209**.
- Core workflow: factual catalog → approved real media/rights review → product-resource/inventory context → Content Studio → CAIP evidence/governance → Release Preflight → explicit Release Board action.
- `/admin/inventory-operations/` has a scoped dark-theme contrast and mobile repair. It supports `?product_id=<id>` to open the matching product resource context.
- Product Release Preflight reads inventory/maker-input information only as a non-blocking context stage. It does not write stock, create reservations, change costs, create CAIP evidence, grant rights, or affect release scores.
- The explicit Featured Image Sync still writes only a resolved existing URL to `products.featured_image_url` after confirmation/audit.
- The canonical unresolved incident remains `POST /api/auth/login` `500`; obtain its sanitized JSON response or Cloudflare Function log before changing login code or D1 schema.

## Immediate validation

Deploy Build 209. Follow `BUILD209_VALIDATION.md`, re-run `POST_DEPLOY_SMOKE_TEST.md`, Build 206/207 media-consent checks, and Build 208 destination-aware preflight checks.
