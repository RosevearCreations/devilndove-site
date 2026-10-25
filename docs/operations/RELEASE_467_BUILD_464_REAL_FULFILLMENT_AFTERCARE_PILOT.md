# Devil n Dove Build 464 — Real Fulfillment, Damage/Returns & Aftercare Pilot

## Source-first scope

The private [Build 464 owner pilot](/admin/maker-fulfillment-pilot/) guides **one real existing Order** through Canadian carrier/pickup, protective packing, actual damage, return (refund versus exchange owner review), repair and aftercare. It uses **the canonical Orders `/api/admin/order-detail`** and the existing **Build 454 immutable evidence `/api/admin/maker-fulfillment-evidence`**. The second endpoint is already guarded by canonical migration `0049`; this build adds **no migration, competing Orders table, provider token, automatically sent message or new paid service**.

Both Admin source requests run only when an operator enters an actual order ID and selects **Inspect**. Order payloads may contain private address data but the page displays only the minimum identifiers and statuses; it never stores an address, customer email, billing token, photo or document in a receipt, localStorage or console. Receipt history is bounded to 50 records (the last twelve displayed), with truncation disclosed.

## Physical owner pilot instructions

1. Choose an actual order in the existing Orders page. Never invent a customer or transaction merely to clear the pilot. Enter its ID and explicitly load original Orders + Build 454 evidence.
2. Verify actual payment/fulfillment status, Canadian destination/pickup instructions and the genuine customer's approved direction at its **original record**. Payment state alone does not prove final settlement; check the separate Finance source where appropriate.
3. For shipping, personally inspect the actual carrier, tracking and independently issued postage receipt reference. For pickup, use a genuine receipt/reference. A draft label, message or external URL is not proof that goods shipped, were received or were collected.
4. For damage, record a factual **`damage_hold`**; for a requested return/refund or exchange, record **`return_hold`** with an explicit `refund` or `exchange` review route in the note. The saved receipt is never a financial approval. A repaired item may use `repair_followup`; an aftercare review may use `aftercare_followup` after manually checking customer authorization. This screen does not contact the customer.
5. Record the exact source reference (not the customer's private data), a factual 24+ character observation and explicit operator observation/attestation. Select **Evaluate**. Only after original records and human-source checks pass can the owner click **Append**.
6. The page re-fetches both original sources immediately before the append-only POST and blocks if the order's status/payment/mode or latest evidence ID/count changed. It retries the **same request key** after an ambiguous network response for idempotent replay rather than creating another charge or receipt. A changed input invalidates the key. Re-check canonical Build 454 history after an accepted receipt.
7. Open canonical Orders, Finance, Custom Requests and existing Fulfillment to handle status transitions, outbound communication, exchanges and refunds through **their existing authorities only**. No action in this pilot grants such authority.

### Safety and HOLD matrix

| Path | Required independent evidence | Pilot effect |
| --- | --- | --- |
| Protective packing | Original CAD shipping order to CA, paid status, owner/customer instruction reference | Append Build 454 `packing_review`, not dispatch |
| Carrier shipment | All above + genuine Canadian carrier, tracking, independent postage receipt | Append Build 454 `shipping_receipt`, not buy/book/notify |
| Local pickup | Original CAD pickup order, paid status, genuine pickup reference and instruction | Append Build 454 `pickup_receipt`, not status transition |
| Damage report | Existing order + personally reviewed factual damage observation | Append Build 454 `damage_hold`, not a damage/insurance claim |
| Return/refund or exchange | Existing order + factual review of the return request | Append Build 454 `return_hold`; separate finance/customer approval HOLD |
| Repair/aftercare | Existing order + personally checked original customer authorization reference | Append Build 454 `repair_followup`/`aftercare_followup`; no outbound message |

Any absent canonical endpoint, original-source mismatch, partial Orders read, missing consent where required, US/foreign shipping, cancelled/refunded outbound order or unsatisfied receipt fields is **HOLD**. Operator-checked consent remains a **manual assertion**, not independently provider-verified customer consent. Actual owner trial acceptance is **HOLD until an actual transaction is personally verified**; passing synthetic automated tests and deploying code does not change that.

## Verification and handoff

```text
node --check public/js/maker-fulfillment-pilot-policy-464.mjs
node --check public/js/admin-maker-fulfillment-pilot-464.js
node --test scripts/release467_build464_fulfillment_pilot.test.mjs scripts/release467_build457_maker_workbench.test.mjs
python scripts/current_application_quality_gate.py
```

The tests use synthetic orders and deliberately fail source/consent/shipping safety checks. They do not demonstrate any real shipment, refund, returned merchandise, customer consent or owner observation. In Production, keep existing `dev` and `main` protected PR gates, exact-tree Cloudflare deployment, and the independent **zero-D1 post-deploy live resource integrity proof**; do not call Production GREEN without actual exact-SHA success. No automatic financial mutation, R2 media action, paid provider, customer contact, US shipping or D1 schema change is included.

**Next proposed:** Build 465 — Maker Pilot Closure & Next Prioritized Roadmap, preserving unresolved genuine owner/provider HOLDs.
