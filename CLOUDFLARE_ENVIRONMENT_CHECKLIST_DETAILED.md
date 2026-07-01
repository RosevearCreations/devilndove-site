# Retired reference — Build 200

This file is preserved as historical implementation evidence only. It does not define current work or release order. Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`; use `MARKDOWN_INDEX.md` to decide whether this historical note is relevant.

## Cloudflare Environment Checklist — Devil n Dove

_Last updated: Build 188/189 environment clarification after login route fix_

This checklist explains **exactly where to add each setting in Cloudflare** and **where to find or create each value**.

You confirmed:

- The **D1 database binding is already there**.
- Login is working after the route hotfix.
- Cloudflare is currently only allowing you to create **encrypted variables/secrets**.

That is okay. For this project, it is safe to add the listed Cloudflare environment values as **encrypted** if that is the only option available.

---

## 0. Important: if Cloudflare only allows encrypted values

Cloudflare’s UI may show the setting as **Variable** but only allow an encrypted/secret-style value. That is acceptable.

Use this rule:

| Situation | What to do |
|---|---|
| Cloudflare only allows encrypted variables/secrets | Add every value below as encrypted. |
| Value is sensitive, like Stripe secret, session secret, API token | It **must** be encrypted. |
| Value is public-ish, like `PUBLIC_SITE_URL` or `STRIPE_PUBLISHABLE_KEY` | It can still be encrypted. The app can read it server-side through `context.env`. |
| You need a value visible directly in browser JavaScript | Do **not** rely on Cloudflare secrets. Add a safe API/config endpoint later if needed. |

Encrypted values cannot be viewed again after saving. Keep a private copy in a password manager or offline secure note.

---

## 1. Cloudflare navigation paths

### Your Pages project

Go to:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site / your Devil n Dove Pages project
```

### Environment variables / secrets

Go to:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Environment variables
```

Depending on the current Cloudflare UI, this area may be called:

```text
Environment variables
Variables and Secrets
Variables
```

Use this area for:

- `PUBLIC_SITE_URL`
- `SITE_ORIGIN`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `DD_BOOTSTRAP_TOKEN`
- email provider keys
- PayPal keys
- Cloudflare API token
- Facebook/Instagram tokens

### D1 and R2 bindings

Go to:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Bindings
```

Use this area for:

- D1 database binding: `DB`
- R2 bucket binding: `PRODUCT_MEDIA_BUCKET`

D1/R2 are **not** normal environment variables. They are resource bindings.

---

## 2. Production vs Preview

Cloudflare Pages usually separates:

```text
Production
Preview
```

Use this pattern:

| Environment | Recommended values |
|---|---|
| Production | Real domain, real D1 database, real R2 bucket, live Stripe only when ready |
| Preview | Test domain, test Stripe keys, optional test D1/R2 if available |

For now, if we are mainly testing the live `pages.dev` deployment, add the core values to **Production** first.

---

## 3. Already confirmed: D1 database binding

You said database bindings are already present. Confirm the binding name is exactly:

```text
DB
```

### Where to confirm it

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Bindings
→ D1 database bindings
```

| Binding name | Type | Status | What it should point to |
|---|---|---:|---|
| `DB` | D1 database binding | Already present | Your Devil n Dove D1 database |

### Common mistake

Do **not** add `DB` as an encrypted variable. It must be a D1 binding.

---

## 4. Strongly recommended: R2 media bucket binding

The app can run with fallback behaviour, but media uploads, private evidence, product media, and visual workflows work better with R2.

### Where to create/check it

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Bindings
→ R2 bucket bindings
→ Add binding
```

### Where to find the R2 bucket

```text
Cloudflare Dashboard
→ R2 Object Storage
→ Buckets
```

Choose the bucket that stores Devil n Dove product/media files.

| Binding name | Type | Where value comes from | Notes |
|---|---|---|---|
| `PRODUCT_MEDIA_BUCKET` | R2 bucket binding | Select your R2 bucket from Cloudflare’s bucket dropdown | Main product/media/evidence bucket. |

### Optional R2 aliases later

These are not urgent. If the UI lets you add multiple R2 bindings, they can point to the same bucket for now.

