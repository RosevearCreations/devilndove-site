# Release 464 — Three-Update Roadmap

Release 464 converted the agreed 20-item improvement list into three bounded Development updates. **All three updates are now Development green.** Work remains on `dev`; Production promotion to `main` is a separate deliberate action.

## Update 1 — Platform Integrity and Migration Authority (items 1–7) — COMPLETE

1. Canonical D1 migration ledger/applicator under `migrations/canonical/`.
2. Fail-closed `dev`/`main` source/deploy controls; native GitHub protection remains separately observable.
3. Exact green Development-tree promotion proof for `main`.
4. Legacy Build/Release authority cleanup and provenance isolation.
5. Canonical documentation convergence.
6. Accounting statement-import migration ownership/fail-closed closure.
7. Application-wide request-time D1 schema mutation blockade.

**Exit met:** canonical migration policy, runtime schema mutation gate, Development migration/proof, exact Preview deployment and source/system acceptance are green.

## Update 2 — Operational Acceptance and Recovery (items 8–13) — COMPLETE

8. Operational thresholds and **Today Needs Attention** for notification/upload/payment-provider/critical/stale incidents.
9. Retention review with D1 archive, count parity and explicit Admin approval before deletion.
10. Read-only orphaned-storage diagnostics with no object-body reads or R2 delete capability.
11. One-click audited safe recovery limited to allowlisted HTTPS/R2 HEAD probes.
12. Non-secret exact Preview smoke that sends zero auth/service-token headers and never weakens Cloudflare Access.
13. Keyboard, visible-focus, live-status, image-alt, iframe-title, caption and screen-reader acceptance.

**Exit met:** operational safety/recovery controls are source-gated and Development-proven. External provider transaction/browser acceptance remains deliberately separate rather than being misrepresented as Update 2 completion.

## Update 3 — Business Application Growth (items 14–20) — COMPLETE

14. Deepened Storefront product-detail/customer experience and corrected canonical customer Product path.
15. Public SEO depth with Product/Offer/Breadcrumb structured data, canonical/social metadata, internal Collection links and one-H1 enforcement.
16. Reusable Storefront merchandising/Collection scheduling rules with include/exclude effects, priority and active windows.
17. Inventory material genealogy exposed from the existing Build 440 purchase-lot → production → finished-lot → order/sale authority, read-only.
18. Financials Month-End Cockpit over the existing Accounting close/HST/evidence/export authority, read-only.
19. Creators + CAIP + Storefront cross-module project/product/content/accounting-reference pipeline without duplicate domain ledgers.
20. I.T. Operations Dashboard as current release/environment/migration/provider/error/business-growth control centre.

**Exit met:** the business-growth layer can connect existing Product, Inventory, Creator/CAIP, Storefront and Financials authorities without duplicate re-entry or granting Update 3 cross-domain mutation powers.

### First Update 3 technical green

- source SHA: `0edab02e5506dc74a37ad7e2ef03fbeb52b02398`
- System Gate: `33422881509`
- exact Preview: `https://b6ac8e5a.devilndove-site.pages.dev`
- Development D1: `583` tables / `3` native canonical migrations / `3` proof rows / `0` FK violations
- proof artifact: `9769640976`
- Access-safe smoke: PASS, zero auth headers, Access not weakened
- Production/provider/raw-R2 mutation: ZERO

## Permanent safety rules

- Production transactional/business data is Production-owned and is never refreshed wholesale from Development.
- Historical migration replay is forbidden.
- Applied canonical migration identity/recovery guidance is immutable; corrections use a new numbered migration.
- Request-time schema mutation is forbidden.
- Development migration/proof comes before Production migration/proof.
- Production migration/proof comes before dependent Production code.
- Provider credentials never imply transaction/publication authorization.
- Preview smoke never weakens Cloudflare Access.
- Public pages retain SEO gates including one exposed H1 per page.

## Deliberately separate next boundaries

Release 464 completion does not silently authorize external providers or Production. Future bounded work may include Stripe Development acceptance, PayPal sandbox acceptance, CAIP private-media browser/range-streaming evidence, Social/OAuth controlled acceptance, or deliberate exact-tree Production promotion.
