# Build 282 — Modular Architecture Lock

Build 282 locks the Devil n Dove modular taxonomy and connects the Build 281 registry to the existing Admin runtime in **shadow mode only**.

## Locked layers

### Platform layer

- `CORE` — authentication/session client concerns, module registry, shared API/error utilities and cross-module contract mechanics.
- `PLATFORM` — schema/runtime health, release mechanics, infrastructure-facing diagnostics and deployment evidence. This is an internal ownership category, not a business-menu destination.
- `ADMIN` — users, roles, permissions, administrator configuration, security and command-center management.
- `PUBLIC` — customer-facing website/storefront shell composed from domain-owned services.

### Business modules

- `CATALOG` — products, merchandising, pricing/offers, checkout-facing catalog and movie catalog.
- `INVENTORY` — stock/material identity, cost, movements, usage and reversals.
- `OPERATIONS` — customers, custom requests, fulfillment, membership/gift-card operations, vendor/pickup/community workflow and work queues.
- `CREATIVE` — Creative Process project lifecycle and reviewed project/material facts.
- `CAIP` — private creative media, evidence, story intelligence and derivative planning.
- `PACKAGING` — packaging projects, labels, templates, formulas, INCI, claims and print readiness.
- `CONTENT` — Media & Content Studio, public/static site media, deliverables and approved media handoff.
- `MARKETING` — SEO, analytics/Search Console, promotion, marketplace presentation and social publishing.
- `ACCOUNTING` — ledger, AR/AP, payments, reconciliation, profitability and financial reporting.

## Build 282 compatibility rule

The existing application remains authoritative for runtime behavior. The new resolver may identify a route and annotate Admin links with `data-dd-module-target`, but it must not:

- activate a module;
- load a module runtime entry point;
- replace navigation;
- change an API route;
- query D1;
- fetch application data;
- start a timer/poller;
- change Cloudflare bindings;
- introduce a D1 migration.

All module `entry` values therefore remain `null` in Build 282.

## Shadow resolution

`dd-admin-module-shadow.mjs` is loaded from the existing shared Admin JavaScript. It waits for the existing authentication state, identifies the current route for a verified/cached administrator, and publishes `dd:module-resolved` metadata.

Synthetic administrator context is used only to classify destination links. It is not authorization. Server-side APIs remain responsible for authorization exactly as before.

## Cross-module contract rule

A module may own a table and capability without physically moving either. Other modules should eventually consume the owner's declared contract rather than duplicate its business rules.

Build 282 declares the first contract catalog but provides no new service implementations. Examples include:

- Packaging reads Inventory identity through `inventory-read`.
- Creative Process posts/reverses actual material use through Inventory authority.
- Packaging/Catalog read approved media through `content-media`.
- Content reads reviewed CAIP evidence through `caip-evidence`.
- Operations reads bounded payment/financial state through `accounting-read`.
- Admin reads bounded platform readiness through `platform-health`.

## Next conversion gate

Build 283 is expected to convert Packaging into the first actively loaded UI module while keeping its current public/admin URLs stable. Inventory, Content and Catalog should first expose the narrow contracts Packaging actually needs; Packaging should not duplicate those authorities.