| Binding name | Use |
|---|---|
| `MEDIA_BUCKET` | Generic media fallback |
| `PRIVATE_EVIDENCE_BUCKET` | Private evidence downloads |
| `ACCOUNTING_EVIDENCE_BUCKET` | Accountant evidence ZIPs |
| `DARK_THEME_EVIDENCE_BUCKET` | Dark-theme screenshot evidence |
| `CUSTOM_REQUEST_MEDIA_BUCKET` | Custom request uploads |
| `ORDER_STAGE_PHOTOS_BUCKET` | Order/process photos |
| `PRODUCT_DERIVATIVE_BUCKET` | Optimized derivative images |

If this feels like too much, only do `PRODUCT_MEDIA_BUCKET` for now.

---

## 5. Core site URL values

Add these at:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Environment variables
→ Add variable / Add secret
```

If Cloudflare only allows encrypted values, add them encrypted.

| Name | What to enter | Where to find it | Notes |
|---|---|---|---|
| `PUBLIC_SITE_URL` | `https://devilndove.com` | Cloudflare Pages → Custom domains, or your browser address bar for the live domain | Public canonical site URL. |
| `SITE_ORIGIN` | `https://devilndove.com` | Same as above | Usually same as `PUBLIC_SITE_URL`. |
| `PRODUCT_MEDIA_PUBLIC_BASE_URL` | `https://assets.devilndove.com` | Cloudflare R2 → bucket → custom domain / public URL setup | Public base URL for product/media images. |
| `R2_PUBLIC_BASE_URL` | `https://assets.devilndove.com` | Same as above | Alias used by older/newer media code. |

### If `assets.devilndove.com` is not set up yet

Use one of these:

| Situation | Temporary value |
|---|---|
| You have a public R2 custom domain | Use that URL. |
| You do not have a public R2 domain yet | Leave blank or use `https://devilndove.com` temporarily. |
| Product images already use absolute URLs in the database | The app may still display them without this value. |

Best final value is still:

```text
https://assets.devilndove.com
```

---

## 6. Security values we create ourselves

These values are **not found in Cloudflare, Stripe, or Facebook**.

We create them ourselves as long random strings.

### How to create them

Use one of these methods:

1. Password manager random password generator.
2. Local terminal:

```bash
openssl rand -hex 32
```

3. Any trusted random password generator.

Use at least **32 random characters**. Longer is fine.

Do not use names, birthdays, shop names, pets, or reused passwords.

### Values to create

Add these at:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Environment variables
→ Add encrypted variable / secret
```

| Name | We create it or find it? | What it is for | How long to keep it |
|---|---|---|---|
| `SESSION_SECRET` | We create it | Helps sign/session-protect login/session data | Keep permanently; rotate only if needed. |
| `PRIVATE_EVIDENCE_DOWNLOAD_SECRET` | We create it | Signs private evidence download links | Keep permanently; rotate if leaked. |
| `DD_BOOTSTRAP_TOKEN` | We create it | Temporary token for first-admin setup | Remove/rotate after first admin is created. |
| `ADMIN_TOKEN` | We create it | Legacy/bootstrap/admin maintenance token | Remove/rotate after bootstrap/maintenance is done. |

---

## 7. `DD_BOOTSTRAP_TOKEN` explained in detail

### What it is

`DD_BOOTSTRAP_TOKEN` is a temporary setup password/code used when the app needs to create or repair the first admin account.

It is **not** provided by Cloudflare.

We make it ourselves.

### Where to create it

Use a password manager or:

```bash
openssl rand -hex 32
```

Example format:

```text
f3b2d1e8f0a9480ab5a2c7d9d0e8c3f1a9b4c6d8e2f4a6b8c0d2e4f6a8b0c1d3
```

### Where to save it in Cloudflare

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Environment variables
→ Add encrypted variable / secret
```

Name:

```text
DD_BOOTSTRAP_TOKEN
```

Value:

```text
your generated random token
```

### When to use it

Use it only if the app’s admin setup/bootstrap page or API asks for a bootstrap token.

Common places it may be used:

```text
/admin/
admin setup screen
first-admin setup route
bootstrap/repair route
```

### When to remove it

After the first working admin account exists and login works, remove or rotate it.

Do not leave bootstrap tokens active forever.

---

## 8. `ADMIN_TOKEN` explained in detail

### What it is

`ADMIN_TOKEN` is a legacy or maintenance-style admin token.

