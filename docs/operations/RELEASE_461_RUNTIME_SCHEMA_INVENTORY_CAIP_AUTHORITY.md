# Release 461 — Runtime Schema Convergence, Inventory & CAIP Production Pipeline

Release 461 is the current Development release for `devilndove-site-dev`.

## Boundary

- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development R2 remains the only data/storage target for acceptance.
- Separate live Production `main` / `devilndove-site` remains untouched.
- Provider live authorization, execution, and publication remain closed.
- Request-time DDL is forbidden.
- Historical migration replay is forbidden.

## Release 461 scope

Release 461 converges request-time schema ownership into explicit forward/additive migrations and completes the current operational queue:

1. Inventory purchase-package/base-unit correctness.
2. Inventory desktop/mobile usability acceptance.
3. Product primary-image quality acceptance.
4. CAIP private ingest context.
5. Multicamera recognition and synchronization planning.
6. Footage-quality review.
7. Reversible reject/deferred-purge lifecycle.
8. Semantic evidence attached to source-backed temporal ranges.
9. Story Builder from reviewed CAIP evidence and story segments.
10. Reviewed edit/timeline generation with provider execution closed.
11. Reviewed CAIP → Content Studio publishing handoff.
12. Release authority/source-gate/D1 acceptance convergence.

## Inventory authority

Purchase packaging remains the receiving and purchase-cost authority. `site_inventory_base_balances` is the canonical usable/base-unit stock read authority. Compatibility triggers keep mature legacy writers synchronized while migration away from package-count writers continues. UI labels explicitly distinguish purchase units from usable/base units.

## Product image acceptance

The primary image acceptance contract is explicit and reviewable:

- loadable public image;
- at least 1200×1200 pixels;
- at least 12 meaningful alt-text characters;
- server-computed quality score of at least 70.

The media-role and quality-review schema is migration-owned; the request route contains no runtime DDL.

## CAIP pipeline

Existing private CAIP R2 intake and immutable raw-media registration remain canonical. Release 461 adds orchestration/review metadata only: capture context, synchronization groups/tracks, footage quality, reversible lifecycle states, semantic annotations, story drafts, and edit-plan drafts. No Release 461 pipeline action deletes a raw R2 object or invokes a publishing/render provider.

The established reviewed-evidence handoff remains authoritative. Release 461 adds story/timeline/quality/semantic/lifecycle state to the prepared handoff package while preserving reference-only transfer.

## D1 acceptance state

Release 461 contains forward/additive Development migrations. Until read-only acceptance proves convergence and the explicit Development apply is completed, `development-release.json` must continue to report D1 as verified through Release 460 with Release 461 migration required.

Never mark Release 461 D1 green merely because source gates pass. D1 becomes green only after the Release 461 acceptance workflow verifies the exact Development database and all Release 461-owned tables/indexes/constraints with clean foreign keys.

## Green definition

Release 461 is green only when all of the following agree on one exact `dev` SHA:

- Release 461 aggregate source gate: green;
- canonical System Gate: green;
- Development D1 Release 461 acceptance: converged and green, or explicitly proven already converged with no apply needed;
- Development Pages deployment/check: green;
- provider/publication/live-Production boundaries remain closed;
- canonical release documentation reflects the same state.
