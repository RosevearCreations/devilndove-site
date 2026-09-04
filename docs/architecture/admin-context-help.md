# Shared Admin Contextual Help

Status: current application capability.

## Purpose

Devil n Dove admin workspaces use one shared contextual-help layer for terminology and controls that benefit from explanation without forcing the operator to leave the current task.

The visible affordance is a compact `ⓘ` button. Help is explanatory only: it does not own business data, make API requests, mutate D1/R2, contact providers, publish content, place orders, alter Inventory, or change Production.

## Current authority

- JavaScript: `public/js/admin-context-help.js`
- Styles: `css/admin-context-help.css`
- Current help centre: `/admin/help/`
- Navigation manifest: `data/admin-navigation-modules.json`
- Current regression: `scripts/current_help_hygiene_gate.py`

The current vocabulary covers Storefront merchandising, CAIP evidence, Tools, Supplies, Accounting, I.T., password security, SEO/search quality, responsive layout, release promotion and external HOLD states.

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
