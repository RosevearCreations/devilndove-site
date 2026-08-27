# Devil n Dove Modular Application Architecture — Core + Four Modules

## Current status

Updated: 2026-08-27

The approved target is now **one Application Core + four top-level application
modules**. The fourth module, **I.T. & Platform** (`it-platform`), separates
web/deployment/database/storage/recovery maintenance from ordinary creator and
business workflows. Its detailed authority is
`docs/architecture/IT_MODULE_ARCHITECTURE.md`.

The deployed Build 440 runtime still has the three proven Build 438 business
modules. The fourth-module runtime and D1 authority are intentionally gated
until Build 440 authenticated live acceptance closes and the next Development
release is deliberately opened.

The Build 302 history below remains useful migration provenance, but its
“exactly three” target is superseded by this approved four-module boundary.

## Historical normalization status

Build 280 remains the frozen Production baseline. Development intentionally diverged after Build 280 to modularize the application safely.

Builds 281–301 established the modular registry, route classification, service contracts and the first real domain extraction through Packaging. Build 302 normalizes the architectural target so Devil n Dove is no longer described as if every business domain will become a separate top-level application module.

**Historical Build 302 target: one Application Core + exactly three top-level application modules.**

The existing domain boundaries remain valuable. They become internal ownership boundaries inside the three application modules rather than twelve separate top-level applications.

Build 302 does not move or delete mature runtime code. It does not change D1 schema, Cloudflare bindings, R2, authentication, server endpoints, or the completed Build 301 Packaging runtime. It establishes the target structure and migration map before further extraction.

## Architectural goal

Devil n Dove remains one application platform with one authentication authority, one D1 data model and the existing R2 architecture.

```text
                     DEVIL N DOVE APPLICATION CORE
                               |
        +-------------+-------------+-------------+
        |             |             |             |
        v             v             v             v
   COMMERCE &     CREATIVE &    BUSINESS &      I.T. &
   OPERATIONS      PRODUCTION   ADMINISTRATION  PLATFORM
```

The four top-level modules are independently loadable application areas. The
three business modules contain their business domains; I.T. & Platform contains
technical operations that creators should not need to use.

The goal is not four repositories, four databases, or four Cloudflare
applications. The goal is four runtime/authority boundaries inside one Devil n
Dove platform.

## Application Core

The Core owns only cross-application capabilities:

- authentication and session awareness;
- current-user identity and server-backed authorization context;
- module registry and lifecycle;
- route-to-module resolution;
- shared API request helpers;
- shared error handling and notifications;
- environment/runtime information;
- service registration and lookup;
- feature/module availability;
- common route/application bootstrap primitives.

The Core must not become a replacement monolith.

The Core must not own:

- product/catalog business rules;
- inventory costing or stock rules;
- Creative Project lifecycle rules;
- CAIP evidence/intelligence rules;
- Packaging/labeling rules;
- Media/Content project rules;
- marketing/publishing rules;
- accounting treatment or close controls.

Those belong to the module/domain that owns the capability.

## Module 1 — Commerce & Operations

### Purpose

Own customer-facing commerce and the operational facts required to sell, fulfill and support Devil n Dove products.

### Internal domains

#### Public Website & Storefront (`public`)

Owns customer-facing presentation and storefront composition. It consumes approved catalog/content/marketing facts but does not load private Admin/Creative/Accounting runtimes for ordinary visitors.

#### Catalog & Commerce (`catalog`)

Owns products, product editing, product media linkage, offers, pricing, tax assignment, checkout-facing catalog behavior, merchandising and product-facing marketplace identity.

#### Inventory & Materials (`inventory`)

Owns supplies, tools, materials, inventory identity, usage profiles, cost history, stock movements, kits, suppliers/source relationships, actual consumption and compensating reversals.

Inventory remains a foundational business authority even though it lives inside Commerce & Operations. Other modules consume Inventory through explicit contracts rather than duplicating stock logic.

#### Business & Customer Operations (`operations`)

Owns orders, customer/custom-request workflows, fulfillment, memberships, gift cards, vendor/pickup/community workflows, work queues and customer documents.

### Representative current routes

```text
/
/admin/catalog*
/admin/catalog-media*
/admin/create-product*
/admin/products*
/admin/movies*
/admin/mobile-product*
/admin/release-preflight*
/admin/site-item-inventory*
/admin/inventory*
/admin/operations*
/admin/orders*
/admin/customer-documents*
/admin/gift-cards*
/admin/members*
/admin/membership*
/admin/custom-request*
/admin/today-tasks*
```

## Module 2 — Creative & Production

### Purpose

Own the full creation-to-production evidence chain: Creative Projects, private intelligence, packaging/labeling and approved content/media production.

### Internal domains

#### Creative Projects (`creative`)

Owns project concept/planning, lifecycle, work timeline, reviewed actual materials, outputs, lessons and project facts.

Creative Projects may request Inventory posting/reversal through the Inventory contract, but Inventory remains the stock authority.

