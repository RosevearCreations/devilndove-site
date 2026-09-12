# Release 467 Build 127 — Admin Context Breadcrumbs & Workspace Return

## Goal

Keep the Devil n Dove operator oriented inside the growing Admin application without creating another navigation database, saved preference, or business-data authority.

## Verified starting point

Build 126 is externally verified and Production GREEN:

- SHA `af4dec5acdaf2b01a35d52731863786bee197315`
- tree `b8e410f0c517d3b0d59d48cf4dd7f2acfe6e21a3`
- System Gate `34724580675`
- Current Application Quality `34724580676`
- I.T. Admin Runtime `34724580648`
- Repository Branch Hygiene `34724580646`
- Production Pages Deploy `34724657853`
- Production Live Resource Integrity `34724703548`

This closure is ingested by Build 127 and is not a Build 126 self-claim.

## Runtime contract

- `data/admin-navigation-modules.json` remains the only Admin workspace/tool context authority.
- Build 127 injects one `<nav aria-label="Admin context">` breadcrumb on Admin routes.
- Resolved routes show Admin, workspace, section and current tool context.
- Nested tools receive a direct **Back to workspace** link.
- The current tool is marked with `aria-current="page"`.
- Manifest failure falls back to Admin plus the current page label.
- Build 122 command palette, Build 125 workspace memory and Build 126 favorites remain unchanged and available.

## Safety boundary

The module is Admin-only and client-only. It uses no `localStorage` or `sessionStorage`, creates no server persistence, performs no network write, and introduces no automatic business action. Its only fetch is a GET/read of the existing Admin navigation manifest.

There is no schema change, request-time DDL, D1 business-data mutation, R2 mutation, binding mutation, Accounting posting, period close, Inventory/Creative/Product/price mutation, provider execution/publication, or Production business-data overwrite. Canonical D1 migrations remain exactly `0001`–`0004`.

## Closure policy

Build 127 remains non-self-recording. Its exact-head System/Quality/I.T./Hygiene proof and later Production Pages/Live Resource proof must be externally observed and then ingested by Build 128.
