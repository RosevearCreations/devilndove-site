# Release 467 Build 249 — Refinement Runtime Measurement & Outcome Baseline

Build 249 starts from exact Build 248 Development `2f46181a3c92568c2b192a83929a85f72a2b4374` and promoted Production `main` `e6ed352b5fe9f32b2cd6d049b00239fd643ebbc6`, which share tree `2db3a312cd0e7a6e24b07de4495d1d97898c7028`.

## Purpose

Build 248 correctly recorded runtime outcome telemetry as not yet measured. Build 249 adds a bounded browser-local baseline so future refinement work can compare real operator runtime behavior without creating a new server telemetry authority.

## Measurement contract

- Route visits and same-origin Admin-to-Admin transitions are counted in `sessionStorage`.
- Startup request measurement is limited to the first 15 seconds of each measured Admin page.
- Only same-origin API pathnames are counted. Query values, request bodies, response bodies, headers, cookies, tokens, emails, Product IDs, search text and other business payloads are not recorded.
- Build 240 read-budget counters remain authoritative for cache hits, live/cache-miss reads and duplicate in-flight suppression.
- Existing Build 157 Product snapshot counters are surfaced when present.
- A real session baseline is captured only after the bounded startup window has elapsed. No CI or code path manufactures sample values.
- Measurements remain browser-local. No D1, R2, provider, analytics endpoint or remote telemetry write is added.

## Operator surface

The Admin dashboard exposes a compact read-only **Build 249 runtime baseline** card showing:
- Admin route transitions observed in this browser session;
- startup safe GETs that reached the existing API transport;
- Build 240 cache hits;
- Build 240 live/cache-miss reads;
- duplicate reads suppressed by Build 240 coalescing;
- whether a real 15-second session baseline has been captured.

The snapshot is also available to later refinement work as `window.DDRefinementRuntimeV249.snapshot()`.

## Acceptance

Build 249 is not accepted unless:
1. Build 248 is recorded as the exact Production-GREEN predecessor tree;
2. measurement remains browser-local and session-scoped;
3. endpoint measurement strips query values and never records request/response bodies or headers;
4. no remote telemetry, D1/R2 mutation, provider action, publication, Inventory movement or Finance posting is introduced;
5. Admin home loads the measurement before Build 240 and the dashboard clients;
6. the compact Product browser loads the shared measurement layer before its Product browser client;
7. Build 240 cache/coalescing behavior remains unchanged;
8. the current System, Application Quality, I.T. runtime, branch-hygiene and Build 249 dedicated gates are GREEN on the exact Development head before Production promotion.

The next authorized release is **Build 250 — Startup & Provider Read-Budget Verification**.
