# AI Context

## Current truth

Do not treat this repo as only a static website.
It is a real multi-area application with:

- storefront
- checkout
- member area
- admin area
- analytics layer
- SEO layer
- product media workflow layer
- inventory/reorder layer

## Payment truth

Current payment flow includes:

- order creation
- provider readiness
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation
- manual admin recording

Do not describe Stripe as complete.
Stripe is still in preparation mode unless newer code explicitly adds full completion.

## Product media truth

Products can now be managed with:

- ordered image URLs
- alt text
- captions
- focal points
- image notes
- SEO metadata

The current workflow is URL-driven, not full direct upload yet.

## Analytics truth

The site now tracks:

- visitors
- sessions
- page views
- search events
- cart activity
- checkout starts
- abandonment signals
- country/path breakdowns

## Documentation rule

When architecture changes, keep these files aligned:

- `README.md`
- `PROJECT_BRAIN.md`
- `AI_CONTEXT.md`
- `DEVELOPMENT_ROADMAP.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `SANITY_HEALTH_CHECK.md`
