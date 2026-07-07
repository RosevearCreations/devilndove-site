# Social Publishing Connection Guide — Build 210

This specialist guide accompanies the two canonical documents:

- `AI_HANDOFF.md` — technical/deployment source of truth
- `PROJECT_STATUS_AND_ROADMAP.md` — business, workflow, SEO, and release source of truth

## What Build 210 actually automates

Build 210 adds a safe product-to-social trigger:

```text
Active + Approved/Published product
→ one linked social queue draft
→ caption/media/privacy review
→ explicit approval
→ dry-run
→ publish only through a configured platform connection
```

It is intentionally **not automatic publishing**. A social draft is created only when the administrator enables it in `/admin/social-publishing/`, and only one non-archived draft is created per product. The trigger never publishes, updates product content, changes source media, creates CAIP evidence, grants rights, creates a product claim, or bypasses the Social Media Privacy Guard.

## Why pixels are not posting connections

A browser pixel or conversion API measures selected visitor/conversion events. It cannot create a post on a Facebook Page, Instagram account, TikTok profile, X account, Pinterest board, or YouTube channel.

Posting requires all of:

1. A platform developer app/project.
2. The correct account/page/channel identity.
3. The required OAuth/app permissions and any required review/approval.
4. A protected server-side access token.
5. A platform-specific posting/upload flow.
6. A successful dry-run and privacy review.

Do not put tokens, client secrets, refresh tokens, Page tokens, or OAuth codes in D1, R2 object metadata, Git, Markdown, browser JavaScript, product records, or screenshots. Keep them as **Cloudflare encrypted Secrets**.

## Current application support matrix

| Platform | Product draft | Direct API publishing in current queue | Notes |
|---|---:|---:|---|
| Facebook Page | Yes | Yes, after setup | Existing queue supports Page feed/image posts. |
| Instagram Professional | Yes | Yes, after setup | Existing queue supports single-image feed posting. |
| Pinterest | Yes | Yes, after setup | Existing queue supports image Pins. |
| X | Yes | Yes, after setup | Existing queue supports text/link posts. |
| TikTok | Yes | No | Draft/copy preparation only. Direct Post requires dedicated OAuth, creator-info, media transfer, approved scope, and UX. |
| YouTube | Yes | No | Draft/preparation only. Upload requires dedicated Google OAuth and resumable upload. |

## Meta: Facebook Page and Instagram Professional

### Required state

- Facebook Page managed by the Meta account used to authorize the app.
- Instagram account set to Professional and connected to the Facebook Page.
- Meta developer app with the needed Graph API products, access level, and permissions.
- Current Graph API version is configurable by `META_GRAPH_API_VERSION`; Build 210 uses `v25.0` by default so it is not stuck to the older v20.0 fallback.

