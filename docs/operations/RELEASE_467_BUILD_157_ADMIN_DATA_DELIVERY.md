# Release 467 Build 157 — Product Admin + Admin Data Delivery

## Purpose

Build 157 makes the Product Admin workspace usable before secondary evidence is allowed to consume large D1 read budgets and audits the other Admin pages that explicitly request large row sets. The delivery rule is **small core read → interactive workspace → bounded secondary evidence**.

This build does **not** move mutable business truth into static JSON. Products, prices, stock, inventory movements, tax classes, readiness evidence, orders, finance records, and other changing business data remain in their existing D1 authorities.

Static JSON is appropriate only for truly immutable presentation/reference material such as fixed UI labels, help copy, or a versioned default dictionary that does not claim to be live business state.

## Product Admin findings and Build 157 changes

Before Build 157, opening `/admin/products/` could start a broad Product rollup, Product readiness aggregation, Product Release Quality work, buyer-fact reads, Product resource bootstrap, and other secondary controllers close together. The retained Build 156 request scheduler already prevents an unbounded GET burst, but the actual list-level readiness request was historically canonicalized to 500 rows.

Build 157 changes the delivery contract without replacing the existing authorities:

- Core Product authority is allowed to become interactive first.
- List-level Product readiness waits for the core Product recovery signal, with a bounded 1.2 second fail-soft wait.
- The actual Product readiness D1 request is rewritten to **80 Products maximum** and marked `force_deep=1&delivery=build157`.
- The retained Build 156 request scheduler still limits concurrent authenticated Admin GETs to two and reserves a lane for core Product work.
- Existing Product mutations remain on their current server-authoritative endpoints and are not rewritten by Build 157.
- The Product Quality Command Center therefore receives the same readiness authority, but only after core Product usability and through the bounded 80-row delivery path.

## Product Tools & Supplies

The Product Resources panel previously called a bootstrap that could load **600 Product rows** even when the operator was not actively using a large Product selector.

Build 157 changes the bootstrap to:

- default to **80** Product identity rows;
- hard-cap the bootstrap at **120**;
- keep Product links scoped to the selected Product;
- never preload the resource catalog through the bootstrap;
- continue using the existing search-required resource endpoint, whose blank query returns zero resources and whose server-side search remains capped.

This avoids treating a 600-row Product/resource universe as startup data.

## Inventory reconciliation

The Inventory & Material-Usage reconciliation workspace historically requests `limit=500`. Its server builds evidence from multiple Inventory, Product, Creative, production-run, reservation, and kit queries, with several evidence lanes using multiples of that requested limit.

Build 157 preserves the historical Build 112 client and server authority but caps the browser’s actual request to **80** on `/admin/inventory-operations/`. This materially reduces initial D1 row reads while preserving the reconciliation semantics and every existing write authority.

A future dedicated pagination/read-model build can split reconciliation evidence by section if this workspace grows beyond the bounded view.

## Other large-data verification

The repository audit found the following explicit high-row delivery paths:

- `/admin/products/` Product readiness: historical 500-row compatibility request — **bounded to 80 actual rows by Build 157**.
- `/admin/products/` Product resource bootstrap: historical 600 Product rows — **80 default / 120 hard max in Build 157**.
- `/admin/inventory-operations/` material-usage reconciliation: historical 500-row request — **bounded to 80 actual rows by Build 157**.
- Mobile Product bootstrap: a **mobile-only** resource lane can still reach `LIMIT 700`; it is not part of desktop Product Admin startup because resources are included only when explicitly requested or by the Mobile Product workflow. It remains a follow-up candidate for cursor/search delivery.
- Public Toolshed and Gallery surfaces contain 500-row API requests but already pair them with static JSON fallback datasets. Those are public browsing surfaces rather than mutable Admin business authorities and are outside this Admin hotfix.

The Product resource search already follows the desired pattern: a blank query returns no rows, a search term is required, and the server caps results.

## Why catalog options and tax classes are not static JSON

Catalog options and tax classes already use `functions/api/admin/_catalog-option-authority.js`, which provides a **5-minute** in-memory fresh cache plus a **1-hour** stale fallback. It uses a small bounded D1 contract and remains the canonical changing authority.

Replacing that with static JSON would create a second authority that could become stale after an Admin changes an option or tax class. Build 157 therefore preserves the existing cache instead of copying mutable settings into a static file.

## Delivery policy going forward

For Admin pages with large datasets:

1. Use compact read models for the first interactive view.
2. Avoid exact total counts when pagination can use `has_more`.
3. Require server-side search for large catalogs.
4. Use cursor/paged evidence rather than loading all rows.
5. Defer expensive joins, readiness, QA, images, audit history, and reconciliation until the core workspace is usable.
6. Cache immutable or slowly changing reference authorities with an explicit invalidation/stale policy.
7. Use browser snapshots only as clearly labeled fail-soft continuity, never as the write authority.
8. Keep mutations on the existing server-authoritative endpoints.
9. Do not turn Products, Inventory, Orders, Finance, pricing, or stock into static JSON.
10. Re-measure D1 row reads after each delivery change before increasing limits.

## Safety boundary

Build 157 adds no schema migration, request-time DDL, Product mutation, Inventory mutation, Production business-data overwrite, R2 mutation, provider execution, publication, payment, refund, or accounting posting.
