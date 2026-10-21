# Release 467 Build 431 — Release Gate Dashboard & Human-Readable Blocker Reasons

## Delivered scope

- **Admin page:** `/admin/release-gate-status/`, linked from Admin Dashboard and Release Control.
- **Verified-Admin API:** `GET /api/admin/release-gate-status-431` (POST denied). No automatic polling or write actions.
- **Bounded GitHub queries:** read `dev` and `main` HEADs, then four individually addressed Development workflow runs for the **exact `dev` SHA**; separately read Production Pages Deploy for exact `main` SHA. Missing/failing/pending/inaccessible checks are NOT treated as green. Read-only GitHub access uses optional `GITHUB_RELEASE_READ_TOKEN` server-side, never exposed to browser; public API is attempted without it. A private/inaccessible repository surfaces UNKNOWN with explanation rather than a fabricated PASS.
- **Evidence UI:** show exact SHA, workflow-specific pass/HOLD/UNKNOWN, explanation and GitHub run/workflow links. Production GREEN requires exact branches, all four checks, success of the protected Production workflow and the live marker match.
- **Live version marker:** protected Production Pages Deploy now writes a small public `/release-version.json` from the exact approved `main` `GITHUB_SHA` and `GITHUB_RUN_ID` immediately before `wrangler pages deploy`. A subsequent bounded custom-domain GET validates the exact SHA, branch and run ID and FAILS the workflow if the live site is stale. Its result is archived in `production-live-version.json`, alongside Build 430's source-linked Cloudflare deployment receipt.
- **Regression:** `scripts/release467_build431_regression.mjs` validates exact SHA matching, wrong-branch and wrong-SHA rejection, pending/failed/missing/error classification and the ban on premature Production GREEN. Wired to Current Application Quality.

## Use

Visit `/admin/release-gate-status/` while signed in as an active verified Admin. The page performs one bounded on-demand inspection when opened; use **Refresh release evidence** to retry. No automatic polling or deployment action exists. Green historical workflows for other commits never qualify.

If GitHub API access is unavailable, the page reports **UNKNOWN**, not GREEN; check token/read-scope configuration only if that specific reason is displayed. No customer, product, inventory, billing or provider data is read or modified by this workflow.

## Deployment acceptance

Build 431 is **not Production GREEN merely because it reaches `main`**. The protected Production workflow must pass all four exact-SHA Development proofs, Cloudflare control-plane checks, public smoke and the new live source marker verification. The currently active Production site must then serve the SHA expected for `main`.

No release gate was disabled, D1/R2 data was changed, provider operation was performed or U.S. shipping re-enabled.

**Next queued:** Build 432 — Deployment Rollback Readiness & Safe Recovery, as documented in `docs/operations/RELEASE_467_BUILD_429_438_ROADMAP.md`.
