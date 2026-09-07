# Release 467 Build 69 — Product CRUD & Duplicate Safety

Build 69 starts from the exact fully-green Build 68 Production/Development checkpoint:

- Source SHA: `84e34ac4513d985de91085050f33a2c25a702e9a`
- Source tree: `b0abbc6bf690cfb885594c2c9f70dd49eaadbccb`
- Canonical D1 migrations: `0001`–`0004`
- Build 68 Production Pages Deploy: GREEN
- Build 68 Production Live Resource Integrity Proof: GREEN

## Purpose

Finish the existing Product create/edit/archive/delete correction lanes without inventing a second Product authority. The key Build 69 distinction is that **an unused duplicate is not the same thing as a Product with retained business history**. Orders, accounting, inventory, production, customer, packaging, Content Studio and CAIP references must continue to preserve the Product identity.

## Build 69 contract

1. **Create remains collision-safe.** Product numbers are never reused, blank SKUs receive the canonical generated SKU, and explicit Product number/SKU conflicts fail instead of silently overwriting an existing Product.
2. **Edit remains collision-safe.** Product number, slug and SKU conflicts fail with HTTP 409 semantics; Build 67 stale-copy protection remains authoritative for Product saves.
3. **Archive gains stale-copy protection.** Cleanup may send `expected_updated_at`; if the Product changed after the cleanup view loaded, archive fails closed with `stale_product_copy` instead of hiding a newer edit.
4. **Archive remains non-destructive.** It changes lifecycle status only, preserves Product identity and linked history, and records an audited archive reason when supplied.
5. **Permanent delete remains reference-gated.** Protected orders/accounting/inventory/production/customer/content/CAIP history continues to require Archive instead of deletion.
6. **Inventory correction remains explicit.** A Product with material rows requiring reservation release/return review is routed to the Correct / remove workflow; it is not mislabeled as history-blocked.
7. **Cleanup separates history safety from inventory safety.** `history_allows_removal` and `deletion_allowed` are treated as separate signals so the inventory-review state is reachable and visible.
8. **Unused-record classification is explicit.** Cleanup asks the administrator to identify an unused duplicate, abandoned draft, test record, replaced incorrect record, or another unused record. It no longer writes “duplicate” into the audit reason merely because a Product happens to be draft or archived.
9. **The Products table is not a permanent-delete lane.** The historical direct “Remove duplicate draft” button is hidden; permanent removal is reviewed from Cleanup/Archive or the material-aware Correct / remove workflow.
10. **Permanent deletion remains step-up protected.** The existing server contract still requires a fresh reference preflight, admin step-up, the exact `DELETE PRODUCT` phrase, and an audit reason of at least eight characters.
11. **Product numbers remain retired after deletion.** Delete never rewinds the Product-number sequence.
12. **Reusable media remains preserved.** Product cleanup detaches reusable media and does not delete R2 objects.
13. **No schema migration is added.** Build 69 remains schema-neutral; canonical D1 authority stays at `0001`–`0004`.
14. **No Production business-data rewrite, R2 object deletion, payment/provider execution or publication execution is introduced.**
15. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` can fast-forward.

## Correction outcomes

| Product state | Build 69 action |
| --- | --- |
| Normal draft needing edits | Keep/edit; do not assume duplicate |
| Confirmed unused duplicate with no protected history | Classify explicitly, step-up, permanently remove |
| Abandoned/test/incorrect unused record | Classify explicitly, step-up, permanently remove |
| Protected order/accounting/inventory/production/customer/content history | Archive only; inspect owning workspace |
| No protected history but reserved/returnable linked materials | Correct / remove with explicit material actions |
| Product changed after cleanup page loaded | Refresh; stale archive fails closed |

## D1 / R2 boundary

Build 69 adds no table, column, index, trigger or migration. It does not copy Development business data into Production. It does not delete raw or reusable R2 objects. Its Product CRUD changes are bounded status/correction operations against the existing schema and existing deletion registry.

## Next build

After Build 69 is exact-green, continue with **Release 467 Build 70 — Inventory Units & Conversion Engine**.
