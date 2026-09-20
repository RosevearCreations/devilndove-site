# Release 467 Build 210 — Custom Work Intake 2.0

## Goal

Enrich the existing Custom Request intake with structured manufacturing intent while preserving every existing private status, reference-image, quote, payment-request and order-draft authority.

## Exact starting boundary

Build 209 is exact-SHA Production GREEN.

- Development SHA: `9b6b22291bd98bdd2d57c8793a0c892f937b4287`
- Shared tree: `36bed0abebbb47b375277562355c3517d171b629`
- System / Quality / I.T. / Hygiene: `35517349532` / `35517349713` / `35517349672` / `35517349600`
- Build 209 Development proof: `35517349698`
- Production main: `9a1bd2b3d99edf69651a17e790866d3b8fa744d4`
- Production Pages / Live Resources: `35517517613` / `35517574976`
- Product Browser / Route: `35517574870` / `35517574790`
- Build 209 Production proof: `35517517656`
- Exact Production URL: `https://d8ed45c4.devilndove-site.pages.dev`
- Deployment: `d8ed45c4-cc5c-4dfa-b430-d9f5591760c0`

## Existing authority extended

Build 210 keeps these owners:

- `custom_requests` for the customer request;
- `/custom-request/` public intake;
- `/admin/custom-request/` staff review;
- private reference uploads;
- existing request status;
- existing quote/revision/payment-request/order-draft journey;
- existing budget, deadline, recipient, occasion, gift presentation and handoff context.

No second intake table or Custom Work application is introduced.

## Canonical schema

Migration `0010_release467_custom_work_intake_2.sql` adds 12 structured columns to `custom_requests`:

1. quantity
2. project_intent
3. intended_use
4. organization_name
5. event_context_structured
6. supplied_item
7. desired_material
8. desired_finish
9. personalization_text
10. requested_capability_key
11. tolerance_size_notes
12. help_choose_method

`requested_capability_key` references the reviewed Build 209 `workshop_capability_profiles` authority.

## Customer experience

The intake now captures:

- one-off / prototype / repeat / batch / corporate-event / repair-remake intent;
- quantity;
- intended use;
- company or organisation;
- event/project context;
- whether the customer expects to supply an item;
- desired material;
- desired colour/finish;
- wording/personalization;
- approximate size/tolerance notes;
- an optional reviewed workshop capability preference;
- explicit **Help me decide how to make it**.

A chosen capability is a preference only. It is never an automatic manufacturing or feasibility promise.

## Build boundary

Build 210 records requirements only.

Build 211 — Manufacturing Triage & Route Proposal — owns:

- candidate process selection;
- specialist review;
- proof/sample requirement;
- material unknowns;
- supplied-item suitability;
- feasibility state;
- next clarification question.

Build 210 must not implement those decisions early.

## Safety

- forward-only canonical migration;
- no request-time DDL;
- no automatic quote;
- no automatic order;
- no automatic stock reservation;
- no automatic feasibility/manufacturing promise;
- no R2 mutation beyond the already-existing explicit reference-upload route;
- no payment/provider/publication execution;
- Production business data remains Production-owned;
- Canada/CAD and U.S.-shipping pause remain unchanged.

## Acceptance

1. All 12 structured fields are canonical columns on the existing `custom_requests` table.
2. Public runtime schema readiness fails closed until migration 0010 is present.
3. Public intake records quantity, intent, use, company/event context, supplied-item flag, material/finish, personalization, size/tolerance, capability preference and help-me-choose state.
4. Capability preference validates against reviewed Build 209 public capability profiles.
5. Existing gift/occasion/handoff/reference/budget/deadline fields remain present.
6. Existing admin Custom Work read path surfaces the structured fields without a new admin authority.
7. No Build 211 manufacturing route or feasibility decision is created.
8. Existing private status, quote and order journey remains canonical.

## Next

Build 211 — Manufacturing Triage & Route Proposal — remains blocked until Build 210 is exact-SHA Production GREEN.
