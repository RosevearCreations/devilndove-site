# Devil n Dove AI Handoff — Build 437

This is the **first of two canonical current project files**. Read this file first for architecture, data authority, safety and current release state. Read `PROJECT_STATUS_AND_ROADMAP.md` second for the current open functionality and ordered next work.

Historical Build validation/changed-file prose is evidence only and does not override these two canonical files. Specialist documents remain authoritative for their specialist implementation details.

## Current release

**Build 437 — Membership canonical completion and release alignment** is the current completed release baseline.

The local/remote `dev` baseline after deterministic release-artifact generation is clean and Build 437 release notes/manifest are current.

Build 437 completed and proved these Production parity families:

```text
Product numbers                              COMPLETE / PROVEN
Gift Card                                    COMPLETE / PROVEN
Full Build 403 Notification                  COMPLETE / PROVEN
Build 197 annotation index                   COMPLETE / PROVEN
Membership Build 395                         COMPLETE / PROVEN
```

Membership Production evidence is retained in `BUILD437_MEMBERSHIP_COMPLETION_RELEASE.md` and `BUILD437_CURRENT_STATE_HANDOFF_OVERLAY.md`. The Membership Production authorization token is **SPENT / COMPLETE** and must never be reused.

## Current application architecture

Devil n Dove is one Cloudflare application built from:

- Cloudflare Pages/static frontend and Pages Functions/Workers runtime;
- Cloudflare D1 as structured application/business data authority;
- Cloudflare R2 for media/binary storage where applicable;
- `users` + `sessions` as current authentication/session authority;
- server-side role/authorization checks as the security boundary;
- shared browser auth/navigation/error helpers;
- specialist admin/member/public surfaces rather than separate repositories.

The application already contains four substantial functional surfaces:

1. **Customer Commerce** — public website, Shop, Cart/checkout, product discovery, custom requests, registration/login and customer-facing content.
2. **Customer / Member Account** — `/members/`, profile/account tools, orders/order detail, wishlist, reviews, downloads and Membership presentation.
3. **Creative & Production Operations** — Creative Process / Creative Project Workflow, CAIP / Creative Assets, Packaging Studio, Content Studio, production/material workflows and operational evidence/review.
4. **Business Administration** — Catalog/Inventory administration, Members, Orders/Payments, Accounting, Analytics, settings/security, Application Sanity, Release & Go-Live and other business-management tools.

### Important modularity truth

These four surfaces are functionally separate, but the application does **not yet** have a central module registry/activation layer. Current separation is primarily route + authentication/role based.

A disabled module therefore cannot yet be guaranteed to suppress its navigation, route access, startup API calls, timers, polling, autosave/sync and provider work as one central contract.

The next planned architecture release is:

**Build 438 — Application Core / Module Registry**

See `BUILD438_APPLICATION_CORE_MODULE_PLAN.md`.

Build 438 must wrap existing working subsystems rather than rewrite them. Its job is to make modules centrally discoverable, enabled/disabled, role-aware and runtime-gated.

## Planned module keys

```text
customer_commerce   Customer Commerce
member_account      Customer / Member Account
operations          Creative & Production Operations
business_admin      Business Administration
```

The planned runtime rule is stronger than hiding menu items: an unavailable/inactive module must not initialize its module-owned polling, autosave, sync, startup API calls or provider work, and direct routes/APIs must fail closed.

## Shared core authority

The following remain shared application core rather than switchable business modules:

- authentication/session handling;
- authorization helpers;
- D1 access wrappers and schema/read helpers;
- common security/CSP/error/fallback behavior;
- responsive shell/navigation primitives;
- bounded analytics where applicable;
- release/build metadata;
- future module-registry read/route guards.

## Major subsystem authority boundaries

### Creative Process

Creative Process is project/process/material/time/cost authority. Planned timeline material facts do not change Inventory. Inventory changes only through explicit reviewed actual-use posting. Posted usage is audit data: corrections/removals use compensating reversals rather than silent deletion.

### CAIP / Creative Assets