### Required Cloudflare Secrets

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
META_GRAPH_API_VERSION          # optional; default v25.0
```

The existing queue can reuse the Facebook Page token for Instagram only when that token actually has the required Instagram publishing permissions. Keeping a dedicated `INSTAGRAM_ACCESS_TOKEN` is clearer.

### Setup

1. Open Meta for Developers and create/select the production app.
2. Configure the required OAuth redirect URLs only if/when the site implements the platform OAuth handoff; do not invent a redirect URL.
3. Verify access to the business/Page and link the Professional Instagram account.
4. Request the minimum required permissions for Page posting and Instagram Content Publishing. Meta’s permissions model and app access levels can require review for production use.
5. Obtain a valid Page access token for the Page and identify the connected Instagram professional account ID.
6. In **Cloudflare Pages → Devil n Dove → Settings → Variables and Secrets**, add each credential as **Secret (encrypted)**. The current project UI may offer only the encrypted-secret type; that is appropriate.
7. Deploy, open `/admin/social-publishing/`, and ensure the Facebook/Instagram connection cards change from **Setup required** to **Configured**.
8. Create one non-sensitive test draft. Run Dry run, complete the Social Media Privacy Guard review, approve it, and publish it only once.

### Important media rules

- Facebook can publish a Page feed post or an image post from the existing queue.
- Instagram current support is a public HTTPS single image. Do not assume carousels, Reels, music, tagged products, or video are covered until they have their own tested code path.
- Never use a source image whose public use, privacy, customer consent, or third-party rights are unclear.

## X

### Required Cloudflare Secret

```text
X_USER_ACCESS_TOKEN
```

### Setup

1. Create an X developer project/application.
2. Configure a write-capable OAuth user authorization flow. The preferred modern option is OAuth 2.0 Authorization Code with PKCE.
3. Request the minimum write scopes: `tweet.read`, `tweet.write`, and `users.read`. Request `offline.access` only after secure refresh-token handling is implemented.
4. Obtain a user token for the Devil n Dove account and store it as the encrypted `X_USER_ACCESS_TOKEN` secret.
5. Deploy, check that the X card is configured, then dry-run a text/link post.

### Current limitation

The current direct queue sends text/link posts to `POST /2/tweets`. It does not upload image/video media to X. Use product link copy or keep image-first X publishing manual until a dedicated media upload implementation is added.

## Pinterest

### Required Cloudflare Secrets

```text
PINTEREST_ACCESS_TOKEN
PINTEREST_BOARD_ID
```

### Setup

1. Create a Pinterest developer app and apply for the access tier suitable for product Pins.
2. Set up OAuth using the scopes for the business account, board, and Pin creation workflow.
3. Select one Devil n Dove board for product discovery and copy the board ID.
4. Store the OAuth access token and board ID as Cloudflare encrypted secrets.
5. Test a public HTTPS product image + landing URL using Dry run before creating a Pin.

### Current limitation

The current queue creates an image Pin using the first approved public image URL. It does not upload a private/local file and will reject non-HTTPS/local URLs.

## TikTok

### Required future secret

```text
TIKTOK_ACCESS_TOKEN
```

### Setup before automation can be enabled

1. Register the TikTok developer app.
2. Request approval for the correct Content Posting API scope:
   - `video.publish` for Direct Post.
   - `video.upload` for upload-only.
3. Build the OAuth authorization flow.
4. Query creator info before showing the publish/export experience.
5. Implement the prescribed upload or `PULL_FROM_URL` media transfer flow.
6. Store tokens only as Cloudflare encrypted secrets; implement secure refresh/expiry handling.
7. Add the platform UX disclosures/controls required by TikTok before enabling direct posting.

### Current status

The app can include TikTok in a product social draft, but it is intentionally manual/review-first. The app does **not** pretend that a token alone makes Direct Post complete.

## YouTube

### Required future secret

```text
YOUTUBE_ACCESS_TOKEN
```

A mature implementation will also need OAuth client credentials and a securely held refresh token, not a one-off browser token.

### Setup before automation can be enabled

1. Create a Google Cloud project and enable YouTube Data API v3.
2. Configure the OAuth consent screen and Web application OAuth client.
3. Implement a secure OAuth flow that requests `https://www.googleapis.com/auth/youtube.upload`.
4. Implement resumable upload to the YouTube `videos.insert` endpoint.
5. Choose privacy state deliberately and record the returned video ID/URL.
6. Store tokens/secrets only in Cloudflare encrypted Secrets.
7. Test an unlisted, non-sensitive video first. New unverified API projects can be restricted to private uploads until audited.

### Current status

The social queue can prepare a title/caption/reference, but it does not upload to YouTube in Build 210.

## Product social-draft configuration

Open:

```text
/admin/social-publishing/
```

Choose:

- **Create a social draft when product becomes eligible** — disabled by default.
- **Trigger status** — `Approved or Published` or `Published only`.
- **Require Active/Published status** — recommended.
- **Require usable product image** — recommended.
- Default platforms, hashtag set, caption template key, UTM campaign, and internal guardrail note.

The generated draft has:

```text
source_type = product
source_id = product_id
approval_status = needs_review
post_status = draft
privacy_status = needs_review
approved_for_public_post = 0
api_publish_mode = review_first
```

It must still clear the Social Media Privacy Guard and explicit approval.

## Recommended launch sequence

1. Start with Facebook Page and Instagram only.
2. Add a single product with an accurate title, live price, real product photo, and truthful description.
3. Enable the **automatic draft** setting, not publication.
4. Confirm one draft appears in the social queue.
5. Review privacy, caption, UTM URL, and product link.
6. Use Dry run.
7. Publish one low-risk test post.
8. Verify the post link, UTM traffic, and the application’s attempt record.
9. Add Pinterest next for product discovery.
10. Add X only for succinct product/workshop updates.
11. Keep TikTok and YouTube manual until the dedicated video/OAuth flows are built and tested.

## References to verify before connection

- Meta Graph API versioning/changelog and Page/Instagram Content Publishing documentation.
- X OAuth 2.0 Authorization Code with PKCE and API v2 authentication mapping.
- Pinterest OAuth/scopes and Create Pin documentation.
- TikTok Content Posting API, creator-info, Direct Post/Upload requirements, and scope approvals.
- YouTube Data API `videos.insert` and OAuth upload scope documentation.

Always re-check these official provider documents just before enabling a new API connection because app reviews, versions, scope names, access tiers, and publishing restrictions can change.
