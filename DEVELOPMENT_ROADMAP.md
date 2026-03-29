# Development Roadmap

## Current completed foundations

- auth and session model
- member orders/downloads
- admin users/security tools
- checkout and order creation
- PayPal handoff
- PayPal return capture
- PayPal webhook reconciliation foundation
- analytics and visitor monitoring foundation
- product SEO tools
- product media workflow foundation
- site inventory/reorder foundation
- phone-first finished-product capture foundation
- movie cover integration with enriched JSON support

## Strongest next steps after this pass

1. Stripe payment completion pass
2. webhook retry / replay / dispatch hardening
3. direct media upload workflow to R2 completion and lifecycle polish
4. deeper inventory operations for products, tools, and supplies
5. product import seeding refinement and validation UX
6. richer analytics dashboards and funnel reporting
7. staged migration of duplicate JSON-backed collections into D1

## Media-specific roadmap

- direct upload endpoint completion and consistency across admin flows
- image delete/reorder UI polish
- thumbnail/variant handling
- tighter annotation-to-storefront usage
- featured-image suggestion and storefront-ready image rules

## Payment-specific roadmap

- webhook replay safety
- idempotency improvements
- provider retry logging
- refund/dispute workflows
- invoice / refund / return receipt delivery

## Inventory and catalog roadmap

- stronger movement history and reservation logic
- reorder automation and supplier-facing workflows
- build readiness driven from linked tools/supplies and finished products
- continue reducing duplicate JSON vs D1 sources
- expand product-resource story links for social and merchandising use

## Analytics roadmap

- richer dashboard summary and trend views
- funnel reporting by session and checkout stage
- stronger abandoned-cart diagnostics
- clearer source / campaign / landing-page attribution

## Current pass update

- Added real movie API pagination and updated the movie page so the full catalog can be browsed instead of stopping at the old 150-row default.
- Continued CSS cleanup with more defensive layout rules to reduce overflow, overlap, and card/table breakage across admin and public pages.
- Rewrote `KNOWN_GAPS_AND_RISKS.md` so the package now documents the remaining operational, security, data-model, and customer-experience risks honestly.
- Refreshed roadmap and repo documentation to keep the next priorities clear: payment hardening, inventory depth, media lifecycle polish, analytics, and continued JSON → D1 migration.
- SEO guidance remains active on every pass: one H1 per outward-facing page, stronger discovery wording, clearer metadata, and crawl-friendly page structure.
