# Release 467 — Build 184 D1 Quota Remediation

## Incident

On 2026-09-18 the Cloudflare account exhausted the D1 free-tier daily allowance of 5,000,000 rows read in under four hours. The quota notification showed the next reset at 2026-09-19 00:00 UTC. Once exhausted, authenticated and D1-backed parts of Devil n Dove could no longer verify sessions or load live data reliably.

This is treated as a release-blocking application/acceptance defect, not as an acceptable free-tier inconvenience.

## Root causes found

### Correlated Inventory/catalog scans

Build 183 Inventory identity health used per-row correlated subqueries to count duplicate Inventory identities and test catalog matches. With roughly 1,040 active Tool/Supply rows, one summary could rescan roughly the same thousand-row Inventory authority for each row, producing million-row provider accounting from a small logical dataset.

Catalog Health and the early Build 184 image review had similar per-row catalog/Inventory lookup patterns.

### CI multiplied live database reads

Build 181–184 workflows allowed live Development D1 proofs on pull-request iterations. Every candidate commit could therefore repeat real remote D1 scans before an exact Development SHA even existed.

### Inventory Operations startup fan-out

Inventory Operations mounted many independent diagnostic/review modules. Several of them automatically queried D1 merely because the page/auth initialized, including Tool lifecycle, material reconciliation, process assignment, Product integrity, receiving history/reversal evidence, Product resources, purchased kits/component usage, Product stock/build readiness and catalog option authority.

Each request could be individually bounded while their combined startup fan-out still wasted the daily allowance.

## Repairs

### Query architecture

The high-risk Inventory/catalog health endpoints now pre-aggregate authorities using CTEs, grouped joins and ranked catalog references. Duplicate counts, catalog identity matches and image-reference selection are calculated once per authority instead of by correlated full-table rescans.

Affected endpoints:

- `/api/admin/inventory-identity-health`
- `/api/admin/catalog-health`
- `/api/admin/catalog-image-repair`

### Explicit diagnostic loading

Opening Inventory Operations or Catalog Health no longer automatically starts non-core diagnostic reads.

The following are explicit operator actions:

- Catalog Health summary
- Tool lifecycle
- material-usage reconciliation
- Tool/Supply process assignment
- Product integrity review
- recent receiving evidence
- receipt reversal evidence
- Product resource/bootstrap workspace
- purchased-kit workspace
- kit-component usage
- Product stock/build readiness
- catalog option/tax-code authority
- Inventory identity health
- image-repair queues and R2 object evidence

Core Inventory list/search remains available; diagnostics are loaded when the operator actually needs them.

### CI policy

Build 181–184 live Development D1 jobs now run only when the exact candidate SHA is pushed to `dev`.

Pull requests run source/local gates only. They do not spend remote D1 row reads.

### Provider-metered acceptance

Exact-`dev` D1 workflows parse Wrangler/Cloudflare response metadata and record `meta.rows_read`.

Each proof has a hard ceiling. A query that returns the correct answer but exceeds its provider-metered row-read budget fails acceptance.

Current ceilings:

- Build 181 catalog authority proof: 20,000 rows
- Build 182 Product buyer-facts proof: 5,000 rows
- Build 183 Inventory identity proof: 50,000 rows
- Build 184 image-repair proof: 50,000 rows

These ceilings are intentionally far below the 5,000,000-row daily account limit.

## Release rule

No Build 184 Production promotion may be called GREEN from source checks alone.

Because the current D1 daily allowance is already exhausted, the branch must wait for the Cloudflare reset and then complete one exact-SHA Development push. The provider-reported `rows_read` ceilings must pass on that exact SHA before the same SHA can move non-force to `main`.

This protects the site from accepting another functionally-correct but quota-destructive release.

## Safety

This remediation performs no Production business-data copy, no schema migration, no automatic Inventory/Product mutation, no R2 object mutation, no provider/publication execution, no payment/refund action and no accounting posting.