It is **not** provided by Cloudflare.

We create it ourselves.

### Why it may exist

Older routes or emergency repair/admin scripts may ask for `ADMIN_TOKEN`.

Build 187/188 moved the app toward safer normal login, but older bootstrap or maintenance helpers may still check this value.

### Where to save it

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Environment variables
→ Add encrypted variable / secret
```

Name:

```text
ADMIN_TOKEN
```

Value:

```text
a different generated random token
```

### Can it match `DD_BOOTSTRAP_TOKEN`?

Best practice: no. Use a different random value.

### When to remove it

Remove or rotate it after bootstrap/maintenance is complete.

If everything is working through normal login, we should eventually retire this.

---

## 9. Stripe settings

You already have:

```text
STRIPE_SECRET_KEY
```

### Where to find Stripe keys

Go to:

```text
Stripe Dashboard
→ Developers
→ API keys
```

You will see:

| Stripe label | Cloudflare name |
|---|---|
| Publishable key | `STRIPE_PUBLISHABLE_KEY` |
| Secret key | `STRIPE_SECRET_KEY` |

### Where to find Stripe webhook secret

Go to:

```text
Stripe Dashboard
→ Developers
→ Webhooks
→ select your webhook endpoint
→ Signing secret
```

| Name | Cloudflare type | Where to get it | Starts with |
|---|---|---|---|
| `STRIPE_SECRET_KEY` | Encrypted/secret | Stripe → Developers → API keys → Secret key | `sk_test_` or `sk_live_` |
| `STRIPE_PUBLISHABLE_KEY` | Encrypted is okay | Stripe → Developers → API keys → Publishable key | `pk_test_` or `pk_live_` |
| `STRIPE_WEBHOOK_SECRET` | Encrypted/secret | Stripe → Developers → Webhooks → Signing secret | `whsec_` |

### Test vs live

| Stripe mode | Use where |
|---|---|
| `sk_test_` / `pk_test_` | Preview/testing |
| `sk_live_` / `pk_live_` | Production only when ready |

---

## 10. PayPal settings

Only add these when PayPal checkout is ready.

### Where to find them

Go to:

```text
PayPal Developer Dashboard
→ Apps & Credentials
→ REST API apps
→ select your app
```

| Name | What to enter | Where to find it |
|---|---|---|
| `PAYPAL_CLIENT_ID` | PayPal client ID | App credentials page |
| `PAYPAL_SECRET` | PayPal secret | App credentials page |
| `PAYPAL_ENV` | `sandbox` or `live` | Choose based on mode |
| `PAYPAL_WEBHOOK_ID` | Webhook ID | PayPal Developer → Webhooks |

If Cloudflare only allows encrypted values, add them all encrypted.

---

## 11. Email provider settings

For now, safest value:

```text
EMAIL_PROVIDER=manual
GIFT_CARD_EMAIL_PROVIDER=manual
```

This lets the app queue/review email-related actions without accidentally sending live customer emails.

Add at:

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ devilndove-site
→ Settings
→ Environment variables
```

| Name | Value now | Notes |
|---|---|---|
| `EMAIL_PROVIDER` | `manual` | Change later to `resend`, `sendgrid`, or `postmark`. |
| `GIFT_CARD_EMAIL_PROVIDER` | `manual` | Change later when gift-card email delivery is tested. |

### Resend

Find values here:

```text
Resend Dashboard
→ API Keys
```

and sender/domain here:

```text
Resend Dashboard
→ Domains
```

| Name | Where to find value |
|---|---|
| `RESEND_API_KEY` | Resend → API Keys |
| `RESEND_FROM_EMAIL` | Verified sender/domain in Resend |

### SendGrid

Find values here:

```text
SendGrid Dashboard
→ Settings
→ API Keys
```

| Name | Where to find value |
|---|---|
| `SENDGRID_API_KEY` | SendGrid → Settings → API Keys |

### Postmark

Find values here:

```text
Postmark
→ Servers
→ select server
→ API Tokens
```

| Name | Where to find value |
|---|---|
| `POSTMARK_SERVER_TOKEN` | Postmark server token |

### Admin notification emails

These are chosen by us.

