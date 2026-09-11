# Devil n Dove — Project Status and Roadmap

## Current Development and Production authority

**Release 467 Build 96 — Product Browser Search & Focus Filters** is the current Development closure candidate.

Last fully verified Development is Build 95 — Product Workspace Current Context & Table Ergonomics:
- `dev` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- System Gate `34545373706` SUCCESS
- Current Application Quality `34545373640` SUCCESS
- I.T. Admin Runtime Proof `34545373627` SUCCESS
- Repository Branch Hygiene `34545373651` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 95:
- `main` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- Production Pages Deploy `34545520443` SUCCESS
- Production Live Resource Integrity `34545592072` SUCCESS.

## Build 96 scope

Build 96 makes the existing Product records table faster to navigate without changing Product authority or adding database load. Search runs over the Product records already loaded by the page and the shared `dd_admin_products_snapshot_v2` browser snapshot.

The Product browser adds:
- search across Product/System number, name, slug, SKU, type/category, status, review status and colour;
- **All products**, **Needs attention**, **Drafts**, **Low stock**, and **Missing lead image** focus views;
- live focus counts and a visible shown/rendered row count;
- browser-local persistence of the search/focus view;
- **Clear search & filters** to restore the rendered list;
- explicit current-Product recovery when a filter hides the Product loaded in the editor.

**Needs attention** includes drafts, low-stock records, missing lead images and `needs_changes` review status. Build 95 sticky table identity/current Product context/column presets, Build 94 responsive workspace navigation and Build 93 centered-shell/local-scroll protections remain active.

No D1/R2 business data, schema, payment/provider execution, publication authority, commerce rule or heading hierarchy changes. Exactly one H1 remains the public SEO rule.

## Current external acceptance

Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`. CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

## Build 96 closure sequence

1. Ingest Build 95 exact Development/Production closure into current restart authority.
2. Apply browser-local Product search/focus controls without changing Product data authority.
3. Fast-forward the exact candidate to `dev`.
4. Require exact merged-`dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof and Repository Branch Hygiene plus canonical Development D1/binding proof and exact Preview smoke.
5. Promote the same exact SHA/tree to `main` only when all Development checks are GREEN.
6. Require Production business-data preservation, canonical Production D1/FK/binding proof, exact Pages deployment, public smoke and promotion proof.
7. Require Production Live Resource Integrity to re-prove live D1, same-origin Product R2, Product API photography and account diagnostic.
8. Only then call Build 96 complete externally; Build 97 must ingest Build 96's final external closure evidence.

Canonical migrations remain exactly `0001`–`0004`.
