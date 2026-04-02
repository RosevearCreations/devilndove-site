# Sanity / Health Check

## Current build status

This build is in a better state for day-to-day browsing and admin use than the previous pass, but it is still not in the final security-complete or payments-complete state.

## What improved in this pass

- Movie cards now stay readable and inside the layout frame.
- Movie paging now reflects the full catalog instead of stopping the visible experience at the old default batch.
- Small-screen handling for the movie shelf is materially improved.
- Same-site admin media uploads are more reliable because auth-cookie fallback is now accepted.
- Key JSON endpoints now return safer baseline headers.
- Known gaps and risks are now documented in a much more actionable way.

## Still the biggest unfinished areas

- Stripe completion and refund/dispute safety
- webhook retry/replay hardening
- stronger media lifecycle completion
- deeper inventory movement and reorder depth
- richer analytics and funnel reporting
- trusted movie metadata enrichment

## Recommended next test cycle

1. Test the movie shelf on desktop and on phone-width layouts.
2. Verify paging across multiple movie pages and different page sizes.
3. Test admin media upload from same-site mobile/admin flows.
4. Confirm no layout overflow on dense cards and table-heavy admin screens.
5. Continue into Stripe/webhook hardening next.


## Current pass update

- Rebuilt the public movie shelf layout with a dedicated card and pager structure so movie entries no longer collapse into unusable one-character columns.
- The movies page now uses the API paging metadata to show the real total catalog size, page number, page range, and next/previous navigation more honestly.
- Added a more defensive movie-specific CSS layer so future generic card/grid changes are less likely to break the movie shelf again.
- KNOWN_GAPS_AND_RISKS.md was rewritten to document the remaining payment, inventory, media, analytics, and metadata risks more clearly.


## Current pass reliability/security improvements

- Admin audit trail added for key privileged changes.
- Account recovery request logging now stores IP and user-agent and applies light rate limiting.
- Stripe and PayPal webhook event records now track attempts more honestly during processing.

## Current pass health update

- Payment/admin risk was reduced with provider refund sync attempts plus queued receipt records.
- Inventory authority moved forward with stronger action-specific mutations and movement logging.
- Media lifecycle moved forward with restore/replace metadata support.
- Analytics moved forward with better funnel metrics.
- Draft-to-publish workflow now has readiness signals.
- The largest remaining unresolved areas are true outbound receipts, full Stripe completion, deeper provider-confirmed dispute sync, final D1 authority cleanup, and trusted movie metadata enrichment.



## Current pass health update
- Stripe confirmation is materially safer because the customer return path now finalizes the Checkout Session locally.
- Stripe dispute records are now provider-confirmed through webhook upserts instead of staying manual-only.
- Notification outbox entries can now be dispatched through a real email-delivery path when mail credentials are configured.
- Destructive admin actions now require password confirmation.
- Public creations now use a centralized API path instead of another page-level direct JSON dependency.
- The biggest remaining unresolved area is trusted movie enrichment, because that depends on external metadata access rather than an unfinished local endpoint.

## Current pass health update
- Stripe return reconciliation remains in place.
- Notification outbox dispatch remains in place.
- Draft-to-publish governance moved forward with explicit review/publish actions and durable review logs.
- Inventory authority moved forward with supplier purchase-order drafts and grouped reorder suggestions.
- Product margin visibility moved forward with linked-resource cost rollups.
- Analytics moved forward with referrer, entry-path, and zero-result search diagnostics.

## Remaining honest gaps
- worker-grade automated webhook replay/dispatch is still not fully autonomous yet
- permission granularity still needs deeper role segmentation
- trusted movie enrichment still depends on external accepted data access



## Current pass update
- Public read-path duplication was reduced again by adding centralized `/api/tools` and `/api/supplies` endpoints and using API-first reads for gallery/creations migration paths.
- Supplier purchase-order workflow now updates inventory more honestly when orders are marked ordered or received.

- Product-level resource reservation actions are now present in admin inventory workflows.
- Mobile quick-product bootstrap has been hardened against false unauthorized/bootstrap failures.
- Media asset admin patching now supports batch sort/variant updates and no longer references an undefined confirmation variable.


## Current pass health update
- Customer receipt delivery is more real than before because refund/dispute actions now attempt immediate queued-email dispatch instead of only storing queue rows.
- Stripe provider-confirmed refund/dispute customer notices now have a direct queue-and-dispatch path when customer email and mail credentials are present.
- Public product discovery moved forward with live category/colour/type summaries from `/api/products`.
- Public tools and supplies moved one step closer to single read authority by using their dedicated APIs on the outward-facing pages.

## Remaining honest gaps
- non-Stripe provider-confirmed dispute automation is still not complete
- broader role/permission segmentation is still a future security pass
- trusted movie enrichment still depends on external accepted metadata access

## Current pass update
- Bulk import quality improved: preview now catches duplicate slugs/SKUs/product numbers plus newer field-validation issues before insert.
- Bulk import completeness improved: imports can now seed richer finished-product metadata, tags, SEO rows, and additional product-image rows.
- Media upload lifecycle improved: direct R2 uploads can now attach to product galleries and optionally set the featured image in the same step.



## Current pass sanity update
- Product stock report now supports frontend reserve/release actions for linked resources.
- Storefront product detail now returns grouped image structures plus variant-role hints.
- Media asset reads expose derived variant URL suggestions for later image-processing rollout.
- Visitor analytics expose top product paths and top ordered products.
- Public supplies discovery and tools health now use centralized API reads more consistently.


## Current pass update
- Admin products screen now includes reserve/release controls for linked resources.
- Toolshed page now reads through `/api/tools` instead of direct JSON fallback chaining.
- Product detail payload now includes `build_summary` and image `variant_urls` hints.
