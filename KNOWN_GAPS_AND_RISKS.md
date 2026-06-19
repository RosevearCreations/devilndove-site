# Known Gaps and Risks — Current Build 191

> Canonical direction: read `PROJECT_STATUS_AND_ROADMAP.md` first. Historical gap logs remain under `docs/archive/`.

## Live environment

1. D1/R2/payment/email/provider behaviour requires deployed verification.
2. Build 191 environment checks report configuration presence, not successful transactions.
3. Stripe webhook signatures, email delivery, R2 permissions, and Cloudflare API permissions need live tests.

## Costs and marketplace

4. Fee settings are intentionally unconfigured until actual account-specific values are entered.
5. Product-family defaults cannot replace product-specific costs for unusual/custom work.
6. Margin overrides must remain temporary, reasoned, and audited.
7. Pinterest/manual channel fee mapping may need explicit business rules before margin automation.

## Customers and communication

8. Review eligibility is not consent or permission to send.
9. Customer timeline notes are private admin records and need careful factual wording.
10. Customer-story drafts remain private until consent, accuracy, and placement review.
11. Duplicate customer emails/shared households still need merge suggestions.

## Media and mobile

12. Mobile D1 recovery excludes image file bytes; users must reselect files.
13. Responsive image jobs are queue records until an R2 worker is deployed.
14. Public gallery items must have approved consent/public-use status.
15. Real photographs remain the largest trust/visual-search gap.
16. Real-device screenshots are still required despite CSS/static checks.

## SEO and local search

17. Search Console CSV shapes can vary; always inspect the mapping preview.
18. Local first-page rankings cannot be guaranteed.
19. GBP observations/tasks are manual and must use accurate current facts.
20. Structured data must match visible content and real inventory/price/review facts.

## Deployment

21. Apply `database_build191_value_operations_followthrough.sql` after Build 190.
22. Re-run JS, JSON, one-H1, CSS, SQL, preflight, and ZIP integrity checks before release.
23. Keep `_routes.json` at the deployed root so `/api/*` reaches Pages Functions.


## Build 192 — Operational data connection and live proof follow-through

Build 192 keeps the project moving toward real business usefulness instead of adding another disconnected admin page. The new work is integrated into `/admin/command-center/` through `/api/admin/value-ops-next` and `public/js/admin-value-ops-next.js`.

Completed in this pass:

1. Added fee/cost change-audit rows so actual Stripe/Etsy/PayPal/local fee changes can be recorded with a reason and effective date.
2. Added R2 derivative worker readiness checks for bindings, WebP, AVIF, srcset writeback, and cleanup.
3. Added resumable mobile upload session rows and draft-conflict review rows beyond browser-only autosave.
4. Added approved real-media replacement plan rows for key public placeholders.
5. Added scheduled Search Console import rows for monthly pages/queries, weekly top pages, and quarterly image-search review.
6. Added Google Business Profile evidence records for monthly observations, photos, reviews, posts, and local-page proof.
7. Added customer duplicate/merge candidate rows and a Command Center action to refresh duplicate email candidates.
8. Added live provider test records for Stripe, email, R2, and Cloudflare checks without exposing secret values.
9. Added Lighthouse/PageSpeed import schedules for mobile and desktop routes.
10. Added legacy admin usage and consolidation recommendation rows so older admin pages are not retired until real usage data supports it.
11. Added extra visual placeholders to business-relevant public pages that still lacked visual enrichment.
12. Updated schema, release, roadmap, handoff, SEO, image, sanity, and deployment documentation.

Current opinion: the app is now past the “add structure” stage. The next business value comes from entering real costs/fees, uploading approved photographs, importing live evidence, and using the Command Center daily.

### Build 192 D1 migration

Run after Build 191:

```text
database_build192_operational_data_connection.sql
```
