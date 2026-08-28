# AI Handoff — Development Build 446

Updated: 2026-08-28

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. These are the two mutable current-state authorities. Git history is the historical archive.

## Current release

- Development release: **Build 446 — deep repository retirement / forward sanity**
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev`
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Previous fully green/deployed checkpoint: **Build 445 / `f50e6d61deb31de9c17b12b55d6649a7779fdb95`**
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Build 446 repository policy

The active tree is not a historical filing cabinet. Build-by-build Markdown, archived release snapshots, superseded incremental migrations, one-off evidence generators and inactive regression scripts belong in Git history only. `database_full_schema.sql` is the aggregate fresh-install authority. Standalone Build 440/442/443 SQL/scripts remain only because they are still part of guarded Development recovery and current CI regression coverage.

The canonical repository sanity command is:

```bash
python scripts/repository_forward_sanity.py
```

Do not create new `BUILD###_CHANGED_FILES.md`, `BUILD###_VALIDATION.md`, `docs/releases`, or `docs/archive` trees. A future release replaces the current system gate instead of accumulating another permanent gate.

## Accepted inherited evidence

Product/Inventory/Tools source and Windows D1 transport gates are green. Authenticated Development acceptance previously proved reversible Product save/restore, Inventory/kit ownership/failure guards, Tool identity/history/publication/failure behavior, and public Tool/Supply D1 authority. Cross-mutation/responsive source coverage remains permanent regression coverage. Do not weaken CSP to satisfy an automation harness.

## Current HOLDs

- **CAR-446-H1:** use read-only infrastructure readiness to determine whether carousel schema is already present; only if absent, use the retained guarded Development migration, then prove draft/preview/publish/pause/schedule/fallback behavior.
- **IT-446-H1/H2:** use readiness to determine whether explicit I.T. user-grant authority exists; only if absent, use the retained guarded migration before Phase B enforcement.
- **PAY-446-H1/H2:** Stripe Development and PayPal sandbox end-to-end checkout/return/webhook/replay evidence.
- **CAIP-446-H1:** Development private R2 delivery/range/timecode/storage evidence.
- **OPS-446-H1:** separate live Production promotion remains closed by policy.

## Invariants

- D1 is authoritative for operational state; no request-time DDL.
- Legacy JSON is not write authority.
- CI never applies D1 or mutates providers/Production.
- Public pages preserve SEO basics including one meaningful H1 and truthful metadata/schema.
- Storefront, Creators/CAIP, Finance/Accounting and I.T. remain distinct application domains with explicit ownership.
- Unresolved work always moves to the active release; old build numbers are provenance, not active requirements.

## Workflow

1. Work on `dev` only.
2. Run `.github/workflows/build446-system-gate.yml` on the exact resulting head.
3. Deploy only the exact green head to `devilndove-site-dev`.
4. Use read-only D1/R2 readiness before any guarded recovery action.
5. Keep separate live Production untouched without explicit authorization.
