# Build 217 Validation

## Scope
Build 217 advances reviewed Creative Project operations without enabling automatic publishing or requiring social credentials.

## Completed
- Inventory-post reversal uses a compensating positive inventory movement.
- Reversal requires an administrator, confirmation, and a meaningful reason.
- Original posting remains in history and is marked `reversed`; duplicate reversal is blocked.
- Cost templates can be selected and applied.
- Marketplace/channel fees support a percentage of revenue plus a fixed fee.
- Shared project costs can be allocated among linked products; percentages must total 100%.
- Lessons learned and future-project recommendations are drafted from mirrored CAIP internal source evidence.
- Knowledge summaries remain `needs_review` until deliberately approved.
- `/admin/creative-assets/` has scoped dark surfaces, readable controls and corrected low-contrast white panels.
- Mobile controls collapse to one column and the shared menu remains dropdown/accordion based.

## Safety boundaries
- No inventory changes occur on page load.
- Reversal never deletes the original inventory movement.
- Cost allocation does not change product price, tax, availability or storefront content.
- Knowledge summaries do not publish or become product claims automatically.
- OAuth remains staged until provider credentials and approval are available.

## Deployment tests
1. Post one approved material to inventory.
2. Enter a detailed reason and reverse it.
3. Confirm stock is restored once and both movements remain visible.
4. Apply a cost template and confirm labour, packaging, overhead, shipping and fee percentage load.
5. Enter revenue and confirm percentage fees are included in the saved channel-fee total.
6. Link two products, allocate 60/40, and confirm stored allocations total the project cost.
7. Mirror selected project evidence into CAIP.
8. Generate Lessons Learned and Future Recommendations; confirm both start as Needs Review.
9. Open `/admin/creative-assets/` at desktop and phone widths; confirm no white/light-text panels remain.
