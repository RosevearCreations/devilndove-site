# Devil n Dove AI Handoff — Build 210

## Read this first

This is the technical/deployment source of truth. Pair it with `PROJECT_STATUS_AND_ROADMAP.md` for business, workflow, SEO, and release direction. Use `MARKDOWN_INDEX.md` to open only task-specific references.

## Current build

**Build 210** adds a dedicated Social Publishing workspace and a safe product-to-social automation handoff.

### What changed

- Added `/admin/social-publishing/` with:
  - Product-to-social draft settings.
  - Live, secret-safe connection status for Facebook, Instagram, Pinterest, X, TikTok, and YouTube.
  - The existing social queue and Social Media Privacy Guard in one focused workspace.
  - Detailed in-app setup guidance that distinguishes tracking pixels from account publishing authorization.
- Added `functions/api/admin/social-product-automation.js`.
- Added `functions/api/_lib/productSocialAutomation.js`.
- Added `database_build210_social_publishing_product_automation.sql`.
- Approved/Published Active products can now automatically create **one linked review-first social queue draft** when the administrator explicitly enables the setting.
- Added a public product link with UTM parameters to the generated draft.
- Changed the Meta Graph API default in the existing social queue from `v20.0` to `v25.0`; use the `META_GRAPH_API_VERSION` Cloudflare secret only when an intentional supported override is needed.
- Added `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`.

## Critical safety boundary

Build 210 **does not auto-publish** a product to any network.

The optional product trigger creates a queue item only. Generated items start:

```text
approval_status = needs_review
post_status = draft
privacy_status = needs_review
approved_for_public_post = 0
api_publish_mode = review_first
```

The trigger does not bypass Social Media Privacy Guard, modify original media, make a product claim, change CAIP evidence/governance, add a Release Board approval, call a platform API, or place credentials in D1/browser code.

## Platform status

| Platform | Queue draft | Current direct API path | Required next safe action |
|---|---:|---:|---|
| Facebook Page | Yes | Existing review-first Page feed/photo path | Add Page ID/token, dry run, privacy-review, test post |
| Instagram Professional | Yes | Existing review-first single-image path | Add IG account ID/token, dry run, privacy-review, test post |
| Pinterest | Yes | Existing review-first image-Pin path | Add access token/board ID, dry run, test Pin |
| X | Yes | Existing review-first text/link path | Add write-capable user token, dry run, test post |
| TikTok | Yes | Manual only | Build approved OAuth, creator-info, and upload/Direct Post flow |
| YouTube | Yes | Manual only | Build Google OAuth + resumable `videos.insert` upload flow |

Do not call a platform “connected” merely because a pixel is installed. A pixel measures site events; organic posting requires platform app permissions and server-side credentials.

## Cloudflare secrets

Use **Pages → Settings → Variables and Secrets** and add secrets only as encrypted values:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
META_GRAPH_API_VERSION             # optional; Build 210 defaults to v25.0
X_USER_ACCESS_TOKEN
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
TIKTOK_ACCESS_TOKEN                # future dedicated direct-post integration only
YOUTUBE_ACCESS_TOKEN               # future dedicated upload integration only
```

`DB` remains a D1 binding, not a secret variable.

Never store social access tokens, OAuth codes, client secrets, refresh tokens, or Page tokens in public code, D1, R2 metadata, Git, Markdown, screenshots, browser storage, or product fields.

## Immediate deployment and validation

1. Deploy the flattened Build 210 archive.
2. If not using the runtime auto-create fallback, apply `database_build210_social_publishing_product_automation.sql` to the existing D1 database. It is additive and leaves automation disabled.
3. Sign in as admin and open `/admin/social-publishing/`.
4. Confirm platform cards show only secret names, never secret values.
5. Keep product draft automation disabled until a low-risk test product exists.
6. Enable draft automation, create or approve one Active product with a usable image, and confirm exactly one linked queue item appears.
7. Confirm that the queue item remains Draft/Needs review and that no network API call or public post occurs.
8. Complete privacy review, Dry run the payload, and test a single configured platform only.
9. Confirm the public product page, product facts, media, CAIP, Release Preflight, and Release Board were not modified by draft creation.

## Main unresolved incident

The login `POST /api/auth/login` `500` is still not claimed fixed. The database has current `users` and `sessions` tables. Obtain the sanitized response body or matching Cloudflare Function log before changing login logic or schema.

## Best next engineering work

1. Deploy and prove the Build 210 Facebook/Instagram/Pinterest/X test paths with one safe draft each.
2. Add secure OAuth callback/token-refresh storage only for platforms we actually connect, using encrypted environment secrets and a documented rotation plan.
3. Implement a dedicated TikTok upload/Direct Post flow only after required app approval, scopes, creator-info, media transfer, and UX rules are documented.
4. Implement YouTube OAuth + resumable upload only after a deliberate channel/video release workflow exists.
5. Add a pre-publish visual preview and per-platform media sizing/format validator before expanding direct publishing.
6. Continue resolving the login 500 evidence-first.

## Deployment shape

The deployment archive must have these at its root:

```text
index.html
_routes.json
wrangler.toml
functions/
```

Cloudflare Pages must bind the existing D1 database as `DB`. Do not create `DB` as a text secret.
