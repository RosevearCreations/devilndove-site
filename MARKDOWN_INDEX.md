# Devil n Dove — Markdown / Authority Index

## Current authority — Release 467 Build 96

Build 96 — **Product Browser Search & Focus Filters** is the current Development closure candidate.

Last fully verified Development is Build 95:
- `dev` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- System `34545373706` SUCCESS
- Quality `34545373640` SUCCESS
- I.T. `34545373627` SUCCESS
- Hygiene `34545373651` SUCCESS.

Current Production is Build 95:
- `main` `746eb697484aaa7d2506b9025873510c4586c48a`
- tree `be7f10517a6a0b247d387436d8414f5d22480e32`
- Production Pages Deploy `34545520443` SUCCESS
- Production Live Resource Integrity `34545592072` SUCCESS.

## Current reading order

1. `current-development-authority.json`
2. `release467-build96-product-browser-focus.json`
3. `release467-build95-product-workspace-current-context.json`
4. `docs/operations/RELEASE_467_BUILD_96_PRODUCT_BROWSER_SEARCH_FOCUS.md`
5. `docs/operations/RELEASE_467_BUILD_95_PRODUCT_WORKSPACE_CURRENT_CONTEXT.md`
6. `release467-build94-product-workspace-readability.json`
7. `release467-build93-centered-application-shell-overflow-accessibility.json`
8. `release467-build92-prelaunch-action-queue-completeness.json`
9. `release467-build91-prelaunch-go-live-decision-convergence.json`
10. `release467-build90-external-acceptance-evidence-depth.json`
11. `docs/operations/RELEASE_467_BUILD_77_CANADA_ONLY_COMMERCE_RULES.md`
12. `AI_HANDOFF.md`
13. `PROJECT_STATUS_AND_ROADMAP.md`
14. `SANITY_HEALTH_CHECK.md`
15. `docs/operations/IT_PREFLIGHT_STARTUP_RELEASE_GUIDE.md`
16. `migrations/canonical/manifest.json`
17. Earlier Release 467 authorities when investigating historical implementation/provenance.

## Build 96 authority contract

Build 96 consumes exact Build 95 Development and Production closure and improves day-to-day Products & Inventory navigation:
- search is performed only over Product records already loaded by the page;
- the Product focus views are **All products**, **Needs attention**, **Drafts**, **Low stock**, and **Missing lead image**;
- focus counts come from the shared `dd_admin_products_snapshot_v2` browser snapshot;
- **Needs attention** includes draft, low-stock, missing-featured-image, and `needs_changes` records;
- the visible result count explains how many rendered rows remain;
- search/focus state is browser-local presentation state;
- **Clear search & filters** restores all rendered Product rows;
- if the current Product is hidden, **Show current Product** only clears filters and locates it after an explicit click;
- Build 95 current-Product context, sticky header/identity columns and Essential/Full views remain active;
- Build 94 responsive workspace navigation and Build 93 centered-shell/right-side reachability remain active;
- no additional Product API/database read, Product/inventory business-data mutation, provider execution/publication, Cloudflare Access mutation, schema mutation or automatic Production promotion is introduced.

Canonical migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains active, U.S. sales/shipping remain disabled, and local pickup remains supported. `EXTERNAL_EXACT_BRANCH_HEAD_FOUR_PROOF_V1` remains active.
