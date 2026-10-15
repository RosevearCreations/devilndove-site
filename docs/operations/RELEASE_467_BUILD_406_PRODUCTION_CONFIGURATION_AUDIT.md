# Devil n Dove — Production settings: required / missing audit & provider credential acquisition
**Audit date:** 15 October 2026. **Project:** Cloudflare Pages Production serving \`https://devilndove.com\`. **Status key:** CONFIRMED BLOCKER (owner screenshot), CODE-REQUIRED, VERIFY LIVE, OPTIONAL / FUTURE. 

**Important:** A GitHub repository does not expose encrypted Cloudflare Production secrets. I cannot truthfully report a particular \`META_APP_SECRET\` or \`INSTAGRAM_ACCESS_TOKEN\` as definitely missing without authorized live diagnostic data. Build 406 adds **I.T. Integrations → Check current Production variables (no secret values)**, which reads variable-name presence in the Cloudflare Pages Function without returning any values. Compare its **PRESENT / NOT SET** results with this register. A PRESENT value might still be expired, invalid or lacking permission. **Do not paste any keys or access tokens into chat or GitHub.**

## 1. How to inspect / add settings safely in Cloudflare
1. Sign into [Cloudflare dashboard](https://dash.cloudflare.com/), choose the correct account.
2. Open **Workers & Pages → Devil n Dove Pages project → Settings → Variables and Secrets** (navigation labels may vary slightly).
3. Explicitly select **Production**, not Preview. Avoid changing production D1 IDs unless migration/deployment is planned.
4. Open the new [Devil n Dove I.T. Integrations](https://devilndove.com/admin/it-integrations/) section: click **Check current Production variables**, then compare each key with the checklist below.
5. For a missing value, click **Add**; enter the **exact variable name**, then its provider-issued value. Choose **Encrypt / Secret** for credentials, tokens, passwords, API keys, app secrets or session secrets. URLs and public IDs can remain normal variables.
6. Save. Redeploy the approved production code if required so Pages Functions pick up new bindings. Verify the names again without revealing any values.
7. Never change GitHub Actions Cloudflare deployment token unless the CI workflow actually requires it. Runtime and CI credentials are separate.

Cloudflare official: https://developers.cloudflare.com/pages/functions/bindings/

## 2. Confirmed owner blocker: Etsy OAuth and the three empty dropdowns
**Confirmed from the supplied Build399 screenshot:** \`oauth_access_expired_or_near_expiry\`. The dropdowns intentionally wait for valid OAuth; they are **not proven missing configuration keys**.
1. Visit [Etsy developer portal / Your Apps](https://www.etsy.com/developers/your-apps). If no app, use [Register](https://www.etsy.com/developers/register) and request a **Seller App** for your own shop.
2. In **Manage your apps**, find the **API Key keystring** → Production secret \`ETSY_API_KEYSTRING\`; reveal the **Shared Secret** → \`ETSY_SHARED_SECRET\`.
3. Production variable \`ETSY_REDIRECT_URI\` must equal \`https://devilndove.com/api/social/oauth/etsy/callback\`. Add this exact callback URL to the Etsy app registration where requested.
4. In Devil n Dove → [I.T. Integrations](https://devilndove.com/admin/it-integrations/) → Etsy OAuth Acceptance, click **Reconnect Etsy** and approve the scopes requested by the app (\`shops_r\`, \`listings_r\`, \`listings_w\`). Never copy Etsy access tokens into Production vars; the application stores them encrypted through the OAuth flow.
5. Return to **Build399**; choose Product #54 and its original local draft → **Check readiness** → **Read live Etsy categories & shipping/processing profiles (GET only)**.
6. If shipping/readiness dropdowns remain empty with current OAuth, open Etsy Shop Manager and create suitable **shipping profile** and **processing time/readiness** definitions, then repeat the deliberate read. Ensure U.S. shipping destinations remain disabled under current shop policy.
7. Do not click Create Remote Draft until all preconditions are verified; uncertain prior attempts must never be automatically retried.

Official Etsy key/secret: https://developers.etsy.com/documentation/tutorials/quickstart/
Official Etsy OAuth: https://developers.etsy.com/documentation/essentials/oauth2/

## 3. Meta: Facebook Pages, Instagram and Marketplace
**Owner goal:** One canonical Add Product screen with destination flags. **Important:** Facebook Marketplace personal-listing publication is **not** automatically available simply by creating a Meta app. Build406 implements **local preference and canonical-media mapping**, not automated provider listing creation. Instagram publishing, Facebook Page posting and Commerce Catalog APIs have distinct permissions and app-review rules.

### Meta App credentials — verify if enabling Meta OAuth
1. Go to [Meta for Developers / My Apps](https://developers.facebook.com/apps/), sign in with the business administrator account, create a business-focused app (or open your existing app).
2. Configure the appropriate Facebook Login / Business integration for the selected use case.
3. Under **App settings → Basic**, copy **App ID** → \`META_APP_ID\`. Reveal **App Secret** (requires your account verification/password) → encrypted \`META_APP_SECRET\`.
4. Configure valid OAuth redirect URI; the app's current canonical Meta callback path is \`https://devilndove.com/api/social/oauth/meta/callback\` → Production \`META_REDIRECT_URI\`. If testing alias routes, register the exact corresponding callback; do not invent alternate URLs.
5. Configure allowed domains and privacy policy / data-deletion details as requested by Meta. Request advanced access/app review for necessary permissions before production use.
6. In Devil n Dove OAuth Integrations, connect through the application flow. Do not manually put a short-lived user access token into \`META_APP_SECRET\`.

### Facebook Page fields — only needed for Page features
1. Create/use a Facebook Page owned by the business in Meta Business Suite.
2. Obtain Page numeric ID from Page information / Meta business tools → \`FACEBOOK_PAGE_ID\` (or legacy \`META_PAGE_ID\` only where used by older code).
3. Through the authorized Meta Login flow, request relevant approved Page permissions including \`pages_show_list\`, \`pages_read_engagement\`, \`pages_manage_posts\`, \`pages_manage_metadata\` as required for the actual feature.
4. A Page access token (not the App Secret!) may be used by legacy direct integration \`FACEBOOK_PAGE_ACCESS_TOKEN\`. Prefer your app's encrypted OAuth connection where supported; tokens expire or can be revoked.
5. Confirm capabilities and policies before enabling any Page content execution. Do not equate Page posting with Marketplace seller listing.

### Instagram Business/Creator access — NOT a separate "Instagram API key"
1. Switch the Instagram account to a **Professional** Business or Creator account.
2. For the **Instagram API with Facebook Login** used by the Meta Page-linked route, link that Instagram Professional account to the managed Facebook Page. The linked Instagram professional ID corresponds to \`INSTAGRAM_USER_ID\` (legacy alias \`IG_USER_ID\` or \`INSTAGRAM_BUSINESS_ACCOUNT_ID\` where specific old code uses it).
3. Request and pass Meta app review for needed permissions such as \`instagram_basic\` / \`instagram_content_publish\` in the Facebook Login model; the actual Meta app's OAuth scopes must be updated and approved before these capabilities work.
4. An alternative **Instagram API with Instagram Login** uses \`instagram_business_basic\` and \`instagram_business_content_publish\` and may not require a Facebook Page, but **this is a distinct OAuth integration** and should not be mixed with the current Meta provider contract.
5. \`INSTAGRAM_ACCESS_TOKEN\` is **feature-specific** to older direct integration paths; prefer an encrypted OAuth access token issued after the correct login and permissions rather than supplying a guessed static token. If enabling a direct path, record a correctly scoped token only as an encrypted Cloudflare secret.

Meta-maintained API descriptions: https://www.postman.com/meta/instagram/folder/u4g5a2a/instagram-api-with-facebook-login
Instagram Login alternative: https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login

## 4. Exact reference names by activation priority
| Tier | Names to check in Production | Where values come from / action |
|---|---|---|
| CORE / current | \`SESSION_SECRET\`, \`ETSY_API_KEYSTRING\`, \`ETSY_SHARED_SECRET\`, \`ETSY_REDIRECT_URI\` | Generated strong private session secret / Etsy Developer dashboard / exact callback above |
| RESOURCE BINDINGS | \`DB\`, \`PRODUCT_MEDIA_BUCKET\`, \`CAIP_PRIVATE_MEDIA_BUCKET\` | Cloudflare Pages → Settings → Bindings: D1 and R2; not a string variable |
| Meta OAuth when activated | \`META_APP_ID\`, \`META_APP_SECRET\`, \`META_REDIRECT_URI\` | Meta developer app Settings Basic + OAuth Valid Redirect URIs |
| Page feature-specific | \`FACEBOOK_PAGE_ID\`, \`FACEBOOK_PAGE_ACCESS_TOKEN\` | Facebook Page metadata / approved Meta Login connection; prefer OAuth storage |
| Instagram feature-specific | \`INSTAGRAM_USER_ID\`, \`INSTAGRAM_ACCESS_TOKEN\` | IG Professional account ID / correctly scoped authorized token where direct path required |
| Pinterest future | \`PINTEREST_APP_ID\`, \`PINTEREST_APP_SECRET\`, \`PINTEREST_REDIRECT_URI\` | [Pinterest Developer Apps](https://developers.pinterest.com/apps/), request access, Manage app → Configure / Redirect URI, OAuth |
| TikTok future | \`TIKTOK_CLIENT_KEY\`, \`TIKTOK_CLIENT_SECRET\`, \`TIKTOK_REDIRECT_URI\` | [TikTok Developers](https://developers.tiktok.com/), register app and select Login Kit/content scope with review |
| YouTube future | \`YOUTUBE_CLIENT_ID\`, \`YOUTUBE_CLIENT_SECRET\`, \`YOUTUBE_REDIRECT_URI\` | [Google Cloud Console](https://console.cloud.google.com/), create project → enable YouTube Data API v3 → OAuth consent screen → Credentials → OAuth client |
| X future | \`X_CLIENT_ID\`, \`X_CLIENT_SECRET\`, \`X_REDIRECT_URI\` | [X developer portal](https://developer.x.com/), create developer application / OAuth 2.0 client |
| Optional transaction | \`STRIPE_SECRET_KEY\`, \`STRIPE_PUBLISHABLE_KEY\`, \`STRIPE_WEBHOOK_SECRET\` | [Stripe dashboard](https://dashboard.stripe.com/apikeys), Developers → API keys; webhook signing secret from specific webhook endpoint |
| Optional alternative payments | \`PAYPAL_CLIENT_ID\`, \`PAYPAL_SECRET\`, \`PAYPAL_WEBHOOK_ID\`, \`PAYPAL_ENV\` | [PayPal developer](https://developer.paypal.com/dashboard/applications), REST app (sandbox first), webhook ID |
| Optional Square | \`SQUARE_ACCESS_TOKEN\`, \`SQUARE_APPLICATION_ID\`, \`SQUARE_ENV\` | [Square Developer Dashboard](https://developer.squareup.com/apps), sandbox then explicitly approved production |
| Optional email | \`EMAIL_PROVIDER\`, \`NOTIFICATION_FROM_EMAIL\`, \`RESEND_API_KEY\` or \`SENDGRID_API_KEY\` or \`POSTMARK_SERVER_TOKEN\` | Provider domain verification + dashboard API credentials; keep \`EMAIL_PROVIDER=manual\` until accepted |
| Optional assets | \`PRODUCT_MEDIA_PUBLIC_BASE_URL\`, \`R2_PUBLIC_BASE_URL\` | R2 custom domain e.g. \`https://assets.devilndove.com\` **only when actually active** |
| Optional business info | \`BUSINESS_LEGAL_NAME\`, \`BUSINESS_GST_HST_NUMBER\`, \`BUSINESS_ADDRESS_LINE1\`, \`BUSINESS_CITY\`, \`BUSINESS_PROVINCE\`, \`BUSINESS_POSTAL_CODE\`, \`BUSINESS_COUNTRY\`, \`BUSINESS_EMAIL\` | Verified company information; do not fabricate GST/HST identifiers |

### Pinterest acquisition detail
1. [Pinterest Developers → Connect app](https://developer.pinterest.com/docs/getting-started/connect-app/) with a verified Pinterest Business account.
2. Request trial access. On approval, **My apps → Manage** reveals App ID and App Secret.
3. Under **Configure → Redirect URIs**, register \`https://devilndove.com/api/social/oauth/pinterest/callback\` if using this app route and configure exact \`PINTEREST_REDIRECT_URI\`.
4. Grant requested \`boards:read\`, \`pins:read\`, and only necessary write scopes. Approval does not mean live posting is activated.

### TikTok / Google / X acquisition steps
TikTok: developers.tiktok.com → Manage apps → create/register → use **Client key** and **Client secret**, register exact \`https://devilndove.com/api/social/oauth/tiktok/callback\`; Content Posting API needs its own review.
Google/YouTube: Cloud Console → new/existing project → enable **YouTube Data API v3** → OAuth consent screen → OAuth client → Web application → add \`https://devilndove.com/api/social/oauth/youtube/callback\` → copy client ID & secret; publishing requires approved \`youtube.upload\` scope.
X: Developer Console → project/app → User authentication settings OAuth 2.0 → set callback \`https://devilndove.com/api/social/oauth/x/callback\` → copy Client ID and Client Secret if provided. Confirm pricing/tiers before activation.

## 5. What is *actually* missing?
- **Confirmed from owner's screenshot:** A currently usable Etsy access token at Build399 test time; the app reports \`oauth_access_expired_or_near_expiry\`. Reconnect or refresh through the approved owner OAuth path. It is NOT proof that \`ETSY_API_KEYSTRING\` was absent.
- **Not verified yet:** Which other Cloudflare Production variable names are empty. Only the authenticated Build406 Production audit or authorized dashboard can establish this.
- **Expected to be absent until opted in:** Meta, Instagram, Pinterest, TikTok, X, YouTube, alternate payment and email-provider variables. Their absence should be marked \`FUTURE / OPTIONAL\`, not a production defect when the feature is not enabled.
- **Not available by API-key alone:** Publishing personal Facebook Marketplace seller listings. Preserve local preparation while integrating only permitted Meta products, scopes and provider contracts.
- **Do not expose:** secrets, OAuth access tokens, private business or account data in screenshots, support tickets, repository commits or messages.
