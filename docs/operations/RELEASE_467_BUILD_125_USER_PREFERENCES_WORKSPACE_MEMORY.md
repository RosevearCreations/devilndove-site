# Release 467 Build 125 — User Preferences & Workspace Memory

Build 125 starts from the fully proven Build 124 Development and Production checkpoint:

- SHA `fbcc55051b899719d2fb2cdf90343852cf5abe70`
- tree `7476f4843f8209c230189a03449d7c172da5de8a`
- System Gate `34720625518`
- Current Application Quality `34720625496`
- I.T. Admin Runtime `34720625502`
- Repository Branch Hygiene `34720625515`
- Production Pages Deploy `34720717741`
- Production Live Resource Integrity `34720757007`

Build 124 remains non-self-recording. These proof IDs are ingested by Build 125 startup authority before Build 125 changes begin.

## Goal

Make Admin work easier to resume on the same browser without creating a second server-side user-settings system.

## Behavior

- Preferences are scoped to the signed-in Admin user ID.
- The last non-home Admin route can be remembered.
- Admin home can show a **Resume** link.
- Recent Admin tools can be shown or hidden.
- The recent visible limit is selectable as 3, 5 or 8.
- **Clear workspace memory** deletes only the Build 125 browser-memory key.
- Storage failures fail soft and never block Admin navigation.
- Build 122 command-palette navigation remains authoritative for available destinations.

## Safety boundary

The feature uses browser `localStorage` only. It does not use `sessionStorage`, create a preference API, perform a POST/PUT/PATCH/DELETE request, change D1 schema or business data, mutate R2/bindings, post Accounting entries, change Inventory/Creative/Product/price data, execute payment providers, publish providers, or overwrite Production business data.

Canonical D1 migrations remain exactly `0001`–`0004`.

## Closure policy

Build 125 is a `DEVELOPMENT_CLOSURE_CANDIDATE`. `final_closure` and `production_checkpoint` remain null in the Build 125 candidate authority. Build 126 must ingest Build 125's later external exact-head and Production proof.
