# Devil n Dove Project Status and Roadmap — Build 438 Source / Build 437 Production Baseline

This is the **second of two canonical current project files**. Read `AI_HANDOFF.md` first for architecture, authority and safety. This file is the current open-functionality roadmap.

Historical Build-number prose remains evidence only. Specialist documents own specialist implementation details.

## Current baseline

**Current completed Production-proven release: Build 437.**

**Current source/development release: Build 438 — Application Core / Module Activation Authority.**

Build 438 source control-plane work is now **READY FOR OWNER VALIDATION**. Development D1 apply/live proof remains pending. Production Build 438 D1 is not authorized.

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

Current architecture:

| Layer/module | Functional scope | Current state |
|---|---|---|
| Application Core | auth/session, module lifecycle, route/service authority, shared recovery/security/runtime helpers | Existing; Build 438 control plane source ready |
| `commerce-operations` | storefront/customer/member, Catalog, Inventory, Orders, Membership, Gift Cards, fulfillment/customer operations | Existing top-level module; runtime extraction still incremental |
| `creative-production` | Creative Process, CAIP, Packaging, Media/Content, Content Studio, reviewed production workflows | Existing top-level module; strong four-domain activation/read coverage |
| `business-administration` | Accounting, Analytics/SEO/marketing, users/settings/security, platform/release/admin controls | Existing top-level module; Accounting runtime proven, other domains incremental/domain-bridge |

Customer Commerce and Member Account are separate UX surfaces inside Commerce & Operations, not separate top-level runtimes.

## Build 438 — P0 / current release

**Status: SOURCE READY FOR OWNER VALIDATION / DEVELOPMENT D1 + LIVE PROOF PENDING / PRODUCTION NOT AUTHORIZED**

Build 438 source now includes:

1. additive `app_modules` D1 authority;
2. additive `app_module_role_access` authority;
3. exact three-module seed;
4. explicit member/admin role mapping;
5. short non-user module-config cache;
6. request-scoped session/user evaluation;
7. fail-closed real authority-error semantics with safe pre-migration compatibility defaults;
8. canonical server route/API ownership map aligned to the existing Build 305 domain catalog;
9. hyphenated API-family classification;
10. root Pages direct module enforcement;
11. direct `read` access blocking non-read API methods;
12. seven explicit cross-module shared service contracts;
13. consumer-gated shared-service access;
14. `manage` requirement for shared mutation contracts;
15. read-only `/api/modules` bootstrap with explicit fresh refresh;
16. audited `/api/admin/app-modules` controls;
17. shared-core `/admin/application-modules/` recovery surface;
18. permanent Admin Dashboard **Application Modules** card;
19. Admin-only account-widget recovery link;
20. module Core Health diagnostics;
21. browser Current-State Route Proof;
22. authoritative Admin bootstrap before umbrella runtime activation;
23. disabled runtime suppression;
24. public/member module-aware navigation with short per-tab cache;
25. background permission default OFF and auto-clear on module disable;
26. no request-time module DDL;
27. no new recurring polling;
28. exact D1 verification SQL;
29. hard-pinned Development-only D1 apply/verify helper;
30. local 20-check regression;
31. executable route/shared-contract matrix test;
32. existing client-domain/server ownership alignment test;
33. executable 12-check module access-policy test.

### Shared contract independence now supported

Direct owner-module disablement no longer incorrectly severs a narrow contract legitimately used by another enabled module.

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

This means, for example, Commerce may be disabled for direct user access while Creative remains enabled and can still use the explicit reviewed Inventory contract boundary. Broad Commerce/Inventory pages and legacy APIs remain blocked.

### Build 438 Development acceptance still required

1. Pull current `dev`.
2. Run the Build 438 Python compile checks.
3. Run the 20/20 source regression.
4. Run the route/shared-contract matrix.
5. Run Build305 domain/server alignment.
6. Run the 12/12 access-policy test.
7. Run JavaScript syntax checks.
8. Apply `database_build438_application_module_activation.sql` to **Development D1 only** through the hard-pinned helper.
9. Require exact D1 verification: 3 module rows, 6 role rows, 3 enabled, 0 background enabled, 2 indexes, exact keys.
10. Deploy/preview Development.
11. Verify `/api/modules?fresh=1` returns `schema_ready=true`, `source=d1`.
12. Open `/admin/application-modules/` and require Core Health PASS.
13. Require Current-State Route Proof PASS with all modules enabled.
14. Disable/re-enable Commerce; direct Commerce routes block/return correctly and data stays intact.
15. While Commerce is disabled and Creative remains enabled, prove appropriate shared read contracts remain usable by Creative.
16. Do not fabricate Inventory movements merely to test `inventory-post`/`inventory-reverse`; use a real reviewed Creative fixture if live mutation proof is needed.
17. Disable/re-enable Creative and prove direct Creative surfaces/runtime block/return correctly; Commerce may still consume explicit `content-media` where required.
18. Disable/re-enable Business and prove direct Business surfaces block/return while Core recovery stays available; Commerce may still consume explicit `accounting-read` where required.
19. Prove a direct module set to `read` blocks non-read methods with `module_access_level_read_only`.
20. Prove business row counts do not change because a module was disabled.
21. Observe Worker/request behavior and confirm no new recurring polling.
22. Record Development evidence in canonical Markdown.
23. Only after all Development proof is green decide whether a narrow Production migration authorization boundary should be prepared.
24. Keep broad Production promotion closed.

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
Build 438 source control plane                  READY FOR OWNER VALIDATION
Build 438 Development migration                PENDING OWNER RUN
Build 438 Production migration                 NOT AUTHORIZED
R2/provider mutation                           DISABLED
CAIP D1-only copy                              FORBIDDEN
Broad Production promotion                     CLOSED
Main/Production broad promotion                FROZEN pending broader acceptance
```

## Documentation rule

`AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` are the two canonical current cross-project authorities. `BUILD438_APPLICATION_CORE_MODULE_PLAN.md` is the current specialist architecture plan and `BUILD438_VALIDATION.md` is the owner-run validation authority. Build 437 overlays remain historical release evidence and do not override current Build 438 source state.
