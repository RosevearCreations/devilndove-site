# Cloudflare Environment Checklist — Devil n Dove (Build 233)

_Last updated: Build 233 bounded-login/session-retention hotfix, retained Build 232 archived-product removal, Build 231 autosave/reload recovery, Build 230 visual manifest, 43-gate Startup system and retained read-only Meta credential tests._

This checklist explains **exactly where to add each setting in Cloudflare** and **where to find or create each value**.

## Build 230 environment note

Build 230 introduces no new secret or external-provider variable. It requires the existing production D1 binding. Back up D1, confirm Build 229, apply one Build 230 migration without explicit SQL transaction statements, then test `/api/admin/image-manifest`, `/api/admin/packaging-studio`, `/api/admin/creative-automation` and `/api/admin/startup-readiness`. Confirm 20 visual rows, three generated provenance rows, three adopted packaging references and 43 readiness gates. Do not store creative/visual/Startup evidence or Meta token values in environment-variable documentation.

## Build 233 login 503 and unexpected-logout check

Build 233 adds no variable and no D1 migration. It requires the existing Production D1 binding named exactly `DB`. The code removes full schema inspection from every login POST, uses one indexed user read plus one atomic D1 batch, stops temporary session-verification outages from erasing a valid browser token, and keeps the 897-row Amazon reference compressed until an authenticated inventory route requests it.

1. Deploy the complete Build 233 ZIP. Record **Workers & Pages → your Pages project → Deployments → deployment ID/time**.
2. Hard refresh `/login/`. In Developer Tools → Application → Service Workers, confirm the current shell is `devilndove-shell-v14`; unregister an older shell only if the hard refresh did not activate v14.
3. Open Developer Tools → Network, enable **Preserve log**, select **Fetch/XHR**, and keep the panel open.
4. Open `https://devilndove.com/api/auth/login`. Expect HTTP 200 JSON with `response_profile: auth_login_bounded_v1` and `diagnostic_mode: binding_only`. This default check confirms only that `DB` is present and does not query D1.
5. Return to `/login/` and submit an owner-controlled administrator login. Select the `POST /api/auth/login` row. Under **Headers**, expect Status 200 and `x-dd-auth-profile: auth_login_bounded_v1`; under **Response**, expect `ok: true`, the same profile and the correct user role. Never copy the returned token or cookie into notes/screenshots.
6. Confirm redirect to Admin, then refresh once. Select `GET /api/auth/me` and confirm HTTP 200 JSON with `response_profile: auth_session_bounded_v1`. This proves the new session can be read through the one-query indexed verification path.
7. In Cloudflare Dashboard open **Workers & Pages → the production project → Metrics → Errors / Invocation statuses**. Match the UTC timestamp. Then open **Logs** and filter `/api/auth/login` and `/api/auth/me`. Record successful/failed invocation status, CPU time, wall time and whether the outcome is `exceededCpu`, `exceededMemory` or error 1102. These auth routes must not trigger Amazon reference expansion. Do not infer CPU from the browser’s 34 ms duration because waiting and platform time differ from Worker CPU.
8. Submit one deliberately wrong password. Expect HTTP 401 JSON with `code: AUTH_INVALID_CREDENTIALS`. It must not redirect or create an authenticated session.
9. Sign in correctly again. In Developer Tools → Network request blocking, block only `*/api/auth/me*`, reload `/login/`, and confirm the account widget reports **Session retained • verification temporarily unavailable**. Confirm the existing token/cookie was not cleared. Remove the block, reload, and confirm `/api/auth/me` returns 200. Never block customer/payment endpoints for this test.
10. Log out deliberately and confirm the token/cookie is cleared. A protected API must now return 401. This distinguishes a true authentication rejection from a temporary platform failure.
11. Run password reset, two-browser Logout All Sessions and a deliberately expired test-session check exactly as listed under `login_logout_recovery` in `/admin/startup-readiness/`.
12. If login returns the Cloudflare HTML 503/1102 page, keep the Startup gate Failed/Blocked. Save the deployment ID, route, UTC timestamp and invocation outcome; do not paste the HTML, password, cookie or token. Roll back if the new deployment introduced the failure.
13. Only when a structured application response reports `AUTH_USER_LOOKUP_FAILED`, `AUTH_SESSION_CREATE_FAILED`, `AUTH_SCHEMA_INCOMPLETE` or a binding problem, open `/api/auth/login?diagnostic=full`. Record table/column names and safe error code only. Do not run the full diagnostic during every login attempt.
14. Rerun `node scripts/build233_login_resource_test.mjs` locally and repeat all production steps after any correction. A plan/CPU-limit increase is not a substitute for proving the bounded path.

