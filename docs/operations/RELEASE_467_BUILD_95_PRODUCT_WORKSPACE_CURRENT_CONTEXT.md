# Release 467 Build 95 — Product Workspace Current Context & Table Ergonomics

## Final closure

Build 95 is externally proven **Development GREEN and Production GREEN** at exact SHA `746eb697484aaa7d2506b9025873510c4586c48a`, tree `be7f10517a6a0b247d387436d8414f5d22480e32`.

Development proof:
- System Gate `34545373706` SUCCESS
- Current Application Quality `34545373640` SUCCESS
- I.T. Admin Runtime Proof `34545373627` SUCCESS
- Repository Branch Hygiene `34545373651` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, Preview bindings, non-secret smoke and regression evidence: SUCCESS.

Production proof:
- Production Pages Deploy `34545520443` SUCCESS
- Production Live Resource Integrity `34545592072` SUCCESS.

Build 96 ingests this exact closure as its restart baseline.

## Product workspace current context

The Product workspace organizer is still the presentation layer introduced by Build 66, but Build 95 moved the visible operator identity to Release 467 Build 95. Products, Editor, Inventory Links, Media, SEO / Publishing, and Cleanup / Archive share one Product id/event authority. URL-addressable workspace routing, selected-tab semantics, and Arrow Left/Right/Home/End keyboard navigation remain intact.

When no Product is selected, the authority panel tells the operator to choose or open a Product. When a Product is loaded, its Product number/name remain visible as the shared context across all workspaces.

## Product table ergonomics

The complete records table remains deliberately wide because it carries System #, Name, Slug, SKU, Type, Status, Price, Inventory, Shipping, Tax, and Actions. Build 95 added:

- a sticky table header during vertical scrolling;
- sticky System # and Name identity columns during desktop horizontal scrolling;
- highlighting for the Product currently loaded into the editor;
- explicit **Locate current Product** navigation;
- **Essential columns** and **Full columns** browser-local presentation presets;
- retained fine-grained browser-local column preferences.

Dashboard summaries consume `dd_admin_products_snapshot_v2`, the Product list snapshot already loaded by the primary Product page. Build 95 adds **no additional Product API** or database read for those summaries.

## Retained boundaries

Build 94 remains authoritative for readable Product workspace navigation: three columns on desktop, two at tablet/medium widths, and one on phones. Build 93 remains authoritative for centered application shells, local horizontal scrolling, keyboard-reachable wide data, and right-side content reachability.

Build 95 added no D1 schema change, request-time DDL, Product or Inventory business-data migration, R2 mutation, provider execution, provider publication, Cloudflare Access mutation, or automatic Production promotion. Canonical D1 migrations remain exactly `0001`–`0004`.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.
