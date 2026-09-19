# Release 467 Build 194 — Inventory Evidence Headroom Optimization

## Goal

Reduce the Build 189 Inventory-evidence proof cost while preserving duplicate, supplier/source, count-due and catalog-reference truth.

## Measured starting point

- Build 189 provider rows read: **15,487 / 20,000**.
- Active Inventory items: 1,040.
- Duplicate-identity rows: 8.
- Missing supplier names: 898.
- Missing source references: 326.
- Count due: 1,040.
- Catalog matched: 897.
- Catalog missing: 143.

## Required scope

- optimize grouped Inventory/catalog evidence without correlated per-row rescans;
- preserve exact active/duplicate/supplier/source/count/catalog classifications;
- keep one-record repair rechecks bounded;
- ensure exact rechecks do not trigger the full summary scan;
- target **<= 10,000 rows read** for the grouped Development proof if achievable without semantic loss;
- keep the existing 20,000 ceiling until a lower provider-measured ceiling is proven;
- expose which evidence dimensions drive remaining read cost.

## Safety boundary

No automatic duplicate merge, stock change, count entry, supplier invention, source-reference invention, purchasing, reorder placement, cost write, schema change or Production business-data read.

## Acceptance

Provider-metered exact Development proof must improve materially, retain semantic parity, and keep all Build 189 repair-routing contracts GREEN before protected-main Production promotion.
