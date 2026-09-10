# I.T. Preflight / Startup Release Guide — Release 467 Current Authority

`current-development-authority.json` is the machine-readable restart pointer.

## Verified Development

Build 93 — Centered Application Shell & Overflow Accessibility is the last fully verified checkpoint:
- `dev` `be70b37f61574ec7a11bbad445ab30d0f280bbf3`
- tree `a68a11663f02bfa496883220aa9d8940da4c3cbc`
- System Gate `34513256032` SUCCESS
- Current Application Quality `34513256105` SUCCESS
- I.T. Admin Runtime Proof `34513256055` SUCCESS
- Repository Branch Hygiene `34513256082` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

## Verified Production

Build 93 is the current Production checkpoint:
- `main` `be70b37f61574ec7a11bbad445ab30d0f280bbf3`
- tree `a68a11663f02bfa496883220aa9d8940da4c3cbc`
- Production Pages Deploy `34513466761` SUCCESS
- Production Live Resource Integrity `34513570740` SUCCESS.

## Build 94 operational boundary

Build 94 — **Product Workspace Readability & Responsive Navigation** is the active Development closure candidate. It consumes Build 93's exact external closure and repairs the visible Products & Inventory workspace-tab readability problem without changing Product authority.

The current Product workspace rules are:
- the six focused workspaces remain Products, Editor, Inventory Links, Media, SEO / Publishing and Cleanup / Archive;
- each workspace control places its primary label above its description;
- primary labels remain whole and readable rather than being squeezed into narrow letter stacks;
- descriptions use the full available control width;
- desktop uses three columns, medium/tablet widths use two, and phone widths use one before text becomes cramped;
- selected-state outline, tab semantics, URL-addressable workspace routing and Arrow Left/Right/Home/End keyboard navigation remain unchanged;
- the one shared Product id/event authority remains unchanged;
- Build 93 centered-shell, local horizontal scrolling and right-side reachability remain in force;
- the presentation layer does not change Product or Inventory business data, H1 hierarchy, provider state or launch authority.

## Restart-integrity protocol

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Build 94 ingests the exact Build 93 Development and Production closure. Build 94 must pass exact merged-`dev` System Gate + Current Application Quality + I.T. Admin Runtime Proof + Repository Branch Hygiene, canonical Development D1/binding proof and exact Preview smoke. Only that exact green tree may be promoted to `main`.

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
