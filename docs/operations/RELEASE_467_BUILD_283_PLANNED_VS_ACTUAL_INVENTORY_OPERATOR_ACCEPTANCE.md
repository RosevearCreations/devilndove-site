# Release 467 Build 283 — Planned-vs-Actual Inventory Operator Acceptance

## Purpose

Build 283 converts the Build 274 planned-vs-actual Inventory lifecycle into fresh operator evidence on the exact Development deployment.

The acceptance uses one existing Creative Process project that already exposes a planned material estimate and a reviewed-but-unposted actual. The actual must resolve to a **matching, real, active Inventory item** through direct material identity, prior same-material Inventory provenance, or an existing project-operation resource. It does not create a project, event, Product, Inventory item, provider action or Finance entry for the test.

## Exact predecessor

Build 282 **Content Studio Bridge Operator Acceptance** is the exact verified predecessor.

- Development SHA: `9cd1892c878839982ab18c7a7745101fbe2015ed`
- Production main SHA: `034ab92e57b17765a7b946182256fb32ae25cf87`
- shared tree: `0f5448333945f050cd7c5a32b5fd9a363f1e2bad`
- Development proofs: System `36360504891`, Quality `36360504892`, I.T. `36360505049`, Hygiene `36360505047`, Build 282 `36360505062`
- Production proofs: Pages `36360676716`, Live Resources `36360712757`, Product Browser `36360712745`, Product Route `36360712799`, Build 282 `36360676884`

## Live operator acceptance

The Development-only workflow waits for the exact Build 283 System Gate deployment, obtains that exact Preview URL from the deployment artifact, and then:

1. resolves an existing active Development administrator session;
2. selects one existing non-archived Creative Process project with both a planned material estimate and a reviewed-but-unposted actual that has never been posted;
3. resolves a matching real Inventory item from direct material identity, same-material historical provenance, an existing project-operation resource, or the normal admin Inventory search contract when that search returns one unambiguous non-tool result with valid stock/usage rules;
4. records the initial planned-estimate, Inventory movement and Finance journal state;
5. calls `review_material` and proves the row becomes **Reviewed actual — not posted** while Inventory quantity, movement count and Finance journal counts remain unchanged;
6. calls `post_material_inventory` and proves an explicit Inventory-owned post and posted actual are created;
7. calls `reverse_material_inventory` and proves the post is reversed, a compensating reversal row/history is retained, the material review returns to unposted state and Inventory returns to its exact starting quantity;
8. confirms the correction path remains source-governed by `correct_inventory_use`, which reverses before creating/posting corrected actual evidence;
9. retains only sanitized hashes, counts and booleans.

The acceptance fails closed rather than fabricating a project, event or Inventory item when no qualifying real operator evidence exists. When Development has no safe new event-to-Inventory linkage, Build 283 may instead use existing real planned/reviewed operator states plus an already-recorded Inventory post and compensating-reversal ledger as a read-only acceptance path; it still requires the reversal to restore the original posted quantity and Finance to remain unchanged.

## Safety boundary

There is **no automatic Inventory movement**. The only Development stock movement is the explicit operator post followed by the explicit compensating reversal, leaving net Inventory unchanged. Finance journal entry/line counts must remain unchanged across the entire acceptance.

Production receives only the identical already-accepted code tree. Build 283 performs no Production D1 business-data mutation, R2 mutation, Inventory movement, Finance posting, provider execution/publication, payment/refund or public promotion.

## Closure target

`PLANNED_ACTUAL_INVENTORY_OPERATOR_ACCEPTED_REAL_EVIDENCE`

## Next bounded release

The future queue **has not run out**.

Next: **Build 284 — CAIP Production Acceptance Closure & Outcomes Renewal**.
