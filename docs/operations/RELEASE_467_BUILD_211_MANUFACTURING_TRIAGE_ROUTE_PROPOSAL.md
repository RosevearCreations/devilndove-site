# Release 467 Build 211 — Manufacturing Triage & Route Proposal

## Goal

Let staff translate an existing Custom Request into explicit reviewed manufacturing-triage evidence and one or more candidate workshop processes without turning customer requirements into an automatic feasibility promise.

## Exact starting boundary

Build 210 **Custom Work Intake 2.0** is fully Production GREEN.

- Development SHA: `228d50a0a71d8b99e24f888b8bcd25b9c839a396`
- Production main: `6e81942e7fd54157698b640252eed256b0411752`
- Shared tree: `f8e85d5e91a9eee5a9c64901865efe24be1ad34e`
- Development proofs: `35519319569` / `35519319561` / `35519319637` / `35519319612`
- Build 210 Development proof: `35519319562`
- Production Pages / Live Resources: `35519559453` / `35519611667`
- Product Browser / Route: `35519611679` / `35519611767`
- Build 210 Production proof: `35519559362`
- Exact Production URL: `https://cae32d7d.devilndove-site.pages.dev`

Primary roadmap: `docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md`.

## Extend existing authority

- `custom_requests` remains the customer-request authority.
- `inventory_processes` remains the canonical workshop-process identity.
- `/admin/custom-request/` remains the Custom Work staff surface.
- Existing quote, payment-request, order, reference-image, gift/event and status authorities remain unchanged.

## Build 211 authority

Canonical migration `0011_release467_manufacturing_triage_route.sql` adds:

- one reviewed `custom_request_manufacturing_triage` record per Custom Request;
- ordered `custom_request_route_processes` candidate-process links;
- feasibility state;
- specialist-review requirement and notes;
- proof/sample requirement and notes;
- material unknowns;
- supplied-item suitability-review state and notes;
- next clarification question;
- route notes and review provenance.

The authenticated endpoint `/api/admin/custom-work-triage` provides explicit GET/POST staff review. The page never saves automatically.

## Non-overlap / safety boundary

- No second Custom Request system.
- No second process taxonomy.
- No automatic route proposal from customer text.
- No automatic feasibility promise.
- No invented customer facts, material facts, technical settings or safety claims.
- No automatic quote, order, stock reservation, payment, provider action or publication.
- No request-time DDL.
- Production business data remains Production-owned.

## Acceptance

1. A staff member can review one existing Custom Request and explicitly save triage.
2. One request can reference zero or more ordered candidate `inventory_processes`.
3. Specialist review, proof/sample need, material unknowns, supplied-item review and the next clarification question remain visible.
4. Orphan triage rows, invalid process references, duplicate route positions and foreign-key violations are zero.
5. The exact Development head passes System, Quality, I.T., Hygiene and Build 211 proof before Production promotion.

## Next

Release 467 Build 212 — Hybrid Creative Project Operations — remains blocked until Build 211 is exact-SHA Production GREEN.
