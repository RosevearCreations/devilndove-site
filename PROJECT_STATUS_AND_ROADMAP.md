# Devil n Dove Project Status and Roadmap — Build 439 Development Feature Work / Build 437 Production Baseline

This is the **second of two canonical current project files**. Read `AI_HANDOFF.md` first for architecture, authority and safety. This file owns ordered open functionality and the definition of done for subsystem completion.

## Current baseline

**Production-proven baseline: Build 437.**

**Current completed Development architecture release: Build 438 — Application Core / Module Activation.**

Build 438 is **DEVELOPMENT-PROVEN**. Production Build 438 D1 is not authorized.

**Current active feature family: Build 439 — CAIP Media / Video Evidence Review.**

Build 439 source/schema/D1 authority is Development-proven, but live browser acceptance remains open because the selected Development CAIP asset points to an R2 object key that is not present in the bound Development private-media bucket. A read-only storage-linkage/inventory diagnostic now exists to distinguish healthy bindings, recoverable metadata drift, missing Development R2 objects and missing bindings without mutating D1/R2/provider state.

## Application/module architecture

Devil n Dove remains **one application with three top-level modules**, not a collection of independent applications:

| Layer/module | Scope | Development state |
|---|---|---|
| Application Core | auth/session, module lifecycle, route/service authority, recovery/security/runtime helpers | PROVEN |
| `commerce-operations` | storefront/member, Catalog, Product, Inventory, Tools, Shop, Collections, Movies, Orders, Membership, Gift Cards, customer/operations workflows | enabled; isolation + authenticated acceptance proven |
| `creative-production` | Creative Process, CAIP, Packaging, Media/Content, Content Studio, creative evidence and publishing preparation | enabled; isolation + authenticated acceptance proven |
| `business-administration` | Accounting, Analytics/SEO/marketing, users/settings/security, release/platform controls | enabled; isolation + authenticated acceptance proven |

Customer Commerce and Member Account remain separate UX surfaces inside Commerce & Operations. Specialist areas such as Inventory, Tools, Movies, Collections, CAIP and Packaging may have their own pages/APIs/workspaces, but they should remain submodules/features under the correct top-level module unless a future isolation/security requirement justifies a new top-level module.

## Mandatory subsystem definition of done

An open subsystem is **not complete** merely because source code exists or one API call works. Before we close a subsystem in Development, we require all applicable gates below:

1. **Authority/schema** — one clear data authority; aggregate schema synchronized; no duplicate/legacy authority ambiguity.
2. **Source regression** — deterministic local/source tests for safety, route ownership, error handling and no forbidden side effects.
3. **Development data gate** — required Development migration/apply completed and read-only/strict verification exact.
4. **API acceptance** — authenticated/anonymous behavior, authorization, failure/degraded behavior and no unexpected writes proven.
5. **Browser workflow acceptance** — the real end-to-end user/admin workflow succeeds in Development.
6. **Mobile/desktop/CSS** — responsive behavior, no overlap/drift, usable controls and low-bandwidth behavior where relevant.
7. **Integrity/recovery** — retries/recovery are bounded; missing data/resources fail clearly; no silent corruption or infinite polling.
8. **SEO/public quality** — public surfaces use one clear H1, truthful title/meta/canonical, crawlable links, descriptive alt text and real evidence.
9. **Observability** — meaningful failures can be diagnosed without exposing secrets or requiring database guesswork.
10. **Canonical documentation** — `AI_HANDOFF.md` and this roadmap reflect final state and remaining work.
11. **Production promotion remains separate** — Development completion does not authorize Production mutation.

We finish one coherent subsystem family through these gates before calling it complete and moving the main focus to the next family.

## Ordered completion queue to go-live

### 1. Build 439 — CAIP Media / Video Evidence Review — **ACTIVE / MUST CLOSE FIRST**

Goal: turn the existing CAIP private-media/intake foundation into a first-class reviewed evidence workflow without duplicating Creative Process or Content Studio authority.

