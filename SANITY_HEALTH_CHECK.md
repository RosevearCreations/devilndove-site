# Sanity Health Check — Build 125

Date: 2026-05-14

## Automated checks run during this pass
- JavaScript syntax check: all non-archive `.js` files passed `node --check`.
- Public/admin HTML check: every non-archive `.html` file has exactly one `<h1>`, a `<title>`, and a meta description.
- Local script/style reference check: no missing local `.js` or `.css` references were found.
- CSS brace drift check: `/css/styles.css` braces were balanced after the local-intent page additions.
- Current-pass SQL fresh-schema smoke test passed in SQLite for create-table/index/ledger statements.
- Public SEO additions: six local-intent pages and `sitemap.xml` were added.

## Manual checks after deployment
1. Open `/admin/operations/` and run Release Sanity.
2. Confirm the Build 125 migration ledger row is marked applied only after `database_upgrade_current_pass.sql` has been applied in D1.
3. Open `/admin/catalog/` and run Sync all tools + supplies.
4. Confirm the inventory sync result panel shows expected totals and does not hide failures.
5. Open Amazon purchase review and approve one obvious row only; verify inventory unit cost and cost history.
6. Open Accounting imports and test reconciliation queue buttons on a non-critical exception.
7. Open Accounting report, validate a month, and confirm unbalanced periods are blocked from posting.
8. Spot-check the six local-intent pages on mobile and desktop.

## Guardrails to keep
- One H1 per exposed page.
- Money stored in cents, displayed in dollars.
- Current owned tools/supplies default to at least one stock unit.
- Package math uses stock package plus usage unit count.
- Keep private Amazon cost/order reports out of public static files.
