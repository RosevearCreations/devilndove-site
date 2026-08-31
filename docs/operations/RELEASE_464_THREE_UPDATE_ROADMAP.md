# Release 464+ — Three-Update Roadmap

This roadmap converts the agreed 20-item improvement list into three bounded updates. Work is performed on `dev`, proven in the canonical Preview environment, and deliberately promoted to `main` only after the applicable gates pass.

## Update 1 — Platform Integrity and Migration Authority (items 1–7)

**Active release: 464.** No later schema-changing feature may bypass this update.

1. **Canonical D1 migration ledger/applicator.** `migrations/canonical/`, Cloudflare native `d1_migrations`, SHA-256 proof rows, Development-first application, Production acknowledgement, exact migration identity, recovery note and foreign-key verification.
2. **Branch protection.** Repository policy requires protected `dev`/`main`, required System Gate checks and no force-push. Because repository-administration settings are outside normal source writes, source/deployment gates also fail closed against unproven main-only trees. Native GitHub protection remains an explicit repository-setting acceptance item until the platform reports it enabled.
3. **Exact Development → main synchronization.** Production must prove its tree is identical to a commit reachable from `dev` and that exact Development commit has a successful System Gate run.
4. **Legacy cleanup.** Archive/delete obsolete Build/Release staging branches and retire legacy deployment/schema repair authorities. Preserve deliberate recovery backups and provenance.
5. **Canonical documentation convergence.** `development-release.json`, `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `SANITY_HEALTH_CHECK.md` and operations authorities must describe the same active release/environment/database policy.
6. **Accounting statement-import closure.** `_accountingStatementImports.js` is verified migration-owned/read-only/fail-closed; its Release 461 schema migration remains historical baseline provenance and is not replayed.
7. **Application-wide runtime-DDL removal.** Cloudflare Functions must contain zero request-time CREATE/ALTER/DROP/VACUUM/REINDEX SQL. Schema inspection through `PRAGMA`/`sqlite_master` is allowed; schema mutation belongs only to `migrations/canonical`.

### Update 1 exit criteria

- Canonical migration policy gate green.
- Development canonical migration apply + verification green.
- Runtime schema mutation gate reports zero offenders.
- System Gate green on exact Development SHA and Preview runtime green.
- Production workflow refuses a main-only tree and applies pending canonical Production migration before dependent code.
- Canonical documents agree.
- Obsolete source migration/repair endpoints are retired.
- Native GitHub branch protection is either verified green or explicitly reported as the sole repository-setting remainder; source/deployment controls must not pretend it is enabled when GitHub reports otherwise.

## Update 2 — Operational Acceptance and Recovery (items 8–13)

8. Make schema requirements an explicit System Gate contract.
9. Perform a Production disaster-recovery drill and preserve evidence.
10. Complete Stripe Development test payment/webhook/refund/reconciliation acceptance.
11. Complete PayPal sandbox payment/webhook/refund/reconciliation acceptance.
12. Complete CAIP private-media browser/range-streaming/source-preservation acceptance.
13. Complete controlled Social/OAuth provider connect/revoke/error acceptance; publication remains operator-controlled until separately authorized.

**Exit:** infrastructure recovery and every external-provider boundary has evidence rather than configuration-only readiness.

## Update 3 — Business Application Growth (items 14–20)

14. Deepen Storefront product-detail/customer experience.
15. Complete public SEO depth, structured data, canonical/internal-link and one-H1 enforcement.
16. Build reusable Storefront merchandising/collection/scheduling rules.
17. Complete Inventory material genealogy from purchase/lot through finished product and sale.
18. Advance Financials into a coherent month-end/accountant cockpit.
19. Join Creators + CAIP + Storefront into one project-to-product-to-content pipeline.
20. Build the I.T. Operations Dashboard as the single release/infrastructure/provider/error control centre.

**Exit:** one creative project can carry materials, cost, evidence, finished inventory, storefront listing, accounting and reviewed content/social handoff without duplicate re-entry.

## Permanent safety rules

- Production transactional/business data is Production-owned and is never refreshed wholesale from Development.
- Historical migration replay is forbidden.
- Request-time schema mutation is forbidden.
- Development migration/proof comes before Production migration/proof.
- Production migration/proof comes before dependent Production code.
- Provider credentials never imply transaction/publication authorization.
- Public pages retain SEO gates, including one exposed H1 per page.
