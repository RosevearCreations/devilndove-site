# Build 643 — I.T. Preflight, Prelaunch and Repository Truth Review

## Decision boundary

**Dev/main release promotion:** Protected source gate, current application quality, current migration policy, development deployment and live Cloudflare Pages proof remain authoritative and fail closed. Old Build 91/390/391/406 exact-SHA and run IDs are historical evidence **not tasks to repeat** and do not block the next code release.

**Business opening:** Startup Readiness items and independent external acceptance lanes apply to *unrestricted commerce go-live*, not routine code delivery. Where live owner, provider, finance, shipping or Cloudflare Access evidence is unknown, leave HOLD as-is; a successful production deployment never supplies missing business acceptance by itself.

## Audited screens

| Surface | Found | Build 643 correction |
| --- | --- | --- |
| `/admin/prelaunch/` | Called Build 91 the “last fully verified” technical release and projected it as current GREEN indefinitely | Label Build 91 evidence historical; remove the fixed GREEN current-release assertion. Show current commercial acceptance separately from protected dev/main CI; no automatic go-live decision |
| `/admin/prelaunch/` | Claimed canonical migrations were *exactly* `0001`–`0004` | Identify these as historical baseline and point to the evolving canonical `migrations/canonical/manifest.json` plus `scripts/migration_policy_gate.py` |
| `/admin/deployment-preflight/` | Body described Build 406 as “current”, Build 390 as latest predecessor and Build 391 as current viewer | Replace visible current-release assertions with dynamic schema/preflight descriptions and archive old predecessor IDs; retain real GET-only D1/schema checks |
| Startup Readiness and External Acceptance | D1-backed status/evidence and five independent external lanes; live acceptance details not available from repo | **Preserve**, do not mark completed or remove required real-world approval tasks without owner/provider proof |
| `scripts/release467_build91_gate.py` and historical archive | Earlier immutable closure regression | **Preserve** as a regression/evidence record; historical acceptance is not a new Build 643 prerequisite |
| `scripts/migration_policy_gate.py` | Current canonical migration manifest enforced in protected quality | **Preserve**; do not bypass schema or migration consistency |

## Branch audit (Build 642 baseline)

The remote branch inventory contained `dev`, `main`, `codex/ql364-source-health-main` and `production-d1-0026-proof`. Both nonstandard branches are *diverged and ahead of main*:

- `codex/ql364-source-health-main`: two unmerged commits, source-health logic/tests and docs.
- `production-d1-0026-proof`: one unmerged commit touching the canonical migration manifest.

These are **not demonstrated merged or retired**. Deleting them blindly would discard unmerged source or migration provenance. Retain until a safe merge/archive decision is verified and authorized. No merged feature branch with no unique commits remained to delete at the time of review. Existing protected `dev` and `main` remain intact. No source tree, migration record, production data, or retained evidence was destroyed as part of this cleanup review.
