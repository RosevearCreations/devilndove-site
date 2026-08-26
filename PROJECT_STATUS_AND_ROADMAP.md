# Devil n Dove Project Status and Roadmap — Build 438 Development Authority / Build 437 Production Baseline

This is the **second of two canonical current project files**. Read `AI_HANDOFF.md` first for architecture, authority and safety. This file is the current open-functionality roadmap.

Historical Build-number prose remains evidence only. Specialist documents own specialist implementation details.

## Current baseline

**Current completed Production-proven release: Build 437.**

**Current source/development release: Build 438 — Application Core / Module Activation Authority.**

Build 438 is **APPLIED AND EXACTLY VERIFIED IN DEVELOPMENT**, the Pages guard is live, and all three top-level modules have passed live disable/block/restore isolation. The remaining Build 438 Development gate is authenticated Admin/Core Health/role/shared-contract acceptance. Production Build 438 D1 is not authorized.

Completed/proven Production parity families:

```text
Build 427 Product numbers                  COMPLETE / PROVEN
Build 430 Gift Card                        COMPLETE / PROVEN
Build 432 Notification Build 403           COMPLETE / PROVEN
Build 433 Build 197 annotation index       COMPLETE / PROVEN
Build 437 Membership Build 395             COMPLETE / PROVEN
```

Do not reopen these for unrelated later feature failures.

## Module architecture sanity check

| Layer/module | Functional scope | Current state |
|---|---|---|
| Application Core | auth/session, module lifecycle, route/service authority, shared recovery/security/runtime helpers | Build 438 authority installed/proven in Development; Pages guard live |
| `commerce-operations` | storefront/customer/member, Catalog, Inventory, Orders, Membership, Gift Cards, fulfillment/customer operations | enabled; live disable/403/restore proven |
| `creative-production` | Creative Process, CAIP, Packaging, Media/Content, Content Studio, reviewed production workflows | enabled; live disable/403/restore proven |
| `business-administration` | Accounting, Analytics/SEO/marketing, users/settings/security, platform/release/admin controls | enabled; live disable/403/restore proven |

Customer Commerce and Member Account are separate UX surfaces inside Commerce & Operations, not separate top-level runtimes.

## Build 438 — P0 / current release

**Status: DEVELOPMENT D1 AUTHORITY APPLIED + EXACT / PAGES GUARD PROVEN / LIVE ISOLATION PASS 3/3 / AUTHENTICATED ACCEPTANCE PENDING / PRODUCTION NOT AUTHORIZED**

Build 438 now includes:

1. additive `app_modules` authority;
2. additive `app_module_role_access` authority;
3. exact three-module seed;
4. explicit member/admin role mapping;
5. short non-user module-config cache;
6. request-scoped session/user evaluation;
7. fail-closed real authority-error semantics with safe pre-migration compatibility defaults;
8. retryable 503 session-verification boundary that prevents false logout;
9. canonical server route/API ownership aligned to the existing Build 305 catalog;
10. hyphenated API-family classification;
11. root Pages direct module enforcement;
12. narrow `_routes.json` invocation for module-owned static surfaces while preserving static informational delivery;
13. direct `read` access blocking non-read API methods;
14. seven explicit cross-module shared service contracts;
15. consumer-gated shared-service access;
16. `manage` requirement for shared mutation contracts;
17. read-only `/api/modules` bootstrap with explicit fresh refresh;
18. audited `/api/admin/app-modules` controls;
19. shared-core `/admin/application-modules/` recovery surface;
20. permanent Admin Dashboard **Application Modules** card;
21. Admin-only account-widget recovery link;
22. module Core Health diagnostics;
23. browser Current-State Route Proof;
24. authoritative Admin bootstrap before umbrella runtime activation;
25. disabled runtime suppression;
26. public/member module-aware navigation with short per-tab cache;
27. background permission default OFF and auto-clear on module disable;
28. no request-time module DDL;
29. no new recurring polling;
30. deterministic fresh-install `database_full_schema.sql` synchronization;
31. file-based self-asserting strict D1 verification;
32. hard-pinned Development-only D1 apply/verify helper;
33. local 20-check regression;
34. executable route/shared-contract matrix;
35. Build305 domain/server ownership alignment;
36. executable 12-check module access-policy proof;
37. executable 6-check session-resilience proof;
38. Windows console/strict verification regression;
39. Pages invocation-route regression;
40. Development-only live module isolation/auto-restore harness;
41. response diagnostics `X-DND-Module-Guard`, `X-DND-Module-Key`, `X-DND-Shared-Contract`;
42. Admin **Authenticated Acceptance Proof** runner with automatic module/role restoration;
43. local authenticated-acceptance safety regression.

### Development authority evidence now green

See `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md`.

