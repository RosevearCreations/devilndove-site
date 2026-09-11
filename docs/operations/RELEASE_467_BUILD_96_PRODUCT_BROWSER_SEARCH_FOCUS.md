# Release 467 Build 96 — Product Browser Search & Focus Filters

## Purpose

Build 96 continues the Products & Inventory usability sequence after Build 95. Build 95 is the externally proven Development and Production starting checkpoint at SHA `746eb697484aaa7d2506b9025873510c4586c48a`, tree `be7f10517a6a0b247d387436d8414f5d22480e32`, with System Gate `34545373706`, Current Application Quality `34545373640`, I.T. Admin Runtime Proof `34545373627`, Repository Branch Hygiene `34545373651`, Production Pages Deploy `34545520443`, and Production Live Resource Integrity `34545592072` successful.

## Product browser controls

The Products page already loads its Product list through the primary Product authority and saves the shared browser snapshot `dd_admin_products_snapshot_v2`. Build 96 reuses that same loaded list and snapshot to add browser-local navigation rather than making another Product request.

The Product browser now provides:

- text search across loaded Product identity and workflow text, including Product/System number, name, slug, SKU, type/category, status, review status and colour;
- **All products** focus;
- **Needs attention** focus for drafts, low-stock records, missing lead images, or records marked `needs_changes`;
- **Drafts** focus;
- **Low stock** focus;
- **Missing lead image** focus;
- live focus counts from the shared Product snapshot;
- a visible `shown / rendered` result count;
- **Clear search & filters** to restore the full rendered Product list;
- browser-local persistence only; no Product field is changed by a search or focus choice.

## Current Product interaction

Build 95's current Product context remains authoritative. If an active search/focus view hides the Product currently loaded in the editor, the context panel explicitly says that the row is hidden and the existing locate control becomes **Show current Product**. Only an explicit click clears the browser filters and moves to that Product row. No automatic scrolling or Product switching was introduced.

## Retained usability and accessibility

Build 95 remains authoritative for the sticky Product table header, desktop System # / Name identity anchors, current-row highlighting, Essential / Full column presets and fine-grained browser-local column choices. Build 94 remains authoritative for the readable 3/2/1 Product workspace navigation. Build 93 remains authoritative for centered shells, contained horizontal scrolling and right-side reachability.

Quick-focus buttons expose `aria-pressed` state, search uses a labelled native search field, status/count changes use a polite live region, and phone layouts stack focus controls vertically rather than forcing another horizontal control strip.

## Release and data safety

Build 96 adds no D1 schema change, request-time DDL, Product or Inventory business-data migration, R2 mutation, provider execution, provider publication, Cloudflare Access mutation, or automatic Production promotion. Canonical D1 migrations remain exactly `0001`–`0004`.

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative; U.S. sales/shipping remain disabled and local pickup remains supported.

## Closure protocol

Build 96 is a closure candidate and may not self-record its later exact-head workflow proof. The exact merged `dev` SHA must independently pass System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/read-only/bindings proof, exact Preview deployment and smoke. Only that exact tree may be promoted to `main`. Production must then independently pass the normal business-data-preserving Pages deployment chain and Production Live Resource Integrity proof. Build 97 will ingest that final external Build 96 evidence.