Implemented/proven in Development so far:

- first-class temporal point/range evidence authority;
- evidence categories, review/verification state, transcript excerpts and reviewer identity;
- reviewed temporal evidence -> existing story evidence -> internal story segment flow;
- provider-output artifact authority and fail-closed completion triggers;
- provider profiles remain disabled/zero-budget on rerun;
- no automatic publication;
- private R2 range-streaming proxy with sanitized browser headers;
- Build 439 source regression green;
- deterministic `database_full_schema.sql` synchronization;
- Development D1 exact verification: 3 tables / 7 indexes / 2 triggers / 2 disabled providers / 1 ledger row;
- Build 439 API readiness live: HTTP 200 / schema ready / providers inactive;
- read-only per-asset and paginated storage-linkage diagnostic using D1 reads + R2 HEAD only.

Still required before CAIP closes:

1. audit all Development temporal assets for D1 <-> R2 parity;
2. identify at least one healthy private Development media object or prove Development private R2 population is incomplete;
3. repair metadata-only drift when an existing verified candidate object is available;
4. never create a D1-only media copy/link without a matching R2 object;
5. provide a clear re-upload/recovery path for metadata whose binary is genuinely absent from Development R2;
6. prove secure private playback and seeking with HTTP 206 / Content-Range / Accept-Ranges;
7. save reviewed timecode/range evidence;
8. seek back to the saved marker;
9. promote approved marker to existing story evidence;
10. approve story evidence;
11. draft an internal story segment from reviewed evidence;
12. download the evidence manifest;
13. prove no provider execution/publication/source-media mutation;
14. mobile/desktop CAIP review acceptance;
15. update canonical docs and mark Build 439 Development-complete.

### 2. Commerce/Product/Inventory/Tools operational completion — **NEXT**

Treat Product, Inventory and Tools as closely related specialist workspaces inside `commerce-operations`, sharing Product/Inventory identity rather than creating duplicate stock systems.

Open items include:

- Product Delete Reference Inspector with Open/Resolve;
- audited Finished Production reversal and compensating movement workflow;
- downstream sale/commit guards;
- lot-aware material selection/costing/provenance;
- Inventory Usage Setup Required queue;
- Product Ingredient Review queue;
- Media Integrity Review;
- classification and physical-count adjustment workflow with actor/reason/before/after evidence;
- supplier/source provenance cleanup;
- barcode-first receiving;
- kit/component depletion behavior;
- duplicate/normalization cleanup across JSON and D1;
- correct linked-item/product names instead of opaque external keys;
- reliable use/batch persistence and defaults;
- Tools catalogue/admin completeness, condition/service/usage history and appropriate Inventory links;
- no accidental cross-mutation between Tools, Supplies, Inventory and Product authorities;
- mobile/desktop acceptance for receiving, counts, use, reversal and tool workflows.

Completion requires real Development end-to-end posting **and reversal** evidence, not only static source checks.

### 3. Shop / Collections / merchandising — **THEN**

The storefront and Collections are Commerce surfaces, using the existing Product/Catalog authority.

Open/explicit completion work:

- finish Shop browsing/filter/search/category UX;
- verify collection paths for handmade, vintage, collectible, antique, oddity and pre-built groupings;
- ensure out-of-stock/archived/private records never leak into public merchandising;
- preserve truthful pricing, availability, shipping/tax and product-number identity;
- define deterministic public merchandising authority using the existing `public_display_priorities`/catalog signals rather than hard-coded duplicates;
- add **automated Top Sellers** ranking from real completed sales/order-line evidence with bounded fallback when insufficient sales exist;
- create a responsive **Top Sellers carousel on the front page**;
- allow reviewed manual pin/priority override without falsifying sales rank;
- prevent the carousel from triggering heavy background work on unrelated pages;
- provide accessible keyboard/touch controls and sensible no-JavaScript/static fallback;
- confirm home/shop/collection SEO, one-H1 discipline, alt text and mobile layout.

