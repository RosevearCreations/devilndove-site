# Financials Monthly Performance Bridge

Status: Release 448 forward Financials-depth enhancement.

## Purpose

The Accounting workspace already has authoritative read-only monthly P&L, item-costing, overhead-allocation, and journal services. The Monthly Performance Bridge makes those existing authorities easier to interpret without creating a second ledger or changing D1.

The bridge is a management estimate. It is not a tax return, final financial statement, or final net-income calculation.

## Sources

The bridge reads only:

- `/api/admin/accounting-profit-loss?month=YYYY-MM`
- `/api/admin/accounting-item-costing?month=YYYY-MM`

Those services remain Accounting-owned and declare request-time schema mutation disabled.

## Calculation

The displayed rough operating result is:

`recognized revenue - operating expenses and recorded tax - write-offs - estimated recognized base COGS - full monthly allocated overhead`

`estimated recognized base COGS` contains direct Product cost plus linked resource cost for sold units and excludes overhead.

The item-costing service also exposes:

- recognized overhead COGS
- recognized full COGS = base COGS + recognized overhead COGS

The bridge deliberately does **not** subtract recognized full COGS when it is already subtracting the full monthly overhead pool. Doing both would double-count overhead.

## Cost coverage

The bridge reports how many sold Products currently have:

- a positive base cost
- no missing resource-cost links

A gap is a review signal, not proof that a Product truly has zero cost.

## Existing overview clarification

The older Accounting summary label `Net after overhead` is clarified in the browser as `Before COGS · after overhead`.

`Recognized full COGS` is clarified as `Recognized full COGS · includes overhead`.

This prevents the existing rough management figures from being mistaken for final profit.

## Safety

The bridge:

- performs authenticated GET reads only
- does not POST
- does not create or update Accounting rows
- does not alter Inventory
- does not contact Stripe or PayPal
- does not read or write R2
- has no Production mutation path
- preserves exactly one H1 on the Accounting page

## Regression protection

`scripts/release448_financials_depth_gate.py` is part of the canonical System Gate. It verifies the read-only endpoints, calculation contract, anti-double-counting rule, one-H1 structure, responsive CSS, and JavaScript syntax.
