# Build 279 — Deployment Checklist

## Release

**Devil n Dove Build 279 — Worker Efficiency & Go-Live Hardening**

This is primarily a code/configuration/runtime release. **There is no new Build 279 production D1 migration.** Build 276 remains the latest Packaging migration; Build 274 remains the Creative Process migration; Build 269 remains the CAIP migration.

## Before deploy

1. Back up production D1.
2. Run `BUILD279_D1_VERIFICATION.sql` against production.
3. For both analytics-table queries, every UTM result should be `1`.
4. For the CAIP query, all three Build 269 columns should be `1`.
5. `PRAGMA foreign_key_check` should return no rows.
6. If any required column is absent, stop and preserve the query output; do not improvise an ALTER from the browser. Build 279's analytics is fail-open, but production/schema parity should be repaired deliberately.

## Deploy

Deploy the Build 279 ZIP through the normal Cloudflare Pages production workflow.

Build 279's `wrangler.toml` intentionally:

- keeps `compatibility_date = "2026-04-08"` unchanged;
- keeps existing D1/R2 bindings unchanged;
- enables Workers Logs with `head_sampling_rate = 1`;
- does **not** enable the tracing beta.

After deployment, confirm the Cloudflare project still shows the expected bindings because Wrangler configuration is part of the Pages project configuration authority.

## Immediate smoke checks

1. Hard-refresh `/` and `/admin/`.
2. Confirm public pages render normally and SEO/title/H1 content is unchanged.
3. Confirm Admin Dashboard summary loads.
4. Confirm Smoke Tests and Release Status do not call their APIs until their buttons are clicked.
5. Confirm Live Activity has manual **Refresh Live Feed** and does not update itself every 30 seconds.
6. Open Shop/Product and confirm Featured Products, product reviews/trust blocks and SEO overrides still render/fail safely.
7. Open checkout; confirm cart/order functions still work and checkout recovery is throttled.
8. On CAIP, use a small file or existing resumable test to confirm duplicate-safe intake and final registration.
9. Open Cloudflare Observability/Logs and confirm Production Function invocation logs are available.

## 24-hour gate

Use `BUILD279_CLOUDFLARE_CPU_VERIFICATION.md`.

Do not call the hardening pass complete until a representative production window still shows **0 Exceeded CPU Time Limits** and no request storm from idle Admin/analytics behavior.

## Rollback

Because Build 279 has no production D1 migration, application rollback is straightforward: redeploy Build 278 if a functional regression appears. Do not roll back D1 for Build 279.
