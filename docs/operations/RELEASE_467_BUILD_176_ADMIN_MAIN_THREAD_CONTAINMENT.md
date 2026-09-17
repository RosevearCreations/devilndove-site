# Release 467 — Build 176 Admin Main-Thread / Read Amplification Containment

Build 176 addresses repeated browser **page isn't responding** failures across unrelated Admin workspaces.

## Evidence

The affected routes shared two amplifiers:

1. the Admin contextual-help layer maintained a permanent whole-document `MutationObserver` and rescanned broad text selectors after unrelated DOM mutations; and
2. several legacy workspaces still requested and synchronously rendered hundreds to 1,000 rows while multiple optional navigation observers were booting.

The compact Product Browser did not exhibit the same failure pattern because it already avoided most of that shared legacy startup stack.

## Containment

### Shared Admin startup

- contextual-help observation is debounced, ignores its own DOM, disconnects around refresh, and automatically stops after 8 seconds;
- dynamic workspaces can explicitly dispatch `dd:admin-context-help-refresh` when help needs to be re-evaluated later;
- Catalog, Orders, Storefront Merchandising and Supply Sourcing use lean startup: authentication, Account widget and Ctrl+K remain, while optional preferences/favorites/breadcrumb/help observers are omitted during startup;
- the Build 130 section-position → section-map → navigation-context-dock observer chain is explicit opt-in only.

### Supply Sourcing

- initial Supply window: 120 rows;
- server maximum: 200 rows;
- substitution candidate window: 80 rows;
- Search Supplies is an explicit server-side search rather than rendering a 1,000-row startup set.

### Storefront Merchandising

- Product membership selector request reduced from 1,000 to 120;
- Collection, membership, Collage and rule projections are capped at 200 rows each;
- the extra permanent workspace-state observer is not loaded on this heavy route.

### Orders

- `/api/admin/orders` defaults to 80 rows and hard-caps at 200;
- primary and fallback SQL projections are both bounded;
- Build 150 renders at most 80 rows and slices historical browser snapshots to 80;
- the duplicate legacy Orders/payment/accounting renderer is no longer started under the unified seller workspace;
- deeper work is opened explicitly in Fulfilment & Customer Care, Accounting, or Customer Documents.

### Catalog

The legacy all-in-one Catalog Product application no longer starts a dozen Product subsystems together. The route is now a focused navigation hub to Product Browser, Product Editor, Media, Inventory and Creative Automation.

### Release automation

The same read-amplification rule now applies to deployment verification:

- Development compares the candidate against the current `main` baseline;
- when no canonical schema input changed, migration/authority verification records a **zero-D1 code-only proof** and performs no remote D1 query;
- root-admin D1 verification runs only when root-admin/module-authority inputs changed;
- code-only Preview smoke omits the database-backed public API probe;
- canonical schema changes still require the full Development D1 migration + authority path and fail closed if that proof is unavailable.

This prevents ordinary HTML/CSS/JavaScript/admin work from consuming D1 daily row-read quota merely to prove an unchanged database.

## Boundaries

Build 176 is code-only. It adds no D1 migration and no D1 business-data, R2, provider, payment, refund or accounting mutation. It removes startup work; it does not create a second authority.

## Acceptance

The dedicated Build 176 proof must pass together with the retained Build 175 Product low-read proof, normal Quality/System Gate checks, exact Development Preview deployment, identical-tree Production promotion, Cloudflare deployment proof, Product route/browser proof and Live Resource Integrity proof.
