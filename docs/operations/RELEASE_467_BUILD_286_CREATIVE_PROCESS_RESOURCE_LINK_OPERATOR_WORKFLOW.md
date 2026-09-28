# Release 467 Build 286 — Creative Process Resource-Link Operator Workflow

Build 286 closes the operator/schema gap measured by Build 285. An operator can take an existing active Creative Process material event and explicitly associate it with an existing active Supply or Tool Inventory record. An existing Creative Project operation may also be attached when one exists, but an operation is not required.

## Ownership and safety

- `creative_process_resource_links` stores identity/provenance only.
- Only active `site_item_inventory` rows with `source_type` `supply` or `tool` are accepted.
- Product-owned Inventory is rejected.
- Linking or unlinking does not reserve, decrement, post, reverse or otherwise move Inventory.
- Actual stock use remains the existing review-first Creative Process → Inventory posting authority.
- No Product creation, Finance posting, provider execution, publication, R2 mutation, payment or refund is authorized.
- Request-time schema DDL remains forbidden; schema is introduced only through canonical migration `0024_release467_creative_process_resource_link_operator_workflow.sql`.

## Operator workflow

1. Open Creative Process and select an existing project.
2. Choose an existing active material event.
3. Search existing Inventory for a real Supply or Tool record.
4. Optionally select an existing project operation.
5. Explicitly save the identity link and note why it is correct.
6. The saved identity is immediately visible. Inventory quantity remains unchanged.

Build 287 is next: **Real Existing Resource-Link Evidence Capture**. It must use this workflow against existing real Creative Process material evidence and an existing non-Product Inventory record.


## Owner-reported regressions repaired before promotion

The same Build 286 candidate also repairs four operator-visible regressions reported from the current Production UI:

- Login no longer depends on a JSON session token. Auth-critical scripts are cache-busted and excluded from service-worker caching so the cookie-first client and cookie-first API cannot drift.
- The main Tools & Supplies Inventory editor defaults to a desktop card editor with three columns where space allows, two at medium widths and one on narrow screens. Common fields remain directly editable, including safe Tool ↔ Supply reclassification.
- Public Tools and Supplies listings use smaller cards intended for roughly three to four columns on ordinary desktop widths, with hover/focus expansion without hiding mobile content.
- Light Shop-by-intent/resource-card surfaces explicitly set dark foreground colours, preventing light text on light backgrounds.
