# Devil n Dove AI Handoff — Build 216

## Read this first
Build 216 is the current Creator-path integration release. It adds explicit reviewed inventory posting, CAIP evidence mirroring and reusable cost-template storage. `PROJECT_STATUS_AND_ROADMAP.md` is the business/SEO companion.

## Safety boundary
Never deduct inventory from timeline capture or material review alone. Only `post_material_inventory` may consume stock, and it must remain approval-gated and idempotent. Mirrored CAIP evidence remains internal and `needs_review`; it is not publication permission.

## Deployment
Run `database_build216_reviewed_inventory_caip_evidence.sql` or allow the admin route to create the additive tables. Cloudflare Pages still requires the D1 binding named `DB`.

---

# Devil n Dove AI Handoff — Build 213

## Read this first
The two canonical project documents are `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. Build 213 introduces the project-first Creative Process Engine at `/admin/creative-process/`. Products, Content Studio packages and CAIP records remain valid systems, but a Creative Project is now the preferred origin for documenting an idea, process evidence, materials, time, cost, mistakes, repairs, lessons and intended outputs.

## Build 213 safety boundary
The new engine is additive and review-first. It does not publish, consume inventory, alter source media, create marketplace listings or create products automatically. The 17-output blueprint is a planning/status record only.

## Immediate test
Run `database_build213_creative_process_engine.sql` or allow the admin API to create the additive tables, then create one project at `/admin/creative-process/`, add a process event and confirm all output plans persist after reload.

# Devil n Dove AI Handoff — Build 211

## Read this first

This is the technical/deployment source of truth. Pair it with `PROJECT_STATUS_AND_ROADMAP.md`. Build 211 continues application work while social API approvals are pending.

## Build 211 changes

- Added a browser-only Platform Preview & Media Preflight to `/admin/social-publishing/`. It checks caption length, HTTPS destination/image URLs, image type, browser accessibility, dimensions, aspect ratio, and a visual preview without saving or publishing.
- Added `public/js/admin-social-platform-preflight.js` and `assets/social-platform-preflight-placeholder.svg`.
- Hardened the shared mobile menu as a true dropdown/accordion: only one navigation group remains open at a time, the panel stays scroll-contained, and desktop links remain hidden at mobile widths.
- Social account API credentials remain optional for this preflight. Meta, Pinterest, X, TikTok, and YouTube publishing behavior is unchanged.
- `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` remain the two canonical project documents.

## Safety boundary

The Build 211 preflight is advisory and browser-only. It does not upload media, write D1 data, create or approve a social queue item, modify products, grant media consent, change CAIP evidence, call a provider API, or publish content.

## Deployment test

1. Deploy the flattened ZIP.
2. Open `/admin/social-publishing/`.
3. Test one public JPEG product image and real Devil n Dove product URL in Platform Preview & Media Preflight.
4. Confirm no queue item or product record changes.
5. At a phone width, open Menu and confirm opening one group closes the previously open group.

---

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


# Build 212 — Social platform policy and callback prerequisites

The following production prerequisites now exist directly in the application:

- `https://devilndove.com/privacy/` and `/privacy.html`
- `https://devilndove.com/terms/` and `/terms.html`
- `https://devilndove.com/data-deletion/` and `/data-deletion.html`
- `https://devilndove.com/social-connections/` and `/social-connections.html`
- Exact OAuth callback routes for Meta/Facebook/Instagram, Pinterest, X, TikTok, and YouTube
- `https://devilndove.com/api/social/meta/data-deletion`
- `https://devilndove.com/api/social/integration-readiness`

The Pinterest verification meta tag is present in every HTML head. Callback routes are currently safe readiness endpoints: they do not exchange codes or store tokens until one-time state storage, encrypted token persistence, refresh, and disconnect controls are implemented.

## Build 214 — flexible Creator entry paths
Creative Projects are the preferred origin for documented maker work, but they are not mandatory. Phone capture and direct catalog product entry must continue to create valid independent products. Build 214 adds the optional `creative_project_product_links` relationship so one project can produce several products and an existing independent product can be linked later. Never migrate or reject an unrelated product solely because it has no Creative Project.


## Build 215 — Creative Intelligence Integration
Creative Projects now support reviewed timeline-evidence selection, Content Studio handoff packages, explicit material-usage review before any future inventory consumption, and project profitability. Products remain optional and may be created directly or by phone without a project. No social provider publishing or inventory deduction occurs automatically.

## Build 217 — reviewed reversals, allocations and CAIP knowledge
- Creative Project inventory usage can be reversed only through an authorized compensating movement with a required reason. Never delete the original movement.
- Cost templates can be applied; channel fees support revenue percentage plus a fixed amount.
- Shared project costs can be allocated among linked products, but allocations do not change product prices or public facts.
- Knowledge summaries are derived from mirrored CAIP internal source evidence and remain review-required.
- `/admin/creative-assets/` uses scoped dark contrast rules. Preserve these when changing global card styles.
- Social OAuth remains staged until real provider credentials and approvals exist.