```text
Full schema                         PASS / synchronized
Application Core regression         PASS (20/20)
Route map                            PASS (53 + 7 contracts)
Catalog/server alignment             PASS (61/61)
Access policy                        PASS (12/12)
Session resilience                   PASS (6/6)
Console/strict helper                PASS (10/10)
Pages invocation routes              PASS (10/10)
Development migration                APPLIED / PASS
Human read-only verification         PASS / 0 writes
Strict self-asserting verification   PASS / 0 writes
Pages guard live markers             PROVEN
Live module isolation                PASS (3/3)
Final module state                   RESTORED / EXACT
Business mutation from isolation     NONE
```

Exact Development state:

```text
module_count:               3
role_access_count:          6
enabled_module_count:       3
background_enabled_count:   0
expected_index_count:       2
module_keys:                business-administration|commerce-operations|creative-production
```

### Live isolation result

```text
Commerce   /shop/                    200 -> disabled 403 -> restored 200
Creative   /admin/creative-process/  401 -> disabled 403 -> restored 401
Business   /admin/accounting/        401 -> disabled 403 -> restored 401
Core       /admin/application-modules/ remained 200 throughout
Other enabled module routes          retained recorded baseline behavior
Final app_modules state              RESTORED / EXACT
Production mutation                  NONE
```

### Shared contract independence

Reviewed shared contracts:

```text
catalog-read       Commerce -> Commerce / Creative / Business
inventory-read     Commerce -> Commerce / Creative
inventory-cost     Commerce -> Commerce / Business
inventory-post     Commerce -> Commerce / Creative          mutation
inventory-reverse  Commerce -> Commerce / Creative          mutation
accounting-read    Business -> Business / Commerce
content-media      Creative -> Creative / Commerce
```

Shared mutation contracts require a qualifying consumer with `manage` access.

The 12/12 unit proof establishes Commerce-disabled + Creative-enabled Inventory contract eligibility without fabricating business mutations.

### Build 438 authenticated acceptance still required

The remaining P0 gate is now intentionally concentrated in `/admin/application-modules/`.

Run **Run authenticated acceptance proof** while logged in as Admin. It is designed to prove:

1. D1 source/schema and Core Health PASS;
2. exact three-module enabled/background-off/admin-manage baseline;
3. shared Core control API availability;
4. Commerce disable through audited Admin API -> guarded direct 403 -> client unavailable -> `inventory-read` still available to Creative -> exact restore;
5. Creative disable through audited Admin API -> guarded direct 403 -> client unavailable -> `content-media` still available to Commerce -> exact restore;
6. Business disable through audited Admin API -> guarded direct 403 -> client unavailable -> `accounting-read` still available to Commerce -> exact restore;
7. Business Admin role temporarily changed from `manage` to `read`;
8. GET remains available at `read`;
9. intentionally unsupported POST is rejected by middleware with `module_access_level_read_only` before endpoint mutation;
10. Admin role restores exactly;
11. final Core Health/module/background state returns to baseline;
12. no `inventory-post`/`inventory-reverse` dummy mutation is used;
13. record final authenticated evidence in canonical Markdown;
14. only after the authenticated Development proof is green decide whether a narrow Build 438 Production authorization boundary should be prepared;
15. keep broad Production promotion closed.

Local safety gate before browser proof:

```text
scripts/build438_authenticated_acceptance_regression.py
```

## Open requested functionality — prioritized sanity check

### P1 — CAIP real video/evidence pipeline

**Status: PARTIAL / HIGH VALUE**

Already strong: private R2 intake/recovery, bounded multipart integrity, duplicate/recovery handling, project-first navigation, evidence/story/derivative-plan foundations.

Still open:

1. first-class video viewing/review inside CAIP;
2. exact timecode/time-range evidence markers for technique/problem/result/lesson/etc.;
3. real bounded proxy/thumbnail/frame/audio/transcript processing adapter;
4. verify provider outputs before jobs are complete;
5. transcript/timecode evidence -> reviewed story segments;
6. human approval before Content Studio refresh/public claims;
7. generate derivatives only for approved story needs;
8. continue large-media interruption/resume/recovery proof.

### P1 — Creative Process / production proof and reversals

**Status: PARTIAL**

Still open:

1. production-test real correction/reversal flows end to end;
2. polished audited Finished Production reversal UI;
3. downstream sale/commit guards for reversal;
4. lot-aware material selection/costing and supplier-lot provenance;
5. Inventory Usage Setup Required queue for historical generic `unit`/`log_only` records;
6. physical-count/adjustment workflows with reason, actor, before/after and movement evidence.

### P1 — Packaging Studio physical acceptance / regulatory evidence

**Status: PARTIAL**

Still open:

