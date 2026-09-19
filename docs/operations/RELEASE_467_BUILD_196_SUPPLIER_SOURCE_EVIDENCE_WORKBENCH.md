# Release 467 Build 196 — Supplier & Source Evidence Workbench

## Goal

Make the largest remaining Inventory evidence gaps—supplier identity and source reference—reviewable and repairable without fabricating provenance.

## Measured starting point

- Active Inventory items: 1,040.
- Missing supplier names: 898.
- Missing source references: 326.

## Required scope

- bounded queue/filter for missing supplier, missing source reference, or both;
- exact record comparison against existing catalog/source metadata;
- surface known candidate evidence without auto-selecting it;
- direct routing into existing Inventory Operations fields;
- stale-safe exact recheck after correction;
- reviewed bulk navigation may group records but must not bulk-write unknown supplier/source values;
- distinguish “missing evidence” from “known not applicable.”

## Safety boundary

No supplier invention, URL/source invention, Amazon/provider scraping, purchase action, reorder placement, cost mutation, stock mutation, schema change or Production business-data copy.

## Acceptance

Build 196 must make the 898/326 evidence queues manageable while preserving explicit human review and existing Inventory mutation authority.
