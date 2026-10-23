# Release 467 — Build 449: True Project Costs & Pricing

Owner workflow: [Admin → True Project Costs & Pricing](/admin/project-costs/). This build extends the verified maker journey through Builds 445–448; it does **not** alter the Build 383 Accounting and Revenue authority or update Product prices.

## Sources and explicit exclusions

| Cost evidence | Canonical source | Treatment |
| --- | --- | --- |
| Planned material cost | Active Build 445 `maker_project_bom_lines` × current Inventory unit cost per stock unit | Comparison only; **never additive** to actual materials. Unknown if any planned line lacks a valid price or there are no lines. |
| Actual physical material | Non-reversed `creative_project_inventory_posts` × current `site_item_inventory.unit_cost_cents` | Count each real receipt once. Returns/reversals excluded. Current unit cost is *not* an immutable purchase-lot price. Unknown if any posted item lacks a known price. |
| Classified scrap | Build 445 `maker_project_bom_actual_links.scrap_usage_quantity` with unit conversion | Already included in actual material cost. A displayed attribution, never a second expense or stock movement. |
| Actual human time | Build 379 `creative_work_order_events` `event_kind='time'` | One Work Order clock; multiply by reviewed hourly rate. Creative Process alternate logs and Build 446 traveler links are evidence, **not** additional time. Missing rate/time is unknown unless explicitly reviewed as no time. |
| Actual machine time | `creative_project_production_cost_evidence.machine_minutes`, else the reviewed machine-minute estimate | Multiply by reviewed hourly machine rate. A calendar reservation is not an actual run. No record or no rate is unknown; zero must be positively entered. |
| Packaging, consumables, rework, finishing, outside services | Active Build 217 `creative_project_production_cost_evidence` | Each non-null source amount takes precedence over an optional reviewed fallback; do not add both. Rework extras must exclude material and time already counted. |
| Prototype waste evidence | Build 217 `prototype_waste_cost_cents` | Visible cost provenance; excluded from additive total because it may overlap real consumed material and scrap. Requires separate human reconciliation to avoid double counting. |
| Overhead | Append-only operator-reviewed explicit CAD allocation | Zero is allowed when verified; otherwise unknown. |
| Failed/second/reworked attempt evidence | Build 447 `maker_quality_attempts` | Flags review requirements. A failed batch can accrue costs but remains **not sale-eligible** based on costing. |
| Optional pricing | Human `proposed_price_cents` **per unit** × `pricing_quantity` | Informative *potential* price, not a Product update, accepted commission quote, invoice, payment or booked revenue. Margin/profit estimates remain unknown if any cost component is unknown. |

## Canonical schema and operator reviews

The additive, immutable, forward-only canonical migration `0045_release467_maker_project_cost_scenarios.sql` creates `maker_project_cost_reviews`: `one_off`, `failed_batch`, `commission`, `private_learning`; reviewed rates, explicit no-use confirmations, packaging/consumable/rework/finishing/outside-service fallback amounts, overhead, machine minutes, optional per-piece sale price, pricing quantity, review reason, operator and unique request key with SHA-256 payload. DB-level constraints prevent negatives and contradictory no-use claims if actual material or time evidence is already posted. Records may not be edited or deleted; save a **new** reviewed scenario instead. Unique request key replays are source-payload checked.

The GET `/api/admin/project-costs` requires Admin and shows source-owned costs, reviews, comparison and unknown state. POST is same-origin Admin-only and writes **only** immutable review assumptions and an admin audit event. No ledger, physical stock, reservations, Product prices, sale, quote, payment, payroll, Etsy draft or Facebook Marketplace publication. A private therapeutic project can accrue real effort without any price or revenue requirement. Cost source revisions on the original authorities are reflected on refresh, without rewriting history.

## Acceptance evidence and green gates

1. **Good one-off:** planned material CAD 15 vs. one real CAD 12 posting; labour CAD 20, machine CAD 25, packaging CAD 3, consumables CAD 1, overhead CAD 2 → reviewed cost **CAD 63**, optional sale price CAD 100 → illustrative CAD 37 difference / 37% margin. Classified scrap CAD 2 remains inside materials.
2. **Failed batch:** two actual inventory postings CAD 40, 90 minutes labour CAD 30, rework extras CAD 10 and overhead CAD 2 → cost **CAD 82**, not a sale. CAD 20 classified scrap is within real material; `maker_quality_attempts` flags failed attempts for owner review.
3. **Commission:** missing material unit cost and labour rate makes total **unknown** even with a CAD 50 suggested per-piece price × 4. No phantom margin or payment/revenue event.
4. **Therapeutic/private:** zero material or time only if explicitly verified; no sale price required. Machine/overhead and other costs must also be known to call total complete.
5. **Source precedence:** Production Cost Evidence packaging overrides fallback, machine actual time overrides manual minutes; prototype-waste source is visible but not double-added.
6. **Schema integrity:** SQL regression asserts immutable reviews, no false zero-use assertions, unique request keys, valid nonnegative amounts, intact Inventory and Finance rows and no FK violations.

Run:

```bash
node scripts/release467_build449_costs_math.test.mjs
python scripts/release467_build449_costs_sql_regression.py
python scripts/migration_policy_gate.py
python scripts/current_deployment_preflight_truth_gate.py
python scripts/repository_forward_sanity.py
```

Development must prove canonical D1 0045 application before the identical tested tree may pass the `main` Production review. Production green requires the controlled Pages deploy, exact tree, D1 0045 proof, Production release receipt and live custom-domain functional and unauthenticated API checks. Production promotion is **not** implied by a local green test or source merge alone.

## Manual acceptance after promotion

- Open `/admin/project-costs/`; choose a project with linked actual Inventory receipts. Inspect planned vs actual, scrap attribution and any unknown unit prices.
- Inspect Work Order time, quality attempts and costing categories; save a new review with a meaningful source note. Refresh to prove the saved review survives and costs use current source evidence.
- Compare a one-off, failed batch and commission. Do not click Product publish or book a transaction as part of this acceptance.
- For a private creative exercise, leave optional price blank and enter zero only for categories positively confirmed as unused.
