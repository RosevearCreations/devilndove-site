# Release 467 Build 65 — Admin Page Lazy Loading

Build 65 starts from the exact fully-green Build 64 Production/Development source boundary:

- base SHA: `636402494045db3acb178041a71d4f4ce4182639`
- base tree: `9c60862d8ec87dd191085a787bfd615adf275a98`
- canonical D1 migration authority: `0001`–`0004` only

## Purpose

Large admin workspaces must not initialize unrelated optional systems merely because the page opened. Build 65 makes heavy presentation/enhancement modules **selector- and viewport-gated** so they load only when their owning panel exists and is near the operator, or when the operator interacts with that panel.

## What changes

`public/js/admin.js` now owns a small release-scoped lazy-loading coordinator (`R467B65_V1`). It coalesces duplicate imports, exposes a read-only runtime snapshot through `window.DDAdminLazyLoading`, and uses `IntersectionObserver` plus bounded presence observation to activate optional modules.

The following optional systems are no longer unconditional admin-startup work:

- Product finished-production reversal waits for `.product-production-release` to become relevant.
- Product Editor image-quality guidance waits for `#createProductForm` to become relevant.
- Inventory base-unit usability waits for `#siteInventoryAdminMount` and remains excluded from Products.
- External credential/provider/help support waits for an actual external/provider-related field or provider setup row instead of scanning every admin form at startup.

Presence observers are temporary and disconnect after their target appears or after a bounded timeout. Visibility observers and interaction listeners also disconnect after activation. This prevents permanent unrelated MutationObservers from being installed simply because another admin workspace is open.

Page-specific Photography Manager and Packaging walkthrough guidance remain page-scoped because those pages are their direct owners.

## Authority boundary

The **core module authority remains eager**. `dd-application-module-bootstrap.mjs` still loads immediately because permission/module availability must be established before optional application runtimes activate. Build 65 defers only non-authority enhancements.

This build is schema-neutral:

- canonical D1 migration stream: unchanged (`0001`–`0004`)
- D1 business-data mutation: **NONE**
- R2 mutation: **NONE**
- provider execution/publication: **NONE**
- Production promotion: only after the exact Development SHA is fully green

## Acceptance

Build 65 is accepted only when the exact Development SHA passes the current System Gate, current application quality proof, I.T./Admin runtime proof, repository hygiene, canonical Development deployment/smoke acceptance, and the Build 65 source contract. Production may then be promoted only by non-force fast-forward of that exact green Development commit.

## Next planned build

After Build 65 is fully green and promoted, continue with **Build 66 — Product Workspace Split**.