### 4. Movies / personal collection catalogue — **THEN**

Movies remains a specialist catalogue surface under `commerce-operations`; it does not need a new top-level application module unless future privacy/access requirements demand isolation.

Current code already has a public movie API/page and Admin API, with JSON base plus optional D1 overlay. Remaining completion work must include:

- audit JSON vs D1 authority and remove ambiguous duplicate/stale overlays;
- confirm all intended DVD/Blu-ray records, edition/version/UPC identity and format data;
- Criterion/special-edition/version details where known;
- cover front/back integrity and Development R2/environment correctness;
- metadata enrichment status/source provenance;
- search/filter by title, UPC, year, actor, director, genre, studio and format;
- collection notes, rarity/value/research fields without presenting estimates as guaranteed sale values;
- admin add/edit/archive/dedupe workflow;
- mobile/desktop public browsing acceptance;
- SEO/noindex decisions based on whether the collection is intended for public discovery;
- no illegal media-streaming functionality: catalogue/trailer/reference links are metadata, not redistribution of owned discs.

### 5. Creative Process / production proof and reversals — **THEN**

Open:

- real correction/reversal end-to-end test;
- polished audited Finished Production reversal UI;
- downstream sale/commit guards;
- lot-aware material selection/costing/provenance;
- Inventory Usage Setup Required queue;
- physical count/adjustment workflow with actor/reason/before/after evidence;
- reviewed lessons/future-project recommendations from evidence;
- profitability using materials, time, packaging and channel fees;
- selected evidence -> Content Studio package/handoff.

Creative Process remains the project/process/material/time/cost authority. Inventory changes only through explicit reviewed shared contracts.

### 6. Packaging Studio physical/regulatory acceptance — **THEN**

Open:

- finish reusable template/library behavior for soap labels, candle tops and additional sizes;
- delete/archive labels/projects safely;
- fix preview/state drift and ingredient/oval overlap;
- static-vs-editable template fields verified against approved reference layout;
- soap type/ingredient/claim libraries and repeat-job templates;
- botanical/color variants and generic/white artwork behavior;
- 100%-size physical bilingual soap-ribbon proof;
- claim/text clearance proof;
- extended/peel-back bilingual template if required;
- supplier Master INCI evidence;
- fragrance allergen review;
- French Review cockpit/history/hard print gate;
- visual/reference diff and owner physical acceptance.

### 7. Media & Content Studio / site enrichment — **THEN**

Open:

- replace P1 required placeholders first;
- replace P2 recommended visuals with real workshop/project evidence;
- page-wide edit mode production test desktop/mobile;
- image assignment/target visibility and before/after pairing quality;
- keep products/inventory/supplies/tools outside inappropriate static-page editing authority;
- CSS/mobile parity checks;
- one H1 and descriptive alt text;
- static page/header/banner/showcase coverage without exposing private CAIP originals.

### 8. Content Studio / social publishing downstream — **THEN**

Open:

- reviewed Creative/CAIP evidence -> channel package;
- scheduling/calendar handoff;
- provider/social publishing connections where supported;
- human approval immediately before release;
- retry/error/dead-letter evidence;
- post-release analytics feeding reviewed lessons;
- never imply an output plan equals publication;
- no unsupported public claim beyond reviewed evidence.

### 9. Business Administration / Accounting / mobile operations — **THEN**

Open:

- finish Accounting workbench and remaining extraction/parity issues;
- row-level approval/posting and AR/AP/journal integrity;
- bank CSV promotion/matching and close/lock workflows;
- accountant month/quarter/year export presets;
- phone dashboard / Today;
- Quick Add Expense;
- Quick Add Write-Off;
- Quick New Product;
- phone-camera evidence/write-off capture;
- responsive low-bandwidth operational surfaces;
- users/settings/security/Application Sanity/release controls acceptance.

