# Devil n Dove — Sanity / Health Check

**Release 467 Build 96 — Product Browser Search & Focus Filters is the current Development closure candidate.**

Last fully verified Development is Build 95:
- SHA `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- System Gate `34545373706`: SUCCESS
- Current Application Quality `34545373640`: SUCCESS
- I.T. Admin Runtime Proof `34545373627`: SUCCESS
- Repository Branch Hygiene `34545373651`: SUCCESS
- exact Preview, canonical Development D1, read-only data authority, bindings, smoke and regression evidence: SUCCESS.

Current Production is Build 95:
- `main` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- Production Pages Deploy `34545520443`: SUCCESS
- Production Live Resource Integrity `34545592072`: SUCCESS.

## Current Build 96 boundary

- Build 95 current Product context, sticky table header, desktop System # / Name anchors, highlighted current row and browser-local column views remain authoritative.
- Search filters the Product records already rendered by the primary Products loader.
- Quick views are **All products**, **Needs attention**, **Drafts**, **Low stock**, and **Missing lead image**.
- **Needs attention** means draft, low stock, missing featured image, or `needs_changes` review state.
- Counts are derived from `dd_admin_products_snapshot_v2`; no second Product API/database read is introduced.
- The shown/rendered count makes active filtering explicit.
- Search/focus state is browser-local and never edits Product data.
- If a filter hides the Product loaded in the editor, the context explains it and **Show current Product** only clears filters after an explicit click.
- Build 94 responsive workspace navigation and Build 93 centered-shell/right-side data reachability remain active.

## Safety boundary

- Canonical migrations remain exactly `0001`–`0004`.
- No Product/inventory business-data mutation is introduced by Build 96.
- No request-time schema mutation or Development-to-Production business-data overwrite.
- No automatic provider execution, provider publication, Cloudflare Access mutation or automatic Production promotion.
- Production provider execution remains closed.
- Restart integrity remains `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1`.
- Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT` unless its own current evidence proves acceptance.
- Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported.

**Verdict:** Build 95 Development and Production are GREEN. Build 96 is correctly bounded as a Product browser navigation improvement and must earn its own exact Development and Production proof before closure.
