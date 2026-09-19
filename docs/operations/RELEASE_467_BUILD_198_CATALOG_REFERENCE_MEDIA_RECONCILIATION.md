# Release 467 Build 198 — Catalog Reference & Media Reconciliation

## Goal

Close the remaining catalog-reference and image-reference work through the existing Catalog, Inventory Operations and Product Media authorities.

## Measured starting point

- Catalog references not matched: 143.
- Blank Inventory images: 2.
- External Inventory image references: 141.
- Product alt-text attention: 10.
- Inventory/catalog image drift: 0.

## Required scope

- separate missing catalog reference, external media reference, blank image and weak Product alt evidence;
- exact candidate matching using bounded normalized keys;
- direct repair routing to the correct existing authority;
- one selected R2 object HEAD only where canonical R2 evidence is needed;
- no bucket-wide list;
- preserve Product approved-role and public-use semantics;
- stale-safe recheck after reviewed correction;
- report “metadata missing,” “reference external,” and “object missing” as different conditions.

## Safety boundary

No automatic catalog relink, R2 upload/copy/delete, media reassignment, alt-text invention, Product publication or Production business-data rewrite.

## Acceptance

Build 198 must preserve Build 190 media semantics while making the 143/141/10/2 queues directly actionable and bounded.
