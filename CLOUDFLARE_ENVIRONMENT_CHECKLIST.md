# Cloudflare Environment Checklist — Build 187

This checklist separates **bindings** from **secrets/variables**. In Cloudflare Pages Functions, D1/R2 resources and text variables are all accessed through `context.env`, but they are configured in different dashboard areas.

## Required bindings

| Name | Type | Required | Notes |
|---|---:|---:|---|
| `DB` | D1 database binding | Yes | Main operational database for auth, products, admin, sessions, orders, command center, and roadmap workflows. |
| `PRODUCT_MEDIA_BUCKET` | R2 bucket binding | Strongly recommended | Main image/media bucket. Many features fall back to this bucket when a more specific bucket is not configured. |

Optional legacy alias: `DD_DB` can point at the same D1 database, but Build 187 patches the remaining health/bootstrap routes to accept `DB` first.

## Minimum secrets / variables for the site to operate

| Name | Secret? | Required | Example / guidance |
|---|---:|---:|---|
| `PUBLIC_SITE_URL` | No | Recommended | `https://devilndove.com` |
| `SITE_ORIGIN` | No | Recommended | `https://devilndove.com` |
| `PRODUCT_MEDIA_PUBLIC_BASE_URL` | No | Recommended | `https://assets.devilndove.com` |
| `R2_PUBLIC_BASE_URL` | No | Optional alias | Same as product media public base when using one public assets domain. |
| `ADMIN_TOKEN` | Yes | Only if using `/api/admin/bootstrap` | Long random token for the legacy admin bootstrap route. |
| `DD_BOOTSTRAP_TOKEN` | Yes | Only if creating the first admin through `/api/auth/bootstrap-admin` | Long random token. Remove/rotate after first admin exists. |
| `SESSION_SECRET` | Yes | Recommended | Long random secret. Used as fallback signing secret for private evidence links. |
| `PRIVATE_EVIDENCE_DOWNLOAD_SECRET` | Yes | Recommended for accounting/private evidence | Long random secret for signed evidence downloads. |

## Payment provider secrets

| Name | Secret? | Required when | Notes |
|---|---:|---|---|
| `STRIPE_SECRET_KEY` | Yes | Stripe checkout is live | Already configured in your account. |
| `STRIPE_PUBLISHABLE_KEY` | No | Stripe checkout UI/provider status | Safe public key. |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhooks are enabled | Add after webhook endpoint is created. |
| `PAYPAL_CLIENT_ID` | No/Secret | PayPal is enabled | Public-ish client ID; still okay as protected variable. |
| `PAYPAL_SECRET` | Yes | PayPal is enabled | Keep secret. |
| `PAYPAL_ENV` | No | PayPal is enabled | `sandbox` or `live`. |
| `PAYPAL_WEBHOOK_ID` | Secret | PayPal webhooks are enabled | Optional until webhooks are live. |
| `SQUARE_APPLICATION_ID` / `SQUARE_APP_ID` | No/Secret | Square is enabled | Optional provider. |
| `SQUARE_ACCESS_TOKEN` | Yes | Square is enabled | Optional provider. |
| `SQUARE_ENV` | No | Square is enabled | `sandbox` or `production`. |

## Email / notification secrets

| Name | Secret? | Required when | Notes |
|---|---:|---|---|
| `EMAIL_PROVIDER` | No | Email sending is enabled | `resend`, `sendgrid`, `postmark`, or `manual`. |
| `GIFT_CARD_EMAIL_PROVIDER` | No | Gift-card delivery uses a specific provider | Defaults to `EMAIL_PROVIDER` or manual. |
| `RESEND_API_KEY` | Yes | Resend is used | Recommended first provider. |
| `RESEND_FROM_EMAIL` | No | Resend is used | Verified sender address. |
| `SENDGRID_API_KEY` | Yes | SendGrid is used | Optional provider. |
| `POSTMARK_SERVER_TOKEN` | Yes | Postmark is used | Optional provider. |
| `NOTIFICATION_FROM_EMAIL` | No | Notifications enabled | Verified sender. |
| `NOTIFICATION_ADMIN_TO` | No | Admin alerts enabled | Admin destination email. |
| `SUPPORT_FROM_EMAIL` | No | Support/account emails | Verified sender fallback. |
| `ACCOUNT_HELP_REVIEW_EMAIL` | No | Account help requests enabled | Where forgot-login/admin recovery requests go. |
| `ACCOUNTING_ALERT_EMAIL` | No | Accounting close alerts enabled | Where accounting review alerts go. |

## Social publishing secrets

| Name | Secret? | Required when | Notes |
|---|---:|---|---|
| `FACEBOOK_PAGE_ID` | Secret/Variable | Facebook page posting | Already configured in your account. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Yes | Facebook page posting | Missing if direct Facebook posting should work. |
| `INSTAGRAM_USER_ID` | Secret/Variable | Instagram posting | Optional. |
| `INSTAGRAM_ACCESS_TOKEN` | Yes | Instagram posting | Optional; some code can fall back to Meta page token. |

## Cloudflare release/admin checks

| Name | Secret? | Required when | Notes |
|---|---:|---|---|
| `CLOUDFLARE_API_TOKEN` | Yes | Release Control imports deployments/manifests | Scoped API token only. |
| `CLOUDFLARE_ACCOUNT_ID` | Secret/Variable | Release Control live checks | Cloudflare account ID. |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | No | Release Control live checks | Pages project name. |
| `CLOUDFLARE_PAGES_PROJECT` | No | Alias | Optional alias used by older code. |

## Optional R2/media aliases

These can point to the same bucket while the app is small, then split later when privacy/accounting needs grow.

| Name | Type | Use |
|---|---:|---|
| `MEDIA_BUCKET` | R2 binding | Generic media fallback. |
| `R2_PRODUCT_MEDIA` | R2 binding | Older product media alias. |
| `ACCOUNTING_EVIDENCE_BUCKET` | R2 binding | Accounting evidence attachments/private bundle source. |
| `PRIVATE_EVIDENCE_BUCKET` | R2 binding | Private signed evidence download source. |
| `DARK_THEME_EVIDENCE_BUCKET` | R2 binding | Dark-theme screenshot evidence. |
| `CUSTOM_REQUEST_MEDIA_BUCKET` | R2 binding | Custom request reference uploads. |
| `ORDER_STAGE_PHOTOS_BUCKET` | R2 binding | Custom order process/stage images. |
| `PRODUCT_DERIVATIVE_BUCKET` | R2 binding | Future derivative image output. |

## Current immediate gap

The current Cloudflare account only shows `FACEBOOK_PAGE_ID` and `STRIPE_SECRET_KEY` as secrets. That is not enough for the full current app. At minimum, confirm the `DB` D1 binding exists and add the product media R2 binding plus site/media URL variables. For the login issue, `DB` is the critical binding.
