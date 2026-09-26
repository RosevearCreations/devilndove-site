# Release 467 Build 271 — Standalone / Social CAIP Project Workflow

## Purpose

Build 271 lets an existing **Creative Process** project open or refresh one CAIP workspace even when there is no physical Product and no Content Studio package.

The Creative Process record remains the project identity. CAIP becomes the private-media, evidence, story and derivative-planning workspace for that identity. Content Studio remains optional until a reviewed deliverable/social package is actually wanted.

## Exact predecessor

Build 270 is the exact source predecessor.

- Development SHA: `b51e15f9c150e1d740fe1383d8df98a962990b21`
- Production main SHA: `9c3ed0664d71ab66a3087047b35989c5ed5b6904`
- shared tree: `9dc39ed9dde4946ad54e51b58c7b66ca38b75634`
- Development proofs: System `36206690243`, Quality `36206690338`, I.T. `36206690036`, Hygiene `36206690296`, Build 270 `36206690389`
- Production proofs: Pages `36206849648`, Live Resources `36206908948`, Product Browser `36206908972`, Product Route `36206908996`, Build 270 `36206849597`

## Identity rule

The idempotent mapping is:

`creative_projects.source_type = 'creative_work_project'`

`creative_projects.source_id = creative_work_projects.creative_work_project_id`

The existing unique `(source_type, source_id)` authority prevents a second CAIP project for the same Creative Process identity.

Opening the workflow again refreshes the Creative Process snapshot and policy profile. It preserves any existing Content Studio link and review/lifecycle state.

## Productless/social projects

A Product is optional.

Build 271 does not insert a Product, does not invent a catalog item and does not require `product_id`.

A Content Studio package is also optional. Build 271 does not create one. Build 273 remains the dedicated Content Studio bridge.

The CAIP operator can therefore:

1. choose an existing non-archived Creative Process project;
2. open or create its single CAIP workspace;
3. intake private raw media through the existing duplicate-safe flow;
4. review assets, rights, evidence and story structure;
5. create optional immutable derivative plans;
6. later hand reviewed material to Content Studio without changing project identity.

## Derivative-plan access

All derivative plans remain reachable in one bounded scroll region. Planned items sort before already-approved plans. Build 271 does not clip the list to six rows and does not require a derivative plan for every source asset.

## Authority separation

- Creative Process owns project purpose, manufacturing/process events, planned/actual materials and project lessons.
- CAIP owns private raw media, source identity, evidence/story review and derivative plans.
- Content Studio owns reviewed deliverable/social packages.
- Release Board/provider adapters own explicit publication approval and provider status.

No stage may fabricate another stage's authority.

## Safety boundary

Build 271 performs no schema migration, automatic project creation, Product creation, Content Studio package creation, Inventory movement, Finance posting, R2 deletion, public copy, provider execution or publication.

The only new mutation is the explicit administrator-triggered identity mapping/refresh in `creative_projects`. Existing private binaries are unchanged.

Canada/CAD commerce and the U.S. shipping pause remain unchanged.

## Closure target

`STANDALONE_SOCIAL_CAIP_IDENTITY_READY_REVIEW_FIRST`

## Next bounded release

The future queue **has not run out**.

Next: **Build 272 — Upload Prerequisite & Operator Readiness**.
