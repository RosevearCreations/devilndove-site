# Devil n Dove — Project Status & Roadmap

## Current Development release

**Release 464 — Platform Integrity and Migration Authority — is complete through Update 3 in Development.** Release 463 remains the environment/cutover authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development and `main` → Production/Live, with isolated D1/R2 resources.

## Three-update plan

| Update | Items | Theme | State |
|---|---:|---|---|
| Update 1 | 1–7 | Platform Integrity and Migration Authority | Complete / Development green |
| Update 2 | 8–13 | Operational Acceptance and Recovery | Complete / Development green |
| Update 3 | 14–20 | Business Application Growth | Complete / Development green |

## Update 1 — items 1–7

Canonical forward D1 migration authority, fail-closed source/deploy controls, exact Development-tree Production promotion, legacy-authority cleanup, documentation convergence, Accounting statement-import fail-closed ownership, and zero request-time schema mutation capability are established and carried forward.

## Update 2 — items 8–13

Operational thresholds/Today Needs Attention, archive-and-approve retention deletion, read-only orphan-storage diagnostics, allowlisted audited HEAD recovery, Access-safe Preview smoke, and accessibility acceptance are complete. Provider execution, raw R2 deletion and Access weakening remain closed.

## Update 3 — items 14–20

14. **Storefront product experience:** correct `/shop/product/?slug=` customer path and richer Product context.
15. **Public SEO depth:** Product/Offer/Breadcrumb structured data, canonical/social metadata, Collection internal links, one-H1 enforcement.
16. **Storefront merchandising:** reusable scheduled rules, include/exclude effects, priority, start/end windows and explicit Product overrides.
17. **Inventory genealogy:** read-only existing Build 440 purchase-lot → production-run → finished-lot → order/sale trace; no duplicate stock ledger.
18. **Financials:** read-only Month-End Cockpit over existing close, HST/GST, evidence and accountant-export authority.
19. **Creators + CAIP + Storefront:** cross-module business pipeline stores references/status/events only; Inventory mutation, accounting posting, publication and provider execution are not granted.
20. **I.T. Operations Dashboard:** current release/environment/migration/provider/business-growth control centre without secrets/provider calls.

## Database authority

Release 461 is the historical verified baseline only and is not replayed. Release 464's canonical forward stream is:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`
3. `0003_release464_business_growth.sql`

Update 3 Development proof: **583 tables, 3 native migration ledger rows, 3 migration proof rows, 0 foreign-key violations.** Migration 0003 was the only newly applied file in the first Update 3 green run.

Permanent order: **Dev migration + Dev proof → exact green Dev tree → Production migration + Production proof → dependent Production code.** Production business/transactional data remains Production-owned and is never overwritten wholesale from Development.

## Exact first Update 3 Development-green evidence

- source SHA: `0edab02e5506dc74a37ad7e2ef03fbeb52b02398`
- System Gate: `33422881509`
- source-gate job: `99589311686` — PASS
- deploy-development job: `99589416714` — PASS
- exact Preview: `https://b6ac8e5a.devilndove-site.pages.dev`
- D1: `583` tables / `3` native migration rows / `3` proof rows / `0` FK violations
- migration manifest SHA-256: `9a230eda68494c197e41b2f268c4539638921e4bbaf77004c81ab972eb2a8f76`
- proof artifact: `9769640976`
- Preview smoke: `CLOUDFLARE_ACCESS_PROTECTED` — PASS
- authentication headers used by smoke: `ZERO`
- Cloudflare Access weakened: `NO`
- provider execution invoked: `ZERO`
- Production mutation: `ZERO`

## Release gates

Development is green only when the same `dev` tree has canonical source gates, migration policy/firewall, update-specific gates, SEO/accessibility where applicable, Development D1 apply/proof, exact Preview deployment/control-plane binding proof and Access-safe non-secret smoke all passing.

Production is a separate deliberate promotion boundary and is not required to call a Development update green.

## Deliberately separate future acceptance

These were not silently folded into Update 3 and still require deliberate provider/browser/operator acceptance when chosen:

- Stripe Development test payment/webhook/refund/reconciliation;
- PayPal sandbox payment/webhook/refund/reconciliation;
- CAIP private-media browser/range-streaming/source-preservation evidence;
- Social/OAuth connect/revoke/error acceptance;
- live provider authorization;
- deliberate Production promotion.

Configuration or credential presence never authorizes execution.

## Forward direction

Release 464 Updates 1–3 are complete in Development. Do not reopen them without current evidence of drift. The next bounded roadmap can now focus on external acceptance, deliberate Production promotion, or the next business-growth release rather than redoing Release 464 infrastructure.
