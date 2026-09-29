# Release 467 Build 289 — Real Inventory Adoption Outcomes Renewal

## Purpose

Build 289 re-measures Builds 285–288 against real Development data and closes the owner-requested Inventory editing residual without inventing station assignments.

The Build 287 real Creative Process material → Supply Inventory link remains the real linkage authority. Build 288 proved reviewed-unposted → explicit Inventory post → compensating reversal on that real linkage. Build 289 adds the operator model needed to classify the rest of the real Tool/Supply Inventory correctly.

## Workstation/category model

There is one existing canonical workshop category authority: `inventory_processes`. Build 289 does **not** create a parallel free-text category system.

Every Tool or Supply can be assigned to one existing workshop category such as Laser Engraving & Cutting, 3D Printing, CNC Machining, Resin, Polymer Clay, Candles, Metal & Ring Work, Cricut/Vinyl/HTV, Packaging & Labeling or General Workshop.

A Tool may additionally be marked as:

- **This tool is the workstation** — for machines such as a laser engraver, 3D printer, CNC machine or metal lathe.
- **Associated tool / supply** — for accessories, hand tools, consumables and materials used by a workstation/category.
- An associated item may optionally point to one specific station Tool in the same canonical category.

Migration `0025_release467_inventory_workstation_roles.sql` adds only this role/parent metadata. It creates **zero automatic station classifications**. Owner review remains the source of truth.

## Card/table editor

The Inventory card/table editor now uses the canonical workshop category dropdown, not arbitrary category text. Stock Unit and Usage Unit are dropdowns from the shared unit preset authority. Reorder can be set to **N/A — do not reorder**, which maps to the existing `do_not_reorder` authority and is excluded from low-stock/replenishment signals.

The card editor also accepts the proper Amazon product URL for an existing item and provides **Fill missing from Amazon**. The review-first fetch may fill only facts that are currently missing:

- current CAD price only when Inventory cost is zero/missing;
- package/unit count when Amazon exposes a defensible count;
- item image when missing;
- source URL, supplier, supplier SKU and description when missing.

Existing reviewed cost, images, package conversion and supplier facts are never overwritten by the Amazon fill.

## Migration evidence

Development migration run **36503337920** applied and verified canonical migration 0025:

- active canonical processes: **22**
- required workstation-role columns: **6**
- foreign-key violations: **0**
- automatically created workstation-role rows: **0**
- direct provider rows_read for the bounded verification: **29 / 20,000**

## Exact predecessor

Build 288 is the exact fully verified predecessor:

- Development: `49531694be53b4c8749817c95a4b3b0b28814b90`
- shared Build 288 tree: `8e34e42a970c1aa8aab2325db5f2fab466703400`
- Development proofs: System `36439993698`, Quality `36439993660`, I.T. `36439993643`, Hygiene `36439993798`, Build 288 `36439993633`
- Production main: `10ca103d83a2f0517eb1bbf3aac26cebd5e0e451`
- Production Pages: `36442437962`
- Production Live Resource Integrity: `36442922542`

## Renewal decision

Build 289 must perform one exact-SHA Development read-only remeasurement. When the real Build 287 linkage, Build 288 reversed posting evidence, canonical process authority and current Inventory runtime all remain valid, the measured software residual is closed.

At that point the remaining work is owner data classification — deciding which real tools are station machines and which real items belong to each category/station. That is not a defensible autonomous software build.

The expected terminal state is **AUTONOMOUS_QUEUE_EXHAUSTED** with no successor build unless a new measured software residual is later identified.
