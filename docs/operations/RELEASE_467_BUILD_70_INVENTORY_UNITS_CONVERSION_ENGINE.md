# Release 467 Build 70 — Inventory Units & Conversion Engine

Build 70 starts from the exact fully-green Build 69 Production/Development checkpoint:

- Source SHA: `2b5eaa8b668b678796e7fc36aa3ead28a56a5aad`
- Source tree: `a784bf7b8a762df2aac3be3eca30fcd24410921e`
- Canonical D1 migrations: `0001`–`0004`
- Build 69 Development System Gate: GREEN
- Build 69 Production Pages Deploy: GREEN
- Build 69 Production Live Resource Integrity Proof: GREEN

## Purpose

Converge Inventory package/base-unit conversion and partial-use rules so receiving, Creative material posting, purchased-kit component use, reusable Tool usage and Product resource availability do not each invent different arithmetic.

The existing Release 461 boundary remains authoritative: `site_item_inventory` keeps purchase/package quantities for receiving and purchase costing, while `site_inventory_base_balances` exposes canonical usable/base quantities. Build 70 does not replace that design; it makes mutation-side unit arithmetic agree with it.

## Build 70 contract

1. **One pure conversion engine owns package/base arithmetic.** `inventoryUnitConversion.js` normalizes unit labels, purchase-to-base and base-to-purchase conversion, tracking modes, minimum increments and partial-use planning.
2. **Purchase/package quantities remain receiving authority.** `stock_unit_label`, package on-hand/reserved/incoming quantities and purchase-unit cost remain compatible with the established Inventory endpoint and D1 compatibility triggers.
3. **Usable/base quantities remain consumption authority.** `usage_unit_label` plus `usage_units_per_stock_unit` define the usable amount represented by each purchase unit.
4. **Reserved stock is not consumable stock.** Exact and estimated material use is limited to `on_hand - reserved`; a request cannot spend quantities already reserved for another purpose.
5. **The reservation boundary is race-checked at commit.** Creative Inventory posting requires both on-hand and reserved quantities to still match the reviewed plan before its D1 batch may claim the posting.
6. **Partial consumption respects the configured minimum increment.** A usage request must be at least `minimum_usage_increment` and must align to that increment rather than merely exceeding it.
7. **Exact consumption converts base use into package depletion.** Example: with `1 kilogram = 1000 grams`, using `250 grams` consumes `0.25 kilogram` of package stock.
8. **Estimated consumption uses the same conversion arithmetic.** It remains marked estimated but cannot bypass reservations or minimum-increment rules.
9. **Reusable Tools never disappear because they were used.** Tool source type forces reusable tracking; usage is logged but on-hand Tool quantity is unchanged.
10. **Log-only materials remain non-depleting by design.** Their usage ledger records the base quantity while stock remains unchanged.
11. **Do-not-reuse Tool safety remains fail-closed.** A Tool marked `do_not_reuse` cannot accept another use until reactivated through Tool lifecycle controls.
12. **Product stock stays outside Supply/Tool Inventory depletion.** The shared engine rejects Product-owned stock when called from Inventory material-use workflows.
13. **Purchased-kit component use shares the same engine.** The Kit workspace no longer owns separate package/base arithmetic for component depletion.
14. **Kit template `quantity_per_kit` remains a purchase/stock quantity.** Opening a purchased kit releases component package quantities and cost; later component use is entered in the component's usable/base unit and converted through the shared engine.
15. **Supply kit components keep lot provenance.** Existing kit opening and component depletion continue to create/deplete Supply purchase lots and update lot reconciliation through the established atomic D1 batch.
16. **The Release 461 base-balance helper shares unit normalization.** Read-side package/base labels and conversion factors use the same normalization rules as mutation planning.
17. **No runtime schema repair is added.** The conversion engine is pure calculation and performs no D1, R2, provider, network, polling or request-time DDL work.
18. **No new D1 migration is required.** Canonical migration authority remains `0001`–`0004`; Build 70 uses the existing Release 461 inventory tables/profiles and current canonical schema.
19. **No Production business-data rewrite or R2 deletion is introduced.** Build 70 changes future Inventory arithmetic and validation only.
20. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` can fast-forward.

## Worked examples

### Package to usable quantity

A wax supply is purchased by kilogram:

- Purchase unit: `kilogram`
- Usable/base unit: `gram`
- Conversion: `1 kilogram = 1000 grams`
- On hand: `2 kilograms`
- Reserved: `0.5 kilogram`
- Available: `1.5 kilograms = 1500 grams`

Using `250 grams` consumes `0.25 kilogram`, leaving `1.75 kilograms` physically on hand while the existing `0.5 kilogram` reservation remains protected.

A request for `1600 grams` is rejected because only `1500 grams` is available after reservations.

### Partial-use increment

If the same wax has a minimum usage increment of `5 grams`:

- `250 grams` is valid.
- `5 grams` is valid.
- `252 grams` is rejected because it is not an exact 5-gram increment.
- `2 grams` is rejected because it is below the minimum increment.

### Reusable Tool

A thermometer may have one Tool unit on hand and a usage unit of `use`. Recording three uses creates usage evidence but does **not** turn one thermometer into negative stock or remove it from Inventory.

### Purchased kit

A purchased candle kit may release `1 kilogram` of wax as a component when opened. That `quantity_per_kit = 1` is the package/stock quantity. If the component is configured as `1 kilogram = 1000 grams`, later recording `125 grams` of wax use consumes `0.125 kilogram` through the same conversion engine used by Creative material posting.

## D1 / R2 boundary

Build 70 adds no table, column, index, trigger or migration. It does not copy Development business data into Production, delete R2 objects, call payment/social providers or perform publication execution. Existing compatibility triggers continue to mirror package-level writes into the Release 461 base-balance authority.

## Acceptance

The Build 70 source gate plus the pure Node runtime acceptance prove:

- unit alias normalization;
- package-to-base and base-to-package conversion;
- reserved quantity exclusion;
- minimum increment lower bound and alignment;
- exact and estimated depletion;
- reusable/log-only no-decrement behavior;
- Tool do-not-reuse safety;
- Product ownership boundary;
- shared use by Creative Inventory posting and Kit component consumption;
- schema-neutral and provider-neutral execution.

## Next build

After Build 70 is exact-green, continue with **Release 467 Build 71 — Inventory Lifecycle**.
