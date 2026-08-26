# Devil n Dove Project Status and Roadmap — Build 438 Development-Proven / Build 437 Production Baseline

This is the **second of two canonical current project files**. Read `AI_HANDOFF.md` first for architecture, authority and safety. This file owns ordered open functionality.

## Current baseline

**Production-proven baseline: Build 437.**

**Current completed Development architecture release: Build 438 — Application Core / Module Activation.**

Build 438 is **DEVELOPMENT-PROVEN**. Production Build 438 D1 is not authorized.

## Module architecture

| Layer/module | Scope | Development state |
|---|---|---|
| Application Core | auth/session, module lifecycle, route/service authority, recovery/security/runtime helpers | PROVEN |
| `commerce-operations` | storefront/member, Catalog, Inventory, Orders, Membership, Gift Cards, customer/operations workflows | enabled; isolation + authenticated acceptance proven |
| `creative-production` | Creative Process, CAIP, Packaging, Media/Content, Content Studio | enabled; isolation + authenticated acceptance proven |
| `business-administration` | Accounting, Analytics/SEO, users/settings/security, release/platform controls | enabled; isolation + authenticated acceptance proven |

Customer Commerce and Member Account remain separate UX surfaces inside Commerce & Operations.

## Build 438 completion

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

The browser acceptance runner contains no direct SQL, does not invoke `inventory-post`/`inventory-reverse`, and uses read-only shared probes. A separate before/after business-row-count sample was not captured; do not claim that specific measurement.

## Build 439 — P0 / NEXT

### CAIP Media / Video Evidence Review

**Status: NEXT COHERENT FEATURE FAMILY**

Goal: turn the existing CAIP private-media/intake foundation into a first-class reviewed evidence workflow without duplicating Creative Process or Content Studio authority.

Planned Build 439 scope:

1. playable video/media review in CAIP;
2. exact point timecodes and bounded start/end ranges;
3. evidence categories: technique, problem, result, lesson, material/process proof, safety/quality note;
4. evidence notes, confidence/review state and reviewer identity;
5. evidence markers tied to the existing CAIP media/project identity;
6. timeline/list review UI with seek-to-marker behavior;
7. draft story segments generated only from reviewed evidence;
8. explicit human approval before Content Studio refresh/handoff;
9. derivative requests generated only from approved story needs;
10. bounded processing-job foundation for proxy/thumbnail/frame/audio/transcript;
11. provider-output verification before a processing job can be complete;
12. retry/failure state that does not loop on Cloudflare CPU/resource failures;
13. private originals remain private and authoritative;
14. large-media resumability/integrity rules remain intact;
15. no automatic publication or unsupported public claims;
16. no Product/Inventory identity duplication;
17. no D1-only copying of CAIP media without matching R2 objects;
18. mobile/desktop review usability;
19. local/source regression package;
20. Markdown handoff/roadmap update after the coherent family is implemented.

## P1 — Creative Process / production proof and reversals

Still open:

- real correction/reversal end-to-end test;
- polished audited Finished Production reversal UI;
- downstream sale/commit guards;
- lot-aware material selection/costing/provenance;
- Inventory Usage Setup Required queue;
- physical count/adjustment workflow with actor/reason/before/after evidence.

## P1 — Packaging Studio physical/regulatory acceptance

Still open:

- 100%-size physical bilingual soap-ribbon proof;
- claim/text clearance proof;
- extended/peel-back bilingual template if required;
- supplier Master INCI evidence;
- fragrance allergen review;
- French Review cockpit/history/hard print gate;
- visual/reference diff and owner physical acceptance.

## P1 — Product / Inventory operational completion

Still open:

- Product Delete Reference Inspector with Open/Resolve;
- audited Finished Production reversal;
- lot-aware costing/provenance;
- Product Ingredient Review queue;
- Media Integrity Review;
- classification/physical-count adjustments;
- supplier/source provenance cleanup.

## P1 — Media & Content Studio

Still open:

- replace P1 required placeholders first;
- replace P2 recommended visuals with real workshop/project evidence;
- production-test page-wide Edit mode desktop/mobile;
- continue CSS/mobile parity checks;
- keep one H1 and descriptive alt text.

## P1 — Content/social publishing downstream

Still open:

- reviewed scheduling/calendar handoff;
- provider/social publishing connections where supported;
- human approval immediately before release;
- retry/error/dead-letter evidence;
- post-release analytics feeding reviewed lessons;
- never imply an output plan equals publication.

## P2 — Mobile operator/business workflows

Still requested:

- phone dashboard / Today;
- Quick Add Expense;
- Quick Add Write-Off;
- Quick New Product;
- barcode-first receiving;
- phone-camera evidence/write-off capture;
- accountant month/quarter/year export presets;
- responsive low-bandwidth operational surfaces.

## P2 — Customer/member experience

Members is functional with profile/account tools, orders, wishlist, reviews and downloads. Continue evidence-driven polish within Commerce & Operations; do not create a second customer identity system.

## P2 — Go-live / reliability

Before broad Production promotion:

- representative Worker metrics/log review;
- payment/refund smoke proof;
- email delivery proof;
- D1 restore drill;
- R2 environment/separation proof;
- critical mobile/desktop screenshots;
- large-media interruption/recovery proof;
- controlled release evidence;
- confirm unrelated pages do not start unnecessary background work.

## P2 — SEO/local search

Continue one clear H1, truthful titles/descriptions/canonicals, natural searcher wording, crawlable links, descriptive alt text, real product/process evidence, mobile parity and measured Search Console/Business Profile outcomes. No first-page guarantee.

## Remaining schema/parity technical debt

Known but **not automatically next and not authorized**:

```text
Fractional Inventory / Creative Project numeric rebuilds
Product / foreign-key rebuilds
Accounting default / nullability rebuilds
Other structural drift
```

## Release safety state

```text
Build 437 Membership token                     SPENT / COMPLETE
Build 438 Development                          PROVEN
Build 438 Production migration                 NOT AUTHORIZED
Build 439                                      DEVELOPMENT FEATURE WORK NEXT
R2/provider mutation                           DISABLED unless explicitly scoped
CAIP D1-only copy                              FORBIDDEN
Broad Production promotion                     CLOSED
Main/Production broad promotion                FROZEN
```

## Documentation rule

`AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` are the two canonical current cross-project authorities. `BUILD438_DEVELOPMENT_AUTHORITY_EVIDENCE.md` is the detailed Build 438 proof. Build-specific files remain specialist/history evidence and do not override these canonical files.
