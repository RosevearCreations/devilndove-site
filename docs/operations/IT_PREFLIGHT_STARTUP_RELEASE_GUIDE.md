# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 94 — Product Workspace Readability & Responsive Navigation is the last fully verified checkpoint:
- `dev` `bcafa7bbfbf17793d4b6280195c44c435ff3c68e`
- tree `f83d850b2b28ef4840463439a8b449ebbe1b9a43`
- System Gate `34537169571` SUCCESS
- Current Application Quality `34537169401` SUCCESS
- I.T. Admin Runtime Proof `34537169400` SUCCESS
- Repository Branch Hygiene `34537169580` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 94 is the current Production checkpoint:
- `main` `bcafa7bbfbf17793d4b6280195c44c435ff3c68e`
- tree `f83d850b2b28ef4840463439a8b449ebbe1b9a43`
- Production Pages Deploy `34537326802` SUCCESS
- Production Live Resource Integrity `34537397229` SUCCESS.

## Build 95 operational boundary

Build 95 — **Product Workspace Current Context & Table Ergonomics** is the active Development closure candidate. It consumes Build 94's exact external closure and continues the visible Products & Inventory usability work without changing Product authority.

The current Product workspace rules are:
- the six focused workspaces remain Products, Editor, Inventory Links, Media, SEO / Publishing and Cleanup / Archive;
- the visible Product-workspace header identifies Release 467 Build 95 instead of historical Build 66;
- Build 94 vertical label/description controls and 3-column desktop, 2-column tablet, 1-column phone layout remain active;
- the one shared Product id/event authority remains unchanged;
- Product table headers stay visible while vertically scrolling;
- System # and Name stay visible as desktop horizontal-scroll identity anchors;
- the Product loaded in the editor is highlighted when its row exists;
- **Locate current Product** is manual only;
- **Essential columns** and **Full columns** are browser-local table views, with existing fine-tune preferences retained;
- Product dashboard summaries reuse the already-loaded browser Product snapshot, with no additional Product API read;
- Build 93 centered-shell, local horizontal scrolling and right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 95 ingests exact Build 94 Development and Production closure. Build 95 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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
