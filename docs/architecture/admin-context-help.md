# Shared Contextual Help

Status: current application capability.

## Purpose

Devil n Dove public, creator and admin workspaces use one shared contextual-help layer for terminology and controls that benefit from explanation without forcing the operator to leave the current task.

The visible affordance is a compact `ⓘ` button. Help is explanatory only: it does not own business data, make API requests, mutate D1/R2, contact providers, publish content, place orders, alter Inventory, or change Production.

## Current authority

- JavaScript: `public/js/admin-context-help.js`
- Styles: `css/admin-context-help.css`
- Public/member help centre: `/help/`
- Admin/creator operating help centre: `/admin/help/`
- Navigation manifest: `data/admin-navigation-modules.json`
- Current regression: `scripts/current_help_hygiene_gate.py`

The current vocabulary covers shopping and Product details, full-image Product presentation, crop/resize and focal-point editing, wishlist/back-in-stock, Media/Content/Creative/Packaging workflows, Storefront merchandising, CAIP evidence, Tools, Supplies, Accounting, I.T., runtime attention, password security, SEO/search quality, responsive layout, release promotion and external HOLD states.

## Accessibility and layout contract

Every trigger is a semantic button with an accessible label, `aria-controls`, truthful `aria-expanded`, keyboard support and Escape-to-close behavior. Only one explanation is intentionally open at a time.

Field-level help is wrapped with the field rather than inserted as a separate grid item. Help must never create another primary page heading.

## Declarative extension

Use `data-context-help="<shared-key>"` when a shared definition exists. A page-specific term may supply `data-context-help-title` and `data-context-help-text`.

Prefer one shared definition over slightly different copies scattered across pages.

## Safety invariants

- no `fetch()` or authenticated API calls from the help module
- no D1/R2 mutation
- no Stripe/PayPal/provider execution
- no publication or checkout authority
- no secret values in visible help
- configured is not the same as tested/accepted
- Development readiness is not permission to mutate Production

Historical release/build evidence remains available in Git history and authority records, but current help avoids presenting old release instructions as live operating procedure.


## Shared availability

Public HTML receives the client-only help layer from the shared Pages middleware. Admin and creator routes receive the same implementation through the authenticated UI bootstrap, including lean workspaces without enabling the optional broad navigation stack.

A floating **ⓘ Help** link points shoppers/members to `/help/` and admin/creator users to `/admin/help/`. Contextual triggers remain local to the term or method being explained.

Product and presentation media help deliberately preserves authority boundaries: Product gallery/crop work belongs to Product Media; non-Product workshop/site photography belongs to Media & Content Studio.

## Build 233 application-wide page-level coverage

The shared implementation now supplies a page-level circular ⓘ explanation for every meaningful page with an H1 when the shared runtime is active. This is a fallback/overview layer; specific field and term help remains local and more precise.

Audience separation is explicit:

- public/customer routes use **ⓘ Customer Help** and `/help/` for shopping, accounts, orders, custom requests, gift cards, pickup and contact guidance;
- Creator/Admin routes use **ⓘ Creator Help** and `/admin/help/` for Creator, Storefront, Operations, Finance, I.T. and administration guidance.

Page profiles explain purpose, authority boundaries, what the screen can change, what help itself never changes, and where the operator/customer should go next. The runtime remains client-only and performs no fetch/API call or business-data/provider mutation.

Build 233 does not create another help engine. The existing declarative `data-context-help` extension and shared term library remain authoritative for detailed local help.
