# Devil n Dove — AI Handoff

## Current authority

Release 467 Build 96 — **Product Browser Search & Focus Filters** is the active Development closure candidate. It consumes the externally proven Build 95 closure and may not self-claim its own later exact-head acceptance.

Last fully verified Development is Build 95 — **Product Workspace Current Context & Table Ergonomics**:
- `dev` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- System Gate `34545373706` SUCCESS
- Current Application Quality `34545373640` SUCCESS
- I.T. Admin Runtime Proof `34545373627` SUCCESS
- Repository Branch Hygiene `34545373651` SUCCESS
- exact Preview, canonical Development D1, read-only data authority, binding/control-plane proof, non-secret smoke and regression evidence: SUCCESS.

Current Production is also Build 95:
- `main` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- Production Pages Deploy `34545520443` SUCCESS
- Production Live Resource Integrity `34545592072` SUCCESS.

## Build 96 scope

Build 96 continues the Products & Inventory usability pass without adding another Product data read. The Product browser now searches the already-loaded records by Product/System number, name, slug, SKU, type/category, status, review status and colour. Quick focus views expose **All products**, **Needs attention**, **Drafts**, **Low stock**, and **Missing lead image**, with counts sourced from the shared `dd_admin_products_snapshot_v2` browser snapshot.

The **Needs attention** view is deliberately practical: draft, low-stock, missing-featured-image, and `needs_changes` records qualify. A visible result count explains how many rendered rows remain. **Clear search & filters** restores the full rendered list. Search/focus state is browser-local presentation state only.

Build 95 current Product context remains authoritative. When the current Product is hidden by a browser filter, the context explains that state and the locate button becomes **Show current Product**. Only that explicit operator action clears the filters and moves to the row. Build 95 sticky headings/identity columns and column presets, Build 94 responsive 3/2/1 workspace navigation, and Build 93 centered-shell/right-side reachability remain active.

## Restart rule

`EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains authoritative. Start from `current-development-authority.json`, which records Build 95 as the last fully verified Development/Production checkpoint and Build 96 as the current closure candidate. Build 96 must pass the exact merged `dev` System Gate, Current Application Quality, I.T. Admin Runtime Proof, Repository Branch Hygiene, canonical Development D1/bindings proof and exact Preview smoke before any `main` promotion.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media acceptance remains `EVIDENCE_DEPENDENT`. Canada-only CAD commerce remains authoritative, U.S. sales/shipping remain disabled, and local pickup remains supported. Provider configuration never authorizes Production execution or publication.
