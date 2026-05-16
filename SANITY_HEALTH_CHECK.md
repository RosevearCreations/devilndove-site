# Sanity Health Check — Build 127

Date: 2026-05-15

## Automated checks run during this pass
- JavaScript syntax check: all non-archive `.js` files passed `node --check`.
- Public/admin HTML check: every non-archive `.html` file has exactly one `<h1>`, a `<title>`, and a meta description.
- Local script/style reference check: no missing local `.js` or `.css` references were found.
- CSS brace drift check: `/css/styles.css` braces were balanced.
- `/api/products` adaptive-schema smoke test passed with an older tax schema that has `tax_rate` but no `rate_percent`.
- Current-pass SQL includes a Build 127 migration ledger marker and no destructive changes.

## Runtime incident sanity flow after deploying Build 127
1. Open `/api/products` in the browser.
2. Confirm the JSON response shows `ok: true`.
3. Confirm `summary.authority` is not `error`.
4. Open `/admin/operations/`.
5. Use **Security / Runtime Incidents** and filter the last 7 days.
6. Confirm no new `/api/products` incidents are created after the Build 127 deploy time.
7. Mark the old `/api/products` rows resolved once the new endpoint is confirmed.
8. Re-run Release Sanity.

## Guardrails to keep
- One H1 per exposed page.
- Money stored in cents, displayed in dollars.
- Current owned tools/supplies default to at least one stock unit.
- Package math uses stock package plus usage unit count.
- Keep private Amazon cost/order reports out of public static files.
- Public APIs should inspect D1 schema before referencing optional columns so older databases degrade safely.
