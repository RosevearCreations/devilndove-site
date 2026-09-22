# Release 467 Build 233 — Universal Help & Quality-of-Life Coverage

## Goal

Turn the existing shared circular ⓘ contextual-help primitive into a robust application-wide help layer without creating a second help engine or a parallel workflow authority.

The owner explicitly requested two help experiences:

- **Customer Help** — plain-language shopping, account, order, custom-request, gift-card, pickup and site-use guidance.
- **Creator & Operations Help** — Creator, Storefront, Operations, Finance, I.T. and Admin guidance covering purpose, prerequisites, authority boundaries, recovery and next safe action.

## Starting boundary

Build 232 is Production GREEN at main `d5e9922b629f99c5653f5b884861a2c18358b44f` with shared tree `3fcfd435a8618dc64244f53d0ceca1379878dcdd`.

Build 232 exhausted the prior manufacturing evidence roadmap. Build 233 is valid new work because the owner explicitly authorized a new refinement capability direction, which is one of Build 232's documented reactivation conditions.

## Existing capability retained

Build 198 already provided:

- one shared `public/js/admin-context-help.js` implementation;
- circular ⓘ triggers;
- accessible `aria-controls` / `aria-expanded`;
- Escape-to-close;
- one panel open at a time;
- `/help/` and `/admin/help/`;
- public middleware injection;
- Creator/Admin bootstrap injection;
- selected field/term definitions.

Build 233 extends that implementation instead of replacing it.

## Build 233 contract

1. Every meaningful page reached by the shared runtime receives a page-level ⓘ explanation when it has an H1.
2. Existing specific field/term contextual help remains available and takes precedence where attached directly.
3. Public/customer pages show **ⓘ Customer Help** and route to `/help/`.
4. Admin/Creator pages show **ⓘ Creator Help** and route to `/admin/help/`.
5. Page-level help uses audience/workspace profiles:
   - customer shopping;
   - customer custom work;
   - customer account/order/fulfilment;
   - customer discovery;
   - Creator/Storefront;
   - Creator/workshop operations;
   - Finance;
   - I.T./administration;
   - generic Creator/operations fallback.
6. Help describes purpose, what changes, what does not change, prerequisites/review boundaries and next steps.
7. Help remains explanatory only and performs no fetch/API call or mutation.
8. The shared asset revision is bumped so existing browsers receive the new coverage.

## Help Centres

### Customer Help Centre

`/help/` is customer-only. It covers:

- shopping and Product details;
- Product image behavior;
- wishlist/back-in-stock;
- custom requests and proofs;
- account, orders, gift cards and pickup;
- contacting Devil n Dove.

It does not teach Creator/Admin operations.

### Creator & Operations Help Centre

`/admin/help/` is for Creator roles and higher-access workspaces. It covers:

- how the page-level and local ⓘ system works;
- security;
- search/SEO;
- responsive/mobile behavior;
- releases and Production;
- integrations/HOLD states;
- Product image operations;
- Today Needs Attention/runtime incidents;
- Storefront, Creator/Socials, Finance and I.T. workspace ownership.

## Quality-of-life roadmap

Build 233 also authorizes the owner-requested refinement roadmap in `docs/operations/RELEASE_467_REFINEMENT_AUTONOMOUS_BUILDS_233_248.md`.

The sequence is:

- Builds 233–238: QoL/help/operator ergonomics;
- Builds 239–242: streamlining;
- Builds 243–246: security hardening;
- Build 247: non-Product visual coverage;
- Build 248: measured refinement review and roadmap renewal.

## Non-Product image register

`SITE_WIDE_NON_PRODUCT_IMAGE_REQUIREMENTS.md` records public site photography, service/process visuals and Admin diagrams/empty-state illustrations. Individual Product gallery media is intentionally excluded.

## Safety

No schema migration, D1/R2 business mutation, provider execution, publication, Product mutation, Inventory movement, Finance posting, Production business-data copy or synthetic business evidence.
