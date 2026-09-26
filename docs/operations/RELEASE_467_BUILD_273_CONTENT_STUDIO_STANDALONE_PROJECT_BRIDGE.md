# Release 467 Build 273 — Content Studio Standalone-Project Bridge

## Purpose

Build 273 connects one existing Creative Process project and its one existing CAIP workspace to one Content Studio package. A missing Content Studio package may be created; a missing or ambiguous Creative Process/CAIP identity may not be invented here.

## Exact predecessor

- Development SHA: `7cf4f6858c664a444499245a6b878491dceecb5f`
- Production main SHA: `e490a5a12f30d9046dda2a6e9ea9ee73ee33b48f`
- identical tree: `875f5cf60dd1118036f6bf5a18c0748e6e9b8d71`
- Development proofs: System `36209187858`, Quality `36209187822`, I.T. `36209187867`, Hygiene `36209187908`, Build 272 `36209187949`
- Production proofs: Pages `36209298966`, Live Resources `36209339128`, Product Browser `36209339067`, Product Route `36209339102`, Build 272 `36209299044`

## Identity contract

The authoritative identity is `creative_work_project:{creative_work_project_id}`. Content Studio requires exactly one non-archived CAIP workspace with `source_type='creative_work_project'` and the same `source_id`.

If no CAIP workspace exists, the bridge fails closed. If more than one matching CAIP workspace exists, it fails closed. If the CAIP workspace already points to a different Content Studio package, it fails closed. Build 273 does not create a replacement Creative Process project or CAIP workspace.

`content_projects` remains idempotent on its existing unique `(source_type, source_id)` identity. A missing package is created only as a Content Studio package with `source_type='creative_project'` and `source_id=creative_work_project_id`. Refresh reuses that same package.

## CAIP media and handoff

CAIP source media is read by the exact existing `creative_project_id`. Content Studio keeps source references review-first and does not move or delete private originals. The Creative Process handoff row is updated in place when the same package already exists.

The operator UI shows whether CAIP is ready, missing, or ambiguous and disables package creation until exactly one CAIP workspace exists.

## Safety

Build 273 adds no schema migration and no request-time schema repair. It creates no Creative Process project, CAIP project, Product, fake Product, public-media copy, provider execution/publication, Inventory movement, Finance posting, or automatic publication. No uncertain private R2 object is deleted.

Canada/CAD commerce and the U.S. shipping pause remain unchanged.

## Closure classification

`EXISTING_CREATIVE_PROCESS_CAIP_IDENTITY_TO_SINGLE_CONTENT_STUDIO_PACKAGE`

## Next bounded release

The queue **has not run out**.

Next: **Build 274 — Creative Process Planned-vs-Actual Inventory Lifecycle**.