Cloudflare’s [Error 1102 guidance](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/) identifies CPU or memory exhaustion; [Pages Functions metrics](https://developers.cloudflare.com/pages/functions/metrics/) and [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) are the platform authorities for the actual invocation and plan limits.

## Build 232 archived-product removal check

Build 232 adds no variable and no D1 migration. After deployment and a hard refresh to `devilndove-shell-v13`:

1. Open `/admin/products/` → **Draft & Archive Cleanup** → **Archived** and use an owner-controlled unused archived product.
2. Select **Check removal** and confirm `/api/admin/delete-product?product_id=<ID>` returns HTTP 200 JSON with `cleanup_profile: bounded_registry_v1`.
3. Confirm a normal archive/media-change audit does not block that disposable product, while an order-, packaging-, creative-project-, recall- or customer-history product remains **Archive only**.
4. Complete the reviewed deletion only for the disposable record; confirm inventory and deletion audit effects occur exactly once.
5. In Functions Metrics/Logs, filter `/api/admin/delete-product` and confirm the GET and POST produced no `exceededCpu`, `exceededMemory`, raw Cloudflare HTML or JSON parsing error.

## Build 231 Worker resource-limit check

Build 231 introduces no variable and no D1 migration. If a Product Editor request returns **503 Worker exceeded resource limits**:

Cloudflare currently documents a 10 ms CPU budget for Workers Free and explains that time waiting on network requests is not counted as CPU time. Confirm the actual account plan and invocation status rather than inferring CPU from HTTP duration alone.

1. Open Cloudflare Dashboard → Workers & Pages → the Devil n Dove project → Metrics → Errors → Invocation Statuses.
2. Check whether the matching timestamp is **Exceeded CPU Time Limits** or **Exceeded Memory**.
3. Open Workers Logs and filter for `/api/admin/product-detail`, `/api/admin/create-product` and `/api/admin/update-product`. Record timestamp, route, invocation outcome, CPU time, wall time and a non-secret product ID only.
4. Confirm the browser is running Build 232 (`devilndove-shell-v13` after refresh), which retains the Build 231 repair. Load Draft product 45 and confirm the Product Detail request returns HTTP 200 JSON with `response_profile: editor_compact_v1`; then autosave twice, edit while the first save is throttled, reload and run the browser-recovery test in `BUILD231_VALIDATION.md`.
5. Keep the Startup `runtime_incident_fallback` gate Failed or Blocked if an `exceededCpu`/`exceededMemory` result recurs. A Worker terminated by Cloudflare may not reach application catch/incident code, so the platform log is required evidence.
6. Optimize/reduce the failing request before considering a paid-plan CPU-limit increase. Do not treat a higher limit as proof that an unbounded loop, large payload or memory problem is fixed.

## Build 227 additions — business documents and Meta tests

### Client-document business identity

Add these to the Production environment. Encrypt them if Cloudflare only offers encrypted values:

| Variable | Required | Source / test |
|---|---|---|
| `BUSINESS_LEGAL_NAME` | Yes | Owner-confirmed legal/operating supplier name. Issue a test invoice and confirm the heading. |
| `BUSINESS_ADDRESS_LINE1` | Yes | Principal business address approved for customer documents. Confirm with owner/accountant. |
| `BUSINESS_ADDRESS_LINE2` | Optional | Suite/unit where applicable. |
| `BUSINESS_CITY`, `BUSINESS_PROVINCE`, `BUSINESS_POSTAL_CODE`, `BUSINESS_COUNTRY` | Yes | Owner-confirmed mailing/business facts. Print and review an invoice/credit note. |
| `BUSINESS_EMAIL`, `BUSINESS_PHONE`, `BUSINESS_WEBSITE` | Recommended | Customer-service contact details. Test that the public email/site destinations work. |
| `BUSINESS_GST_HST_NUMBER` | Conditional/important | Use only the owner/accountant-confirmed registration number. Never invent one. Required before treating a GST/HST credit note as complete. |

After saving, deploy, open `/admin/customer-documents/`, issue an owner-controlled invoice and packing slip, then select a recorded test refund and issue a credit note/refund confirmation. Confirm business name, registration number, recipient, date, reason, amounts and tax adjustment. Formally void only a disposable test document and confirm its immutable snapshot remains previewable.

### Meta Facebook Page + Instagram professional account

| Variable | Required | Source / safe test |
|---|---|---|
| `FACEBOOK_PAGE_ID` or `META_PAGE_ID` | Facebook | Meta Page identity. The app checks returned ID matches. |
| `FACEBOOK_PAGE_ACCESS_TOKEN` or `META_PAGE_ACCESS_TOKEN` | Facebook | Page access token stored as an encrypted Production secret. |
| `INSTAGRAM_USER_ID`, `IG_USER_ID`, or `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Instagram | Connected professional-account ID. It may also be derived from the Page response. |
| `INSTAGRAM_ACCESS_TOKEN` | Optional | Use when the Instagram workflow requires a distinct token; otherwise the configured Page token is tested. |
| `META_APP_ID`, `META_APP_SECRET` | Optional diagnostic | Enables server-side Page-token debug: validity, app-ID match, expiry/data-access-expiry and scopes. Store the secret encrypted. |
| `META_GRAPH_API_VERSION` | Optional | Set only after reviewing/testing the chosen Meta version. Build 227 falls back to `v26.0`. |

Safe test procedure:

1. Deploy after saving the variables; do not paste values into evidence.
2. Open `/admin/social-publishing/` and select **Test Facebook + Instagram**.
3. Confirm Facebook and Instagram return HTTP 200 and their IDs match the configured/derived account IDs.
4. If optional app credentials are configured, confirm `is_valid`, app-ID match, acceptable expiry/data-access-expiry and the expected returned scopes.
5. Save only the test time, API version, masked IDs/names, HTTP result, scope names and expiry timestamps.
6. Generate/dry-run a product draft. Keep automatic publishing disabled.
7. Only after roles/scopes/app review are approved, publish one reviewed non-sensitive product-only test and save the provider post ID/URL.
8. Retest after token rotation, app-role change, account reconnection or Graph API version change.

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

1. Confirm the deployed build is Build 233 or later and service-worker shell v14 is active.
2. Confirm `_routes.json` exists at the deployed root.
3. Confirm Functions are active in the deployment details.
4. Confirm D1 binding name is `DB`.
5. Check Cloudflare Pages deployment logs.
6. Follow the Build 233 fourteen-step login 503 and unexpected-logout check at the top of this file.

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
