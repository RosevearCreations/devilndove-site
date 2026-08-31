# Devil n Dove — Sanity / Health Check

## Current release

**Release 464 — Platform Integrity and Migration Authority — Updates 1–3 are Development green.** Release 463 remains the environment authority; Release 461 is historical D1 baseline provenance only.

## Hard boundaries

- [x] `dev` → Preview/Development on `devilndove-site`.
- [x] Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2: `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2: `devilndove-caip-media-dev`.
- [x] `main` → Production/Live on the same Pages project with isolated Production D1/R2.
- [x] Production business/transactional data are Production-owned.
- [x] Provider execution/publication remain closed.
- [x] Raw CAIP R2 deletion remains closed.
- [x] Request-time schema mutation remains blocked.
- [x] `wrangler.toml` is Development-safe and contains no `account_id` or Production D1 id.
- [x] Cloudflare Access is never weakened for Preview smoke.

## Canonical database authority

- [x] Historical Release 461 migrations are never replayed automatically.
- [x] Forward migrations live only in `migrations/canonical/`.
- [x] `d1_migrations` is the native applied ledger.
- [x] `app_schema_migration_proofs` records checksum/source/environment/recovery evidence.
- [x] Applied canonical migration identities are immutable.
- [x] Development-first migration proof is mandatory.
- [x] Canonical 0001, 0002 and 0003 are applied and verified on Development.
- [x] Development D1 reports `583` tables, `3` native canonical rows, `3` proof rows and `0` FK violations.

## Update 1 sanity

- [x] Exact green Development-tree promotion rule remains enforced.
- [x] Accounting statement imports are migration-owned/read-only/fail-closed.
- [x] Shared D1 firewall and source gate block request-time schema DDL.
- [x] Native Git-triggered Pages deployments remain frozen.
- [ ] Native GitHub branch-protection/ruleset state remains a separate repository-admin setting; source controls never falsely claim it is enabled.

## Update 2 sanity

- [x] Today Needs Attention operational thresholds remain active.
- [x] Retention deletion requires archive + count match + explicit approval.
- [x] Orphan-storage diagnostics are read-only and read no object bodies.
- [x] Safe recovery is allowlisted HEAD-only and audited.
- [x] Accessibility acceptance remains in System Gate.
- [x] Exact Preview smoke uses zero auth/service-token headers and preserves Cloudflare Access.

## Update 3 sanity

- [x] Product links use `/shop/product/?slug=<slug>`; public Product page retains one source H1.
- [x] Product/Offer/Breadcrumb structured data and canonical/social metadata are source-gated.
- [x] Scheduled merchandising rules are read-time rules and do not rewrite Product rows on activation.
- [x] Material genealogy is GET-only and reads existing Build 440 purchase/production/finished-lot/order authorities.
- [x] No second Inventory genealogy ledger or fabricated historical reconstruction was added.
- [x] Month-End Cockpit is read-only over the existing Accounting close workflow.
- [x] Cross-module business pipeline writes only its own references/status/events.
- [x] Update 3 pipeline cannot decrement Inventory, post Accounting, publish content, execute providers or delete R2.
- [x] I.T. Operations Dashboard reports current release/environment/migration/provider state without secrets/provider calls.
- [x] Update 3 source gate is part of canonical System Gate.

## Exact first Update 3 green evidence

- source SHA: `0edab02e5506dc74a37ad7e2ef03fbeb52b02398`
- System Gate: `33422881509`
- source job: `99589311686` — PASS
- deploy job: `99589416714` — PASS
- exact Preview: `https://b6ac8e5a.devilndove-site.pages.dev`
- D1: `583` tables / `3` canonical migrations / `3` proof rows / `0` FK violations
- manifest SHA-256: `9a230eda68494c197e41b2f268c4539638921e4bbaf77004c81ab972eb2a8f76`
- artifact ID: `9769640976`
- Preview mode: `CLOUDFLARE_ACCESS_PROTECTED`
- authentication headers used: `ZERO`
- Access weakened: `NO`
- provider execution: `ZERO`
- Production mutation: `ZERO`

## Green definition

The documentation closure SHA must pass the same canonical System Gate idempotently. Its migration step must report no pending migration while preserving 3 native rows / 3 proof rows / 0 FK violations, then deploy that exact SHA with Development bindings and pass Access-safe smoke. That closure SHA becomes the final Release 464 restart checkpoint.

Production promotion and external Stripe/PayPal/CAIP/Social provider acceptance remain separate deliberate boundaries.
