# New Chat Status — Devil n Dove Build 125

Date: 2026-05-14
Source build: `devilndove-site-main(124).zip`
Current output build: Build 125 Amazon purchase review, inventory cost history, reconciliation queue, journal validation, and local SEO pass.

## What changed in Build 125
- Added Amazon purchase review/apply API and admin queue.
- Added inventory cost history table and cost-history recording from sync, manual inventory edits, bulk cost edits, and Amazon-approved purchases.
- Improved inventory sync result visibility on the admin catalog page.
- Expanded reconciliation exception queue actions and fields.
- Added journal validation/posting guardrails for monthly accounting entries.
- Added six local-intent landing pages and a sitemap.
- Updated schema files and active Markdown files.

## Deploy order
1. Deploy the Build 125 zip.
2. Apply `database_upgrade_current_pass.sql` in Cloudflare D1.
3. Open `/admin/operations/`, run Release Sanity, and mark the Build 125 ledger row applied if D1 looks good.
4. Open `/admin/catalog/`, click Sync all tools + supplies, and review the sync result panel.
5. Open the Amazon purchase review queue on `/admin/catalog/` and approve only obvious safe matches first.

## Important verification queries
```sql
SELECT source_type, COUNT(*) AS total,
       SUM(CASE WHEN unit_cost_cents > 0 THEN 1 ELSE 0 END) AS with_unit_cost
FROM site_item_inventory
WHERE source_type IN ('tool','supply')
GROUP BY source_type;
```

```sql
SELECT COUNT(*) AS cost_history_rows
FROM site_item_inventory_cost_history;
```

```sql
SELECT review_decision, COUNT(*) AS total
FROM amazon_purchase_import_staging
GROUP BY review_decision;
```

## Current caution
Amazon order data remains private operational/accounting data. Keep raw Amazon reports and review exports out of public `/data/` paths.

## Build 126 handoff

A hotfix build was created after Release Sanity reported 7 recent error/critical runtime incidents. The build adds a visible `/admin/operations/` Security / Runtime Incidents review panel, grouped incident API results, review statuses, and Release Sanity filtering for resolved/ignored incidents. After deploying, open Operations, refresh the runtime incidents panel, group the 7 current incidents, fix the highest-count recurring endpoint first, then mark fixed rows resolved.
