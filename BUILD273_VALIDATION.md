# Build 273 Validation

## Scope

Gray Hair / standalone-social acceptance path plus Creative Process Inventory usability, Automatic Output Blueprint clarity, Content Studio package bridge, CAIP authority preservation, responsive CSS, SEO restraint and Markdown authority consolidation.

## Regression results

Passed:

- Build 241 CAIP private media / immutability / processing-plan boundary
- Build 265 upload diagnostics / productless routing
- Build 266 dedupe / refund compatibility
- Build 267 registration reconciliation / duplicate cleanup safety
- Build 268 full-schema CAIP compatibility
- Build 269 strong dedupe / multipart completion integrity
- Build 270 failed-recovery presentation
- Build 271 operator clarity / full derivative access
- Build 272 intake readiness guard
- Build 273 Creative Process / CAIP / Content Studio workflow consolidation

All touched JavaScript files pass `node --check`.

## Database safety

Build 273 adds no D1 tables/columns/indexes and requires no migration.

Fresh executions of:

- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`

all return **0** rows from `PRAGMA foreign_key_check`.

## Gray Hair acceptance behavior

- Content Studio lists the existing Creative Process project separately from finished Products and existing packages.
- `?creative_project_id=6` is treated as a Creative Process project request and resolves its package if present.
- Creating/refreshing the standalone package uses the existing Creative Process project; it does not create a second Creative Project.
- The Content Studio package attaches to the existing CAIP row with source identity `creative_work_project`.
- Existing private CAIP assets become reference-only Content Studio archive rows. They are not copied into another raw R2 object and a missing public URL is valid.
- A draft package may exist before timeline evidence is selected. Evidence/story approval and public release remain separate gates.

## Creative Process acceptance behavior

- Direct project Inventory usage has a typable search box.
- Reviewed timeline material posting has a typable search box.
- Search does not alter Inventory authority, stock conversions or reversal rules.
- Automatic Output Blueprint explains that it is a destination/status dashboard rather than a renderer.
- It reports CAIP asset/probe/evidence/story/derivative counts and Content Studio deliverables, with a connected-feed explanation on every output row.

## SEO / public-content restraint

A static scan of 56 non-admin HTML files found **0 pages with multiple H1 elements and 0 pages with no H1**.

Standalone/social Content Studio templates were changed to project-journal/evidence-first wording. They do not invent a sellable Product and they do not generate a default Google Business Profile photo pack merely because the Devil n Dove brand is in Southern Ontario.

Current external workflow direction was sanity-checked against Google Search guidance on concise/descriptive titles, people-first evidence and descriptive image context; Frame.io review/timecode/metadata patterns; and Canva content-planning/scheduling/analytics patterns. Those patterns inform the next CAIP wave, not claims that those external platforms are integrated.

## Markdown sanity

Only these two files are mutable current authorities:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

`MARKDOWN_INDEX.md` now explicitly classifies Build records as release evidence, CAIP docs as specialist references and old roadmap/status filenames as compatibility pointers. Historical files are retained rather than physically deleted so old links/tests remain stable.

## Still intentionally not implemented

- video player with in/out timecode evidence markers;
- verified proxy/frame/audio/transcript provider execution;
- transcript-linked story generation;
- automatic derivative rendering;
- automatic publication;
- automatic physical deletion of duplicate raw R2 media.
