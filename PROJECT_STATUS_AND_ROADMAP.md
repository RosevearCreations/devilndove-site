# Devil n Dove Project Status and Roadmap — Build 438 Source / Build 437 Production Baseline

This is the **second of two canonical current project files**. Read `AI_HANDOFF.md` first for architecture, authority and safety. This file is the current open-functionality roadmap.

Historical Build-number prose remains evidence only. Specialist documents own specialist implementation details. Do not reconstruct current priorities from older chronology when this file provides a newer explicit status.

## Current baseline

**Current completed Production-proven release: Build 437.**

**Current source/development release in progress: Build 438 — Application Core / Module Activation Authority.**

Completed/proven Production parity families:

```text
Build 427 Product numbers                  COMPLETE / PROVEN
Build 430 Gift Card                        COMPLETE / PROVEN
Build 432 Notification Build 403           COMPLETE / PROVEN
Build 433 Build 197 annotation index       COMPLETE / PROVEN
Build 437 Membership Build 395             COMPLETE / PROVEN
```

Do not reopen these because later feature work encounters unrelated failures.

## Module architecture sanity check

The repository already contains a genuine modular foundation created progressively in Builds 281–397.

Current architecture:

| Layer/module | Existing functional scope | Current state |
|---|---|---|
| Application Core | auth/session, module registry/lifecycle, route resolution, service contracts, shared runtime helpers | Existing; Build 438 is adding persistent/server authority |
| `commerce-operations` | storefront/customer/member, Catalog, Inventory, Orders, Membership, Gift Cards, fulfillment/customer operations | Existing top-level module; extraction/runtime coverage still incremental |
| `creative-production` | Creative Process, CAIP, Packaging, Media/Content, Content Studio, reviewed production workflows | Existing top-level module; strong four-domain activation/read coverage |
| `business-administration` | Accounting, Analytics/SEO/marketing, users/settings/security, platform/release/admin controls | Existing top-level module; Accounting runtime is proven, other domains remain incremental/domain-bridge |

Customer Commerce and Member Account are separate UX surfaces but are **inside Commerce & Operations**, not separate top-level runtime modules.

## Build 438 — P0 / current work

**Status: SOURCE IMPLEMENTATION IN PROGRESS / DEVELOPMENT MIGRATION NOT YET PROVEN / PRODUCTION NOT AUTHORIZED**

Build 438 is completing the missing central activation/access layer rather than rewriting the existing modules.

Source now includes:

1. additive `app_modules` D1 authority;
2. additive `app_module_role_access` authority;
3. exact seed of the three existing top-level modules;
4. current `member`/`admin` role mapping;
5. bounded server module-config read service;
6. request-scoped session/user module access evaluation;
7. canonical server route/API ownership map;
8. root Pages middleware module enforcement;
9. read-only access-level enforcement for non-read API methods;
10. read-only `/api/modules` bootstrap;
11. audited `/api/admin/app-modules` control API;
12. shared-core `/admin/application-modules/` recovery/control screen;
13. authoritative Admin browser bootstrap before umbrella runtime activation;
14. disabled/unavailable Admin navigation filtering;
15. public/member module-aware navigation visibility;
16. explicit module background-activity permission with default OFF;
17. no request-time module schema DDL;
18. no new polling loop;
19. read-only Build 438 D1 verification SQL;
20. local 20-check migration/security/runtime regression.

### Build 438 Development acceptance still required

