# Devil n Dove — Project Status & Roadmap

## Current checkpoint

**Release 467 Build 112 — Inventory & Material-Usage Reconciliation** is the active closure candidate.

Build 111 is the last fully verified Development + Production checkpoint:

- Exact Build 111 Development SHA: `a234b874b6e03442af96c0110d3cc22db074fe34`
- Exact tree: `4e82696773761595e57bb69eb48c053f95060e2c`
- System Gate: `34669983965`
- Current Application Quality Proof: `34669983954`
- I.T. Admin Runtime Proof: `34669983974`
- Repository Branch Hygiene: `34669983946`
- Production Pages Deploy: `34670059768`
- Production Live Resource Integrity: `34670099134`

The Build 111 closure is recorded by Build 112 ingestion, not by a retrospective Build 111 self-claim.

## Build 112 — Inventory & Material-Usage Reconciliation

Goal: reconcile Product/project material consumption, reservations, kit remnants, shortages and costing evidence **without inventing stock movements**.

Delivered scope:
1. Read-only reconciliation helper with deterministic `ready / review / blocked` states.
2. GET-only admin endpoint.
3. Inventory Operations UI with filters and owner routing.
4. Product plan and Product production-material evidence.
5. Creative reviewed-consumption evidence.
6. Aggregate reservation-vs-movement reconciliation with no invented Product attribution.
7. Kit provenance/remnant evidence with explicit aggregate-balance caveat.
8. Current Inventory cost authority and shortage review.
9. Existing Build 71 / 309 / 440 mutation owners preserved unchanged.
10. No schema/R2/provider/Finance mutation.

## Release mechanics

Every new build follows the same restart protocol:
1. Ingest the **previous build's later external closure**.
2. Implement a bounded candidate without self-claiming later proof.
3. Fast-forward the exact candidate to `dev`.
4. Require exact-head System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene proof plus Preview/D1/binding acceptance.
5. Only then non-force promote the exact SHA/tree to `main`.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. The **next** build ingests that six-proof closure.

Persistent branches remain `main` and `dev`.

## Safety / external work

Forward D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social/OAuth and Cloudflare Access service-token lanes remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

Canada-only / CAD commerce remains authoritative, U.S. sales and shipping remain disabled, and local pickup remains supported.

## Next build

No Build 113 scope is authorized until Build 112 receives its later external exact-head Development and Production proof. Build 112 itself must not record that proof.
