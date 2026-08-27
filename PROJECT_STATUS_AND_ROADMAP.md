# Project Status and Roadmap — Development Build 440

Updated: 2026-08-27

This is the ordered execution companion to `AI_HANDOFF.md`. Those two files are the canonical mutable project documents.

## Release status

- Current Development release: **Build 440**
- Canonical marker: `development-release.json`
- Build 440 source/CI: **CLOSED / GREEN**
- Exact-head `devilndove-site-dev` Cloudflare Pages **Production deployment**: **GREEN**
- Development live/authenticated acceptance against that Dev-project Production deployment: **NEXT**
- Build 439 CAIP media/video live-browser acceptance: **OPEN / SEPARATE**
- Separate live Production baseline (`main` / `devilndove-site`): **Build 437**
- Separate live Production promotion: **CLOSED**

Do not infer currentness from an old commit number. The current `dev` head is release-valid only when the Build 440 GitHub Actions gate and the `devilndove-site-dev` Cloudflare Pages **Production deployment** check both pass on that exact commit. A preview deployment from another branch is not equivalent evidence. The separate live `devilndove-site` project remains outside this Development release path unless explicitly authorized.

## What is complete

### Release alignment
- Active Development runtime cache/version majors are Build 440.
- Minor cache revisions may use the Build 440 major, for example `440.3`.
- Service worker shell identity is Build 440.
- `development-release.json` is the canonical release authority.
- Old one-time self-writing GitHub Actions synchronization workflows are retired.
- Active CI is repository-read-only.
- Retained compatibility regressions derive current cache release instead of demanding obsolete cache versions.
- Canonical AI/status documentation and compatibility pointers are Build 440-aligned.
- The `dev` branch is the source branch for the `devilndove-site-dev` Pages project's Production deployment.

### Product
- Desktop/mobile Product resource persistence is shared and atomic.
- Resource kind/key identity is case-insensitively normalized and deduplicated.
- Safe defaults are enforced for use-per-batch and lot-size.
- Product deletion/reference inspection is bounded and history-aware.
- Product cost schema ownership is migration/accounting-owned.
- Product media integrity uses distinct Product review counts.

### Inventory
- Case-normalized Inventory identity is retained.
- Fractional/reusable usage ledgers are authoritative.
- Purchase-lot/source provenance, receiving and compensating reversal are covered.
- Finished production/reversal and commitment safety are fail-closed.
- Kit opening/component usage is Inventory-owned and D1 batch tested.
- Product cross-mutation from the Kit workspace is blocked.
- Internal-only Tool/Supply Inventory rows do not become public by accident.

### Tools and Supplies
- Public eligibility comes from `catalog_items`.
- Live operational identity/metadata comes from `site_item_inventory`.
- Legacy JSON is emergency read-only fallback only.
- Tool lifecycle, service/inspection history, publication linkage and reusable usage history are available in one bounded Admin workspace.
- Out-of-service/retired Tools enforce do-not-reuse until explicit reactivation.

### Desktop/mobile acceptance at source level
- Product desktop and mobile paths share the same persistence authority.
- Current Admin Product/Inventory/Tool surfaces are source-checked for responsive tablet/phone behavior.
- No device-specific mutation authority is allowed for the same operation.
- Cross-mutation/responsive regression is part of the permanent Build 440 gate.

## What remains open

### 1. Exact-head Development live acceptance
Source/CI and the `devilndove-site-dev` Production deployment are green, but live application behavior still needs explicit proof against that deployed Dev-project Production surface:

- Admin authentication succeeds
- relevant Admin APIs return expected current authority responses
- Product resource read/save behavior works through the deployed app
- mobile Product capture uses the shared Product resource authority
- Inventory/kit paths enforce owner and stock safety
- Tool lifecycle/history/publication view works
- desktop/tablet/mobile layouts have no blocking overlap or off-screen controls

Use reversible fixtures/no-op writes where practical. Do not create business-history noise merely to prove a test.

