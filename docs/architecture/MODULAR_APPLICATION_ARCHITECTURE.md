# Devil n Dove Modular Application Architecture — Build 281

## Status

Build 280 is the frozen Production baseline. Build 281 is the first Development-only architectural build after the Production/Development split.

Build 281 does **not** replace existing Devil n Dove functionality. It establishes the rules and code primitives that future builds will use to separate the current large application into independently loadable business modules.

No Build 281 D1 migration is required. No Cloudflare binding, R2 bucket, route, authentication flow, or existing page is changed by this foundation.

## Architectural goal

Devil n Dove remains **one application platform** with one authoritative authentication system, one D1 data model and the existing R2 storage architecture. The application is not being split into unrelated repositories, databases, or microservices.

The change is an application boundary:

```text
Devil n Dove Application Core
        |
        +-- Public Website & Storefront
        +-- Catalog & Commerce
        +-- Inventory & Materials
        +-- Creative Projects
        +-- CAIP
        +-- Packaging & Labeling
        +-- Media & Content Studio
        +-- Marketing / Publishing / SEO
        +-- Accounting & Business
        +-- Administration / Platform Operations
```

Each domain owns its business rules and UI runtime. Cross-domain work happens through explicit service contracts rather than one screen importing arbitrary internals from another screen.

## App Core responsibilities

The shared core may own only capabilities that genuinely cross the whole application:

- authentication/session awareness;
- current user identity and server-backed authorization context;
- module registry and lifecycle;
- route-to-module resolution;
- shared API request helpers;
- error handling and notifications;
- environment/runtime information;
- shared service registration;
- feature/module availability information.

The core must **not** become a new monolith. Inventory calculations, packaging formulas, CAIP evidence logic, product editing, publishing logic and accounting rules belong to their domain modules.

## The two-gate rule

A module may become active only when both gates pass:

1. **Identity gate** — the current user is authorized for the module.
2. **Runtime-need gate** — the user is actually on a route/workflow that requires the module.

A hidden navigation item is never authorization. Every protected server endpoint continues to enforce authentication/authorization independently.

Runtime gating exists to prevent idle subsystems from consuming browser, network or Cloudflare resources. A module that is not open must not start polling, refresh loops, background fetches or expensive initialization merely because the Admin shell is open.

## Build 281 registry contract

`public/js/core/dd-module-registry.mjs` introduces a passive registry with lifecycle states:

- `registered`
- `loading`
- `loaded`
- `active`
- `inactive`
- `failed`

The registry does nothing automatically. Importing it creates no timers, fetches, polling, Worker requests, D1 calls or R2 calls.

A future module may expose optional lifecycle hooks:

- `onLoad(context)` — one-time initialization after its runtime bundle is explicitly requested;
- `onActivate(context)` — route/workflow became active;
- `onDeactivate(context)` — route/workflow is leaving and should release listeners/timers/resources.

Build 281 deliberately leaves every domain `entry` as `null`. That means no existing screen is routed through the new loader yet. Later extraction builds will connect one reviewed module at a time.

## Domain ownership

### Public Website & Storefront

Owns customer-facing composition and presentation. It consumes public capabilities from Catalog, Content and Marketing but must never load Admin, CAIP or Accounting UI logic for ordinary visitors.

### Catalog & Commerce

Owns products, product editor concerns, product-facing media linkage, offers, pricing, tax assignment, merchandising and checkout-facing catalog behavior.

### Inventory & Materials

Owns inventory identity, supplies, tools, materials, usage profiles, cost history, movements, kits, supplier/source relationships, actual consumption and compensating reversals.

Inventory is a foundational service because other domains consume inventory facts. Those domains should request inventory operations through a stable contract instead of reproducing inventory logic.

### Creative Projects

Owns Creative Process project facts: concept/planning, work timeline, reviewed actual materials, outputs, lessons and lifecycle state. Creative Projects consumes Inventory posting/reversal services but Inventory remains the stock authority.

### CAIP

