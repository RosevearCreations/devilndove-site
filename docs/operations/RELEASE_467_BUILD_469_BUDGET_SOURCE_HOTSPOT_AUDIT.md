# Build 469 — Cloudflare D1, Workers and R2 source capture and evidence-led hotspots

This is an **operator-owned, zero-background-request** addition to `/admin/maker-resource-budget/`, following Build 463. It captures local comparison receipts; it does **not** fetch live Cloudflare usage, spend money, write D1/R2, or automatically optimize a Worker.

## Capture steps (original provider facts; do not paste secrets)

1. Log into the real Cloudflare dashboard as an authorized owner. Confirm the account's current plan and billing method separately for D1, Workers and R2; if not Free, **leave the matching Free checkbox clear**. Use official [D1 Analytics](https://developers.cloudflare.com/d1/observability/metrics-analytics/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) and [R2 pricing](https://developers.cloudflare.com/r2/pricing/).
2. From the original Cloudflare D1 metrics/billing time-window view, record **account-scope rows read and rows written** as non-negative integer totals for a UTC calendar day. Note which databases are included. If only one database's chart is available and it cannot substantiate the account total, leave account acceptance HOLD.
3. From Workers Analytics, record total **account-scope Workers requests** for that same UTC day, with the dashboard's start/end. Observe errors, per-invocation CPU and subrequest traces separately; **CPU p95 must not be treated as the per-invocation CPU maximum** or a daily quota.
4. From R2 Billing/Analytics, record **account-scope Standard Class A and Class B operation totals** for the UTC billing month, including any relevant buckets. Confirm the billing period and separate R2 storage GB-month from one storage snapshot in bytes. R2's 1 million A and 10 million B operations/month are **free included usage**, not guaranteed hard request limits. Extra operations can incur charges depending on the account and plan. Do not extrapolate a partial month as a full-month forecast.
5. Enter the provider's exact source dashboard link in the existing Build 463 source fields and its five integer values in section 2. In Build 469 section 5 choose the UTC day/month and supply **separate original screenshot/receipt references, source window start and end** for D1, Workers and R2. The start must be exactly midnight on the selected UTC day or first day of month. The end must be later and no later than the next period boundary. A partial window is explicitly marked partial.
6. Press **Review matching UTC windows**. The review requires explicit checkbox affirmation for each Free plan; invalid, mismatched or missing source, receipt, value or time window yields HOLD. At 75% of a confirmed reference the page flags **NEAR**; at 100% it flags **ABOVE**. These are review candidates, not demonstrated application-route hotspots.
7. Download the **Build 469 HOLD receipt JSON** to retain a local owner-controlled copy. Query strings/fragments on dashboard links are removed from the receipt. Review the original dashboard and export independently before treating any data as authoritative. Never put bearer tokens, cookies, keys, billing credentials or customer records in references. The app has no provider analytics credential and cannot verify the screenshot independently.

## Hotspot investigation, never automatic action

| Candidate | Initial route/workflow to examine | Additional original source proof before implementation |
| --- | --- | --- |
| D1 rows read | Product Editor bounded list and detail loading | D1 query metrics/query-specific analysis, same-window row counts and reproducible request sequence |
| D1 rows written | Editor autosave/draft writes | Distinct write events, request errors, coalescing and any replay/duplicate evidence |
| Worker requests | Admin login, Product Editor 503/1102 | Timestamped Cloudflare route/Ray IDs, Worker execution trace and per-request CPU/subrequest evidence |
| R2 Class A | Maker photo upload / library sync | Actual Class A bucket operation logs and same-month source references |
| R2 Class B | Product/media gallery reads | Actual Class B operations with bucket/caching attribution and confirmed time windows |

The **source-linked ratio does not attribute usage to a route or prove a defect**. No changes to pricing, paid monitoring, D1 capacity, retry policy, the release gate, R2 retention, or customer/owner records are authorized by this worksheet. Remediate only a measured, owner-approved hotspot with a separate focused build and tests. Unavailable original provider information remains HOLD while software release pipelines can still be GREEN.

## Independent acceptance and constraints

- Run `node --test scripts/release467_build469_cloudflare_budget_sources.test.mjs scripts/release467_build463_resource_budget.test.mjs` and existing release tests.
- Ensure both `dev` and `main` have the exact tested source tree, required GitHub checks pass, Production Pages Deploy succeeds, and independent zero-D1 production integrity proof succeeds.
- No live Cloudflare numbers, billing period screenshot or credential was provided to this build. **Provider and owner source acceptance: HOLD** until original receipts are entered and manually reconciled. No synthetic numbers are represented as real observations.