#### Creative Asset Intelligence Platform (`caip`)

Owns private creative-media intake, Creative Assets, evidence, derivatives, technical observations, intelligence and reviewed story structure.

CAIP consumes Creative Project context; it does not become Inventory or Content Studio.

#### Packaging & Labeling (`packaging`)

Owns packaging projects, reusable templates, formulas, INCI/ingredients, claims, artwork, translations, print/export layouts, print tests, approvals and repeat jobs.

Packaging may read Catalog, Inventory identity/source data and Content media through service contracts. It does not silently consume physical stock.

**Packaging is the first substantially extracted domain and the Build 301 compatibility baseline is preserved unchanged during Build 302.**

#### Media & Content Studio (`content`)

Owns static/public site media, content projects, deliverables, website image spaces, visual assignments, storyboards, moderation and approved Creative/CAIP media handoff.

It must not become Catalog or Inventory.

### Representative current routes

```text
/admin/creative-project*
/admin/creative-process*
/admin/creative-automation*
/admin/creative-assets*
/admin/caip*
/admin/packaging-studio*
/admin/media-content-studio*
/admin/content-studio*
/admin/visual-enrichment-studio*
/admin/image-manifest*
/admin/stage-photo-moderation*
/admin/content-publications*
```

## Module 3 — Business & Administration

### Purpose

Own business control, downstream distribution, financial treatment, analytics
and business administration. Technical platform maintenance is owned by I.T. &
Platform.

### Internal domains

#### Marketing, Publishing & SEO (`marketing`)

Owns SEO, analytics/search-console concerns, social publishing, campaigns, marketplace presentation/exports and downstream distribution.

Content Studio creates/reviews content; Marketing distributes it.

#### Accounting & Finance (`accounting`)

Owns journals, ledgers, AR/AP, payments, reconciliation, statement imports, fees, profitability, tax reporting, financial reporting and close controls.

Other modules emit operational facts; Accounting owns accounting treatment.

#### Administration (`admin`)

Owns users, roles, permissions, administrator-facing configuration, security and Command Center management.

### Representative current routes

```text
/admin/seo*
/admin/social*
/admin/marketing*
/admin/analytics*
/admin/marketplace-mapping*
/admin/marketplace-exports*
/admin/public-display-order*
/admin/search-console*
/admin/accounting*
/admin/
/admin/users*
/admin/settings*
/admin/security*
/admin/command-center*
/admin/access-tier*
/admin/user-profiles*
```

## Module 4 — I.T. & Platform

### Purpose

Own web hosting, release/deployment, runtime, schema, storage, recovery and
technical maintenance so creators can work without interacting with technical
controls.

### Internal domain

#### I.T. & Platform (`platform`)

Owns schema/runtime health, release mechanics, route/API diagnostics, deployment
evidence, Cloudflare/D1/R2 health, backup/restore evidence, technical incident
review and bounded recovery utilities.

### Representative current routes to reclassify

```text
/admin/operational-continuity*
/admin/deployment-preflight*
/admin/release-control*
/admin/deploy-readiness*
/admin/promotion-control*
/admin/go-live-execution*
/admin/live-ops-followthrough*
/admin/application-sanity*
/admin/markdown-sanity*
/admin/route-usage*
/admin/public-api-health*
/admin/schema-drift*
/admin/runtime-incidents*
```

`/admin/application-modules*` remains Application Core recovery authority.

## Domain-to-module migration map

The current Build 290 domain catalog remains active during migration. Build 302 groups those definitions as follows:

| Current domain ID | Target application module | Current extraction state |
| --- | --- | --- |
| `public` | Commerce & Operations | shadow/legacy |
| `catalog` | Commerce & Operations | shadow/legacy |
| `inventory` | Commerce & Operations | shadow/contract provider |
| `operations` | Commerce & Operations | shadow/legacy |
| `creative` | Creative & Production | shadow/legacy |
| `caip` | Creative & Production | shadow/legacy |
| `packaging` | Creative & Production | active extracted domain; Build 301 baseline |
| `content` | Creative & Production | shadow/contract provider |
| `marketing` | Business & Administration | shadow/legacy |
| `accounting` | Business & Administration | shadow/legacy |
| `platform` | I.T. & Platform | shadow/platform; fourth-module extraction pending |
| `admin` | Business & Administration | shadow/platform-admin |

The current domain identifiers remain useful for ownership, route classification and service contracts. They are not intended to remain twelve top-level independently loaded application modules.

## Build 302 passive architecture catalog

`public/js/core/dd-application-module-groups.mjs` is the machine-readable target grouping.

It declares:

```text
core
commerce-operations
creative-production
business-administration
it-platform (approved target; not present in the historical Build 302 catalog)
```

and historically mapped the existing twelve domain IDs into exactly three
top-level modules. The next release must add `it-platform` and move
`platform` ownership without changing business-data authority.

