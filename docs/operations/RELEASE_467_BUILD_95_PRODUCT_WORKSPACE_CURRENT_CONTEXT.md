# Release 467 Build 95 — Product Workspace Current Context & Table Ergonomics

## Purpose

Build 95 continues the Products & Inventory usability work after Build 94 made the six workspace controls readable. Build 94 is the externally proven starting checkpoint at SHA `bcafa7bbfbf17793d4b6280195c44c435ff3c68e`, tree `f83d850b2b28ef4840463439a8b449ebbe1b9a43`, with System Gate `34537169571`, Current Application Quality `34537169401`, I.T. Admin Runtime Proof `34537169400`, Repository Branch Hygiene `34537169580`, Production Pages Deploy `34537326802`, and Production Live Resource Integrity `34537397229` all successful.

## Product workspace current context

The Product workspace organizer is still the presentation layer introduced by Build 66, but it now identifies the current Release 467 Build 95 operator surface rather than showing the historical Build 66 label. Products, Editor, Inventory Links, Media, SEO / Publishing, and Cleanup / Archive continue to share one Product id/event authority. URL-addressable workspace routing, selected-tab semantics, and Arrow Left/Right/Home/End keyboard navigation remain unchanged.

When no Product is selected, the authority panel tells the operator to choose or open a Product. When a Product is loaded, its Product number/name remain visible as the shared context across all workspaces.

## Product table ergonomics

The complete records table remains deliberately wide because it carries System #, Name, Slug, SKU, Type, Status, Price, Inventory, Shipping, Tax, and Actions. Build 95 improves navigation through that width without discarding fields:

- the table header is sticky during vertical scrolling;
- System # and Name are sticky identity columns on desktop horizontal scrolling;
- the Product currently loaded into the editor is highlighted when its row is rendered;
- **Locate current Product** is enabled only when that row exists and scrolls to it only after an explicit operator action;
- **Essential columns** hides secondary Slug, SKU, Shipping, and Tax columns and compacts Inventory detail;
- **Full columns** restores every optional column;
- existing fine-grained browser-local column preferences remain available;
- no Product data is mutated by any table-view preference.

Dashboard summaries continue to consume `dd_admin_products_snapshot_v2`, the Product list snapshot already loaded by the primary Product page. There is **no additional Product API** or database read for these table-dashboard summaries.

## Responsive and accessibility boundaries

Build 94 remains authoritative for readable Product workspace navigation: three columns on desktop, two at tablet/medium widths, and one on phones, with the label above its description. Build 93 remains authoritative for centered application shells, local horizontal scrolling, keyboard-reachable wide data, and right-side content reachability.

The Product table identity columns are sticky only at desktop widths. Smaller screens retain normal contained horizontal scrolling rather than sacrificing viewport space to fixed columns. Current-row highlighting is supplemental; Product identity remains available in text and controls.

## Release and data safety

This is a presentation/runtime usability build. It adds no D1 schema change, no request-time DDL, no Product or Inventory business-data migration, no R2 mutation, no provider execution, no provider publication, no Cloudflare Access mutation, and no automatic Production promotion. Canonical D1 migrations remain exactly `0001`–`0004`.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.

## Closure protocol

Build 95 is a closure candidate and may not self-record its later exact-head workflow proof. The exact merged `dev` SHA must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/read-only/bindings proof, exact Preview deployment and smoke. Only that exact tree may be fast-forwarded to `main`. Production must then independently pass the normal business-data-preserving Pages deployment chain and Production Live Resource Integrity proof. Build 96 will ingest that final external evidence.
