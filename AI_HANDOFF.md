# AI Handoff — Development Build 441

Updated: 2026-08-27

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. These are the two full mutable current-state authorities. Historical `BUILD*.md`, numbered migrations and archived evidence are provenance unless explicitly named by the active release gate.

## Current release

- Development release: **Build 441**
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev`
- Separate live Production: `main` / `devilndove-site`, baseline Build 437
- Production promotion: **CLOSED**

Build 441 is a system convergence release. Builds 439/440 remain regression provenance; unfinished proof is carried forward as a Build 441 **HOLD**, never as a separate active release and never as a false PASS.

## Accepted inherited evidence

Build 440 Product/Inventory/Tools source/Windows D1 gates are green. Authenticated Development acceptance proved admin authentication, Product reversible save/persist/restore and safe 404 handling, Inventory/kit ownership/failure guards with no side effects, Tool identity/history/publication/failure guards with unchanged state, and public Tool/Supply D1 authority with no fallback. The 35/35 cross-mutation/responsive source gate is permanent regression coverage.

Automated live responsive viewport proof was blocked by the correct CSP `frame-ancestors 'none'` and Firefox popup protection. This is a harness limitation, not an observed responsive defect; do not weaken CSP.

## Current HOLDs

- **CAIP private media evidence HOLD:** source/schema/fail-closed artifact safeguards are retained, but Development private R2 delivery, byte/range seeking, exact timecode/range evidence, storage audit and expected provider-off behavior still need live proof. This blocks separate live Production promotion, not continued Development development.
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

Build 441 activates a read-only operator hub at `/admin/it-platform/` and makes I.T. the documentation/operational home for Preflight, Startup Release Guide, technical HOLDs, deployment/schema/runtime/storage/recovery evidence and release stop conditions. Full fourth-module registry integration and explicit per-user I.T. read/manage enforcement remain Build 442+ work; do not imply those controls are already complete.

## Development workflow

1. Work on `dev` only.
2. Run `.github/workflows/build441-system-gate.yml` on the exact resulting head.
3. Treat inherited 439/440 scripts as regression provenance, not active release numbers.
4. Record unresolved evidence as a Build 441 HOLD.
5. Deploy only to `devilndove-site-dev` for Development acceptance.
6. Never mutate `main` / `devilndove-site` without explicit authorization.

## Repository hygiene

Historical root build reports with exact copies under `docs/archive/build-history/` are retired from root. Git plus the archive preserves evidence. Never delete migrations/runtime/tests because their filenames are old. See `docs/operations/REPOSITORY_HYGIENE.md`.

## Feature direction

The active feature register is in `PROJECT_STATUS_AND_ROADMAP.md` and includes I.T./preflight, Shop/customer experience, Home carousel/merchandising, Catalog/Collections, Inventory, Tools, Creative/CAIP, Gallery, Movies/media, Packaging, Orders/Payments/Accounting, SEO/content/analytics, reliability/security/backup and go-live work.
