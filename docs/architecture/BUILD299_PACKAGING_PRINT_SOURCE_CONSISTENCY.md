# Build 299 — Packaging Print Source Consistency

## Why this build exists

Build 298 proved that normal Packaging reads and writes use the native client. During Development use, a separate print/version defect became visible: saving project details refreshed the live project correctly, but the Print Test tab defaulted its `Version tested` selector to the newest historical review version. At the same time, the optimized-sheet button ignored that selector and rendered the live project draft.

That produced an internally inconsistent UI: the screen could appear to say “Version N” while the generated sheet actually came from the current draft.

## Build 299 decision

Build 299 keeps two concepts explicit:

1. **Project draft** — current editable Packaging data. A normal **Save project** updates this source.
2. **Saved review version** — an immutable historical snapshot created only by **Save review version**.

Saving the project does not silently rewrite a saved review version.

## Browser behavior

`public/js/admin-packaging-print-source-v299.js` is loaded after the proven Build 298 mature editor.

It changes only print-source behavior:

- every newly rendered Print Test tab defaults to **Project draft**;
- Project draft printing continues through the existing mature-editor optimized-sheet handler unchanged;
- if the user explicitly selects a saved review version, Build 299 intercepts only that print click and prints the version's stored SVG artifact;
- the Print Test selector is relabeled **Print source / evidence version** and explains whether the current source is the Project draft or an immutable saved version.

The controller does not name or call the retired `/api/admin/packaging-studio` endpoint.

## Exact saved-version artifact read

`functions/api/admin/packaging-version-artifact.js` is a narrow authenticated GET endpoint:

```text
GET /api/admin/packaging-version-artifact
  ?packaging_project_id=<project>
  &packaging_project_version_id=<version>
```

It returns exactly one `packaging_project_versions.svg_markup` artifact only when the version belongs to the requested project. Normal Packaging bootstrap remains unchanged and does not carry every historical SVG, avoiding unnecessary payload growth.

The endpoint is read-only and does not change version history, project data, schema, inventory, Catalog, Content, R2, bindings, or Production.

## Preserved boundaries

Build 299 deliberately does **not** change:

- `public/js/admin-packaging-studio.js` Build 298 mature editor;
- `public/js/admin-packaging-native-client-v298.js` or its module;
- Build 297 outer compatibility defense layers;
- Build 290 Packaging runtime;
- Build 288 GET retirement guard;
- Build 289 compatibility write bridge;
- Build 293 `/api/admin/packaging-bootstrap` read authority;
- Build 292 `/api/admin/packaging-write` gateway;
- Build 291 Packaging domain service;
- Build 294 legacy GET/POST tombstone endpoint;
- SQL/schema;
- Cloudflare bindings/config;
- R2 configuration;
- real Devil n Dove Production.

The previously staged browser-compatibility-retirement candidate was removed from the current tree before Build 299 activation and is deferred to a later build after this print behavior is independently proven.

## Expected user workflow

### Update the current label

1. Edit Packaging fields.
2. Click **Save project**.
3. Open **Print Test**.
4. `Print source / evidence version` should show **Project draft**.
5. Print the optimized sheet. It should reflect the current draft/current saved project details.

### Print an older review artifact

1. Open **Print Test**.
2. Explicitly choose Version 1/2/etc.
3. Click **Print optimized 8.5 × 11 sheet**.
4. Build 299 loads that exact stored SVG and prints it without modifying the version.

## Next build

Only after Build 299 has live Development parity should the browser-compatibility retirement audit resume. That work must remain separate from this functional print correction.
