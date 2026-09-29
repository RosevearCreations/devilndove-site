# Release 467 Build 290 — Inventory Multi-Station Read Integrity & Client-Native Memberships

## Purpose

Build 290 closes the remaining compatibility gap in the many-to-many workstation model introduced around Build 289. The database already has one canonical workshop category per Inventory item and a many-to-many membership table for specific workstation tools. Build 290 makes that model native in the normal Inventory client/read path instead of depending on a request interception shim.

## Authority model

- `inventory_process_assignments` remains the one-primary-category authority.
- `inventory_workstation_roles` identifies Tool rows that are workstation tools.
- `inventory_workstation_memberships` owns zero/one/many specific station-tool links for an associated Tool/Supply.
- The legacy `workstation_site_item_inventory_id` field is retained only as first-membership compatibility data.

No new schema is introduced.

## Read integrity

The normal `/api/admin/site-item-inventory` response collects the bounded page item IDs and performs one set-based membership query for those IDs. The results are merged by Inventory identity, returning:

- `workstation_site_item_inventory_ids`
- `workstation_item_names`
- compatibility first membership fields

The page therefore does not issue one workstation-membership query per card.

## Client-native membership payload

The primary Inventory client now reads checked station memberships directly from the multi-station checklist and includes the complete `workstation_site_item_inventory_ids` array in ordinary POST/PATCH payloads. The compatibility helper no longer overrides `window.fetch`.

The helper remains temporarily responsible for rendering the checklist over the existing single-select markup so Build 293 can later consolidate the UI/CSS without coupling that larger refactor to Build 290 data integrity.

## Regression

A deterministic Forge-like regression creates three workstation tools in one category and one associated Tool linked to all three. The same set-based membership read must return all three IDs and all three names without duplicates.

## D1 budget

The exact Development workflow runs a bounded read-only D1 measurement over a 40-item Inventory page and its membership rows. Acceptance requires:

- provider `rows_read <= 5,000`
- foreign-key violations = 0
- invalid membership rows = 0

No Production business-data query is used for Development acceptance.

## Next

After Build 290 is Production GREEN, the queue remains open.

**Next: Build 291 — Public Runtime Reliability & Broken-Surface Closure.**
