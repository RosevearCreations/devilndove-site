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
# Cloudflare Environment Checklist — Devil n Dove

_Last updated: Build 187 login/env hotfix follow-up_

This file explains **where each setting goes in Cloudflare** and **where to find the value**.

Important split:

- **Database bindings** and **R2 bucket bindings** are added under the Pages project **Settings → Bindings**.
- **Variables and secrets** are added under the Pages project **Settings → Environment variables**.
- Secrets are encrypted and cannot be viewed again after saving, so keep a private copy in your own password manager.

You confirmed the **Database Bindings are already there**, so do not change them unless the binding name is wrong.

---

## 1. Where to go in Cloudflare

### Pages project

Go to:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove / your Devil n Dove Pages project
```

From there:

```text
Settings → Environment variables
```

Use this for:

- normal text variables
- encrypted secrets
- public URLs
- provider API keys

And:

```text
Settings → Bindings
```

Use this for:

- D1 database bindings
- R2 bucket bindings
- KV / other Cloudflare resources if added later

For most settings, add them to **Production** first. If you use preview deployments for testing, add the same safe test values to **Preview** too.

---

## 2. Already confirmed / do not duplicate

### D1 database binding

| Binding name | Type | Status | Where in Cloudflare | Notes |
|---|---|---:|---|---|
| `DB` | D1 database binding | Already there | Pages project → Settings → Bindings → D1 database bindings | Main app database. Login/admin require this. |
| `DD_DB` | D1 database binding alias | Optional legacy alias | Same as above | Only needed if older functions still reference it. Build 187 was patched to prefer `DB`. |

If login still fails after the route hotfix, check that the binding name is exactly:

```text
DB
```

not `DATABASE`, `D1`, `devilndove`, or another label.

---

## 3. Minimum required for the current app

These should be added first.

| Name | Cloudflare type | Where to add it | Where to find / how to choose value | Example / guidance |
|---|---|---|---|---|
| `PUBLIC_SITE_URL` | Variable | Pages project → Settings → Environment variables → Add variable | Your final public website URL | `https://devilndove.com` |
| `SITE_ORIGIN` | Variable | Same as above | Same as public site origin | `https://devilndove.com` |
| `PRODUCT_MEDIA_PUBLIC_BASE_URL` | Variable | Same as above | Your public R2/assets custom domain | `https://assets.devilndove.com` |
| `R2_PUBLIC_BASE_URL` | Variable | Same as above | Same as assets URL when using one public bucket | `https://assets.devilndove.com` |
| `SESSION_SECRET` | Secret | Pages project → Settings → Environment variables → Add secret | Create a long random value in a password manager | 32+ random characters |
| `PRIVATE_EVIDENCE_DOWNLOAD_SECRET` | Secret | Same as above | Create a long random value in a password manager | 32+ random characters |
| `DD_BOOTSTRAP_TOKEN` | Secret | Same as above | Temporary first-admin setup token | Remove/rotate after first admin is created |
| `ADMIN_TOKEN` | Secret | Same as above | Legacy bootstrap token if older bootstrap route is used | Remove/rotate after bootstrap |

### How to generate secret values

Use a password manager random generator, or from a local terminal:

```bash
openssl rand -hex 32
```

Do not use business names, birthdays, pet names, or reused passwords.

---

## 4. R2 bucket bindings

