# Build 279 — Cloudflare CPU / Go-Live Verification

## Purpose

Build 279 is preventive hardening. The Devil n Dove Production service snapshot reviewed before this release showed **193 successful Worker/Pages Function requests, 0 errors, 132 subrequests, and 0 Exceeded CPU Time Limit events** in the inspected 24-hour window. Rosie Dazzlers was the service responsible for the account-level CPU warning; Devil n Dove is being optimized now so it does not grow into the same failure mode.

Cloudflare Workers Free currently permits **10 ms CPU time per HTTP request**. Build 279 therefore reduces repeated request work and enables Workers Logs before go-live.

## Immediately after deployment

1. Open Cloudflare → Workers & Pages → `devilndove-site` → Production.
2. Confirm the D1 `DB`, `PRODUCT_MEDIA_BUCKET`, and `CAIP_PRIVATE_MEDIA_BUCKET` bindings are still present.
3. Open Observability / Logs and confirm new Production Function requests are appearing. Build 279 enables Workers Logs at 100% head sampling; tracing is intentionally not enabled.
4. Hard-refresh the site and Admin Dashboard.
5. Verify ordinary Admin Dashboard loading does **not** automatically run Smoke Tests or Release/Preflight checks. Those cards should wait for the operator button.
6. Verify Live Activity loads once and then refreshes only when **Refresh Live Feed** is clicked.

## Lightweight analytics acceptance

Use browser Network tools:

- Public page first visit: one `/api/track/visit` page-view call is expected.
- Reload/navigate back to the same path within 15 minutes in the same tab/session: an additional page-view call should normally be suppressed.
- `/admin/...`: no public `/api/track/visit` call should be produced by `site-analytics.js`.
- Checkout: one checkout-start event, not two.
- Editing a valid checkout email/name repeatedly must not create more than one normal recovery-lead write per 60 seconds; leaving the page may send one final beacon.

Analytics is non-critical and fail-open. A telemetry failure must never block shopping, checkout, authentication, or Admin business work.

## CAIP acceptance

Do one **small** representative upload/resume rather than another huge batch:

- intake readiness = ready;
- duplicate classification still works;
- parts upload normally;
- final completion still verifies every expected part row, ETag, contiguous range and exact byte total;
- R2 HEAD size must equal original D1 size before asset registration;
- final project refresh shows the registered asset.

Do not weaken integrity checks to improve CPU.

## 24-hour production acceptance

After a representative 24-hour period, record:

| Metric | Pre-Build-279 reviewed snapshot | Build 279 result |
|---|---:|---:|
| Successful requests | 193 | |
| Errors | 0 | |
| Exceeded CPU Time Limits | 0 | |
| Script Threw Exception | 0 | |
| Exceeded Memory | 0 | |
| Subrequests | 132 | |
| CPU P50 | capture from dashboard | |
| CPU P75 | capture from dashboard | |
| CPU P99 / tail | capture from dashboard | |

### Release acceptance

- **Exceeded CPU Time Limits = 0**
- Script exceptions = 0
- Memory errors = 0
- no unexplained request storm from an idle Admin tab
- no analytics retry storm
- CAIP integrity remains exact
- checkout/cart/product/admin workflows remain functional

If CPU rises, use Workers Logs to group invocations by request pathname and outcome before changing code. CPU time and wall time are different; diagnose using Cloudflare's CPU metric rather than guessing from total request duration.
