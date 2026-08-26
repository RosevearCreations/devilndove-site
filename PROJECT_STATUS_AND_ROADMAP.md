# Devil n Dove Project Status and Roadmap — Build 437

This is the **second of two canonical current project files**. Read `AI_HANDOFF.md` first for architecture, authority and safety. This file is the current status/open-functionality roadmap.

Historical Build validation/changed-file prose remains evidence only. Specialist documents own specialist implementation details. Do not reconstruct current priorities from old Build-number chronology when this file provides a newer explicit status.

## Current baseline

**Current completed release: Build 437 — Membership canonical completion and release alignment.**

The Build 437 Production Membership rebuild is complete/proven, release artifacts are deterministic, Python cache/local evidence noise is excluded from version control/release packaging, and the `dev` working baseline was clean after final artifact generation.

Completed/proven Production parity families:

```text
Build 427 Product numbers                  COMPLETE / PROVEN
Build 430 Gift Card                        COMPLETE / PROVEN
Build 432 Notification Build 403           COMPLETE / PROVEN
Build 433 Build 197 annotation index       COMPLETE / PROVEN
Build 437 Membership Build 395             COMPLETE / PROVEN
```

Do not reopen these merely because later work encounters unrelated errors.

## Application-module sanity check

Devil n Dove already has **four substantial functional application surfaces**:

| Module direction | Existing surface | Current state |
|---|---|---|
| `customer_commerce` | Public site, Shop, Cart/checkout, custom requests, registration/login | Functional surface |
| `member_account` | Members area, profile, orders, wishlist, reviews, downloads, Membership | Separate authenticated surface |
| `operations` | Creative Process, CAIP/Creative Assets, Packaging Studio, Content Studio, production/material workflows | Strong functional surface inside current staff/admin architecture |
| `business_admin` | Catalog/Inventory admin, Members, Orders/Payments, Accounting, Analytics, settings/security, sanity/release tools | Large functional admin surface |

### What is still missing

The application does **not yet** have one central module registry/activation authority. Current separation is mostly route + authentication/role based.

Therefore we cannot yet guarantee from one source of truth that an inactive module has:

- no navigation;
- no route/API access;
- no startup/bootstrap calls;
- no timers/polling;
- no autosave/sync;
- no provider/R2 work;
- no module-specific background diagnostics.

This is now the first architectural priority.

## Next planned release — Build 438 Application Core / Module Registry

See `BUILD438_APPLICATION_CORE_MODULE_PLAN.md`.

Build 438 should **wrap existing functionality, not rewrite it**.

### Build 438 required outcomes

1. Add canonical `app_modules` authority with the four default modules.
2. Add explicit role-to-module access authority using the existing role model.
3. Add one shared server-side module-access service.
4. Add a small current-user module bootstrap endpoint.
5. Map existing routes/APIs to module keys.
6. Make direct routes/APIs fail closed when the module/user is unavailable.
7. Render Admin/member/public navigation from module availability where applicable.
8. Prevent inactive modules from initializing avoidable JavaScript/startup work.
9. Gate module-owned timers, polling, autosave and synchronization.
10. Gate module-owned provider/R2 work.
11. Add an audited Admin **Application Modules** control screen.
12. Disabling a module must never delete its business data.
13. Re-enabling a module must restore access without data reconstruction.
14. Add desktop/mobile navigation regressions.
15. Add security regressions proving hidden UI is not the authorization boundary.
16. Add direct-access regressions for disabled modules.
17. Add request-count regressions proving inactive modules do not create startup/background traffic.
18. Preserve Worker/CPU bounded-operation rules.
19. Update the two canonical Markdown authorities when implementation is proven.
20. Only then mark Build 438 complete.

## Open requested functionality — prioritized sanity check

### P0 — Application core / modular activation

**Status: OPEN / NEXT**

Implement Build 438 as described above. This is the architectural prerequisite for intentionally activating/deactivating Customer/Member/Operations/Business Admin surfaces by configuration and role without unnecessary runtime work.