| Name | What to enter | Where value comes from |
|---|---|---|
| `NOTIFICATION_FROM_EMAIL` | Verified sender email | Resend/SendGrid/Postmark verified domain |
| `NOTIFICATION_ADMIN_TO` | Your admin inbox | Choose your receiving email |
| `SUPPORT_FROM_EMAIL` | Support sender email | Verified sender/domain |
| `ACCOUNT_HELP_REVIEW_EMAIL` | Account help inbox | Choose your receiving email |
| `ACCOUNTING_ALERT_EMAIL` | Accounting inbox | Choose your receiving email |

Example:

```text
NOTIFICATION_ADMIN_TO=your-email@example.com
```

---

## 12. Facebook and Instagram settings

You already have:

```text
FACEBOOK_PAGE_ID
```

### Where to find Facebook Page ID

Try these paths:

```text
Facebook Page
→ About
→ Page transparency / Page ID
```

or:

```text
Meta Business Suite
→ Settings
→ Business assets
→ Pages
→ select the page
→ Page details
```

or via Meta tools:

```text
Meta for Developers
→ Graph API Explorer
→ /me/accounts
```

| Name | Where to find it | Notes |
|---|---|---|
| `FACEBOOK_PAGE_ID` | Facebook Page settings / Meta Business Suite / Graph API Explorer | Already present. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Meta for Developers / Graph API tools | Secret. Needed only for direct posting. |
| `INSTAGRAM_USER_ID` | Meta tools for connected Instagram business account | Optional. |
| `INSTAGRAM_ACCESS_TOKEN` | Meta developer token tools | Secret. Needed only for direct posting. |

If we only plan/social-review posts manually, do not add posting tokens yet.

---

## 13. Cloudflare release-control settings

Only add these if we want the admin release-control pages to read live Cloudflare deployment data.

### Where to create Cloudflare API token

```text
Cloudflare Dashboard
→ My Profile
→ API Tokens
→ Create Token
```

Use the narrowest permissions possible.

Likely permissions:

```text
Cloudflare Pages: Read
Account: Read
```

Only add write permissions if a future feature truly needs them.

### Where to find Cloudflare Account ID

Common places:

```text
Cloudflare Dashboard
→ select account
→ Account Home / Overview
```

or the dashboard URL may contain the account hash.

### Where to find Pages project name

```text
Cloudflare Dashboard
→ Workers & Pages
→ Pages
→ select project
```

Use the project slug/name shown in the Pages list. For the current live URL, it may be:

```text
devilndove-site
```

| Name | Where to find value | Notes |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens | Secret. |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account overview / dashboard URL | Encrypted is okay. |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Workers & Pages → Pages → project name | Example: `devilndove-site`. |
| `CLOUDFLARE_PAGES_PROJECT` | Same as above | Legacy alias; optional. |

---

## 14. Optional Square settings

Only add these if Square is being tested.

### Where to find them

```text
Square Developer Dashboard
→ Applications
→ select your application
→ Credentials
```

| Name | Where to find value |
|---|---|
| `SQUARE_APPLICATION_ID` | Square app credentials |
| `SQUARE_APP_ID` | Same as above, legacy alias |
| `SQUARE_ACCESS_TOKEN` | Square access token |
| `SQUARE_ENV` | Choose `sandbox` or `production` |

---

## 15. Suggested setup order for us right now

Since login is now working and D1 bindings are already there, use this order:

1. Confirm D1 binding name is exactly `DB`.
2. Add/check R2 binding:
   - `PRODUCT_MEDIA_BUCKET`
3. Add URL values:
   - `PUBLIC_SITE_URL`
   - `SITE_ORIGIN`
   - `PRODUCT_MEDIA_PUBLIC_BASE_URL`
   - `R2_PUBLIC_BASE_URL`
4. Add security values we create ourselves:
   - `SESSION_SECRET`
   - `PRIVATE_EVIDENCE_DOWNLOAD_SECRET`
   - `DD_BOOTSTRAP_TOKEN`
   - `ADMIN_TOKEN`
