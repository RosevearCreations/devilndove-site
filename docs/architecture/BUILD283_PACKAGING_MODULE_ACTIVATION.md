# Build 283 — Packaging Module Activation

## Purpose

Build 283 is the first Devil n Dove Development build that allows a registered business module to enter the module lifecycle. Packaging is the proof module because its route, data authority and cross-domain dependencies are already explicit.

Production remains frozen at Build 280. Build 283 is Development-only until a future release candidate is deliberately promoted.

## What changes

- `PACKAGING` receives the first non-null module runtime `entry`.
- The Admin module bridge still classifies every Admin route, but it may activate only definitions with an explicit runtime entry.
- Packaging activation requires both:
  1. the active route resolves to Packaging, and
  2. `dd:admin-ready` reports a verified administrator (`verified: true`).
- Cached/provisional identity may classify a route but cannot activate a module.
- A temporarily degraded identity after an already verified activation does not invent authorization. Existing protected APIs remain authoritative server-side.
- The Packaging lifecycle entry exposes load/activate/deactivate state and events only. Existing Packaging Studio rendering, API calls, D1 data, print logic and current legacy JavaScript continue unchanged in Build 283.

## What does not change

Build 283 does not:

- add or run a D1 migration;
- move or rename Packaging D1 tables;
- change a Packaging API route;
- change the `/admin/packaging-studio/` URL;
- change Cloudflare Pages, D1 or R2 bindings;
- copy Packaging business logic into the module entry;
- implement Inventory, Catalog or Content services prematurely;
- activate any module other than Packaging.

## Packaging dependencies

Packaging continues to declare these contracts:

- `inventory-read` — Inventory identity/source facts, never stock mutation from Packaging;
- `catalog-read` — stable Product identity/presentation facts;
- `content-media` — approved artwork/media references.

Build 283 proves the boundary and lifecycle. Later builds may provide concrete contract adapters after their owning modules are ready.

## Runtime states

On Packaging Studio, expected progression is:

```text
route classified
  -> activation-pending
  -> verified administrator
  -> module loaded
  -> module active
```

On another Admin page with no runtime entry:

```text
route classified
  -> shadow
```

On explicit auth rejection or page departure, an active Packaging module is deactivated.

## Safety boundary

Module activation is not an authorization bypass. Every protected request remains subject to existing server-side authentication and role checks. The module entry itself performs no network request, starts no timer, and owns no business-data mutation in Build 283.