### 10. Customer/member experience — **THEN**

Members is functional with profile/account tools, orders, wishlist, reviews and downloads. Finish evidence-driven polish within Commerce & Operations without creating a second customer identity system. Validate checkout/account/order/gift-card/membership recovery paths on mobile and desktop.

### 11. SEO/public discovery pass — **CROSS-CUTTING + FINAL PASS**

Apply continuously during each public subsystem, then run a final public-site pass:

- one clear H1 per exposed page;
- truthful titles/descriptions/canonicals;
- natural searcher wording;
- crawlable descriptive links;
- descriptive alt text;
- real product/process evidence;
- correct structured data where appropriate;
- noindex for private/admin workflows;
- mobile parity/performance;
- Search Console/Business Profile measurement rather than ranking guarantees.

### 12. Go-live / reliability certification — **FINAL DEVELOPMENT GATE**

Before broad Production promotion:

- representative Worker metrics/log review;
- payment/refund smoke proof;
- email delivery proof;
- D1 restore drill;
- R2 Development/Production separation proof;
- critical mobile/desktop screenshots;
- large-media interruption/recovery proof;
- controlled release evidence;
- confirm unrelated pages do not start unnecessary background work;
- module disable/read/manage behavior remains intact;
- final security/session/authorization regression;
- final schema aggregate/fresh-install proof;
- final public navigation/404/error/fallback smoke;
- canonical docs show no P0/P1 go-live blockers.

Only after this gate should we prepare a controlled Production promotion plan. Development completion never silently authorizes Production mutation.

## Build 438 completion evidence

Green evidence:

```text
Full-schema authority                         PASS
Application Core regression                   PASS (20/20)
Route map                                      PASS (53 + 7 shared contracts)
Catalog/server alignment                       PASS (61/61)
Access policy                                  PASS (12/12)
Session resilience                             PASS (6/6)
Console/strict helper                          PASS (10/10)
Pages invocation routing                       PASS (10/10)
Authenticated acceptance safety                PASS (18/18)
Development migration                          APPLIED / PASS
Human read-only D1 verification                PASS / 0 writes
Strict self-asserting D1 verification          PASS / 0 writes
Live module isolation                          PASS (3/3)
Current-state route proof                      PASS (4/4)
Authenticated Admin acceptance                 PASS (31/31)
```

Final Development module state:

```text
3 modules enabled
6 role rows exact
Admin manage on all three
all background permissions OFF
Core Health PASS
Pages guard active
shared read contracts live-proven
read-level non-read enforcement live-proven
final module/role state restored
```

## Existing public merchandising authority

Build 264 already introduced `public_display_priorities` plus editable Home/Shop/Collections content slots. Future Top Sellers/front-page carousel work must extend these existing authorities rather than create hard-coded parallel merchandising data.

## Remaining schema/parity technical debt

Known but **not automatically next and not authorized**:

```text
Fractional Inventory / Creative Project numeric rebuilds
Product / foreign-key rebuilds
Accounting default / nullability rebuilds
Other structural drift
```

Address structural drift when a coherent subsystem completion gate proves it is required; do not perform broad rebuilds merely because they are listed here.

## Release safety state

```text
Build 437 Membership token                     SPENT / COMPLETE
Build 438 Development                          PROVEN
Build 438 Production migration                 NOT AUTHORIZED
Build 439                                      ACTIVE / DEVELOPMENT BROWSER ACCEPTANCE OPEN
R2/provider mutation                           DISABLED unless explicitly scoped
CAIP D1-only copy                              FORBIDDEN
Broad Production promotion                     CLOSED
Main/Production broad promotion                FROZEN
```

## Documentation rule

`AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` are the two canonical current cross-project authorities. Build-specific files remain specialist/history evidence and do not override these canonical files. Every coherent subsystem completion must update these canonical files so a new AI/chat can resume without rediscovering the backlog.
