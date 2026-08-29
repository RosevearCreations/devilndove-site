# Shared Admin Contextual Help

Status: Release 448 forward enhancement — source implemented and System Gate protected.

## Purpose

Devil n Dove admin workspaces use a shared contextual-help layer for terminology or controls that may not be obvious without forcing the operator to leave the current task.

The visible affordance is a compact `ⓘ` button. Help is explanatory only. It does not own business data, make API requests, mutate D1/R2, contact providers, publish content, place orders, alter Inventory, or change Production.

## Shared implementation

- JavaScript: `public/js/admin-context-help.js`
- Styles: `css/admin-context-help.css`
- Admin bootstrap: `public/js/site-auth-ui.js`
- Regression protection: `scripts/release448_storefront_merchandising_gate.py`

The help module is loaded only on `/admin` routes. Non-admin/public navigation keeps its existing module-visibility bootstrap.

## Initial coverage

The first shared vocabulary set covers:

- Storefront: Carousel, Collection, explicit Product membership, Collage preset
- Creators / Socials: CAIP → Content Studio handoff, eligible reviewed evidence, prepared package
- Inventory / Tools: Tool lifecycle, lifecycle status, Product contribution
- Inventory / Supplies: sourcing and replenishment, replenishment targets, substitution review
- Financials: General Ledger, reconciliation, month lock
- I.T.: D1/R2 readiness, provider configuration, integration authority, deferred I.T. test environment

Current page rules cover:

- `/admin/home-carousel/`
- `/admin/storefront-merchandising/`
- `/admin/caip-content-handoff/`
- `/admin/tool-lifecycle/`
- `/admin/supply-sourcing/`
- `/admin/accounting/`
- `/admin/it-platform/`

Both directory URLs and direct `index.html` admin URLs normalize to the same rule path.

## Interaction and accessibility contract

Every help trigger must:

- be a semantic `button` with `type="button"`
- expose a useful `aria-label`
- bind to its explanation with `aria-controls`
- truthfully update `aria-expanded`
- work with keyboard and pointer/touch input
- close on Escape and restore focus to its trigger
- close when the operator clicks elsewhere
- never create an extra H1

Only one help explanation is intentionally open at a time.

Field-level help is wrapped with the field rather than inserted as a standalone grid item. This preserves two-column forms; when opened, a field explanation may span the grid row.

## Dynamic admin screens

A `MutationObserver` re-runs lightweight target discovery when admin screens render content after page load. The resolver prevents multiple help controls from attaching to the same target and removes stale deterministic trigger/panel IDs before rebuilding a replaced target.

## Declarative extension

New admin pages should prefer declarative help when practical:

```html
<h2 data-context-help="collection">Collections</h2>
```

A page can also provide local explanatory text without adding a global vocabulary entry:

```html
<span
  data-context-help="local-term"
  data-context-help-title="Local term"
  data-context-help-text="Explain this term in the context of this workflow."
>Local term</span>
```

Use a shared library key when the same concept appears in multiple workspaces. Do not duplicate slightly different definitions across pages when one authority can explain the term consistently.

## Safety invariants

Contextual help must remain client-only and read-only:

- no `fetch()`
- no `DDAuth.apiFetch()`
- no D1 writes
- no R2 reads/writes added solely for help
- no Stripe/PayPal/provider calls
- no Inventory quantity or movement changes
- no publication or checkout authority
- no secret values in visible help text
- no Production mutation capability

Provider wording must distinguish **configured** from **tested/accepted**. D1/R2 wording must distinguish readiness checks from permission to replay migrations.

## Regression gate

`python scripts/release448_storefront_merchandising_gate.py` verifies the shared help assets and contract as part of the canonical System Gate. It checks accessibility markers, admin-only bootstrap, dynamic/declarative support, grid-safe field handling, mobile/reduced-motion CSS, JavaScript syntax, no API calls, and no H1 creation.

This capability is an additive admin UX enhancement. It does not change Release 447 D1 baseline authority or add a Release 448 migration.
