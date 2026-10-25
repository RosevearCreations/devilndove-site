# Devil n Dove — Release 467 Build 463: D1, Workers, R2 and GitHub Actions Budget Verification

## Technical scope and source-of-truth boundary

The private read-only `/admin/maker-resource-budget/` worksheet is accessible from Maker Workbench. No new D1 schema/tables, R2 objects, additional paid monitoring, auto-polling, scheduled workflows, provider token, billing API call, quota increase, purge, automatic retry or skipped release gate. The one **optional explicit** Admin GET loads the pre-existing `/api/admin/d1-read-budget` application-side **guardrail policy only**. It is *not* Cloudflare actual usage.

The operator records a UTC interval, authentic dashboard links, measured usage values and actual corresponding plan/owner alert limits. The UI compares numeric values and flags 75%+ and 100%+ of *entered* limits. Any absent source/usage/limit is HOLD. Even with complete values the output is `REVIEW_PROVIDER_EVIDENCE_MANUALLY`; it does **not** claim provider attestation, budget GREEN or capacity to scale. The downloadable JSON is an unverified local audit, not a provider receipt. Window compatibility, account aggregation and monthly vs daily quotas require independent review.

Cloudflare provider-side actual billing metrics are **not available from configured tools/credentials for this release**. Therefore the following are intentionally **UNKNOWN/HOLD** until a responsible person supplies actual dashboard evidence:

| Source | Actual required | Operator source |
|---|---|---|
| D1 | rows read, rows written and stored bytes by real database/account and period | [Cloudflare D1 Analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/), [D1 Billing](https://developers.cloudflare.com/d1/observability/billing/) |
| Workers | request, failed request, CPU p95 and subrequest counts, including 1102 spikes | [Workers Metrics & Analytics](https://developers.cloudflare.com/workers/observability/metrics-and-analytics/) |
| R2 | stored bytes and Class A/B operation counts for actual buckets/account | [R2 Metrics & Analytics](https://developers.cloudflare.com/r2/platform/metrics-analytics/) |
| GitHub Actions | actual account-billed minutes/plan limit (distinct from job runtime and queue) | [Job Execution Time](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-job-execution-time), GitHub Billing |

Do not hard-code current plan allowances: check the actual account plan and [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) and other provider plan sources before assigning thresholds. Changing a source link alone does not prove a meter reading.

## Verified historical GitHub Actions measurement (Build 462)

Recorded from actual completed GitHub REST `actions/runs` and `/actions/runs/{run_id}/jobs` timestamps, filtered to **exact Build 462 dev/production candidate and merge SHAs**. Event interval: **2026-10-25 03:03:24–03:11:17 UTC**. All these workflows concluded success. Full roots: [Development PR #517](https://github.com/RosevearCreations/devilndove-site/pull/517), [Production PR #518](https://github.com/RosevearCreations/devilndove-site/pull/518), [independent live resource proof](https://github.com/RosevearCreations/devilndove-site/actions/runs/40157267277).

| Stage | Completed runs | Completed jobs | Actual aggregate job duration (min) | Sum of per-job rounded minutes (reference only) | First-job wait p95 (s) |
|---|---:|---:|---:|---:|---:|
| Development PR | 28 | 30 | 6.3 | 29 | 68 |
| Development post-merge | 16 | 18 | 5.9 | 20 | 3 |
| Production PR | 22 | 22 | 3.2 | 22 | 25 |
| Production post-merge | 11 | 11 | 2.2 | 11 | 51 |
| Independent integrity | 1 | 1 | 0.2 | 1 | 2 |
| **Combined** | **78** | **82** | **17.8** | **83** | **66** |

Job execution is `completed_at - started_at` summed for each job. First-job wait is the elapsed time between workflow creation and its first job starting; **it is not a precise GitHub runner-queue wait** and includes scheduler/dependency effects. The 83-minute figure is a *hypothetical sum of individually rounded job durations*, **NOT** a billed-minutes statement. GitHub Actions billing depends on repository visibility, runner type, account allowances and GitHub metering. Use the account's **actual billing screen** for usage and remaining free allowance. These measurements describe the finished Build 462 release, **not** live/current Build 463 or all monthly activity.

## Operating procedure and fallback

1. Open Cloudflare account-level D1/Workers/R2 analytics and GitHub Actions/Billing. Match exact account, plan, database/bucket/workers and reporting window, and record dashboard URLs and observed quantities in the Build 463 screen. Do not supply API tokens or customer data. Capture real allowance/budget for each row; zero is a genuine metric only if the provider says zero.
2. Compare the source values, including appropriate same-period quotas or human operational-alert thresholds. A metric reaching 75% of the entered ceiling is **NEAR**, 100% is **OVER**, not an automatic paid-plan change. Confirm whether a CPU percentile is per invocation and whether storage figures are point-in-time rather than period totals.
3. Use the existing `/api/admin/d1-read-budget` read-only contract only when diagnosing Product/startup GET patterns. It does **not** measure D1 provider totals and cannot imply spare daily allowance.
4. If real D1 rows are high, identify the actual query/endpoint via Cloudflare D1 Insights. Existing lightweight Product picker, bounded pagination and successful GET coalescing remain safe defaults; pause repeated retries on capacity error. If Workers CPU/errors spike, use CPU/error logs to identify that actual path. If R2 operations/storage are high, review actual bucket usage; do not delete orphan candidates without independent recovery approval.
5. If Actions queue/minutes become high, inspect actual run/job histories, retry patterns and GitHub billing. Avoid adding unnecessary workflows, but **never cancel unrelated active runs or weaken mandatory security, System Gate, Preview or live-integrity checks** merely to lower minutes.
6. Download the local unverified audit with all HOLDs and source links. Assign an owner/date to missing provider metrics. Only implement an optimization in a later build when it is supported by measured before/after evidence, bounded regressions and exact-sha production testing.

## Acceptance

- Read-only page with explicit optional original guardrail GET, no live metering promises, no auto-polling/write/billing.
- Transparent static **actual GitHub Build 462** sample with source PRs, true execution seconds and clear account-billing boundary.
- Pure policy tests: missing data never converts to zero, operator values remain unverified, near/over threshold warnings, invalid source/UTC windows, source-link allowlist, no destructive/actions-gate mutation.
- Existing current application quality test and dev/main release checks pass before Production GREEN. That only proves this **operator review UI** deployed, not D1/Worker/R2/Actions account budget clearance.

**Next proposed Build 464:** Real fulfillment, damaged goods/returns and aftercare pilot, constrained to genuine Canadian order/carrier/pickup evidence and owner-reviewed financial/customer actions.
