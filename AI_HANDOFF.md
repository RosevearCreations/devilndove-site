# AI Handoff — Development Build 443

Updated: 2026-08-27

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. These are the two full mutable current-state authorities. Historical `BUILD*.md`, numbered migrations and archived evidence are provenance unless explicitly named by the active release gate.

## Current release

- Development release: **Build 443 — editable Home carousel / safe static fallback**
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev`
- Separate live Production: `main` / `devilndove-site`, baseline Build 437
- Production promotion: **CLOSED**

Build 442 closed its exact Development checkpoint at `b8868c9b77ad12de4fee4984274fe80e1d096613`, with source gate, Windows D1 transport and Cloudflare deployment `b72eb8b4-ac52-4b12-bdd2-cd85ea6b400d` green. Build 443 implements the Home carousel schema/API/editor/runtime with a static-hero fallback. Historical payment/CAIP/build work remains provenance; unfinished proof is carried forward as a Build 443 **HOLD**, never as an obsolete active requirement or false PASS.

## Accepted inherited evidence

Build 440 Product/Inventory/Tools source/Windows D1 gates are green. Authenticated Development acceptance proved admin authentication, Product reversible save/persist/restore and safe 404 handling, Inventory/kit ownership/failure guards with no side effects, Tool identity/history/publication/failure guards with unchanged state, and public Tool/Supply D1 authority with no fallback. The 35/35 cross-mutation/responsive source gate is permanent regression coverage.

Automated live responsive viewport proof was blocked by the correct CSP `frame-ancestors 'none'` and Firefox popup protection. This is a harness limitation, not an observed responsive defect; do not weaken CSP.

## Current HOLDs

- **CAR-443-H1:** apply/verify the additive carousel schema, then prove audited draft/preview/publish/pause/schedule and all public fallback behavior.
- **IT-443-H1/H2:** apply/verify the Development D1 `it-platform`/explicit user-grant authority before activating Phase B route/API/UI enforcement.
- **PAY-443-H1:** Stripe Development test configuration, simulated checkout, return, signed webhook and duplicate replay evidence.
- **PAY-443-H2:** PayPal sandbox configuration, approval/capture, return, verified webhook and duplicate replay evidence.
- **CAIP-443-H1:** source/schema/fail-closed artifact safeguards are retained, but Development private R2 delivery, byte/range seeking, exact timecode/range evidence, storage audit and expected provider-off behavior still need live proof.
- **Separate live Production promotion HOLD:** deliberate until explicit owner authorization and all promotion gates are green.

## Authority invariants

- D1 is authoritative for Product/Inventory operational state.
- Desktop/mobile Product resource saves share one atomic persistence authority.
- Catalog owns public Tool/Supply eligibility; Inventory owns live identity/metadata/lifecycle.
- Legacy Tool/Supply JSON is emergency read-only fallback only.
- Request-time schema repair is not accepted architecture.
- Historical build numbers may remain in migration/test names as provenance; `development-release.json` is the active release identity.
- CI is repository-read-only.

## I.T. & Platform

The carried Build 442 migration registers the fourth-module and explicit per-user grant authority, but runtime enforcement remains intentionally off until remote D1 proof. `/admin/it-platform/` now keeps the Build 443 carousel, payment, CAIP and I.T. obstacles, correction mechanics, safe payment readiness and pass conditions together. Do not imply live carousel editing, I.T. Phase B or provider acceptance is complete from source evidence alone.

## Development workflow

1. Work on `dev` only.
2. Run `.github/workflows/build443-system-gate.yml` on the exact resulting head.
3. Treat inherited 439/440 scripts as regression provenance, not active release numbers.
4. Record unresolved evidence as a Build 443 HOLD, then renumber it forward if Development advances.
5. Deploy only to `devilndove-site-dev` for Development acceptance.
6. Never mutate `main` / `devilndove-site` without explicit authorization.

## Repository hygiene

Historical root build reports with exact copies under `docs/archive/build-history/` are retired from root. Git plus the archive preserves evidence. Never delete migrations/runtime/tests because their filenames are old. See `docs/operations/REPOSITORY_HYGIENE.md`.

## Feature direction

The active feature register is in `PROJECT_STATUS_AND_ROADMAP.md`. Build 443 delivers the editable responsive Home carousel source/editor/runtime/fallback. The next bounded increment is guarded D1/live carousel acceptance, followed by approved-media selection and restore/version review after the exact Development checkpoint.
