# Release 467 — Build 187 Catalog Repair Action Framework

## Goal

Build 187 turns the read-only Catalog Health findings from Builds 181–185 into a small, explicit repair-action framework that routes an operator to the correct existing mutation authority and records what was reviewed.

This is not a new all-in-one editor. Catalog Health remains the cross-authority review surface; Product Editor, Product Image Editor and Inventory Operations remain the mutation owners.

## Scope

Build 187 should add:

- a normalized repair-action descriptor for each supported Catalog Health finding;
- clear owner/routing metadata such as Product Editor, Product Image Editor or Inventory Operations;
- one-record-at-a-time reviewed actions where an existing narrow API already supports the correction safely;
- before/after evidence in the operator response;
- fail-closed validation when a finding has gone stale or the target no longer matches;
- idempotent request identity for any action that can be safely retried;
- visible audit/evidence text sufficient to understand what changed and why.

## First supported action classes

Prioritize only corrections that already have an established mutation authority:

1. Product fact correction routing.
2. Product image/alt/role correction routing.
3. Inventory identity/source/reference correction routing.
4. Product-resource linkage correction routing.
5. Explicit reviewed dismissal/recheck of a finding after the underlying authority has been repaired.

Do not invent a new generic write endpoint that bypasses specialist APIs.

## Acceptance

Build 187 is GREEN only when:

1. Catalog Health can describe the exact repair owner and next action for supported findings.
2. Any direct mutation is bounded to one reviewed target and uses an existing domain-safe mutation path.
3. Stale findings fail closed rather than overwriting newer data.
4. No automatic batch mutation runs on page load.
5. No polling or MutationObserver-driven write behavior is introduced.
6. D1 live proof is bounded and has an explicit rows-read ceiling.
7. Exact-SHA Development System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene pass.
8. The exact Development tree is promoted through protected main and the Production proof is GREEN.

## Safety boundary

Build 187 performs no:

- schema migration;
- request-time DDL;
- wholesale Production data replacement;
- automatic Inventory quantity/cost mutation;
- R2 upload/copy/delete;
- supplier purchasing;
- payment/refund action;
- social/publication provider action;
- accounting posting.

## Successor

Build 188 — Buyer Readiness Closure.


## Implemented bounded design

Build 187 extends the existing read-only Catalog Health API instead of creating a generic write endpoint.

- Product and Inventory issue rows carry explicit `repair_actions` with the established owner, deep link, direct-mutation=false and a deterministic request key.
- `mode=repair_product&product_id=...` rechecks exactly one Product target.
- `mode=repair_inventory&inventory_id=...` rechecks exactly one Inventory target.
- `expected_updated_at` is compared with the current authority row. A mismatch returns `stale_target=true` and `safe_to_apply=false`.
- The browser Recheck control is explicit-only. There is no startup read, polling loop, MutationObserver-driven write, POST, PATCH, PUT or DELETE path.
- The recheck response supplies current snapshot and owner routing; the mutation itself remains in Product Editor, Product Image Editor or Inventory Operations.

## D1 budget

The exact Development live proof is provider-metered and must stay at or below **5,000 rows read**. It performs only SELECT evidence representative of one Product and one Tool/Supply target. A higher measurement fails closed; the ceiling is not raised merely to make a regression pass.

## Production proof

Build 187 is code-only. No canonical migration is required. Production promotion therefore keeps the zero-D1 code-only path and requires the exact Production Pages deployment plus Production Live Resource Integrity proof to be GREEN.
