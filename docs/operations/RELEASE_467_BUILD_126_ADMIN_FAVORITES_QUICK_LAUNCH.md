# Release 467 Build 126 — Admin Favorites & Quick Launch

Build 126 starts from the fully proven Build 125 Development and Production checkpoint:

- SHA `eca94d1ac4732c561794f914f89a2838af243617`
- tree `c7b4caf380183cd0b71b79d2f0ba73ccefce0d26`
- System Gate `34721943588`
- Current Application Quality `34721943584`
- I.T. Admin Runtime `34721943615`
- Repository Branch Hygiene `34721943593`
- Production Pages Deploy `34722069482`
- Production Live Resource Integrity `34722116635`

Build 125 remains non-self-recording. These proof IDs are ingested by Build 126 startup authority before Build 126 changes begin.

## Goal

Make frequently used Admin tools one click away while keeping the feature entirely in browser convenience state.

## Behavior

- Favorites are scoped to the signed-in Admin user ID.
- Any non-home Admin route can be toggled as a favorite.
- Up to eight favorites are retained.
- A **Favorites** quick-launch dialog lists saved tools.
- Admin home exposes up to three favorite shortcuts directly in the workspace navigation.
- Favorites can be removed individually or cleared together.
- `Alt+Shift+F` toggles the current non-home Admin page.
- Storage failures fail soft and never block Admin navigation.
- Build 122 command-palette navigation and Build 125 workspace memory remain intact.

## Safety boundary

The feature uses browser `localStorage` only. It does not use `sessionStorage`, create a preference API, perform a network write, change D1 schema or business data, mutate R2/bindings, post Accounting entries, change Inventory/Creative/Product/price data, execute payment providers, publish providers, or overwrite Production business data.

Canonical D1 migrations remain exactly `0001`–`0004`.

## Closure policy

Build 126 is a `DEVELOPMENT_CLOSURE_CANDIDATE`. `final_closure` and `production_checkpoint` remain null in the Build 126 candidate authority. Build 127 must ingest Build 126's later external exact-head and Production proof.
