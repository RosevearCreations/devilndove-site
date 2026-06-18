# Known Gaps and Risks — Current Build 190

> **Canonical direction:** Read `PROJECT_STATUS_AND_ROADMAP.md` first. The full historical gap log through Build 189 is preserved at `docs/archive/KNOWN_GAPS_AND_RISKS_HISTORY_THROUGH_BUILD189.md`.

## Current live-environment risks

1. Cloudflare D1/R2/email/payment bindings cannot be fully verified until the deployed environment is tested.
2. Product-media and private-evidence workflows still need a confirmed R2 binding and public/private bucket policy review.
3. Stripe webhook verification remains incomplete until a live/test webhook endpoint and `STRIPE_WEBHOOK_SECRET` are configured.
4. Email should remain in `manual` mode until a provider domain, sender, API key, and delivery logs are verified.
5. Cloudflare release-control live imports need a narrowly scoped API token before they can be considered operational.

## Product and margin risks

6. Product costs are incomplete for many items; Build 190 margin warnings are estimates, not accounting truth.
7. Marketplace fees vary by channel, country, ads, payment processing, shipping, and taxes; the temporary fee estimate must not be treated as exact.
8. Missing product photos, alt text, scale images, materials, care notes, shipping details, and inventory can still block trustworthy publishing.
9. Low stock is currently based mainly on product inventory fields; supply/component shortages are not fully rolled into product readiness.
10. Product-family cost defaults and expected waste/scrap are not yet maintained centrally.

## Customer, consent, and communication risks

11. Unified customer timelines are read/aggregation tools; duplicate emails, guest orders, changed addresses, and shared household emails still need merge rules.
12. Customer stories and proof must remain blocked until public-use consent is explicitly documented.
13. Cart recovery remains human-review only; automatic email must not be enabled without permission, exclusions, cooldown, and provider testing.
14. Review requests need fulfilled/paid eligibility, cooldown, exclusions, and opt-out handling.
15. Recall communication must stay behind approval/signature/evidence gates.

## SEO and local-search risks

16. No code change can guarantee first-page local rankings. Relevance, distance, and prominence/popularity remain external ranking factors.
17. Search Console and Google Business Profile scorecards are only useful after real exports/observations are entered consistently.
18. Local pages need real product/process proof, useful internal links, current content, and honest service-area wording—not repeated location phrases.
19. Structured data must match visible page content; adding unsupported review, price, availability, or location claims is prohibited.
20. Placeholder images support layout but do not provide the trust or image-search value of approved real photography.

## Visual, mobile, and performance risks

21. Several original legacy images remain very large even though Build 190 adds optimized display variants.
22. Public real images still need consent, descriptive alt text, dimensions, compression, mobile cropping, and performance review.
23. CSS checks catch brace/overflow patterns but do not replace real screenshots on common phones/tablets/desktops.
24. Product proof modules are placeholders until approved process, scale, material, and care photos exist.
25. Low-bandwidth mode reduces decoration but still needs live-network/device testing.

## Documentation and migration risks

26. `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md` are now canonical; older historical files are archived and should not be treated as the current task list.
27. Do not rerun old additive migrations blindly on a partially upgraded D1 database; confirm ledger/table/column state first.
28. Run `database_build190_integrated_value_operations.sql` after Build 189.
29. Re-run the static preflight, JavaScript syntax checks, JSON validation, one-H1 scan, CSS balance check, and SQL smoke test before every release.
30. Update both canonical Markdown files, schema reference, release notes, sanity health check, and migration order every build.
