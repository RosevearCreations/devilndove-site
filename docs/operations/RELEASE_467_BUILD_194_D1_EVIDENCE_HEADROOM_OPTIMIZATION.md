# Release 467 Build 194 — D1 Evidence Headroom Optimization

## Goal

Recover safe D1 headroom in the two tightest retained evidence paths without weakening evidence or raising either existing 20,000-row ceiling.

## Measured starting point

### Media evidence — Build 190

- **19,282 / 20,000 rows read**
- Headroom: **718 rows**
- 43 active Products
- 238 gallery images
- 1,040 active Inventory items
- 2 blank Inventory images
- 141 external Inventory image references

### Inventory evidence — Build 189

- **15,487 / 20,000 rows read**
- Headroom: **4,513 rows**
- 1,040 active Inventory items
- 8 duplicate-identity rows
- 898 missing supplier names
- 326 missing source references
- 1,040 count-due rows
- 143 catalog references not matched

## Required scope

Build 194 should:

- inspect both grouped proof/runtime paths for avoidable repeated scans;
- preserve exact Build 189 and Build 190 evidence semantics;
- pre-aggregate or narrow authority reads where safe;
- ensure one-record rechecks never trigger full summary scans;
- preserve selected-object R2 HEAD only; no bucket listing;
- add parity tests for pre/post optimization classifications;
- target media evidence **<= 12,500 rows read** if achievable without semantic loss;
- target Inventory evidence **<= 10,000 rows read** if achievable without semantic loss;
- retain both existing 20,000 hard ceilings until lower provider-measured ceilings are proven;
- never raise a ceiling merely to pass.

## Safety boundary

No schema migration, Product/Inventory business-data mutation, automatic duplicate merge, count write, supplier/source invention, R2 mutation, image reassignment, purchasing, provider action, publication, payment or accounting posting.

## Acceptance

Exact Development provider-metered proofs must improve materially, retain semantic parity and keep all Build 189/190 repair-routing/public-image contracts GREEN before protected-main Production promotion.
