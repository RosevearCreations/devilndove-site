# Devil n Dove Production Variables & Bindings Reference

This is the operator-facing Production checklist for the retained main-site workflow at https://devilndove.com/. Cloudflare may store all values as encrypted secrets; that is acceptable because Pages Functions read them through `context.env`.

## Values we can safely state

| Name | Production value |
| --- | --- |
| PUBLIC_SITE_URL | `https://devilndove.com` |
| SITE_ORIGIN | `https://devilndove.com` |
| ETSY_REDIRECT_URI | `https://devilndove.com/api/social/oauth/etsy/callback` |
| PRODUCT_MEDIA_PUBLIC_BASE_URL | `https://assets.devilndove.com` when that R2 custom domain is active; otherwise use the actual public media base URL |
| R2_PUBLIC_BASE_URL | same public R2/media base URL as above |
| EMAIL_PROVIDER | `manual` until a live provider is explicitly accepted |
| GIFT_CARD_EMAIL_PROVIDER | `manual` until live gift-card email delivery is explicitly accepted |
| META_GRAPH_API_VERSION | optional; current app fallback is `v26.0` if unset |
| PAYPAL_ENV | `sandbox` until live PayPal is explicitly accepted |
| SQUARE_ENV | `sandbox` until live Square is explicitly accepted |

## Core Production secrets/references

These must be created or copied from their owning provider. Existing encrypted values cannot be read back from Cloudflare after they are saved.

- SESSION_SECRET
- PRIVATE_EVIDENCE_DOWNLOAD_SECRET
- DD_BOOTSTRAP_TOKEN
- ADMIN_TOKEN
- ETSY_API_KEYSTRING
- ETSY_SHARED_SECRET
- ETSY_REDIRECT_URI

For the current Etsy main-site connection, `OAUTH_PROVIDER_AUTHORIZATION_MODE`, `OAUTH_TOKEN_ENCRYPTION_KEY_V1`, and `SOCIAL_OAUTH_ACCEPTANCE_PROVIDER` are not required. The dedicated OAuth encryption key is optional because Etsy has the existing domain-separated shared-secret fallback.

## Payments — add only for providers we intend to use

Stripe:
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET

PayPal:
- PAYPAL_CLIENT_ID
- PAYPAL_SECRET
- PAYPAL_WEBHOOK_ID
- PAYPAL_ENV

Square:
- SQUARE_ACCESS_TOKEN
- SQUARE_APPLICATION_ID (or legacy SQUARE_APP_ID where still supported)
- SQUARE_ENV

## Social providers

Meta/Facebook/Instagram:
- FACEBOOK_PAGE_ID
- FACEBOOK_PAGE_ACCESS_TOKEN
- INSTAGRAM_USER_ID
- INSTAGRAM_ACCESS_TOKEN
- META_APP_ID
- META_APP_SECRET
- META_GRAPH_API_VERSION
- Optional legacy aliases supported by older paths: META_PAGE_ID, META_PAGE_ACCESS_TOKEN, IG_USER_ID, INSTAGRAM_BUSINESS_ACCOUNT_ID

Pinterest:
- PINTEREST_APP_ID
- PINTEREST_APP_SECRET

## Email / notifications

Base:
- EMAIL_PROVIDER
- GIFT_CARD_EMAIL_PROVIDER
- NOTIFICATION_FROM_EMAIL
- NOTIFICATION_ADMIN_TO
- SUPPORT_FROM_EMAIL
- ACCOUNT_HELP_REVIEW_EMAIL
- ACCOUNTING_ALERT_EMAIL

Provider-specific, only when used:
- RESEND_API_KEY
- RESEND_FROM_EMAIL
- SENDGRID_API_KEY
- POSTMARK_SERVER_TOKEN

## Business identity fields

- BUSINESS_LEGAL_NAME
- BUSINESS_GST_HST_NUMBER
- BUSINESS_ADDRESS_LINE1
- BUSINESS_ADDRESS_LINE2
- BUSINESS_CITY
- BUSINESS_PROVINCE
- BUSINESS_POSTAL_CODE
- BUSINESS_COUNTRY
- BUSINESS_EMAIL
- BUSINESS_PHONE
- BUSINESS_WEBSITE

## Optional external data

- TMDB_READ_ACCESS_TOKEN

## Cloudflare automation references

These are for CI/automation rather than ordinary runtime provider behaviour:
- CLOUDFLARE_ACCOUNT_ID
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_API_TOKEN_NEW
- CLOUDFLARE_PAGES_PROJECT
- CLOUDFLARE_PAGES_PROJECT_NAME

## Resource bindings — not environment variables

Production deployment must bind:
- DB → Production D1 `devilndove-prod-r462`
- PRODUCT_MEDIA_BUCKET → `devilndove-toolshed-images`
- CAIP_PRIVATE_MEDIA_BUCKET → `devilndove-caip-media`

Optional compatibility R2 aliases are MEDIA_BUCKET, PRIVATE_EVIDENCE_BUCKET, ACCOUNTING_EVIDENCE_BUCKET, DARK_THEME_EVIDENCE_BUCKET, CUSTOM_REQUEST_MEDIA_BUCKET, ORDER_STAGE_PHOTOS_BUCKET and PRODUCT_DERIVATIVE_BUCKET.

## Secret-value rule

Do not copy secret values into GitHub, build artifacts, screenshots, chat, or documentation. If an encrypted Production value is lost, rotate/recreate it at its owning provider or generate a new random value when the application owns the secret.