5. Confirm Stripe values:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET` later when webhook is set.
6. Set email to manual:
   - `EMAIL_PROVIDER=manual`
   - `GIFT_CARD_EMAIL_PROVIDER=manual`
7. Add Cloudflare release-control settings only after the main app is stable.

---

## 16. Quick test checklist after saving variables

After saving or changing variables, redeploy the Pages project.

Then test:

```text
https://devilndove-site.pages.dev/api/auth/login
```

Expected result should be JSON, not the public homepage.

Then test:

```text
https://devilndove-site.pages.dev/admin/
https://devilndove-site.pages.dev/admin/deployment-preflight/
https://devilndove-site.pages.dev/admin/command-center/
```

If login breaks again:

1. Confirm the deployed build includes Build 188 or later.
2. Confirm `_routes.json` exists at the deployed root.
3. Confirm Functions are active in the deployment details.
4. Confirm D1 binding name is `DB`.
5. Check Cloudflare Pages deployment logs.

---

## 17. What not to do

- Do not add D1 as an encrypted variable.
- Do not add an R2 bucket name as a variable and expect R2 upload/download code to work.
- Do not paste secrets into GitHub.
- Do not commit `.env` files.
- Do not use live Stripe keys in Preview unless intentionally testing live payments.
- Do not leave `DD_BOOTSTRAP_TOKEN` or `ADMIN_TOKEN` active forever.
- Do not share `STRIPE_SECRET_KEY`, `PRIVATE_EVIDENCE_DOWNLOAD_SECRET`, `SESSION_SECRET`, or provider tokens in chat screenshots.

---

## 18. Simple “what values do we create ourselves?” list

We create these ourselves:

```text
SESSION_SECRET
PRIVATE_EVIDENCE_DOWNLOAD_SECRET
DD_BOOTSTRAP_TOKEN
ADMIN_TOKEN
```

We find these in Cloudflare:

```text
DB binding
PRODUCT_MEDIA_BUCKET binding
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_PAGES_PROJECT_NAME
```

We find these in Stripe:

```text
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

We find these in PayPal:

```text
PAYPAL_CLIENT_ID
PAYPAL_SECRET
PAYPAL_WEBHOOK_ID
```

We choose these ourselves:

```text
PUBLIC_SITE_URL
SITE_ORIGIN
PRODUCT_MEDIA_PUBLIC_BASE_URL
R2_PUBLIC_BASE_URL
EMAIL_PROVIDER
GIFT_CARD_EMAIL_PROVIDER
NOTIFICATION_ADMIN_TO
```

We find these in Meta/Facebook:

```text
FACEBOOK_PAGE_ID
FACEBOOK_PAGE_ACCESS_TOKEN
INSTAGRAM_USER_ID
INSTAGRAM_ACCESS_TOKEN
```

---

## 19. Reference docs

Cloudflare:

- Pages Functions bindings: https://developers.cloudflare.com/pages/functions/bindings/
- Pages environment variables: https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables
- Workers variables and secrets: https://developers.cloudflare.com/workers/configuration/environment-variables/
- Workers secrets: https://developers.cloudflare.com/workers/configuration/secrets/
- Pages Functions routing: https://developers.cloudflare.com/pages/functions/routing/

Stripe:

- API keys: https://docs.stripe.com/keys
- Webhooks: https://docs.stripe.com/webhooks

PayPal:

- Developer apps and credentials: https://developer.paypal.com/dashboard/applications/

Meta:

- Graph API Explorer: https://developers.facebook.com/tools/explorer/

## Build 190 environment-health panel

After deploying Build 190, open `/admin/command-center/`. The **Auth and environment health** table reports whether the following are configured without exposing their values: `DB`, `PRODUCT_MEDIA_BUCKET`, `PUBLIC_SITE_URL`, `SITE_ORIGIN`, `SESSION_SECRET`, `PRIVATE_EVIDENCE_DOWNLOAD_SECRET`, Stripe keys, email provider mode, and Cloudflare release token.

A public-ish value may still be stored encrypted if Cloudflare only enables encrypted variables. D1 and R2 must remain resource bindings, not ordinary secrets.

## Build 191 in-app verification

After the environment variables/bindings are saved and the site is redeployed, open `/admin/command-center/` and use **Verify environment settings**. This records whether D1, R2, Stripe, Stripe webhook secret, email-provider configuration, Cloudflare API settings, public URL, and session secret appear configured. It does not expose secret values and does not replace live provider tests.

## Build 194 alignment

This is a supporting reference. Start with `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` for current decisions; preserve this document for specialist history and handoff detail.