1. print current bilingual soap ribbon at 100% and perform real wrap/readability proof;
2. physically confirm claim icon/text clearance;
3. if formulas overflow, design/test extended or peel-back bilingual ingredient template rather than unreadable shrinking;
4. finish supplier Master INCI evidence for regular bases/fragrances/colourants;
5. finish fragrance-allergen review data and ergonomics;
6. finish Packaging French Review cockpit with source/draft/approved wording, reviewer/date/history and hard print gate;
7. visual/reference-diff proof for `soap_reference_v2` and record owner physical acceptance.

### P1 — Product / Inventory operational completion

**Status: PARTIAL**

Still open/high value:

1. Product Delete Reference Inspector with direct Open/Resolve actions;
2. audited Finished Production reversal;
3. lot-aware costing/provenance;
4. Product Ingredient Review queue for missing INCI/order/source/allergen/French evidence;
5. Media Integrity Review for D1/R2 featured/gallery/SEO-role disagreement;
6. classification review and physical-count adjustment workflows;
7. supplier/source provenance cleanup for historical Inventory/Product Resource records.

### P1 — Media & Content Studio / visual completion

**Status: PARTIAL**

Build 278 baseline recorded 71 image slots, 68 background slots, 6 P1 required placeholder replacements, 23 P2 recommended replacements, 68 optional backgrounds and 42 authored/default locations. Live D1 assignments supersede baseline counts.

Still open:

1. replace six P1 required placeholders first;
2. work through P2 recommended visuals with real workshop/project/product-adjacent evidence;
3. treat P3 backgrounds as optional polish;
4. production-test page-wide Edit switch on desktop/mobile;
5. continue CSS drift/overlap/mobile parity checks whenever affected pages change;
6. preserve one H1 and descriptive alt text on public pages.

### P1 — Content/social publishing downstream

**Status: PARTIAL**

Still open:

1. reviewed scheduling/calendar handoff;
2. actual social-provider connection/publishing where supported;
3. human release approval immediately before publication;
4. retry/error/dead-letter evidence for publishing;
5. post-release channel/engagement analytics feeding reviewed future-project lessons;
6. never imply publishing/rendering is complete because a derivative/output plan exists.

### P2 — Mobile operator/business workflows

**Status: OPEN / PARTIAL**

Still requested:

1. dedicated phone dashboard with Today/high-value quick actions;
2. Quick Add Expense;
3. Quick Add Write-Off;
4. Quick New Product/draft capture;
5. barcode-first receiving;
6. phone-camera write-off/evidence capture;
7. accountant export presets for month/quarter/year packages;
8. responsive/low-bandwidth behavior for large operational surfaces.

### P2 — Customer/member experience

**Status: FUNCTIONAL / CONTINUE POLISH**

Members includes profile/account tools, orders, wishlist, reviews and downloads. Continue evidence-driven improvements within Commerce & Operations. Do not create a second customer identity system.

### P2 — Go-live / reliability acceptance

**Status: OPEN**

Before broad Production promotion:

1. monitor Workers metrics/logs after representative traffic;
2. payment/refund smoke proof;
3. email delivery proof;
4. D1 restore drill;
5. R2 environment/separation proof;
6. mobile/desktop screenshots for critical public/admin flows;
7. large-media interruption/recovery proof;
8. controlled release evidence through Release & Go-Live Center;
9. confirm unrelated page loads do not start unnecessary background work.

### P2 — SEO/local search

**Status: CONTINUOUS**

Continue one clear H1, truthful titles/descriptions/canonicals, natural searcher wording, crawlable internal links, descriptive alt text, real product/process/workshop evidence, mobile parity, truthful Southern Ontario context and measured Search Console/Business Profile outcomes.

## Remaining schema/parity technical debt

Known but **not automatically next and not authorized**:

```text
Fractional Inventory / Creative Project numeric rebuilds
Product / foreign-key rebuilds
Accounting default / nullability rebuilds
Other remaining structural drift
```

When one is chosen, begin with fresh read-only scope and a new family-specific authorization only if Production mutation is genuinely needed.

## Release safety state

```text
Build 437 Membership token                     SPENT / COMPLETE
Build 438 Development D1 authority              APPLIED / EXACTLY VERIFIED
Build 438 Pages module guard                    PROVEN
Build 438 Development live isolation            PASS (3/3) / RESTORED EXACT
Build 438 authenticated browser acceptance      PENDING
Build 438 Production migration                  NOT AUTHORIZED
R2/provider mutation                           DISABLED
CAIP D1-only copy                              FORBIDDEN
Broad Production promotion                     CLOSED
Main/Production broad promotion                FROZEN pending broader acceptance
```

## Documentation rule

`AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` are the two canonical current cross-project authorities. `BUILD438_APPLICATION_CORE_MODULE_PLAN.md` is the specialist architecture plan, `BUILD438_VALIDATION.md` is the owner-run validation authority, and `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md` records the applied/exact Development D1 + live isolation evidence. Build 437 overlays remain historical release evidence and do not override current Build 438 state.
