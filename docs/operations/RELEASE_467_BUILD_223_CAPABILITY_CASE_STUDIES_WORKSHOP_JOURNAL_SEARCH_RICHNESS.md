# Release 467 Build 223 — Capability Case Studies, Workshop Journal & Search Richness

## Exact predecessor
Build 222 is fully GREEN. Development `a9fd2f4e10f8bf68d3fe9b40c82ced112cf91bb1`, Production `e55cff067fda9a1c949e93db8ea2ea3e5f8d366f`, shared tree `255d08bc787f7eb785119ceaffa61d6aa5eeefed`.

Build 222 Development proofs: System `35624331277`, Quality `35624331446`, I.T. `35624331471`, Hygiene `35624331702`, Build 222 `35624331629`. Production proofs: Pages `35624807963`, Live Resources `35624977882`, Product Browser `35624977818`, Product Route `35624977830`, Build 222 `35624807852`.

## Outcome
Build 223 makes already-published project evidence easier to discover as capability examples, hybrid-project case studies, prototype-to-finished stories, reviewed process examples and Workshop Journal entries.

It does **not** introduce another publication engine. The only public story source is the existing `content_publications` authority through `publicContentPublications()`, which already restricts output to `content_status='published'`.

The new `/case-studies/` hub enriches those published stories with safe relationships to existing:
- `workshop_capability_profiles`;
- `inventory_processes` through Creative Project operations;
- manufacturing lifecycle stage;
- reviewed production-run presence;
- existing Product and Custom Work routes.

## Evidence-derived classification
- Hybrid project: at least two distinct canonical process identities are linked to the source Creative Project.
- Prototype → finished: the existing manufacturing lifecycle has reached a reviewed post-prototype stage.
- Process/technique example: exact canonical process evidence exists.
- Before/after: only when the already-published public copy explicitly contains that concept.
- Capability example: public reviewed capability profile process keys match the exact source-project process evidence.
- Missing classifications stay missing; no generated inference is persisted.

## Publication and privacy boundaries
- No schema migration; canonical D1 remains `0001–0021`.
- No D1 business-data writes.
- No R2 reads/listing are added.
- No private/raw CAIP tables or assets are queried.
- No automatic publication, Content Studio creation, media promotion or provider execution.
- Existing Content Studio, Media/CAIP review and Content Release Board remain owners.
- Public links resolve only to already-published Workshop Journal stories, reviewed capability profiles, existing Product paths and Custom Work.

## Search richness
The indexable static `/case-studies/` hub is added to the sitemap and Workshop navigation. Capability pages and Workshop Journal cross-link to the hub. Query-selected story templates remain outside the sitemap and retain the existing dynamic published-story canonical behavior.

## Next build
Build 224 — **Manufacturing-Era Closure & Next Roadmap** starts only after Build 223 is exact-SHA Production GREEN. Build 224 must measure current evidence before defining any Build 225+ scope.
