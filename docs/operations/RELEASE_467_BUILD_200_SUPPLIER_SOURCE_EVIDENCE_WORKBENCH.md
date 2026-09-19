# Release 467 Build 200 — Supplier & Source Evidence Workbench

## Goal

Turn the largest remaining Inventory provenance gaps into a bounded operator workbench without inventing suppliers, source URLs, supplier SKUs or purchase history.

## Exact starting boundary

- Build 199 Production main SHA: fd92e3eec6a8db4283e83fb19db5cd81ab01929b.
- Build 199 Production exact-main matrix: 27/27 SUCCESS.
- Build 199 Development exact-dev matrix: 29/29 SUCCESS.
- Build 199 buyer-readiness Development D1 proof: 85 provider-metered rows read / 5,000.
- dev was synchronized non-force to the exact Build 199 Production SHA before Build 200 started.

## Measured Inventory evidence

The current roadmap carries the measured baseline:

- 1,040 active Tool/Supply Inventory rows.
- 898 blank supplier names.
- 326 blank source references.
- Build 194 optimized Inventory evidence measured 9,821 provider rows read.

Build 200 uses a 12,500-row exact-Development ceiling. It is lower than the retained 20,000 hard ceiling; if provider metering exceeds 12,500, the query must be optimized rather than the ceiling raised.

## Workbench contract

- No Inventory identity scan during page startup.
- Explicit queue load, capped at 40 returned rows.
- Filter supplier/source review by: all unresolved, supplier+source both missing, missing supplier, missing source reference, source known but supplier SKU missing, or reviewed not-applicable.
- Blank provenance stays unknown.
- Known not applicable is never inferred. An operator may record the exact note marker `[supplier-not-applicable]` or `[source-not-applicable]` through the normal Inventory Operations Reorder / Usage Notes field.
- Same-identity Inventory rows and matching Catalog rows may be shown as candidate supplier/source evidence.
- Candidate evidence is evidence only: no candidate is automatically selected, copied or saved.
- Exact repair routing opens the established Inventory Operations record and focuses Supplier, Source URL, Supplier SKU or Reorder / Usage Notes.
- One-record recheck retains the Build 189 expected-`updated_at` stale check and its bounded duplicate/catalog comparison.
- Manual next-unresolved navigation is allowed; background polling is not.
- Existing Inventory Operations remains the only mutation authority.

## Safety boundary

No supplier invention, URL invention, supplier-SKU invention, Amazon/provider scraping, purchase action, reorder placement, unit-cost mutation, stock mutation, automatic note marker, schema change, R2 mutation, payment/provider execution or Production business-data copy.

Production promotion is code-only and uses the existing zero-D1 path.

## Acceptance

The operator can deliberately filter supplier/source gaps, inspect bounded same-identity evidence, open the exact Inventory field that owns the fact, make a reviewed correction or explicit N/A note, recheck exactly that Inventory record, detect stale queue evidence and manually advance to the next unresolved record without polling or hidden writes.

Build 201 — Cycle Count & Duplicate Identity Resolution — remains next after Build 200 is fully GREEN.