R2 bindings go here:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ your Devil n Dove Pages project
→ Settings
→ Bindings
→ R2 bucket bindings
→ Add binding
```

Cloudflare asks for:

- **Variable name** / **binding name** used by code
- **R2 bucket** to connect

### Strongly recommended

| Binding name | Type | Where to add | Which bucket to select | Notes |
|---|---|---|---|---|
| `PRODUCT_MEDIA_BUCKET` | R2 bucket binding | Settings → Bindings → R2 bucket bindings | Your product/media bucket | Main bucket for product and visual media. |

### Optional aliases / later split buckets

For now, these can point to the same R2 bucket as `PRODUCT_MEDIA_BUCKET`. Later, we can split private accounting, customer uploads, and derivatives into separate buckets.

| Binding name | Type | Use |
|---|---|---|
| `MEDIA_BUCKET` | R2 bucket binding | Generic media fallback |
| `R2_PRODUCT_MEDIA` | R2 bucket binding | Older product-media alias |
| `ACCOUNTING_EVIDENCE_BUCKET` | R2 bucket binding | Accounting evidence ZIP source |
| `PRIVATE_EVIDENCE_BUCKET` | R2 bucket binding | Signed private evidence downloads |
| `DARK_THEME_EVIDENCE_BUCKET` | R2 bucket binding | Dark-theme screenshot evidence |
| `CUSTOM_REQUEST_MEDIA_BUCKET` | R2 bucket binding | Custom request reference uploads |
| `ORDER_STAGE_PHOTOS_BUCKET` | R2 bucket binding | Custom order process/stage images |
| `PRODUCT_DERIVATIVE_BUCKET` | R2 bucket binding | Future optimized derivative images |

### Where to find the R2 bucket

Go to:

```text
Cloudflare Dashboard
→ R2 Object Storage
→ Buckets
```

Use the bucket that stores Devil n Dove product and media assets.

---

## 5. Stripe payment settings

Stripe values come from:

```text
Stripe Dashboard
→ Developers
→ API keys
```

Webhook secret comes from:

```text
Stripe Dashboard
→ Developers
→ Webhooks
→ your webhook endpoint
→ Signing secret
```

In Cloudflare, add them at:

```text
Pages project
→ Settings
→ Environment variables
```

| Name | Cloudflare type | Required when | Where to find value | Notes |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Secret | Stripe checkout is live | Stripe Dashboard → Developers → API keys | Already present. Starts with `sk_`. |
| `STRIPE_PUBLISHABLE_KEY` | Variable | Stripe checkout UI/provider status | Stripe Dashboard → Developers → API keys | Starts with `pk_`. Safe to be public. |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe webhooks are enabled | Stripe Dashboard → Developers → Webhooks → endpoint signing secret | Starts with `whsec_`. |

Use Stripe **test keys** for Preview and **live keys** for Production.

---

## 6. PayPal settings

PayPal values come from:

```text
PayPal Developer Dashboard
→ Apps & Credentials
→ select your app
```

Add them in Cloudflare:

```text
Pages project
→ Settings
→ Environment variables
```

| Name | Cloudflare type | Required when | Where to find value | Notes |
|---|---|---|---|---|
| `PAYPAL_CLIENT_ID` | Variable or Secret | PayPal checkout is enabled | PayPal Developer → Apps & Credentials | Public-ish, but variable is fine. |
| `PAYPAL_SECRET` | Secret | PayPal checkout is enabled | PayPal Developer → Apps & Credentials | Keep secret. |
| `PAYPAL_ENV` | Variable | PayPal checkout is enabled | Choose based on mode | `sandbox` or `live`. |
| `PAYPAL_WEBHOOK_ID` | Secret | PayPal webhooks are enabled | PayPal Developer → Webhooks | Optional until webhook endpoint is live. |

---

## 7. Email / notification provider settings

Add these in:

```text
Pages project
→ Settings
→ Environment variables
```

### Provider selector

| Name | Cloudflare type | Where to choose value | Example |
|---|---|---|---|
| `EMAIL_PROVIDER` | Variable | Choose which email service the app should use | `manual`, `resend`, `sendgrid`, or `postmark` |
| `GIFT_CARD_EMAIL_PROVIDER` | Variable | Choose gift-card sending provider | Usually same as `EMAIL_PROVIDER` |

Use `manual` until email sending is fully configured and tested.

### Resend

Resend values come from:

```text
Resend Dashboard
→ API Keys
```

Sender/domain settings come from:

```text
Resend Dashboard
→ Domains
```

| Name | Cloudflare type | Required when | Notes |
|---|---|---|---|
| `RESEND_API_KEY` | Secret | Resend is used | Starts with `re_`. |
| `RESEND_FROM_EMAIL` | Variable | Resend is used | Must be a verified sender/domain. |

### SendGrid

SendGrid values come from:

```text
SendGrid Dashboard
→ Settings
→ API Keys
```

| Name | Cloudflare type | Required when | Notes |
|---|---|---|---|
| `SENDGRID_API_KEY` | Secret | SendGrid is used | Keep secret. |

### Postmark

Postmark values come from:

```text
Postmark
→ Servers
→ select server
→ API Tokens
```

| Name | Cloudflare type | Required when | Notes |
|---|---|---|---|
| `POSTMARK_SERVER_TOKEN` | Secret | Postmark is used | Keep secret. |

### Notification email addresses

| Name | Cloudflare type | Where to get/choose value | Example |
|---|---|---|---|
| `NOTIFICATION_FROM_EMAIL` | Variable | Verified sender email in chosen provider | `hello@devilndove.com` |
| `NOTIFICATION_ADMIN_TO` | Variable | Your admin inbox | `your-email@example.com` |
| `SUPPORT_FROM_EMAIL` | Variable | Verified support sender | `support@devilndove.com` |
| `ACCOUNT_HELP_REVIEW_EMAIL` | Variable | Admin/recovery inbox | `your-email@example.com` |
| `ACCOUNTING_ALERT_EMAIL` | Variable | Accounting review inbox | `your-email@example.com` |

---

## 8. Facebook / Instagram settings

Add these in:

```text
Pages project
→ Settings
→ Environment variables
```

Meta/Facebook values come from:

```text
Meta Business Suite / Meta for Developers
→ your app / page
→ access tokens and page settings
```

| Name | Cloudflare type | Required when | Where to find value | Notes |
|---|---|---|---|---|
| `FACEBOOK_PAGE_ID` | Variable or Secret | Facebook posting/planning | Facebook Page settings / Meta tools | Already present. Page ID is not usually as sensitive as the token. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Secret | Direct Facebook posting | Meta for Developers / Graph API token tools | Required for posting. Keep secret. |
| `INSTAGRAM_USER_ID` | Variable or Secret | Instagram posting | Meta tools connected IG account | Optional. |
| `INSTAGRAM_ACCESS_TOKEN` | Secret | Instagram posting | Meta token tools | Optional. Keep secret. |

---

## 9. Cloudflare release-control settings

These are only needed when the admin release-control pages should import live deployment and manifest information from Cloudflare.

Cloudflare API token location:

```text
Cloudflare Dashboard
→ My Profile
→ API Tokens
→ Create Token
```

Account/project values:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ your Pages project
```

