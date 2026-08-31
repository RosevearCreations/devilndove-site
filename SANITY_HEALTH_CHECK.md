# Devil n Dove — Sanity / Health Check

## Current release

**Release 464 — Platform Integrity and Migration Authority.**

**Update 2 — Operational Acceptance and Recovery — is Development green.** Release 463 remains the environment authority: one Cloudflare Pages project (`devilndove-site`), `dev` → Preview/Development, `main` → Production/Live. Release 461 is historical D1 baseline provenance only.

## Hard boundaries

- [x] Development source branch is `dev`.
- [x] Development Pages target is Preview on `devilndove-site`.
- [x] Development D1 is `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.
- [x] Development Product R2 is `devilndove-toolshed-images-dev`.
- [x] Development CAIP R2 is `devilndove-caip-media-dev`.
- [x] Production source is `main` and live target is Production on the same Pages project.
- [x] Production D1/R2 remain isolated from Development.
- [x] Production transactional/business data are Production-owned.
- [x] Provider/payment execution and publication remain closed.
- [x] Raw CAIP R2 deletion remains closed.
- [x] `wrangler.toml` contains no `account_id` and remains Development-safe.
- [x] Cloudflare Access is never weakened to make a Preview smoke pass.

## Release 464 database authority

- [x] Historical Release 461 migrations are never replayed automatically.
- [x] Forward migrations live only in `migrations/canonical/`.
- [x] Cloudflare native `d1_migrations` is the applied ledger.
- [x] `app_schema_migration_proofs` records checksum/source/recovery evidence.
- [x] Development migration proof is mandatory before Production apply.
- [x] Production migration runs before code that depends on it.
- [x] Canonical migrations 0001 and 0002 are applied and verified on Development.
- [x] Final Update 2 Development verification reports exactly two native ledger rows and two proof rows.
- [x] Final Update 2 Development verification reports 580 tables and zero foreign-key violations.
- [x] Accounting statement imports contain no request-time DDL authority.
- [x] Runtime incidents contain no request-time CREATE/ALTER/INDEX repair authority.
- [x] Shared runtime D1 firewall blocks request-time schema mutation authority.
- [x] Source gate requires zero raw D1 bypasses carrying schema DDL.

## Update 2 operational sanity

- [x] Operational thresholds surface notification, upload/media, payment/provider, critical and stale-open incident attention.
- [x] “Today Needs Attention” is part of the Operations incident surface.
- [x] Retention cleanup requires a prior D1 archive review.
- [x] Archive candidate and archived-item counts must match before approval.
- [x] Explicit Admin approval is required before closed incident deletion.
- [x] Cleanup can delete only source IDs contained in the approved archive review.
- [x] Retention request, approval/rejection and cleanup actions are audited.
- [x] Orphan-storage diagnostics compare D1 metadata and R2 listings read-only.
- [x] Orphan-storage diagnostics read no R2 object bodies.
- [x] Orphan-storage diagnostics have no R2 delete/put and no D1 mutation capability.
- [x] Safe recovery is limited to allowlisted HTTPS HEAD or binding-local R2 HEAD probes.
- [x] Safe recovery records `operational_recovery_events` evidence.
- [x] Safe recovery does not execute providers and does not delete R2 objects.
- [x] Accessibility gate checks keyboard controls, visible focus, status announcements, image alt, iframe title and HTML-video caption requirements.
- [x] Exact Preview smoke uses zero authentication/service-token headers.
- [x] Current exact Preview is Cloudflare Access protected and all anonymous selected routes are consistently intercepted.
- [x] Exact Preview smoke validates matching source artifacts from the checked-out SHA.

## Promotion sanity

- [x] Main-only application patches are forbidden by release policy.
- [x] Production deployment checks that the `main` tree already exists on `dev`.
- [x] The matching Development tree must have a successful canonical System Gate.
- [x] Production canonical migrations must already be Development-proven.
- [x] Native Git-triggered Cloudflare Pages deployments remain frozen.
- [x] GitHub Actions deploys explicit exact SHAs.
- [ ] Native GitHub branch-protection/ruleset state is separately verified from repository settings; source controls never falsely claim this setting is enabled.

## Repository sanity

- [x] Canonical System Gate owns ordinary Development source/deploy acceptance.
- [x] Update 2 source authority gate is part of System Gate.
- [x] Accessibility acceptance is part of System Gate.
- [x] Access-safe non-secret Preview smoke is part of the Development deployment job.
- [x] Storefront one-H1/canonical/OpenGraph/Twitter/JSON-LD gates remain carried forward.
- [x] Private admin pages remain noindex/nofollow.
- [x] Five canonical modules remain Storefront, Creators, Socials/CAIP, Financials/Accounting and I.T.
- [x] Canonical current-authority documents identify Release 464 / environment Release 463 / Update 2 Development green.

## Exact Update 2 technical evidence

- technical green source SHA: `40fd75bc833407f96dfa249fa5935aa55ac79b16`
- System Gate: `33415361384`
- source-gate job: `99564590843` — PASS
- deploy-development job: `99564723020` — PASS
- exact Preview: `https://b10e991f.devilndove-site.pages.dev`
- D1: 580 tables / 2 canonical migration rows / 2 migration proof rows / 0 FK violations
- proof artifact ID: `9766829652`
- Preview smoke mode: `CLOUDFLARE_ACCESS_PROTECTED`
- authentication headers used: `ZERO`
- Access weakened: `NO`
- provider execution: `ZERO`
- Production mutation: `ZERO`

## Green definition

Release 464 Update 2 is Development green when one exact accepted `dev` tree has both:

1. canonical System Gate source job PASS, including Update 2 and accessibility acceptance; and
2. Development job PASS after canonical D1 migration apply/proof, exact Preview deployment/control-plane verification and Access-safe non-secret Preview smoke.

The technical Update 2 tree `40fd75bc833407f96dfa249fa5935aa55ac79b16` satisfies this definition. The documentation closure commit that contains this file must also pass the same managed Development gate before it becomes the final restart checkpoint.

Production promotion, CAIP private-media browser proof, Stripe test acceptance, PayPal sandbox acceptance and live provider authorization remain later deliberate boundaries; they are not prerequisites for Development green.

## Next bounded work

After the documentation closure SHA is green, proceed to **Release 464 Update 3 — items 14–20, Business Application Growth**. Do not reopen Update 1/2 infrastructure unless current evidence proves drift.