CAIP owns private source media, upload/recovery integrity, technical/evidence review, story evidence and derivative planning. Private R2 originals remain private. Multipart completion is fail-closed and must prove actual parts/ETags/ranges/bytes plus final R2 object size before successful promotion.

### Content Studio

Content Studio owns reviewed channel/package/deliverable preparation. It does not create a duplicate Creative Process project identity. Human-reviewed evidence remains the source for public claims/story copy.

### Packaging Studio

Packaging Studio owns label/package presentation and reviewed printed ingredient/claim evidence. Inventory links in structured Packaging ingredients are identity/source traceability only; Packaging must not consume/reserve Inventory. Current owner direction is separate visible English and French ingredient declarations, with print approval blocked rather than silently clipping long formulas.

### Media & Content Studio

Website Media & Content Studio owns static/public-site placements and visual/content editing. Product/Inventory specialist records and private CAIP source footage remain outside that authority.

### Catalog / Inventory / Production

Catalog/Inventory owns product/supply/tool identities and stock facts. Finished production and Creative Process actual usage must preserve immutable/reversible evidence. Historical generic units/classification still need review queues rather than silent normalization.

## Worker/resource-efficiency rules

Cloudflare resource efficiency remains an application-wide requirement:

- do not perform routine request-time schema creation/repair;
- do not automatically retry resource-limit/CPU failures;
- keep polling bounded and opt-in where practical;
- avoid loading expensive whole-workspace state after every small mutation;
- inactive future modules must not create background traffic;
- analytics/fallback diagnostics must not block primary business actions;
- use server-side authorization, not hidden UI, as the security boundary.

## SEO/public-site rules

- Keep one clear H1 per exposed public page.
- Use truthful concise titles/descriptions/canonicals and natural searcher language.
- Prefer real product/process/workshop imagery and descriptive alt text near matching content.
- Preserve meaningful mobile content parity.
- Do not manufacture location pages, unsupported claims, transformations or fake social proof.
- Measure Search Console/Business Profile/query outcomes after deployment; static scores do not guarantee first-page placement.
- Admin/private workflow pages remain `noindex`.

## Release/package state

Build 437 deterministic release artifacts use Git-tracked release files only.

```text
Release notes:                         RELEASE_NOTES.md / Build 437
Release manifest:                      data/site/release-package-manifest.json
Manifest source scope:                 git_tracked_release_files
Manifest file count:                   1872
Manifest total size:                   66279989 bytes
Generation order:                      release notes first, manifest second
```

Local `.wrangler`, `__pycache__`, local backups and local `build*.txt` evidence are excluded from release packaging.

## Production safety state

```text
Membership Build 395 authorization               SPENT / COMPLETE
Fractional Inventory/Creative rebuilds            NOT AUTHORIZED
Product/FK rebuilds                               NOT AUTHORIZED
Accounting/default/nullability rebuilds           NOT AUTHORIZED
R2/provider mutation                              DISABLED unless explicitly scoped
CAIP D1-only media copy                           FORBIDDEN
Broad Production promotion                        CLOSED
Main/Production broad promotion                   FROZEN pending broader acceptance
```

A generic request such as “continue”, “next release”, feature work or pasted logs does not authorize a Production mutation. Production writes require an explicit, narrow, current scope when genuinely needed.

## Current high-value functional direction

After the Build 438 module core, continue:

1. CAIP first-class video review with exact timecode/range evidence.
2. Verified bounded proxy/frame/audio/transcript provider adapters.
3. Reviewed Creative Process -> CAIP -> Content Studio story/package handoff.
4. Packaging physical proof, bilingual overflow/extended-label strategy and supplier/INCI/allergen/French review.
5. Product/Inventory reversal, lot-aware costing/provenance, delete-reference inspection and review queues.
6. Media & Content Studio P1/P2 real-image replacement and public-page polish.
7. Reviewed social scheduling/publishing and downstream analytics.
8. Dedicated mobile operator/admin workflows.
9. Final reliability/go-live evidence before broad Production promotion.

Read `PROJECT_STATUS_AND_ROADMAP.md` for the prioritized open-functionality list and Build 438 execution order.
