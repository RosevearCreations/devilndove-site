# Devil n Dove Build 466 — Real-Owner Trial Debrief & Cross-Workflow Receipt Reconciliation

**Admin entry:** [/admin/maker-trial-debrief/](/admin/maker-trial-debrief/) through the Maker Workbench and Build 465 closure view. This is a **private, explicitly requested original-source inspection** and human debrief; not a source of product, order, customer, provider, or safety authorization.

## Owner workflow

1. In the original [Owner Trial intake](/admin/maker-owner-trials/), review or record **actual** workshop observations as append-only Build 456 receipts. Choose one actual Project ID (jewellery/metal, resin/clay, CNC/laser/3D, salvage/rework, private therapeutic use) or original Custom Request ID for a genuine commission. No synthetic project is created.
2. Select that exact scenario and ID on the Build 466 screen. Optionally enter an existing Order ID. Choose **Read selected original receipts**; this makes one authenticated Build 456 GET and, when an order is chosen, one Build 454 fulfillment ledger GET. There are no background scans or mass D1 reads.
3. Reconciliation compares original canonical checkpoint names, latest immutable decision by receipt ID, positive receipt/source IDs, accepted owner-observation flags, correct source type and exact listed original source ID. A later HOLD takes precedence. Missing/incompatible sources, truncated histories, commission/project mismatches, unobserved receipts, or sources omitted by the bounded original endpoint remain HOLD.
4. The selected Order is **not automatically associated** with this Project/Request. Open its actual [Order/Aftercare module](/admin/maker-fulfillment-pilot/), check the independent relationship and explicitly tick the owner assertion if it really belongs to this case. Even a shipping receipt is **not a verified delivery or customer consent**.
5. Enter a factual observed outcome, a 24–600-character debrief note, a 12–300-character next action/HOLD, and explicitly attest that the observation is genuine. Notes should contain **no customer names, contact information, credentials, private filenames, media keys or financial details**.
6. Reconcile and optionally add the case to a **tab-only** rollup (maximum 12, replacement by same scenario/source ID). Coverage of all six real journey categories is shown; unreviewed journeys remain HOLD. Download the visibly **UNVERIFIED HOLD** JSON packet only after choosing to do so. No new server receipt, D1 migration, shared state or cross-device sync is introduced.

## Source and decision boundaries

- Build 456 original trial reviews remain the **only** owner intake evidence authority; Build 454 remains the **only** fulfillment evidence ledger. Build 466 does not replace them or mutate either.
- A SOURCE_LINKED_OWNER_RECEIPT means a genuine scoped original record was selected and linked to a human review. It does **not** certify manufacturing success, physical safety, media rights, customer consent, Etsy/Meta publishing, carrier delivery, price, returns, refunds, or legal compliance.
- A reviewer can debrief a **HOLD** trial: a failed or private project need not be complete, monetized, listed or exposed publicly. The whole rollup intentionally always reports `HOLD_INDEPENDENT_REAL_WORLD_ACCEPTANCE`.
- Build 465 closure and proposed Builds 467–475 remain independently scoped. Findings here can inform owner-prioritized follow-up; there is no automatic reprioritization, external execution or cancellation of protected release gates.
- Keep CAD/Canada-first and U.S. shipping suspended, prefer free tiers and bounded reads, and require owner sign-off at original data authorities.

## Test and deployment evidence

```text
node --check public/js/maker-trial-debrief-policy-466.mjs
node --check public/js/admin-maker-trial-debrief-466.js
node --test scripts/release467_build466_maker_real_debrief.test.mjs scripts/release467_build465_maker_closure.test.mjs scripts/release467_build457_maker_workbench.test.mjs
python scripts/current_application_quality_gate.py
```

All fixtures in automated tests are **synthetic test inputs**, never real maker/customer acceptance. Promotion requires clean protected `dev` and `main` checks, same-tree Cloudflare Pages Production deploy and an independent live zero-D1 integrity proof. Technical GREEN is a software-release status only.
