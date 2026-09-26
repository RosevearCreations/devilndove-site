# Release 467 Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle

## Purpose

Build 274 makes the Creative Process material lifecycle explicit across maker and content-only work: planned material estimates are planning evidence only; reviewed actuals are not Inventory movement until explicitly posted; posted actuals are preserved and corrected only through compensating Inventory authority.

## Exact predecessor

- Development SHA: `4d415840158ee83d60eb19346520446cd158e657`
- Production main SHA: `3c593eee38c7a05d2a5ad4df4a6b274e2275f492`
- identical tree: `41db192daa04f81ca0bb2ec59ac290a7d4fc8bfb`
- Development proofs: System `36210339968`, Quality `36210340842`, I.T. `36210339975`, Hygiene `36210339599`, Build 273 `36210339832`
- Production proofs: Pages `36210476372`, Live Resources `36210520305`, Product Browser `36210520286`, Product Route `36210520259`, Build 273 `36210476306`

## Material lifecycle

1. **Planned estimate** — `creative_work_events.material_*` fields capture expected material, quantity, unit and cost. They are editable while no active Inventory post exists and they do not change stock.
2. **Reviewed actual, not posted** — an approved `creative_project_material_reviews` row records what was actually used or reviewed, but stock is unchanged until explicit Inventory posting.
3. **Posted actual** — the Inventory-owned `inventory-post` contract records `creative_project_inventory_posts`, detailed usage evidence and Inventory movement. Posted material details cannot be directly rewritten.
4. **Corrected actual** — the Inventory-owned `inventory-reverse` contract compensates the original post, the original timeline event is voided and preserved, then a new corrected event/review/post is created.
5. **Voided posted entry** — the same Inventory-owned compensating reversal occurs before the timeline entry is marked voided. History and evidence provenance remain available.

The lifecycle applies to maker, content-only, education, research and archive projects. A content-only project is not required to fabricate a Product merely to record planning or actual material evidence.

## Operator clarity

The Creative Process UI labels material entries as `Planned estimate — inventory unchanged`, `Reviewed actual — not posted`, or `Actual inventory posted`. Voided/corrected history remains visible separately.

## Safety

Build 274 adds no schema migration and no request-time DDL. It does not automatically move Inventory, directly rewrite stock, delete usage history, post Finance entries, publish Products/content, execute providers, copy public media, delete private R2 objects, or mutate Production business data during release.

Inventory remains movement authority. Finance/Accounting remains posting authority.

## Closure classification

`PLANNED_ESTIMATES_SEPARATE_FROM_REVIEWED_AND_POSTED_ACTUALS`

## Next bounded release

The queue **has not run out**.

Next: **Build 275 — CAIP Production Acceptance & Outcomes Renewal**.
