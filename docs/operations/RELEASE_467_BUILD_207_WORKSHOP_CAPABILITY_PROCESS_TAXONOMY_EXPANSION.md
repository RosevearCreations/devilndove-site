# Release 467 Build 207 — Workshop Capability & Process Taxonomy Expansion

## Goal

Extend the existing Build 156 workshop-process authority to represent the real manufacturing breadth of Devil n Dove without creating a second process dictionary.

## Starting boundary

Build 206 is exact-SHA Production GREEN.

- Development closure SHA: `ee62ddd837d2ecbb8f0695fa7efb19e9dffb8b98`
- Production main SHA: `16689f6eb5982bb72253aba677cfadf636c89ec9`
- Shared tree: `4c71f152a75c401d3dfd2a5b83852a821dc82cb3`
- Development proofs: System `35486635313`, Quality `35486635381`, I.T. `35486635362`, Hygiene `35486635293`, Build 206 `35486635345`
- Production proofs: Build 206 `35486756132`, Pages `35486756097`, Live Resources `35486808590`, Products Browser `35486808652`, Products Route `35486808582`

Primary roadmap: `docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md`.

## Implementation

Build 207 extends the canonical `inventory_processes` table created by Build 156 through forward-only migration `0008_release467_workshop_process_taxonomy.sql`.

It preserves all existing process keys and reviewed `inventory_process_assignments`. The migration normalizes the existing laser label to **Laser Engraving & Cutting**, keeps existing Build 156 identities compatible, and adds the missing workshop disciplines. No Tool/Supply item is assigned automatically.

The existing `/api/admin/inventory-process-assignments` route remains the assignment authority and reports `taxonomy_build: 207`. Inventory Operations remains the owner surface.

## Canonical process coverage

At minimum:

- laser engraving/cutting
- 3D printing
- CNC machining
- resin
- polymer clay
- candles
- soap/bath-body
- metal/ring work
- wire wrapping
- paracord
- lapidary
- soldering
- forging/heat work
- metal lathe
- Cricut/vinyl/HTV
- apparel/hat finishing
- drinkware personalization
- packaging/labeling
- mechanical/automotive fabrication
- photography/content
- mixed-media/hybrid
- general workshop

## Non-overlap / safety boundary

- No parallel process dictionary or free-text taxonomy.
- No automatic assignment of existing Tools/Supplies.
- No Product, Inventory quantity/cost, Creative Project, Custom Request, Packaging, Media/CAIP or Finance ownership change.
- No request-time DDL.
- No R2/provider/payment/publication execution.
- Mechanical capability is workshop fabrication taxonomy, not a general automotive-repair service promise.

## Acceptance

1. Canonical migration 0008 is applied exactly once and foreign keys remain clean.
2. All 22 required canonical process keys are active.
3. Existing Build 156 process keys remain compatible.
4. Existing assignment authority still enforces one reviewed primary process per Tool/Supply.
5. Migration 0008 contains no write to `inventory_process_assignments`.
6. Inventory Operations retains exactly one H1 and exposes the Build 207 taxonomy note.
7. Build 208 remains blocked until Build 207 is exact-SHA Production GREEN.
