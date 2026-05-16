# Accounting Templates

Current sync: 2026-05-14 — Build 125.

## Purpose
This folder holds safe accounting template/reference files. Private statement exports, Amazon CSVs, accountant packages, and receipts should not be deployed publicly.

## Current statement provider profile support
The admin app now has saved provider profiles for:
- bank CSV
- PayPal activity
- Stripe balance transactions
- Square transactions
- Etsy payment account
- manual CSV

These profiles are stored in D1 table `accounting_statement_provider_profiles` and surfaced in `/admin/accounting/`.

## Next template work
- Add sanitized sample headers for each provider.
- Add manual CSV templates for expenses, payouts, refunds, fees, and HST review.
- Add accountant export manifest templates once the export package is complete.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Build 129 note

Amazon purchase rows should be imported to private D1 staging and reviewed before any costs are used in inventory, COGS, HST, or accountant export workflows.
