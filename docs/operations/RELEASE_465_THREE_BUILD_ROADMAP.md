# Release 465 — Three-Build Roadmap

Release 465 follows the green Release 464 Development checkpoint and is intentionally divided into three bounded builds. Each build uses the same closure discipline: isolated feature branch, source/regression gate, managed Development migration when required, exact Development Preview deployment, D1/R2 binding proof, Access-safe smoke, canonical documentation convergence, then a final idempotent System Gate on the documented closure SHA.

## Build 1 — Storefront & SEO Quality (items 1–7)

1. Storefront merchandising simulator for date/time preview without rewriting Product rows.
2. Product readiness/completeness visibility using the existing Product, SEO and media authorities.
3. Fail-closed Product publication rules: hard commerce/SEO readiness cannot be bypassed; any permitted soft quality override remains explicit, step-up protected and audited.
4. SEO quality cockpit combining structured-data, Product SEO and public-page diagnostics.
5. Explainable internal-link intelligence between Products, Collections and related Storefront content; suggestions do not rewrite content automatically.
6. Product image-quality visibility using existing image annotations, merchandising scores, alt coverage and contextual-shot evidence.
7. Storefront search-quality recovery that suggests likely Products after a zero-result/typo search without changing Product data.

**Exit:** one Storefront quality control centre can explain what is ready, blocked, weak or discoverable; publication hard requirements fail closed; simulation/search suggestions remain non-mutating.

## Build 2 — Inventory & Creator Intelligence (items 8–13)

8. Related-product intelligence with explainable relationship reasons.
9. Inventory availability intelligence: can-make / limited / unavailable reasoning without consuming stock.
10. Material shortage forecasting from recipes, lots, on-hand quantities and planned work.
11. Genealogy exception cockpit over the existing purchase-lot → production → finished-lot → sale authority.
12. Creative project readiness score across materials, cost, evidence, Product linkage and content readiness.
13. Pipeline Next Action engine that explains the next safe step and blockers without executing providers, inventory mutations or accounting posting.

**Exit:** Product and Creative workflows can explain readiness, material risk, genealogy gaps and next actions without introducing a second Inventory or CAIP authority.

## Build 3 — Financial, I.T. & Release Hardening (items 14–20)

14. Cost/profitability intelligence using existing material cost, packaging/labour assumptions and fee models.
15. Read-only Financial anomaly detection for duplicate/unmatched/unusual accounting evidence.
16. Month-end readiness score over the existing close/HST/evidence authority.
17. I.T. health score spanning D1, R2, migrations, deployments, API incidents, SEO and provider configuration boundaries.
18. Regression-evidence archive for compact machine-readable release-to-release comparison.
19. Performance-budget gate for excessive asset/page/runtime growth.
20. Release 465 autonomous acceptance framework and final canonical convergence.

**Exit:** the business and platform expose explainable readiness/risk signals and every Release 465 build is independently Development-proven before any deliberate Production promotion.

## Permanent boundaries

- Production transactional/business data remains Production-owned and is never refreshed wholesale from Development.
- Canonical migrations are forward-only, immutable after Development application, and live only in `migrations/canonical/`.
- Request-time schema mutation remains forbidden.
- Production receives the exact same canonical migrations before dependent code and only during deliberate promotion.
- Provider credentials never imply payment or publication authorization.
- Stripe/PayPal/Social/OAuth execution remains outside autonomous Release 465 work unless explicitly authorized.
- Raw CAIP R2 deletion remains closed.
- Cloudflare Access is never weakened to make Preview smoke pass.
- Public SEO keeps one-H1, canonical, metadata and structured-data gates.
