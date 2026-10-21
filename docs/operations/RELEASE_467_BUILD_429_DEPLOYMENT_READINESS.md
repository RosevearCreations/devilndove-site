# Release 467 Build 429 — Production Deployment Verification & Release Status Reliability

## Purpose

Remove the ambiguity caused by generic GitHub commit-workflow queries, which can return unrelated successful runs while omitting required Production admission proofs.

## Delivery

- `scripts/release429_release_status.py` queries **each of four canonical workflow-specific GitHub Actions endpoints** on `dev`, filtered by exact 40-character SHA.
- Statuses: `GREEN` only for a successful completed matching run; `HOLD` for failed/queued matching runs; `MISSING` when no matching run; `UNKNOWN` when the API cannot be read.
- Diagnostic exits 0 only if all four proofs are green, otherwise exits 2.
- `scripts/release429_release_status_test.py` tests green, missing, failed, mismatched SHA and API failure.
- `.github/workflows/release429-deployment-readiness.yml` is read-only and uploads `release429-status.json` as an Actions artifact, even when proof evidence is unavailable.
- The new diagnostic **does not deploy** or bypass `scripts/main_promotion_gate.py`. The Production workflow remains authoritative.
- Queue and acceptance criteria: `docs/operations/RELEASE_467_BUILD_429_438_ROADMAP.md`.

## Operator procedure

In GitHub Actions, open **Release 429 Deployment Readiness Diagnostic**, then download the `release429-exact-sha-diagnostic` artifact. Read `checks[].name`, `status`, `run_url`, and `reason`. This reveals what is actually missing instead of inferring from unrelated green runs.

**Release state must be recorded separately:** code on `dev`, four required Development proofs, Cloudflare Preview, source promotion to `main`, Production Pages Deploy conclusion, and live application/resource identity. An identical GitHub tree is not confirmation of a live deployment.

## Safety

No schema migration, D1/R2 mutation, provider connection, customer data write, US shipping activation, workflow bypass, or force-push. Read-only GitHub Actions scope needs `actions:read`. Production cannot be called GREEN without independently verified live proof.