1. Run local source syntax/regression checks.
2. Apply `database_build438_application_module_activation.sql` to **Development D1 only**.
3. Run `BUILD438_D1_VERIFICATION.sql` and prove 3 module rows / 6 role-access rows / both indexes.
4. Deploy/preview Development.
5. Verify `/api/modules` reports `schema_ready=true`, `source=d1`.
6. Open `/admin/application-modules/` and verify all three default enabled states.
7. Disable Commerce & Operations in Development and prove Shop/member/Catalog/Inventory/Orders routes are blocked while control route remains available; then re-enable.
8. Disable Creative & Production and prove Packaging/Creative/CAIP/Content surfaces are blocked; then re-enable.
9. Disable Business & Administration and prove Accounting/Analytics/platform/admin routes are blocked while Application Modules recovery remains available; then re-enable.
10. Prove module disable/re-enable does not delete business rows.
11. Set a role access level to `read` in Development and prove non-read module-owned API methods return `module_access_level_read_only`.
12. Verify disabled module runtime activation/import is suppressed in the browser.
13. Verify public/member/Admin navigation follows module state after refresh.
14. Verify all default `background_activity_enabled` values are 0.
15. Confirm Build 438 adds no recurring polling.
16. Observe request counts/Worker behavior; note the temporary duplicate auth lookup on some authenticated paths.
17. If needed, tighten route/API ownership mapping for any uncovered direct endpoint before Production consideration.
18. Update Build 438 evidence/Markdown with Development results.
19. Decide whether the additive Production migration should get its own narrow authorization boundary.
20. Keep broad Production promotion closed.

## Open requested functionality — prioritized sanity check

### P1 — CAIP real video/evidence pipeline

**Status: PARTIAL / HIGH VALUE**

Already strong:

- private R2 intake/recovery;
- bounded multipart integrity checks;
- duplicate/recovery handling;
- project-first CAIP navigation;
- evidence/story/derivative-plan foundations.

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

Already built:

- planned vs actual material distinction;
- reviewed actual-use posting;
- compensating inventory reversal/correction model;
- voided/corrected audit history;
- Creative Process -> CAIP -> Content Studio lifecycle.

Still open:

1. production-test real correction/reversal flows end to end;
2. polished audited Finished Production reversal UI;
3. downstream sale/commit guards for reversal;
4. lot-aware material selection/costing and supplier-lot provenance;
5. Inventory Usage Setup Required queue for historical generic `unit`/`log_only` records;
6. physical-count/adjustment workflows with reason, actor, before/after and movement evidence.

### P1 — Packaging Studio physical acceptance / regulatory evidence

**Status: PARTIAL**

Already built:

- reusable Packaging/template architecture;
- soap-reference visual direction;
- structured ingredients;
- Inventory/source identity linkage without stock consumption;
- separate English/French ingredient presentation;
- print-readiness blocking instead of silent clipping;
- French draft/review concepts;
- claims/warnings/template/version foundations.

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

Build 278 baseline recorded:

```text
71 image slots
68 background slots
6 P1 required placeholder replacements
23 P2 recommended placeholder replacements
68 P3 optional blank backgrounds
42 authored/default locations
```

Live D1 assignments supersede baseline counts.

Still open:

1. replace six P1 required placeholders first;
2. work through P2 recommended visuals with real workshop/project/product-adjacent evidence;
3. treat P3 backgrounds as optional polish;
4. production-test page-wide Edit switch on desktop/mobile;
5. continue CSS drift/overlap/mobile parity checks whenever affected pages change;
6. preserve one H1 and descriptive alt text on public pages.

### P1 — Content/social publishing downstream

**Status: PARTIAL**

The Creative Process -> CAIP -> Content Studio authority chain exists. Still open:

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

Members currently includes profile/account tools, orders, wishlist, reviews and downloads. Continue evidence-driven improvements within Commerce & Operations. Do not create a second customer identity system.

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

Continue:

- one clear H1 on exposed pages;
- concise truthful titles/descriptions/canonicals;
- natural searcher wording in prominent places;
- crawlable descriptive internal links;
- descriptive alt text;
- real product/process/workshop evidence;
- mobile content parity;
- real Southern Ontario business/service context only;
- Search Console/Business Profile measurement rather than guaranteed-rank claims.

## Remaining schema/parity technical debt

These remain known but are **not automatically next and are not authorized**:

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
Build 438 Development migration                PENDING OWNER RUN
Build 438 Production migration                 NOT AUTHORIZED
R2/provider mutation                           DISABLED
CAIP D1-only copy                              FORBIDDEN
Broad Production promotion                     CLOSED
Main/Production broad promotion                FROZEN pending broader acceptance
```

## Documentation rule

`AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` are the two canonical current cross-project authorities. `BUILD438_APPLICATION_CORE_MODULE_PLAN.md` is the current specialist architecture plan. Build 437 overlays remain parity/release evidence and should not override Build 438 current source state.
