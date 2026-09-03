# Release 467 Build 24 — Storefront ↔ Inventory Sellability Reconciliation

## State

**DEVELOPMENT GREEN.**

Accepted runtime SHA `b04aeb89d4d22b1b158244c86256ad39f31da70b`, tree `f70c733f9544764bd7d68af3d85383e133ee77db`.

Accepted evidence: System Gate `33703326878`, Build 24 Proof `33703326916`, Branch Hygiene `33703326867` — SUCCESS. The System Gate proved canonical Development D1 convergence, Development data authority read-only, exact-SHA Preview deployment, control-plane bindings, non-secret smoke acceptance and regression evidence.

Exact green predecessor was final Build 23 closure `9e61f20635b963d77c0b5c0c7bf7fb37d8a00d4d`, tree `323f9af57b905ea3e762e01cdbad2976197ea930`.

## Purpose

Build 24 closes a read-model gap between Storefront publication readiness and Inventory fulfillment evidence. Storefront Quality already knows whether Product content, SEO and images satisfy publication-readiness checks. The Product read model already exposes finished-goods inventory and linked-resource buildability evidence. Inventory Intelligence owns Supply/Tool operational attention. Build 24 projects these existing facts together without creating a new stock, Product, fulfillment or publication authority.

Workspace: `/admin/storefront-inventory-sellability/`

Endpoint: `GET /api/admin/storefront-inventory-sellability`

## Reconciliation states

- `publication_blocked` — existing Storefront hard-readiness evidence is not satisfied.
- `fulfillment_blocked` — publication is ready, but finished stock or linked-resource evidence reports a blocking condition.
- `fulfillment_unverified` — publication is ready, but this projection has no positive finished-stock or buildability evidence. This is a review state, not an automatic error.
- `sellability_supported` — publication readiness and positive fulfillment evidence are both present. This is evidence only, not authorization to publish, sell, build, reserve, ship or post accounting.

Fulfillment evidence is labeled separately as `in_stock`, `buildable`, `stock_blocked`, `resource_blocked`, `unverified`, or `not_applicable` for digital Products.

## Truth and write owners

- Product publication/readiness read model: `/api/admin/products`
- Product edits and finished-goods Product quantity: `/admin/products/`
- Storefront content/SEO/image quality: `/admin/storefront-quality/`
- Supply/resource operational correction: `/admin/inventory-intelligence/`
- Resource linkage/buildability evidence: `product_resource_links + site_item_inventory`

Build 24 does not create a second readiness formula or inventory ledger. Its API directly reuses the existing admin Product read model.

## Safety boundary

Build 24 has no POST handler and authorizes no automatic unpublish, Product mutation, Inventory mutation, resource-link mutation, public-offer-rule change, request-time schema change, D1/R2 business-data mutation, provider execution/publication, Cloudflare Access mutation, `main` mutation or Production mutation.

Canonical D1 migrations remain exactly `0001`–`0004`. Production remains Release 467 Build 20 until a separate deliberate promotion is authorized and proven.

External Stripe, PayPal, CAIP/social and Cloudflare Access acceptance lanes remain `HOLD_EXTERNAL` unless separately proven.
