# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 95 — Product Workspace Current Context & Table Ergonomics is the last fully verified checkpoint:
- `dev` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- System Gate `34545373706` SUCCESS
- Current Application Quality `34545373640` SUCCESS
- I.T. Admin Runtime Proof `34545373627` SUCCESS
- Repository Branch Hygiene `34545373651` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 95 is the current Production checkpoint:
- `main` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- Production Pages Deploy `34545520443` SUCCESS
- Production Live Resource Integrity `34545592072` SUCCESS.

## Build 96 operational boundary

Build 96 — **Product Browser Search & Focus Filters** is the active Development closure candidate. It consumes Build 95's exact external closure and continues Products & Inventory usability without changing Product authority.

The current Product browser rules are:
- Product search operates only over records already loaded by the primary Products page;
- search covers Product/System number, name, slug, SKU, type/category, status, review status and colour;
- quick focus views are **All products**, **Needs attention**, **Drafts**, **Low stock**, and **Missing lead image**;
- **Needs attention** includes draft, low-stock, missing-featured-image, and `needs_changes` records;
- focus counts reuse `dd_admin_products_snapshot_v2` and add no second Product API/database read;
- a visible shown/rendered count makes filtering explicit;
- search/focus preferences are browser-local presentation only;
- **Clear search & filters** restores the full rendered list;
- when a filter hides the Product loaded in the editor, the context explains it and **Show current Product** clears filters only after an explicit operator click;
- Build 95 current Product context, sticky table header, desktop System # / Name anchors, highlighted current row and Essential/Full/fine-tune column views remain active;
- Build 94 readable 3/2/1 workspace navigation remains active;
- Build 93 centered-shell, local horizontal scrolling and right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 96 ingests exact Build 95 Development and Production closure. Build 96 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

The runtime I.T., preflight and reliability pages cannot self-attest GitHub/Cloudflare workflow status. A local GREEN diagnostic never substitutes for exact external release proof.

## Recovery discipline

- Record a current D1 recovery point before a real schema change.
- Rehearse restore only in a test/copied environment; never overwrite live Production business data as a diagnostic action.
- Verify representative users, Products, Inventory, Orders, Packaging and readiness records after an isolated D1 restore.
- Verify R2 inventory/re-link a safe test object without deleting live media.
- Rehearse Pages rollback and return to the current deployment with smoke evidence.
- Keep required binding/variable names documented without secret values.

## Environment boundaries

- Canonical Cloudflare Pages project: `devilndove-site`
- Development branch / Preview: `dev` / `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Development Product R2: `devilndove-toolshed-images-dev`
- Development CAIP R2: `devilndove-caip-media-dev`
- Production branch / site: `main` / `https://devilndove.com`
- Production D1: `devilndove-prod-r462` / `f34a741b-0000-45b0-9a96-6be08754d563`
- Production Product R2: `devilndove-toolshed-images`
- Production CAIP R2: `devilndove-caip-media`
- Canonical migrations: exactly `0001`–`0004` via `scripts/d1_migrate.py`.

Never overwrite Production business data from Development. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain independent `HOLD_EXTERNAL` lanes; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported.