### P1 — CAIP real video/evidence pipeline

**Status: PARTIAL / HIGH VALUE**

Already strong:

- private R2 intake/recovery;
- bounded multipart integrity checks;
- duplicate/recovery handling;
- project-first CAIP navigation;
- evidence/story/derivative-plan foundations.

Still open:

1. First-class video viewing/review inside CAIP.
2. Exact timecode and time-range evidence markers for technique/problem/result/lesson/etc.
3. A real memory-bounded proxy/thumbnail/frame/audio/transcript provider adapter.
4. Verification of provider outputs before jobs are marked complete.
5. Transcript/timecode evidence -> reviewed story segments.
6. Human approval before Content Studio refresh/public claims.
7. Generate derivatives only for approved story needs.
8. Continue large-media interruption/resume/recovery testing.

### P1 — Creative Process / production proof and reversals

**Status: PARTIAL**

Already built:

- planned vs actual material distinction;
- reviewed actual-use posting;
- compensating inventory reversal/correction model;
- voided/corrected audit history;
- project lifecycle linking Creative Process -> CAIP -> Content Studio.

Still open:

1. Production-test real project correction/reversal flows end to end.
2. Complete polished audited Finished Production reversal UI.
3. Add downstream sale/commit guards for production reversal.
4. Add lot-aware material selection/costing and supplier-lot provenance.
5. Add an Inventory Usage Setup Required queue for historical generic `unit`/`log_only` records.
6. Add physical-count/adjustment workflows with reason, actor, before/after and movement evidence.

### P1 — Packaging Studio physical acceptance / regulatory evidence workflow

**Status: PARTIAL**

Already built:

- reusable Packaging Studio/template architecture;
- soap reference direction;
- structured ingredients;
- Inventory/source identity linkage without stock consumption;
- separate English/French ingredient presentation;
- print-readiness blocking rather than silent clipping;
- French draft/review concepts;
- claims/warnings/template/version foundations.

Still open:

1. Print the current bilingual soap ribbon at 100% and perform real wrap/readability proof.
2. Confirm claim-icon/text clearance physically.
3. If real formulas overflow, design/test an extended or peel-back bilingual ingredient template rather than shrinking below readable size.
4. Finish supplier Master INCI evidence for regular soap bases, fragrances and colourants.
5. Finish fragrance-allergen review data and operator ergonomics.
6. Add/finish Packaging French Review cockpit with source/draft/approved wording, reviewer/date/history and hard print gate.
7. Add visual/reference-diff proof for `soap_reference_v2` and record owner physical acceptance.

### P1 — Product / Inventory operational completion

**Status: PARTIAL**

Still open/high value:

1. Product Delete Reference Inspector listing every meaningful blocker with direct Open/Resolve actions.
2. Audited Finished Production reversal workflow.
3. Lot-aware costing/provenance.
4. Product Ingredient Review queue for missing INCI/order/source/allergen/French evidence.
5. Media Integrity Review where D1/R2 product-media roles disagree with featured/gallery/SEO choices.
6. Classification review and physical-count adjustment workflows.
7. Continue supplier/source provenance cleanup for historical Inventory/Product Resource records.

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

Live D1 assignments may improve these counts and remain the operational truth.

Still open:

1. Replace the six P1 required placeholders first.
2. Work through P2 recommended visuals with real workshop/project/product-adjacent evidence.
3. Treat P3 backgrounds as optional polish only.
4. Production-test the page-wide Edit switch on desktop/mobile.
5. Continue CSS drift/overlap/mobile parity checks whenever affected pages change.
6. Preserve one H1, strong mobile parity and descriptive alt text on public pages.

### P1 — Content/social publishing downstream

**Status: PARTIAL**

The Creative Process -> CAIP -> Content Studio authority chain exists. Still open:

1. Reviewed scheduling/calendar handoff.
2. Actual social-provider connection/publishing flows where supported.
3. Human release approval immediately before publication.
4. Retry/error/dead-letter evidence for provider publishing.
5. Post-release channel/engagement analytics feeding reviewed future-project lessons.
6. Do not imply publishing/rendering is complete merely because a derivative/output plan exists.

