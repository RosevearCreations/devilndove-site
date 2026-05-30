# Build 156 repo rules update

Continue the same rules: update Markdown and schema files on every pass, keep one H1 per exposed page, avoid indexing private token pages, keep customer images private until consent is reviewed, and keep payment links behind admin approval gates. Payment/order/consent links must have void/resend/expiry controls before broader customer rollout.

# Build 154 repo rule reminder

When updating custom request quote workflows, keep every payment/order action review-first. Customer acceptance may create drafts, but it must not charge, publish, or create a live order without an admin review step. Uploaded reference images must remain private/internal until Media Consent Records explicitly allow public or social use.

# Build 153 repo rules update

Private quote preview links must remain noindex and manual-share only. Customer quote acceptance records intent but must not auto-charge, auto-invoice, or auto-publish work. Uploaded reference images must remain private-review-only until media consent and public-use review are implemented.

# Build 152 repo rule additions

- Custom request reply templates are internal drafts until a human reviews/copies/sends them. Do not auto-send them in a future pass without an explicit approval gate.
- Deposit and invoice candidates are planning records, not customer-payable invoices. Do not expose them publicly until quote acceptance and payment-request controls exist.
- HST/GST reminders may queue to `notification_outbox`, but live dispatch must continue to respect notification exclusions, cooldowns, and admin review rules.

# Build 151 repo rules note

Continue the pass rule: every feature change must update active Markdown and schema references. Public pages must keep exactly one H1, and private/customer/accounting data must stay out of public `/data/` JSON files.

# Build 150 rule reminder

Trust blocks and SEO overrides must remain review-first. Do not publish private customer details, private Amazon/order data, or unapproved photo/story consent into public trust blocks. Search Console CSV exports and generated SEO action rows are admin/private data; only approved title/meta/internal-link outcomes should become public copy.

# Repo Rules — Devil n Dove

## Build 139 rule reminder

Never commit social platform access tokens, page tokens, OAuth refresh tokens, app secrets, or API keys. Social publisher credentials belong only in Cloudflare environment variables. Keep generated social captions and public post URLs in D1; keep secrets out of D1 and public files.

# Repo Rules

## Build 137 rule reminder

Search Console CSV exports, Amazon order CSVs, and generated review queues are private working data. Do not place them under public `/data/`. Public pages still require exactly one H1, a clear title, and a meta description.

## Build 135 rule reminder

When changing product media or product editor workflows, update `/admin/products/`, Operations diagnostics, schema notes, and Markdown together. Do not place private Amazon/order CSV reports under public `/data/`.


Current sync: 2026-05-18 — Build 137 Search Console filtering, safe batch revert, and private SEO opportunity action queue.

## Required rules for future passes
1. Update Markdown when code/schema changes.
2. Update schema references when D1 tables, columns, indexes, or constraints change.
3. Keep one H1 per exposed public/admin HTML page.
4. Run JavaScript syntax checks before ZIP handoff.
5. Keep private import/accounting data out of public `/data/` paths.
6. Prefer D1 for operational truth; keep JSON as fallback/seed/export until migrated.
7. Store money as integer cents in D1 and show dollars in the UI.
8. Do not overwrite inventory costs blindly; use review and cost history where possible.
9. Do not claim tax/accountant readiness until reconciliation, close, HST review, and export validation are complete.
10. Keep retired files in `/archive/` and active files in predictable paths.

## Deployment rules
- Apply `database_upgrade_current_pass.sql` before relying on new D1-backed admin panels.
- Record applied SQL in the Migration Ledger.
- Run Release Sanity before declaring a build ready.
- Re-run Tools/Supplies inventory sync after catalog JSON/D1 changes.

## Build 125 note

Build 125 keeps Amazon order/cost data private, adds admin review/apply controls for Amazon staging rows, records inventory cost history, expands reconciliation and journal guardrails, and adds local-intent SEO pages plus `sitemap.xml`. Keep schema files and active Markdown updated on every pass.

## Runtime incident review rule - Build 126

Do not clear Release Sanity runtime warnings by marking everything resolved blindly. Group incidents first, fix the recurring endpoint or schema drift, then resolve only the rows tied to the fixed cause. Use `ignored` only for known harmless stale incidents.

## Build 128 rule addition

Public storefront endpoints must not hard-reference optional D1 columns. If a column may not exist on the deployed D1 database, verify it before building SQL and provide a safe default in the response payload.

## Build 129 repo rule additions

- Do not add private Amazon order/cost CSVs or match reports under public static folders such as `/data/`.
- New D1-sensitive endpoints should either verify optional columns before use or degrade safely with a clear runtime incident.
- Any new admin import workflow must be review-first and must update Markdown plus schema references in the same pass.

## Build 130 rule reminder

Before referencing a newer D1 column from a public endpoint, confirm it exists. Public pages should degrade safely instead of creating repeated runtime incidents.

## Build 131 repo rule update

Do not add private Amazon order exports, match reports, cost reports, or transaction CSV/XLSX files under public `/data/`. Use private D1 staging/admin import tools instead. Before deploy, run the local predeploy sanity script or equivalent checks for H1/meta, CSS drift, local references, and public-data privacy.

## Build 132 rule addition

For mobile navigation, keep the shared menu compact and grouped. Avoid adding more always-visible top-level mobile links; place secondary links inside grouped expandable sections so phone screens do not become a long menu wall.

## Build 133 note

Build 133 rule reminder: do not expose private Amazon/order CSV files under public `/data/`; Search Console imports should go to D1 staging tables, not public JSON.


## Build 134 note

This pass fixes the Product editor draft workflow: drafts require only name/type, image upload is available from the editor when R2 media storage is configured, create-product failures return JSON instead of HTML 500 pages, and the create endpoint adapts to live D1 product/media/SEO columns.
## Build 138 social posting rules

- Social posting remains review-first. Queue, review, copy/manual-post, then record the public post URL.
- Do not store Facebook, Instagram, TikTok, X, YouTube, Pinterest, or other platform secrets in Markdown, JSON, D1 public tables, or front-end JavaScript.
- Future direct API posting must use Cloudflare environment variables for secrets, platform OAuth diagnostics, and explicit admin approval before any publish action.


## Build 142 update — Competitive roadmap completed and tracked

- Completed `COMPETITIVE.md` as the active competitive strategy for Devil n Dove, covering positioning, homepage/product-page improvements, mobile UX, local SEO, social workflow, marketplace readiness, product media, trust, and accounting/margin direction.
- Added Operations > Competitive Roadmap so the highest-value items from the document can be seeded into D1, assigned a status, and reviewed during Release Sanity.
- Added `competitive_opportunities` and `competitive_opportunity_events` schema support.
- Added `/data/site/competitive-opportunities.json` as a public-safe roadmap seed file; it contains strategy/action metadata only and no private costs, orders, or customer data.
- Next direction: connect competitive opportunities to product readiness, SEO action completion, social analytics, testimonials, custom requests, and marketplace export checks.

## Build 155 maintenance note

- Updated alongside the latest custom request payment/order/marketplace/proof-filter pass.
- Schema, roadmap, gaps, SEO, and sanity notes now reflect the new Build 155 workflow direction.
