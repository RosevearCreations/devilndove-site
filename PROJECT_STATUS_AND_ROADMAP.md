# Project Status and Roadmap — Development Build 440

Updated: 2026-08-27

This is the ordered execution companion to `AI_HANDOFF.md`. Those two files are the canonical mutable project documents.

## Release status

- Current Development release: **Build 440**
- Canonical marker: `development-release.json`
- Build 440 source/CI: **CLOSED / GREEN**
- Full green baseline: GitHub Actions Build 440 gate #71 at `98bd53f2`
- Development live acceptance: **NEXT**
- Build 439 CAIP media/video live-browser acceptance: **OPEN / SEPARATE**
- Production baseline: **Build 437**
- Production promotion: **CLOSED**

A newer `dev` commit supersedes the baseline SHA only after the same Build 440 gate and Development Pages deployment check pass on that exact commit.

## What is complete

### Release alignment
- Active Development runtime cache/version majors are Build 440.
- Service worker shell identity is Build 440.
- `development-release.json` is the canonical release authority.
- Old one-time self-writing GitHub Actions synchronization workflows are retired.
- Active CI is repository-read-only.
- Retained compatibility regressions derive current cache release instead of demanding obsolete cache versions.

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
Source/CI green is necessary but not sufficient. We still need proof against the deployed `devilndove-site-dev` commit:

- exact commit deployed successfully
- Admin authentication succeeds
- relevant Admin APIs return expected Build/current authority responses
- Product resource read/save behavior works through the deployed app
- mobile Product capture uses the shared Product resource authority
- Inventory/kit paths enforce owner and stock safety
- Tool lifecycle/history/publication view works
- desktop/tablet/mobile layouts have no blocking overlap or off-screen controls

Use reversible fixtures/no-op writes where practical. Do not create business-history noise merely to prove a test.

### 2. Build 439 CAIP media/video live evidence acceptance
Build 439 source/schema work is retained, but its Development media/browser evidence review must be completed explicitly. Do not infer closure from Build 440 CI.

### 3. Development schema/data sanity
After live acceptance, confirm:

- fresh-install aggregate schema remains complete
- required Build 440 migration ledger state is present
- no request-time schema repair has returned
- no legacy JSON write authority has returned
- Inventory/Product/Tool authority relationships match source contracts
- no Development repair utility is accidentally exposed to Production

## Ordered next steps

1. Finish this Build 440 canonical-document/currentness update and obtain a green Build 440 gate on its exact commit.
2. Confirm Cloudflare Pages Development deployment is green on that same commit.
3. Run Build 440 Development live acceptance: Admin auth, Product, mobile Product, Inventory/kit, Tool lifecycle/publication and responsive views.
4. Resolve any live defect as Build 440 and re-run the full exact-head gate; do not skip forward around failures.
5. Complete Build 439 CAIP media/video live-browser evidence acceptance.
6. Run final Development schema/data/current-authority sanity checks.
7. Record a Build 440 closure checkpoint.
8. Define the next Development release only after the above acceptance items are closed.
9. Consider Production promotion only as a separate explicit decision; until then, Production promotion remains **CLOSED**.

## Definition of Build 440 Development closure

Build 440 is Development-closed only when all are true:

- canonical release alignment green
- release-contract integrity green
- cross-mutation/mobile/desktop source acceptance green
- full pre/post aggregate source gate green
- Windows D1 transport gate green
- exact-head Cloudflare Pages Development deployment green
- authenticated live Development acceptance green
- remaining Build 439 media/video live acceptance explicitly resolved or separately documented as intentionally deferred
- canonical docs reflect that exact state
- Production has not been mutated during Development acceptance

## Documentation rule

Do not use a numbered historical build document as the current roadmap. `AI_HANDOFF.md` and this file are canonical. `AI_CONTEXT.md`, `NEW_CHAT_STATUS.md`, `DEVELOPMENT_ROADMAP.md` and `MARKDOWN_INDEX.md` are compatibility/index pointers and must remain thin enough not to become competing roadmaps.
