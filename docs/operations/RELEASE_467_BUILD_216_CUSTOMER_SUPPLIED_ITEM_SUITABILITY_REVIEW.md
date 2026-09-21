# Release 467 Build 216 — Customer-Supplied Item Intake & Suitability Review

## Goal

Support customer-provided tumblers, jewelry, tools and other items through the **existing Custom Work authority**, with source-backed condition evidence, staff-reviewed suitability, explicit limitations and customer acknowledgement.

## Exact starting boundary

Build 215 **Small-Batch, Corporate & Event Quoting** is fully Production GREEN.

- Development SHA: 825814b09a7c3f05c6fddc223ec8876ade0bbc35
- Production main: c8366bde7fb2e7c673be656ff85265058a407c4a
- Shared tree: f1facb7a27e22f3a129654713cc6dd109e3b6b16
- Development System / Quality / I.T. / Hygiene: 35548513112 / 35548513093 / 35548513139 / 35548513160
- Build 215 Development proof: 35548513080
- Production Pages / Live Resources: 35548670491 / 35548742503
- Product Browser / Route: 35548742488 / 35548742478
- Build 215 Production proof: 35548670519
- Exact Production URL: https://cec5e207.devilndove-site.pages.dev
- Production business counts preserved: 2 users / 45 products / 1,041 inventory / 0 orders
- Canonical migrations before Build 216: 15
- Foreign-key violations: 0

## Existing authorities retained

Build 216 does **not** replace any of these:

- custom_requests.supplied_item remains the request-level supplied-item indicator from Build 210.
- custom_request_manufacturing_triage remains the request-level feasibility/supplied-item triage authority from Build 211.
- custom_request_reference_uploads remains the private customer reference/condition upload authority.
- custom_order_stage_photos remains the existing order/process-stage photo authority.
- the existing Custom Work request/status/quote/order/payment journey remains in control.

## Canonical schema addition

Migration 0016_release467_customer_supplied_item_suitability_review.sql adds four additive tables:

1. custom_request_supplied_items — one or more concrete customer-owned/authorized items under an existing Custom Request.
2. custom_request_supplied_item_reviews — append-only item-specific suitability decisions.
3. custom_request_supplied_item_evidence — links to existing media rows for condition-at-intake or post-work condition evidence.
4. custom_request_supplied_item_acknowledgements — private limitation acknowledgement evidence.

The migration creates no supplied-item business rows or media.

## Public intake

When a customer marks **I plan to supply the item or blank**, the existing /custom-request/ form can record:

- item label and description;
- customer ownership or owner-authorized status;
- material if known;
- finish/coating if known;
- requested modification;
- current condition notes;
- condition-at-intake photos.

Unknown material or finish stays **unknown**. Customer statements are recorded as customer-stated facts, not independently verified compatibility claims.

Condition photos use the existing private Custom Work upload bucket and consent controls. They are linked as Build 216 evidence; they are not copied into a new media store.

## Staff suitability review

The existing /admin/custom-request/ page contains the Build 216 workspace.

Each supplied item can retain:

- separate item identity;
- ownership/authority confirmation;
- intake condition notes;
- linked intake media;
- material/finish known-or-unknown state;
- requested modification;
- latest readiness and blockers;
- append-only suitability review history;
- linked post-work condition evidence.

Final Build 216 decisions must agree with the existing Build 211 supplied-item triage state:

- acceptable_for_assessment → Build 216 accepted;
- limitations_required → Build 216 accepted_with_limitations;
- declined → Build 216 declined.

Build 216 does not silently rewrite Build 211 triage.

## Suitability decisions

Append-only review decisions are:

- needs_review;
- accepted;
- accepted_with_limitations;
- declined.

A final review records the reviewed process/suitability basis and may retain:

- material unknowns;
- safety/process unknowns;
- explicit limitations;
- review notes.

Unknown compatibility, material, coating or safety facts must remain explicit. Build 216 does not invent them.

## Limitation acknowledgement

An accepted_with_limitations review may create a private token-protected acknowledgement link at /custom-request/supplied-item/.

The customer can acknowledge or decline the stated limitations. Acknowledgement:

- records the response against the exact review;
- may move the item from limitations_pending to limitations_acknowledged;
- does **not** start production;
- does **not** charge the customer;
- does **not** reserve Inventory or stock;
- does **not** call a provider.

## Evidence retention

Build 216 media evidence is link-only.

- Intake condition evidence references existing custom_request_reference_uploads.
- Post-work condition evidence references existing custom_order_stage_photos.
- Incorrect evidence links are **voided**, not deleted.
- The underlying media is never deleted by Build 216.
- Completed/returned/closed items require post-work condition evidence before readiness can become GREEN.

## Safety boundary

Build 216 does **not**:

- create a second Custom Request or triage system;
- create a second media store;
- make unsupported compatibility or safety claims;
- promise acceptance before staff review;
- start production automatically;
- reserve/consume Inventory;
- create a real order;
- execute payment/provider actions;
- publish private media;
- perform request-time DDL.

## Acceptance

1. Public supplied-item intake creates item-specific identity without duplicating the Custom Request.
2. Condition-at-intake photos remain in the existing private media authority and are linked as evidence.
3. Staff final decisions cannot contradict Build 211 supplied-item triage.
4. Review history is append-only.
5. Accepted-with-limitations requires explicit limitations and customer acknowledgement evidence.
6. Post-work condition evidence is traceable before completion/return closure.
7. Voided evidence links retain history and do not delete media.
8. Unknown material/process/safety facts remain unknown.
9. Migration 0016 is canonical/additive and creates no business rows.

## Next

Release 467 Build 217 — **Production Cost Evidence v2** — remains blocked until Build 216 is exact-SHA Production GREEN.