The file is intentionally passive and is not imported by the live Build 301 runtime in Build 302. This prevents an architecture-documentation correction from changing proven Packaging behavior.

## Current runtime reality at Build 302 start

The current Build 290 domain definitions still contain twelve route/domain classifications.

Only Packaging has a non-null runtime entry:

```text
packaging -> ../modules/packaging/runtime.mjs?v=290
```

All other current domain definitions remain `entry: null` and therefore run as shadow/legacy classifications.

This was expected during migration. Build 440 proves the three existing business
modules; the approved fourth I.T. runtime remains pending.

## Two-gate activation rule

A top-level application module may become active only when both gates pass:

1. **Identity gate** — the current user is authorized.
2. **Runtime-need gate** — the current route/workflow actually requires the module.

A hidden menu item is not authorization. Protected server endpoints continue to enforce authentication/authorization independently.

A module that is inactive must not start polling, refresh loops, background fetches or expensive initialization merely because the Admin shell is open.

## Service-contract rule

Cross-module work must use explicit contracts.

Important examples:

```text
Creative & Production -> inventory-read/post/reverse -> Commerce & Operations
Creative & Production -> catalog-read              -> Commerce & Operations
Creative & Production -> content-media             -> Creative & Production internal domain
Commerce & Operations -> accounting event/facts    -> Business & Administration
Creative & Production -> accounting event/facts    -> Business & Administration
Business & Administration marketing -> catalog/content approved facts
```

A module must not import another module's private implementation merely because both live in the same repository.

## Database rule

Module boundaries are application boundaries, not separate database boundaries.

Keep one authoritative D1 data model so referential integrity, transactions, shared identifiers and reporting remain coherent. Tables gain clear domain ownership over time, but Build 302 does not create module-specific databases.

The separate fresh-install schema-parity problem must be solved independently of this application-module normalization.

## API rule

Do not perform a mass endpoint move.

Existing API routes remain operational until their callers are migrated and validated. Native/domain-oriented facades may replace broad legacy endpoints one bounded workflow at a time, as demonstrated by Packaging.

Server-side authorization remains authoritative regardless of browser module state.

## Cloudflare/runtime rule

Preserve the existing Worker-efficiency discipline:

- no idle polling solely because Admin is open;
- no request-time schema repair on hot paths;
- no automatic retry amplification for Worker/resource-limit failures;
- use D1/R2 bindings directly inside Functions;
- keep expensive work bounded and explicit;
- do not put secrets in source/module definitions.

## Definition of an extracted top-level module

A top-level module is complete only when:

- all owned domains are mapped and documented;
- its routes resolve to that module rather than twelve unrelated top-level domain runtimes;
- its UI runtime loads only when needed;
- server authorization remains enforced;
- internal domains use explicit contracts for cross-domain work;
- it has no hidden dependency on unrelated page globals;
- it starts no idle work when inactive;
- its local and Development tests pass;
- business data remains valid;
- another top-level module can consume supported services without importing private implementation.

## Migration sequence from Build 302

Build 302 is normalization and historical pinning, not a large-bang runtime rewrite.

Recommended sequence:

1. **Build 302 — architecture normalization**
   - pin completed Build 301 historically;
   - establish the historical Core + three business-module baseline;
   - map all existing domains/routes;
   - keep Build 301 runtime unchanged.

2. **Commerce & Operations extraction**
   - formalize the umbrella runtime;
   - make Inventory/Catalog/Operations services explicit;
   - migrate owned route resolution incrementally.

3. **Creative & Production extraction**
   - adopt Packaging Build 301 as the first proven internal domain;
   - bring Creative Projects, CAIP and Content under the same umbrella runtime;
   - remove Packaging's older compatibility dependencies only after equivalent umbrella startup/service readiness exists.

4. **Business & Administration extraction**
   - group Marketing, Accounting and Admin under one gated runtime;
   - retain internal domain ownership and authorization.

5. **I.T. & Platform extraction**
   - add the fourth gated runtime and explicit per-user I.T. grant;
   - move Platform route ownership without mass-renaming URLs;
   - keep ordinary creator workflows free of technical runtime/polling.

6. **Legacy cleanup**
   - remove obsolete shadow classifications, compatibility layers and dead loaders only after all four top-level module runtimes are independently proven.

## Build 301 preservation rule

Build 301 is the completed Packaging compatibility baseline. Build 302 must not modify its proven runtime files.

Before any later Packaging runtime change, completed Build 301 must remain historically testable.

## Legacy compatibility policy

Do not use a large-bang rewrite.

Legacy routes/scripts may coexist with modular code while each route and service is migrated. Compatibility shims are acceptable when explicit, bounded, observable and scheduled for removal.

Every extraction must remain independently reviewable and reversible in Git.

## Production safety

Separate live Production remains at the documented Build 437 baseline unless
deliberately promoted through its distinct workflow.

Build 302 architecture work is Development-only and must not contact or mutate Production resources.