| Name | Cloudflare type | Required when | Where to find value | Notes |
|---|---|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Secret | Release Control imports live Cloudflare data | My Profile → API Tokens | Use the narrowest scoped token possible. |
| `CLOUDFLARE_ACCOUNT_ID` | Variable or Secret | Release Control live checks | Cloudflare dashboard account details / URL / overview | Account ID for the Cloudflare account. |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Variable | Release Control live checks | Pages project name | Example: `devilndove-site` if that is the project name. |
| `CLOUDFLARE_PAGES_PROJECT` | Variable | Legacy alias | Same as project name | Optional alias for older code. |

---

## 10. Optional Square settings

Only add these if Square is being used.

Square values come from:

```text
Square Developer Dashboard
→ Applications
→ your app
→ Credentials
```

| Name | Cloudflare type | Required when | Notes |
|---|---|---|---|
| `SQUARE_APPLICATION_ID` | Variable | Square is enabled | Optional payment provider. |
| `SQUARE_APP_ID` | Variable | Legacy alias | Optional alias. |
| `SQUARE_ACCESS_TOKEN` | Secret | Square is enabled | Keep secret. |
| `SQUARE_ENV` | Variable | Square is enabled | `sandbox` or `production`. |

---

## 11. Suggested current setup order

Since the D1 database bindings are already present, do this next:

1. Confirm the D1 binding name is exactly `DB`.
2. Add or confirm `PRODUCT_MEDIA_BUCKET` as an R2 bucket binding.
3. Add core site URL variables:
   - `PUBLIC_SITE_URL`
   - `SITE_ORIGIN`
   - `PRODUCT_MEDIA_PUBLIC_BASE_URL`
   - `R2_PUBLIC_BASE_URL`
4. Add safety secrets:
   - `SESSION_SECRET`
   - `PRIVATE_EVIDENCE_DOWNLOAD_SECRET`
5. Confirm Stripe:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
6. Leave email as `manual` until ready:
   - `EMAIL_PROVIDER=manual`
   - `GIFT_CARD_EMAIL_PROVIDER=manual`
7. Add Cloudflare release-control variables only when you want live deployment import features.

---

## 12. Production vs Preview recommendation

Use this pattern:

| Environment | Recommendation |
|---|---|
| Production | Real live domain, live Stripe keys, real R2 bucket, real D1 database |
| Preview | Test domain, test Stripe keys, preview/test D1 database if available, test R2 bucket if available |

Do not put live payment secrets into Preview unless you are very sure you want preview deployments to use live payments.

---

## 13. Quick health checks after saving variables

After saving variables and redeploying, check these URLs:

```text
/api/auth/login
/admin/
/admin/deployment-preflight/
/admin/command-center/
/admin/markdown-sanity/
```

Expected result for `/api/auth/login` using GET:

```json
{
  "ok": true,
  "route": "/api/auth/login",
  "methods": ["POST", "OPTIONS"]
}
```

If login still fails:

1. Confirm the deployed build includes the Build 187 login/env hotfix.
2. Confirm the D1 binding name is exactly `DB`.
3. Confirm the user/admin tables exist in D1.
4. Check Cloudflare Pages deployment logs for function errors.
5. Run `/admin/deployment-preflight/`.

---

## 14. What not to do

- Do not add D1 as a normal secret.
- Do not add R2 bucket names as secrets and expect upload/download code to work.
- Do not paste secret values into GitHub files.
- Do not commit `.env` files.
- Do not use the same Stripe test and live keys in both Preview and Production.
- Do not keep `DD_BOOTSTRAP_TOKEN` active forever after the first admin account exists.

---

## 15. Reference docs

- Cloudflare Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Cloudflare Pages build/environment variables: https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables
- Cloudflare Workers environment variables: https://developers.cloudflare.com/workers/configuration/environment-variables/
- Cloudflare Workers secrets: https://developers.cloudflare.com/workers/configuration/secrets/

