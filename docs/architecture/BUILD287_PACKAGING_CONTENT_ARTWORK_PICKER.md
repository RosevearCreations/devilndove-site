# Build 287 — Packaging Content Artwork Picker

## Purpose

Build 287 is the first visible Packaging UI feature supplied through the modular `content-media` contract. It does not rewrite the legacy Packaging Studio editor. Instead, a thin Packaging runtime composition layer mounts a Content-owned artwork picker beside the existing advanced `packagingArtworkAsset` field after the Packaging module has passed verified-admin and route activation.

## Boundary

The proven Build 286 `public/js/modules/packaging/index.mjs` remains the data/API compatibility bridge. Build 287 adds:

- `public/js/modules/packaging/runtime.mjs` — current Packaging runtime entry that delegates to Build 286 and composes new UI behavior.
- `public/js/modules/packaging/artwork-picker.mjs` — DOM adapter and pure artwork-model helpers.
- module routing/version updates to load Build 287.

No Packaging Function, Content Function, D1 schema, binding, or legacy Packaging UI file is changed.

## Data flow

```text
verified Packaging runtime
        ↓
Build 286 narrow bootstrap + owner contracts
        ↓
content-media (media_type=artwork)
        ↓
Build 287 artwork picker
        ↓ explicit Use selected artwork
existing packagingArtworkAsset draft field
        ↓ existing Packaging save/write behavior
```

The picker never writes to Content. It consumes the Content-owned contract and copies only a stable public URL into the existing Packaging draft field.

## Stable URL behavior

The Content contract adds a cache-busting `v=` query parameter to returned public URLs. Build 287 previews the versioned URL but removes only the `v` parameter before copying the URL into Packaging. This keeps Packaging drafts stable while allowing the preview to display the current managed asset version.

## Empty state

A zero-row result is valid. Build 287 displays that no assets are currently classified as Content `artwork`, keeps the manual path editable, and provides a link to Media & Content Studio. It does not broaden the contract to unrelated photos and does not invent placeholder records.

## Refresh behavior

`Refresh Content artwork` performs one explicit `content-media` contract read while Packaging is active. There is no interval, recurring timer, R2 enumeration, or background polling.

## Write behavior

Build 287 does not intercept Packaging POSTs. Existing save/version/template behavior remains authoritative. Selecting managed artwork changes only the current draft field and requires the normal Packaging save action to persist it.

## Runtime composition and rollback

Build 287 deliberately wraps rather than edits the proven Build 286 Packaging module. The wrapper delegates Build 286 load/activate/deactivate and contract reads, then layers the picker lifecycle on top. If the picker layer is removed from module routing, the Build 286 bridge remains an intact compatibility/data boundary.

## Historical regression hygiene

The Build 286 regression originally compared Build 285 to future `HEAD`. Build 287 changes only that historical test so its changed-file audit ends at final Build 286 commit `9a4dde6b974e0a4885b4fb91fa83e4cb6c666f20`. This prevents later builds from causing false Build 286 boundary failures and does not change any Build 286 runtime file.

## Deferred decision

Build 287 does not add a persistent `content_media_asset_id` to Packaging data. If durable media-ID provenance is desired, it should be introduced later as an explicit Packaging/Content contract and schema decision with migration and compatibility handling.

## Safety

- Production remains frozen at Build 280.
- No Production resource is contacted or modified.
- No D1 migration or SQL change.
- No Cloudflare binding/config change.
- No Function change.
- No Inventory/Catalog write.
- Content ownership remains authoritative.
