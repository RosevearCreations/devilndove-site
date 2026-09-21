# Release 467 Build 221 — Workshop Knowledge Library Foundation

## Goal

Create a reviewed internal knowledge authority for material × machine/tool × process × observed setting × constraint × outcome relationships without inventing “best settings” or duplicating Inventory, Creative Project, process, or media authorities.

## Exact starting boundary

Build 220 **Production Run, QA, Rework & Scrap Evidence** is exact-SHA Production GREEN.

- Development SHA: `79abf5b94a7080a25b2feb38bb10cfdde9dcf4c2`
- Shared source tree: `b68b2c8efbf187da8c9414eb4a7e5b24405f5029`
- Development System / Quality / I.T. / Hygiene: `35606184887 / 35606184822 / 35606184538 / 35606184707`
- Build 220 Development proof: `35606184585`
- Exact Development URL: `https://760b9a2e.devilndove-site.pages.dev`
- Production main: `4579e9b91c0676d775f32859a0169ec749bf2194`
- Production Pages / Live Resources: `35607469436 / 35607606049`
- Product Browser / Route: `35607606000 / 35607605559`
- Build 220 Production proof: `35607469438`
- Exact Production URL: `https://95102f07.devilndove-site.pages.dev`
- Canonical migrations before this build: 19
- Production business counts: users 2, products 45, Inventory rows 1041, orders 0
- Foreign-key violations: 0

Primary roadmap: `docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md`.

## Implementation

Build 221 adds canonical migration `0020_release467_workshop_knowledge_library_foundation.sql` and six additive knowledge/evidence tables:

- `workshop_knowledge_entries` — scope, observed result, safety/constraint notes, provenance, confidence and review state.
- `workshop_knowledge_entry_processes` — relationships to canonical `inventory_processes`.
- `workshop_knowledge_entry_inventory_refs` — material, machine/tool, fixture/workholding, consumable, finishing and other references to existing Inventory identity.
- `workshop_knowledge_entry_settings` — observed/measured/owner-confirmed values with an explicit evidence note. There is no “best” or recommendation field.
- `workshop_knowledge_entry_evidence_refs` — source-project, operation, production-run and approved-media references stored as references only.
- `workshop_knowledge_entry_events` — draft/review/void history.

Admin API: `/api/admin/workshop-knowledge-library`.

Admin workspace: `/admin/workshop-knowledge/`, linked from the existing Creative Process workspace.

## Existing authorities retained

- `inventory_processes` remains the canonical process identity.
- `site_item_inventory` remains Tool/Supply/material identity and stock authority.
- Creative Project and its ordered operations remain project/operation evidence authority.
- CAIP/Media authorities remain the owners of source and approved media.
- Build 220 remains production-run/QA evidence authority.
- Finance/Accounting remains costing/posting authority.

The Knowledge Library records reviewed relationships and reference pointers only.

## Review rules

- Reviewed entries require a structured process/material/tool relationship and at least one source evidence reference.
- Every observed setting requires its own evidence note.
- Safety or constraint text requires a safety/constraint evidence note.
- Creative/media asset references must already be approved and remain `reference_only`.
- Reviewed/void entries are not rewritten in this foundation workspace.
- Unknown or untested settings remain unknown.

## Non-overlap / safety boundary

- No AI-generated “best settings”.
- No second process taxonomy, Inventory ledger, project engine or media store.
- No raw/private media copy or R2 mutation.
- No Inventory movement, Finance/Accounting posting, payment/provider execution or publication.
- No request-time DDL.
- No Production business-data copy.
- All list/read work is bounded.

## Acceptance

1. Knowledge entries carry provenance, confidence, review status and explicit scope.
2. Material/process/tool relationships use existing canonical identities.
3. Settings are observations with evidence, never invented recommendations.
4. Safety/constraint notes are evidence-backed and reviewable.
5. Media is reference-only and approved before it can support a reviewed knowledge record.
6. Build 220 exact Development and Production closure remains retained.
7. Build 221 source, Development migration/runtime proof, exact Development proof matrix, protected-main promotion and exact Production migration/runtime/resource/browser proofs are GREEN before closure.

## Next

Release 467 Build 222 — **Project-to-Knowledge Promotion & Recipe History** — remains blocked until Build 221 is fully Production GREEN.
