# Release 467 Build 202 — Catalog Reference & Media Reconciliation

## Goal

Turn the remaining catalog-reference and media-reference evidence into four bounded, operator-driven repair queues while keeping Catalog, Inventory Operations and Product Media as the only mutation authorities.

## Exact starting boundary

- Build 201 Development candidate: `64735b92fede8bbb7c552cb4483a916a855d33ee`.
- Build 201 protected-`main` Production merge: `54706ae1b62338098b3ca27a14b9bcda1dbd7aa6`.
- Build 201 exact Development live-D1 proof: **12,198 / 12,500 provider-metered rows read**.
- Build 201 Production promotion was code-only; no Production business-data copy or verification mutation.
- `dev` was synchronized non-force to the exact Build 201 Production SHA before Build 202 began.

## Evidence inherited from the closure sequence

The Build 192/194 evidence block measured:

- 143 unmatched Tool/Supply catalog references.
- 2 blank Inventory images.
- 141 external Inventory image references.
- 10 Products with alt-text attention.
- 0 measured Inventory/catalog image drift at that checkpoint.

These are a work-queue baseline, not immutable facts. Build 202 refreshes the four counts from the exact Development database through one bounded read-only proof.

## Build 202 scope

### Reconciliation workbench

Catalog Authority Health gains an explicit-only **Catalog Reference & Media Reconciliation** workbench with four independent queues:

1. Unmatched catalog references.
2. Blank Inventory images.
3. External Inventory image references.
4. Product alt-text attention.

Nothing loads on page startup. Summary and issue rows are requested only when an administrator presses the corresponding button. Each issue request is capped at 40 rows.

### Existing authorities only

- Catalog identity repair routes to the existing Catalog or Inventory Operations authority.
- Tool/Supply image repair routes to Inventory Operations.
- Product alt text routes to Product Media & Image Editor.
- Static-site Media Studio remains a separate authority.
- Build 202 does not create a duplicate editor.

### Direct bounded filters

The existing `/api/admin/catalog-image-repair` read-only endpoint gains explicit filters:

- `inventory_issue=missing_image`
- `inventory_issue=external_source`
- `inventory_issue=authority_drift`
- `product_issue=alt_text`

The default `all` behavior remains backward compatible for Build 184/190 callers.

### Stale-safe recheck

- Catalog-reference rows recheck one Inventory record through the existing `mode=record` evidence path and compare `expected_updated_at`.
- Inventory/Product media rows recheck one selected record through existing `mode=r2_evidence`.
- R2 evidence remains one selected object `HEAD` only.
- A stale token/timestamp is reported to the operator; Build 202 never resolves the conflict automatically.

## Safety boundary

Build 202 performs no automatic catalog relink, Inventory rewrite, Product Media mutation, alt-text invention, image reassignment, Product publication, schema migration, R2 list/upload/copy/delete, payment/refund action, provider publication, accounting posting or Production business-data copy.

Unknown media ownership, catalog identity, alt text and source facts remain unknown until an operator reviews evidence in the owning editor.

## D1 / R2 budget contract

The exact Development proof:

- reads the four reconciliation counts only;
- uses one grouped Inventory/Catalog pass plus one Product-image alt-text pass;
- is capped at **12,500 provider-metered D1 rows read**;
- performs **zero D1 mutation**;
- performs **zero R2 mutation**;
- performs no bucket-wide R2 list.

Production promotion remains code-only through the zero-D1 path.

## Acceptance

Build 202 passes only when:

1. Catalog Health exposes the four queues separately and performs no startup read or polling.
2. Unmatched catalog references route to Catalog/Inventory owners without automatic relink.
3. Blank/external Inventory image rows route to Inventory Operations.
4. Product alt-text rows route to Product Media.
5. Queue filters are server-bounded rather than client-only first-40 filtering.
6. One-record rechecks report stale evidence and perform no mutation.
7. Selected R2 evidence uses one object `HEAD` only and never lists/mutates the bucket.
8. The exact Development proof remains at or below 12,500 provider-metered rows read.
9. Retained Build 201, Build 194, Build 190 and Build 189 source contracts remain GREEN.

## Numbering note

An older pre-insertion planning file named `RELEASE_467_BUILD_198_CATALOG_REFERENCE_MEDIA_RECONCILIATION.md` is historical provenance only. The current autonomous roadmap makes **Release 467 Build 202** the canonical delivery of this scope.

## Next

Build 203 — Cost Evidence & Margin Readiness.
