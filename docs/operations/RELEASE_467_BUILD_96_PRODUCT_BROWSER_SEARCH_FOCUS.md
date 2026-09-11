# Release 467 Build 96 — Product Browser Search & Focus Filters

## Final closure

Build 96 is externally proven **Development GREEN and Production GREEN** at exact SHA `ba0e2f633d823b90fdcc2cbbbe6be4c50c79b284`, tree `76f01771b844f6f610a621cd969d033cfa3d7c9c`.

Development proof:
- System Gate `34546959255` SUCCESS
- Current Application Quality `34546959190` SUCCESS
- I.T. Admin Runtime Proof `34546959188` SUCCESS
- Repository Branch Hygiene `34546959296` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Production proof:
- Production Pages Deploy `34547083100` SUCCESS
- Production Live Resource Integrity `34547157869` SUCCESS.

Build 97 ingests this exact closure as its restart baseline.

## Product browser controls

The Products page loads its Product list through the primary Product authority and saves the shared browser snapshot `dd_admin_products_snapshot_v2`. Build 96 reuses that same loaded list and snapshot to add browser-local navigation rather than making another Product request. **No second Product API** or database read is introduced.

The Product browser provides text search across Product/System number, name, slug, SKU, type/category, status, review status and colour; **All products**, **Needs attention**, **Drafts**, **Low stock**, and **Missing lead image** focus views; live focus counts; a shown/rendered result count; **Clear search & filters**; and browser-local persistence only.

Build 95 current Product context remains authoritative. When filtering hides the current editor Product, **Show current Product** clears filters only after an explicit operator click and locates the row. Build 95 sticky table identity/current-row/column views, Build 94 responsive workspace navigation and Build 93 centered-shell overflow protections remain active.

## Release and data safety

Build 96 added no D1 schema change, request-time DDL, Product or Inventory business-data migration, R2 mutation, provider execution, provider publication, Cloudflare Access mutation, or automatic Production promotion. Canonical D1 migrations remain exactly `0001`–`0004`.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.
