# AI Handoff — Development Build 440

Updated: 2026-08-27

This is one of two canonical mutable project documents. Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. Numbered `BUILD*.md`, numbered migrations, archived validation files, and old compatibility scripts are historical evidence unless this document explicitly names them as a current authority.

## Current release state

- Development release: **Build 440**
- Canonical Development release marker: `development-release.json`
- Development branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Build 440 source/CI: **CLOSED / GREEN**
- Exact-head Development Pages deployment: **GREEN**
- Development live/authenticated acceptance: **NEXT**
- Production baseline: **Build 437**
- Production branch: `main`
- Production promotion: **CLOSED**
- Broad Production changes require separate explicit authorization.

Build 440 release health is enforced on the exact current `dev` head rather than by a permanently hard-coded commit. The current head is acceptable only when the Build 440 GitHub Actions gate and the Cloudflare Pages `devilndove-site-dev` deployment check both pass on that same commit. The gate includes Windows D1 transport, canonical release alignment, release-contract integrity, Product/Inventory/Tools cross-mutation acceptance, mobile/desktop responsive authority checks, pre-sync source gate, lot-provenance aggregate sync, receiving aggregate sync, post-sync source gate, and whitespace/safety checks.

## Acceptance boundaries

### Build 438
Development browser/module acceptance is closed and retained as prior evidence.

### Build 439 — CAIP media/video evidence
The source/schema work remains part of the current application. Its live Development media/browser evidence review is a separate open acceptance item; do not falsely mark it closed merely because Build 440 source/CI is green.

### Build 440 — Product / Inventory / Tools
Source and CI are closed/green. The release-alignment and cross-authority work establishes these contracts:

- Desktop and mobile Product resource saves use the same shared atomic D1 persistence authority.
- Product resource identities are normalized case-insensitively by resource kind + source key.
- Missing/non-positive use-per-batch and lot-size values default safely to 1.
- Purchased-kit component depletion uses Inventory-owned movement/lot authorities.
- Product stock cannot be depleted from the Kit workspace.
- Tool usage is reusable evidence, not false stock consumption.
- `out_of_service` and `retired` Tool lifecycle states enforce do-not-reuse until explicit reactivation.
- `catalog_items` controls public Tool/Supply publication eligibility.
- `site_item_inventory` controls live Tool/Supply operational identity, name, category, image, stock and lifecycle metadata.
- Inventory-only internal Tool/Supply rows are not exposed publicly.
- Legacy Tool/Supply JSON is emergency read-only fallback only; runtime re-import is disabled.
- Product cost schema is migration/accounting-owned; request-time DDL is not allowed.
- Mobile and desktop must not have separate mutation authorities for the same business action.
- Active GitHub Actions workflows are read-only with respect to repository contents; one-time self-pushing synchronization workflows are retired.

## Data and schema authority

D1/SQLite is authoritative for application state. JSON may remain for fixtures, import provenance, emergency read-only fallback, or static content where explicitly designed, but it must not silently become a competing write authority.

Current fresh-install/schema authority is:

1. `database_full_schema.sql`
2. numbered, ledgered migrations required after that schema boundary
3. Build 440 focused migrations/verifiers and their aggregate-schema synchronization tests
4. runtime APIs that assume those migration-owned structures already exist

`database_upgrade_current_pass.sql` is a legacy compatibility snapshot retained for older Build 243/244 regression coverage. It currently contains Build 264-era SQL and is **not** the current Development release authority, the Build 440 aggregate schema, or a file that should be relabeled without matching SQL content.

Request-time schema repair is prohibited in normal Product/Inventory/Tool paths. If a table/column/index is required, add or repair it through the owned migration/schema path and verify fresh-install parity.

## Product authority

Products are D1-backed. Important current rules:

- Product deletion uses bounded, classified references and preserves protected history.
- Reviewed inventory release/return and eligible Product cleanup are atomic where required.
- Product resource persistence is shared by desktop and mobile through `functions/api/admin/_productResourcePersistence.js`.
- Resource link readback resolves human-readable Inventory/catalog names.
- Product media integrity counts distinct Products needing review rather than issue types.
- Finished Product production/reversal, raw material lot provenance and commitment guards remain fail-closed.

## Inventory authority

Primary operational identity is `site_item_inventory`.

- Case/whitespace differences must not split the same Tool/Supply identity.
- Fractional usage is represented through usage profiles/movements.
- Purchase lots carry source/landed-cost provenance.
- Receiving and reversal are explicit, auditable operations.
- Physical counts are audited/concurrency guarded.
- Kits use Inventory-owned parent/component movements and provenance.
- Legacy JSON catalogs cannot repopulate or overwrite reviewed D1 Inventory at request time.

## Tool authority

Tool identity remains Inventory-owned. Build 440 adds a bounded completeness/lifecycle view over Inventory identity and balance, supplier metadata, catalog/publication linkage, lifecycle profile/history, and reusable usage history. Lifecycle mutation is explicit and audited. There is no polling/retry loop and no R2/provider mutation in the Tool lifecycle path.

## Release/version authority

`development-release.json` is the one active Development release number.

All live cache-busting majors must match Build 440. Minor cache revisions such as `?v=440.3` are allowed. Historical build numbers may remain in migration filenames, comments, regression names and archived evidence when they describe origin/history; they must not be used as active runtime cache versions or current release labels.

The permanent gates are:

- `scripts/build440_development_release_alignment_test.py`
- `scripts/build440_release_contract_integrity_test.py`
- `scripts/build440_cross_mutation_responsive_acceptance_test.py`
- `scripts/build440_product_inventory_tools_source_gate.py`
- `.github/workflows/build440-source-gate.yml`

## Development workflow

1. Work only on `dev`.
2. Keep `development-release.json` canonical.
3. Require the Build 440 gate green on the exact resulting commit.
4. Require the Cloudflare Pages `devilndove-site-dev` deployment check green on that same commit.
5. Perform Development live/authenticated acceptance against that exact deployed head.
6. Record unresolved defects instead of weakening gates.
7. Do not promote to `main` until explicitly authorized.

## Immediate next work

1. Perform exact-head Development live/authenticated acceptance for Build 440.
2. Exercise authenticated desktop/mobile Product, Inventory and Tool paths against Development with reversible or read-only evidence as appropriate.
3. Close the remaining Build 439 CAIP media/video live-browser evidence acceptance.
4. Re-run a Development schema/data/current-authority sanity check after live acceptance.
5. Record the Build 440 Development closure checkpoint only when those acceptance items are resolved.
6. Define the next numbered Development release after closure.
7. Keep Production promotion closed until a separate promotion decision.

## Non-negotiable safety rules

- Never contact or mutate Production unless explicitly authorized.
- Never fabricate historical lot/media/usage provenance.
- Never convert a failed write into a partial success silently.
- Never use request-time DDL as a substitute for migration ownership.
- Never let mobile and desktop drift into different business authorities.
- Never let an old cache/build number become a current release contract.