Owns private creative-media intake, Creative Assets, technical observations, evidence, derivatives, intelligence and reviewed story structure. CAIP consumes Creative Project identity/context; it does not become Inventory or Content Studio.

### Packaging & Labeling

Owns packaging projects, reusable templates, formulas, structured INCI/ingredients, claims, artwork, bilingual/review state, print/export layouts and repeat jobs.

Packaging may reference Inventory identity/source data but must not silently consume stock. Actual physical material usage remains in the reviewed Creative Process/production path.

### Media & Content Studio

Owns static/public site media assignments, content projects, deliverables, approved project-media handoff, website image spaces and presentation assets. It must not become the product catalog or Inventory editor.

### Marketing / Publishing / SEO

Owns downstream distribution: SEO management, captions, social publishing, campaigns, marketplace feeds and post-content release concerns. Content Studio creates/reviews content; Marketing distributes it.

### Accounting & Business

Owns journals, ledgers, AR/AP, bank reconciliation, statement imports, fees, profitability, financial reporting and close controls. Other modules emit business events/facts; Accounting owns accounting treatment.

### Administration / Platform Operations

Owns users, roles, platform settings, startup/release readiness, deployment diagnostics, system audit and maintenance tools.

## Database rule

Module boundaries are application boundaries, **not separate database boundaries**.

Keep one D1 data model so referential integrity, transactions, shared identifiers and reporting remain coherent. Tables will be assigned domain ownership over time, but they remain in the same Development database unless a future design has a concrete operational reason to change that.

Build 281 makes no schema change.

## API rule

Existing API routes remain operational. Do not perform a mass endpoint move.

Future builds may gradually establish clearer module-oriented API directories or facades, but compatibility endpoints remain until their callers are migrated and validated.

Server-side authorization remains authoritative regardless of module UI state.

## Cloudflare/runtime rule

The modular architecture must preserve the Worker-efficiency discipline already established before the split:

- no idle polling solely because Admin is open;
- no request-time schema repair on normal hot paths;
- no automatic retry amplification for resource-limit failures;
- use D1/R2 bindings directly inside Functions rather than calling Cloudflare REST APIs from runtime code;
- keep expensive work bounded and explicit;
- do not put secrets in source or module definitions.

## Extraction order

Build 281 is foundation only. A sensible following sequence is:

1. **Packaging UI extraction proof** — clear domain boundary and immediate business value.
2. **Inventory service contract** — formalize shared read/post/reverse/cost operations used by Packaging, Creative and Catalog.
3. **Creative Projects / CAIP boundary** — preserve the existing lifecycle and evidence authorities while reducing coupling.
4. **Media & Content Studio**.
5. **Catalog & Commerce**.
6. **Marketing / Publishing / SEO**.
7. **Accounting & Business**.
8. **Admin shell consolidation and legacy cleanup**.

The exact build number for each extraction is allowed to change based on testing and discovered dependencies.

## Definition of a successfully extracted module

A module is not considered extracted merely because files were moved into a new folder. It is extracted when:

- its ownership and dependencies are documented;
- its UI loads only when needed;
- its protected APIs still enforce authorization server-side;
- it has no hidden dependency on unrelated page globals;
- it starts no idle polling/background work when inactive;
- its tests pass locally and on `devilndove-site-dev`;
- existing business data remains valid;
- another module can consume its supported services without importing its private implementation.

## Legacy compatibility policy

Build 280 behavior is the compatibility baseline. During extraction, legacy routes and scripts may coexist with modular code. Compatibility shims are acceptable when they are explicit, bounded and scheduled for removal.

Do not use a large-bang rewrite. Each extraction should be independently reviewable and reversible in Git.

## Build 281 acceptance

Build 281 is successful when:

- Production Build 280 remains untouched;
- Development pulls the new Build 281 commit cleanly;
- the foundation JavaScript passes syntax validation;
- the local ownership inventory can scan the repository;
- Build 281 introduces no D1 migration or Cloudflare binding change;
- no existing page imports the new registry yet;
- existing Development smoke/auth tests continue to pass.