### 2. Build 439 CAIP media/video live evidence acceptance
Build 439 source/schema work is retained, but its Development media/browser evidence review must be completed explicitly against the Dev-project Production deployment. Do not infer closure from Build 440 CI.

### 3. Development schema/data sanity
After live acceptance, confirm:

- fresh-install aggregate schema remains complete
- required Build 440 migration ledger state is present
- no request-time schema repair has returned
- no legacy JSON write authority has returned
- Inventory/Product/Tool authority relationships match source contracts
- no Development repair utility can reach or mutate the separate live Production project

### 4. Complete outstanding-task register

This is the single current task inventory. Historical `BUILD*.md` lists do not
add work unless an item is retained here. Every item requires its applicable
source/schema, fallback, responsive, regression, deployment and live or physical
evidence before closure.

#### Release, sanity and architecture

| ID | Task | State |
| --- | --- | --- |
| REL-01 | Finish exact-head Build 440 authenticated Development acceptance | **IN PROGRESS / LOGIN REQUIRED** |
| REL-02 | Correct live defects, rerun the full gate and redeploy the exact corrected head | **CONDITIONAL** |
| REL-03 | Finish Build 439 CAIP media/video live acceptance | **OPEN** |
| REL-04 | Verify Development D1 ledger/data/current authorities after browser acceptance | **OPEN** |
| REL-05 | Record Build 440 closure; keep separate live Production promotion closed | **OPEN / PROMOTION LOCKED** |
| MOD-01 | Preserve the three proven business modules while adding approved fourth module `it-platform` | **NEXT RELEASE** |
| MOD-02 | Finish incremental shadow/legacy route-runtime extraction and remove compatibility only after proof | **OPEN** |
| MOD-03 | Keep named cross-module contracts, shared desktop/mobile authorities and zero inactive-module work | **PERMANENT GATE** |

#### I.T. & Platform module

Detailed authority: `docs/architecture/IT_MODULE_ARCHITECTURE.md`.

| ID | Task | State |
| --- | --- | --- |
| IT-01 | Add `it-platform` to registry, route maps, D1 seeds and four-module health | **APPROVED NEXT** |
| IT-02 | Add explicit per-user I.T. read/manage grants; ordinary admin role alone is insufficient | **APPROVED** |
| IT-03 | Reclassify deployment, schema, runtime, storage, recovery and incident routes to I.T. | **APPROVED** |
| IT-04 | Add plain-language I.T. health with collapsible technical evidence | **APPROVED** |
| IT-05 | Show creators only Healthy / Needs I.T. review / Maintenance active | **APPROVED** |
| IT-06 | Prove creator, ungranted-admin and read-only denial at navigation/page/API/runtime levels | **OPEN** |
| IT-07 | Add bounded read-only release/schema/runtime/storage/provider/module health contracts | **OPEN** |
| IT-08 | Add environment-locked audited repair controls one workstream at a time | **FUTURE / GATED** |
| IT-09 | Add scheduled/event-driven technical checks only with module, job and background permission | **FUTURE / GATED** |

#### CAIP, Creative Projects and knowledge

| ID | Task | State |
| --- | --- | --- |
| CAIP-01 | Prove exact timecode/range evidence, private R2 review/range seeking and storage audit live | **OPEN** |
| CAIP-02 | Add bounded proxy, thumbnail/frame, audio and transcript execution with verified artifacts | **OPEN / PROVIDERS OFF** |
| CAIP-03 | Add capped retry/dead-letter behavior without Worker retry amplification | **OPEN** |
| CAIP-04 | Complete reviewed Creative Project → CAIP → Content Studio package handoff | **OPEN** |
| CAIP-05 | Require explicit material-usage review before Inventory consumption/reversal | **OPEN** |
| CAIP-06 | Generate reviewed lessons and future-project recommendations from selected evidence | **OPEN** |
| CAIP-07 | Calculate project profitability from material lots, time, packaging and channel fees | **OPEN** |
| CAIP-08 | Support optional client storyboard/private notes without public leakage | **OPEN** |
| CAIP-09 | Keep human approval before story, derivative, release, calendar or publication handoff | **PERMANENT GATE** |

