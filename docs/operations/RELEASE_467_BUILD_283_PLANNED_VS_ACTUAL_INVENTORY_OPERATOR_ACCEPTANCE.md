# Release 467 Build 283 — Planned-vs-Actual Inventory Operator Acceptance

## Purpose

Build 283 converts the Build 274 planned-vs-actual Inventory lifecycle into fresh operator evidence on the exact Development deployment.

The acceptance first tries existing Creative Process material evidence against a **matching, real, active Inventory item**. Development currently has no defensible association between its Goatmilk soap-base event and its only eligible consumable Inventory item (DecorRom candle dye), so Build 283 may fall back to one bounded Development-only fixture: a temporary material timeline event inside an existing project using the real Inventory item. No project, Product, Inventory item, provider action or Finance entry is fabricated.

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
2. first attempts existing non-archived Creative Process planned/reviewed material evidence and a matching real Inventory item;
3. if that real-data association is unavailable, selects an existing Development project plus exactly one eligible real Inventory item, removes any orphaned prior Build 283 fixture through `void_event`, and creates one temporary `add_event` material entry clearly marked as Build 283 acceptance evidence;
4. records the initial planned-estimate, Inventory movement and Finance journal state;
5. calls `review_material` and proves the row becomes **Reviewed actual — not posted** while Inventory quantity, movement count and Finance journal counts remain unchanged;
6. calls `post_material_inventory` and proves an explicit Inventory-owned post and posted actual are created;
7. calls `reverse_material_inventory` and proves the post is reversed, a compensating reversal row/history is retained, the material review returns to unposted state and Inventory returns to its exact starting quantity;
8. confirms the correction path remains source-governed by `correct_inventory_use`, which reverses before creating/posting corrected actual evidence;
9. when the bounded fixture path is used, calls `void_event` after the explicit reversal, verifies the temporary event is no longer active, and keeps the audited reversal history;
10. retains only sanitized hashes, counts and booleans.

The fixture is allowed only on Development and only after the real-data path fails closed. It uses an existing project and a real Inventory item; it never creates a Product or Inventory item. The cleanup guard also calls `void_event` on failure so any still-active Inventory post is reversed before the temporary event is voided.

## Safety boundary

There is **no automatic Inventory movement**. The only Development stock movement is the explicit operator post followed by the explicit compensating reversal, leaving net Inventory unchanged. A bounded fixture may create one temporary Development timeline event, but it must be voided before acceptance completes. Finance journal entry/line counts must remain unchanged across the entire acceptance.

Production receives only the identical already-accepted code tree. Build 283 performs no Production D1 business-data mutation, R2 mutation, Inventory movement, Finance posting, provider execution/publication, payment/refund or public promotion.

## Closure target

`PLANNED_ACTUAL_INVENTORY_OPERATOR_ACCEPTED_REAL_OR_BOUNDED_EVIDENCE`

## Next bounded release

The future queue **has not run out**.

Next: **Build 284 — CAIP Production Acceptance Closure & Outcomes Renewal**.