### P2 — Mobile operator/business workflows

**Status: OPEN/PARTIAL**

Still requested:

1. Dedicated phone dashboard with Today and high-value quick actions.
2. Quick Add Expense.
3. Quick Add Write-Off.
4. Quick New Product/draft capture.
5. Barcode-first receiving.
6. Phone-camera write-off/evidence capture.
7. Accountant export presets for month/quarter/year packages.
8. Continue responsive CSS/low-bandwidth behavior for large operational surfaces.

### P2 — Customer/member experience

**Status: FUNCTIONAL / CONTINUE POLISH**

Current Members area includes profile/account tools, orders, wishlist, reviews and downloads. Continue only evidence-driven improvements after Build 438 module control exists. Do not create a second customer identity system.

### P2 — Go-live / reliability acceptance

**Status: OPEN**

Before broad Production promotion:

1. Monitor Cloudflare Workers metrics/logs after representative traffic; investigate expensive request paths rather than adding blind retries.
2. Payments/refunds smoke proof.
3. Email delivery proof.
4. D1 restore drill.
5. R2 environment/separation proof.
6. Mobile/desktop screenshots for critical public/admin flows.
7. Large-media interruption/recovery proof.
8. Controlled release evidence through Release & Go-Live Center.
9. Confirm no important background work is running merely because an unrelated page loaded; Build 438 should materially improve this.

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
- measurement through Search Console/Business Profile/local conversion evidence.

Do not promise first-page placement or manufacture thin location/AI-targeted pages.

## Known technical-debt/parity families — not automatically next

These remain known but are not implicitly authorized or the default next work:

```text
Fractional Inventory / Creative Project numeric rebuilds
Product / foreign-key rebuilds
Accounting default / nullability rebuilds
Other remaining structural drift
```

If one is chosen later, start with fresh read-only evidence and create a new family-specific authorization only if a Production mutation is actually required.

## Closed items that should not be reopened casually

```text
Product-number Production parity               COMPLETE / PROVEN
Gift Card Production parity                    COMPLETE / PROVEN
Notification Build 403 parity                  COMPLETE / PROVEN
Build 197 annotation index                     COMPLETE / PROVEN
Membership Build 395                           COMPLETE / PROVEN
Membership authorization token                 SPENT / COMPLETE
Build 437 release notes                        CURRENT
Build 437 deterministic manifest               CURRENT
Python cache tracking                          REMOVED
Local build evidence from release package      EXCLUDED
```

## Build 437 release-package facts

```text
Build label:              Build 437
Manifest source scope:    git_tracked_release_files
Manifest file count:      1872
Manifest total size:      66279989 bytes
Generation order:         RELEASE_NOTES.md first -> manifest second
```

Do not reintroduce `.wrangler`, `__pycache__`, local backups or local `build*.txt` evidence into the release manifest.

## Production safety/lock state

```text
Fractional rebuild family             NOT AUTHORIZED
Product/FK rebuild family             NOT AUTHORIZED
Accounting rebuild family             NOT AUTHORIZED
R2/provider mutation                  DISABLED unless explicitly scoped
CAIP D1-only copy                     FORBIDDEN
Broad Production promotion            CLOSED
Main/Production broad promotion       FROZEN pending broader release acceptance
```

## Documentation sanity rule

The two current mutable cross-project authorities are:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

`BUILD438_APPLICATION_CORE_MODULE_PLAN.md` is the current specialist architecture plan for the next release.

Build 437 Membership/roadmap overlays remain retained release evidence, but new work should update these two canonical files rather than creating endless competing current-state overlays.

## Immediate next work

**Start Build 438 Application Core / Module Registry.**

Do not begin by rewriting existing features. Inventory the current routes/APIs/background behaviors into the four module keys, add the central module/access authority, then make navigation, route guards and background activity obey it. Once that core is proven, resume the P1 functional work above inside the appropriate modules.
