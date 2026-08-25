# Build 355 — Content Studio Read Extraction

## Goal

Remove request-time schema creation from the automatic Content Studio GET while preserving every existing POST mutation path.

## Boundary

`functions/api/_lib/contentStudioReadService.js` is the Content-owned read authority for Content Studio. It performs only schema inspection and SELECT/PRAGMA reads.

It reports:

- `build: 355`
- `legacy_build: 273`
- `contract: content-studio-read`
- `owner: content`
- `schema_ready`
- `missing_tables`
- `missing_columns`
- `optional_tables`
- `request_time_schema_mutation: false`
- `mutation_ownership_moved: false`

The legacy `/api/admin/content-studio` GET now delegates to this read authority and no longer calls `ensureContentAutomationSchema()`.

POST still calls `ensureContentAutomationSchema()` and retains the existing Build 273 mutation behavior. No Content Studio mutation ownership moved in Build 355.