#### Packaging and labeling

| ID | Task | State |
| --- | --- | --- |
| PKG-01 | Print/wrap soap profiles at 100% and settle 38.1 mm versus 50 mm geometry | **OWNER PHYSICAL EVIDENCE** |
| PKG-02 | Add true prepress PDF, verified boxes/fonts, printer calibration and deterministic overflow | **OPEN** |
| PKG-03 | Add R2 proof-photo upload and immutable approved-version supersession | **OPEN** |
| PKG-04 | Add verified barcode/QR and transactional batch/lot packaging consumption | **OPEN** |
| PKG-05 | Link reviewed recipe/formula facts to labels without duplicate authority | **OPEN** |
| PKG-06 | Complete bilingual/INCI/formula/claim/net-quantity review per sale product | **OWNER REVIEW** |
| PKG-07 | Measure every candle lid/blank/custom size and complete physical laser/print proof | **OWNER PHYSICAL EVIDENCE** |
| PKG-08 | Add reviewed vector tracing only where a laser workflow requires paths | **OPEN AS NEEDED** |

#### Product, Inventory, Tools and custom commerce

| ID | Task | State |
| --- | --- | --- |
| COM-01 | Finish live Product desktop/mobile, Inventory/kit and Tool lifecycle acceptance | **REL-01** |
| COM-02 | Work physical-count, usage-setup, ingredient and media-integrity queues | **OWNER DATA REVIEW** |
| COM-03 | Reconcile uncertain purchase lots/sources without fabricated history | **OWNER DATA REVIEW** |
| COM-04 | Keep import preview/duplicate validation current; add supplier rules from real failures | **ONGOING** |
| COM-05 | Convert approved payment drafts into processor links and reviewed order drafts into full orders | **OPEN / PROVIDER GATED** |
| COM-06 | Add custom-order status, quote revisions/resend, marketplace CSV validation and related proof | **OPEN** |
| COM-07 | Add public consent capture, review/photo prompts and post-order proof workflow | **OPEN** |
| COM-08 | Keep deletion, reversal, receiving, kit and stock actions atomic/audited/fail-closed | **PERMANENT GATE** |

#### Media and public visuals

| ID | Task | State |
| --- | --- | --- |
| MED-01 | Replace 6 P1 required placeholders with truthful approved images | **OWNER MEDIA NEEDED** |
| MED-02 | Replace 23 P2 recommended placeholders where they improve credibility | **OPEN** |
| MED-03 | Complete item-specific galleries, image roles, alt text, consent and SEO/social images | **OWNER MEDIA REVIEW** |
| MED-04 | Add replace-in-place, thumbnails/variants and reviewed featured-image suggestions | **OPEN** |
| MED-05 | Complete approved before/after, technique, evidence and result proof displays | **OPEN** |
| MED-06 | Keep Product/Inventory/Supply/Tool facts outside Media Studio authority | **PERMANENT BOUNDARY** |

#### Payments, Accounting, SEO and publishing

| ID | Task | State |
| --- | --- | --- |
| BUS-01 | Add scheduled webhook retry/replay/dispatch beyond manual Admin requeue | **OPEN** |
| BUS-02 | Add provider-confirmed refund/dispute sync and exact-once reconciliation | **OPEN** |
| BUS-03 | Prove Stripe/refund/notification/email with owner-controlled live tests; keep PayPal hidden until proven | **LIVE EVIDENCE** |
| BUS-04 | Complete Accounting mappings, AR/AP/journal, tax, fees, profitability, export and close | **OWNER/ACCOUNTANT REVIEW** |
| BUS-05 | Add percentage marketplace fees and shared project-cost allocation | **OPEN** |
| BUS-06 | Preserve one H1, truthful metadata/schema, noindex Admin and local Ontario quality every pass | **PERMANENT GATE** |
| BUS-07 | Replace first-pass search with one bounded unified search authority | **OPEN** |
| BUS-08 | Add consent-aware funnel/campaign/marketplace/post-release analytics | **OPEN** |
| BUS-09 | Complete reviewed social scheduling/publishing and provider/OAuth proof | **OPEN / PROVIDER GATED** |
| BUS-10 | Complete Search Console, sitemap/indexing, Merchant Center and Google Business Profile evidence | **OWNER/EXTERNAL** |

