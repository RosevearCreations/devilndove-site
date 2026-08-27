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

## Ordered next steps

1. Run Build 440 Development live acceptance against the exact-head `devilndove-site-dev` Production deployment: Admin auth, Product, mobile Product, Inventory/kit, Tool lifecycle/publication and responsive views.
2. Resolve any live defect as Build 440 and re-run the full exact-head gate plus the Dev-project Production deployment; do not skip forward around failures.
3. Complete Build 439 CAIP media/video live-browser evidence acceptance against the same Dev-project Production release.
4. Run final Development schema/data/current-authority sanity checks.
5. Record a Build 440 closure checkpoint.
6. Define the next Development release only after the above acceptance items are closed.
7. Consider promotion to the separate live `main` / `devilndove-site` Production site only as a distinct explicit decision; until then that promotion remains **CLOSED**.

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