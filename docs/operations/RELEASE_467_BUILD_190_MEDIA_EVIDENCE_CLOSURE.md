# Release 467 — Build 190 Product & Inventory Media Evidence Closure

## Goal

Build 190 closes the remaining media-quality and reference evidence exposed by Build 184 without merging Product media, Inventory media and static-site Media Studio into one authority.

Product Image Editor remains the finished-Product media mutation owner. Inventory Operations remains the Tool/Supply media owner. Static Website Media Studio remains separate.

## Scope

Build 190 should:

- surface Products with missing or weak alt text;
- surface ambiguous/missing image roles where an approved Product image exists;
- surface Inventory rows with blank or invalid image references;
- show D1-to-R2 reference evidence for one selected record at a time;
- provide direct repair routing to the correct existing editor;
- allow a bounded recheck after repair;
- distinguish missing metadata from missing object evidence;
- preserve the Build 186 high-priority hero-image and lazy-gallery delivery rules.

## R2 rule

R2 proof must remain selected-object or tightly bounded-prefix evidence. Do not list an entire bucket to decide whether one record is healthy.

## Acceptance

Build 190 is GREEN only when:

1. Media review reads are bounded.
2. R2 checks use selected-object HEAD/existence evidence or another comparably bounded method.
3. No bucket-wide scan or automatic media reassignment occurs.
4. Alt/role repairs remain owned by the established Product or Inventory media authority.
5. Public Product image delivery and Product JSON-LD image evidence remain GREEN.
6. Exact-SHA Development gates and protected-main Production promotion are GREEN.

## Safety boundary

No schema migration, request-time DDL, automatic R2 upload/copy/delete, automatic image reassignment, Product-data rewrite, provider/payment action, accounting posting or Development-to-Production business-data copy.

## Successor

Build 191 — Cost, Usage & Profitability Evidence Closure.


## Implemented closure design

Build 190 extends the established Build 184 image-repair authority.

- Product and Inventory queues remain explicit and capped at 40 records.
- Each Product image carries a media-evidence token based on its image URL, alt text, latest role/public-use annotation and approved-role count.
- Each Inventory image carries a token based on its operational image URL, catalog image reference and Inventory updated timestamp.
- Recheck compares the recorded token with current D1 metadata and returns `stale_target` before the operator relies on older evidence.
- Approved Product images distinguish `missing_on_approved`, `ambiguous_on_approved`, `assigned_on_approved` and non-approved role evidence.
- R2 proof remains exactly one `bucket.head(key)` for the selected canonical object.
- Evidence explicitly separates `metadata_state`, `object_state` and `evidence_classification` so missing metadata is not confused with a missing R2 object.
- Repair routing remains Product Media & Image Editor for finished Products and Inventory Operations for Tools/Supplies.
- Static Website Media Studio remains a separate authority.

## Development budget

The exact Development Build 190 proof is provider-metered and must remain at or below **20,000 rows read**. The grouped D1 proof measures Product image alt/role/public-use evidence and Inventory image-reference evidence. It performs **zero D1 mutation** and **zero R2 mutation**.

## Production path

Build 190 is code-only and requires **no canonical migration**. Production promotion therefore remains the **zero-D1 code-only path**. Build 186 public Product proof is retained so the primary Product image remains eager/high-priority, gallery images remain lazy, Product JSON-LD image evidence remains intact, and no extra public Product request is introduced.