#### Reliability, security, backup and go-live

| ID | Task | State |
| --- | --- | --- |
| OPS-01 | Keep failures structured, sanitized, honest and recoverable without raw HTML/false success | **PERMANENT GATE** |
| OPS-02 | Test roles/permissions for every destructive, financial, approval and I.T. action | **OPEN / RECURRING** |
| OPS-03 | Complete isolated D1/R2/config backup-restore rehearsal and recovery-time evidence | **OPEN** |
| OPS-04 | Monitor Worker CPU/subrequests/5xx and suppress polling/sync when no current job needs it | **ONGOING** |
| OPS-05 | Verify cache/service-worker identity and offline/low-bandwidth recovery each release | **RECURRING** |
| OPS-06 | Complete phone/tablet/laptop/wide responsive, accessibility and performance acceptance | **OPEN / RECURRING** |
| LIVE-01 | Freeze a small launch list with verified facts, stock, media, packaging and owner | **OWNER DECISION** |
| LIVE-02 | Rehearse tax, delivery/pickup, checkout, email, payment, refund and fulfilment | **OPEN** |
| LIVE-03 | Finalize support, policies, privacy/consent, stop conditions and rollback ownership | **OWNER REVIEW** |
| LIVE-04 | Run controlled opening and first-window cross-system reconciliation only after promotion opens | **FUTURE / LOCKED** |

## Ordered next steps

1. Run Build 440 Development live acceptance against the exact-head `devilndove-site-dev` Production deployment: Admin auth, Product, mobile Product, Inventory/kit, Tool lifecycle/publication and responsive views.
2. Resolve any live defect as Build 440 and re-run the full exact-head gate plus the Dev-project Production deployment; do not skip forward around failures.
3. Complete Build 439 CAIP media/video live-browser evidence acceptance against the same Dev-project Production release.
4. Run final Development schema/data/current-authority sanity checks.
5. Record a Build 440 closure checkpoint.
6. Define the next Development release only after the above acceptance items are closed.
7. Implement the approved I.T. & Platform module as the first post-Build-440 section, including creator isolation and explicit I.T. grants.
8. Continue the task register section by section, closing each item through live/physical evidence rather than parallel partial implementation.
9. Consider promotion to the separate live `main` / `devilndove-site` Production site only as a distinct explicit decision; until then that promotion remains **CLOSED**.

## Definition of Build 440 Development closure

Build 440 is Development-closed only when all are true:

- canonical release alignment green
- release-contract integrity green
- cross-mutation/mobile/desktop source acceptance green
- full pre/post aggregate source gate green
- Windows D1 transport gate green
- exact-head Cloudflare Pages `devilndove-site-dev` **Production deployment** green
- authenticated live Development acceptance against that deployment green
- remaining Build 439 media/video live acceptance explicitly resolved or separately documented as intentionally deferred
- canonical docs reflect the actual state
- separate live `main` / `devilndove-site` Production has not been mutated during Development acceptance

## Environment terminology rule

Within this repository, **Dev-project Production** means the Cloudflare Pages Production deployment of project `devilndove-site-dev`, sourced from branch `dev`. It is still Development data/runtime authority. **Separate live Production** means branch `main` and the `devilndove-site` Pages project. Never treat those as the same promotion boundary.

## Documentation rule

Do not use a numbered historical build document as the current roadmap. `AI_HANDOFF.md` and this file are canonical. `AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `MARKDOWN_INDEX.md` are compatibility/index pointers and must remain thin enough not to become competing roadmaps.
