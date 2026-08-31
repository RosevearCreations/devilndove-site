# Devil n Dove — AI Handoff

## Current authority

**Release 464 — Platform Integrity and Migration Authority — is the current application release.**

**Update 2 — Operational Acceptance and Recovery — is Development green.** Release 463 remains the current environment authority: one Cloudflare Pages project, `devilndove-site`, with `dev` deploying to Preview/Development and `main` deploying to Production/Live. Release 461 remains historical D1 baseline provenance only and is never replayed because a chat, workstation, branch or deployment changes.

## Environment boundary

### Development

- source branch: `dev`
- Pages project/environment: `devilndove-site` / Preview
- D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`

### Production

- source branch: `main`
- Pages project/environment: `devilndove-site` / Production
- live domain: `https://devilndove.com`
- D1: `devilndove-prod-r462` (`f34a741b-0000-45b0-9a96-6be08754d563`)
- Product R2: `devilndove-toolshed-images`
- CAIP R2: `devilndove-caip-media`

Production business/transactional data is Production-owned. Never refresh or overwrite it wholesale from Development.

## Release 464 Update 1 authority

Update 1 closed roadmap items 1–7:

1. canonical forward D1 migration ledger/applicator;
2. fail-closed `dev`/`main` release controls, with native GitHub protection separately observable;
3. exact green Development-tree promotion to `main`;
4. legacy temporary workflow/tool cleanup;
5. canonical documentation convergence;
6. Accounting statement-import migration ownership/fail-closed closure;
7. application-wide request-time schema mutation blockade.

Forward migrations live only in `migrations/canonical/`. `scripts/d1_migrate.py` owns apply/proof behavior. Cloudflare's native `d1_migrations` ledger is paired with `app_schema_migration_proofs` for SHA-256/source/recovery evidence. Every future schema change is Development-first, then the exact same migration is applied/proven on Production before code requiring it is deployed.

Request-time schema repair is not an authority. The shared D1 firewall makes legacy ensure-style CREATE/ALTER operations non-mutating and rejects destructive schema DDL. Missing schema must fail at the real business query and be repaired by a repository migration, not by a request.

The Accounting statement-import helper is migration-owned/read-only/fail-closed and is not an outstanding runtime-schema offender.

## Release 464 Update 2 authority — Development green

Update 2 closed roadmap items 8–13:

8. **Operational thresholds / Today Needs Attention** — runtime incidents now surface failed notification, upload/media, payment/provider, critical and stale-open thresholds.
9. **Retention safety** — resolved/ignored incident rows must be copied into an immutable D1 archive review, counts must match, an Admin must explicitly approve, and cleanup can delete only source IDs present in that approved archive. Every stage is audited.
10. **Orphaned-storage diagnostics** — bounded D1-reference versus R2-list comparison is read-only. It reads no R2 object bodies and has no R2 delete or D1 mutation capability.
11. **Audited safe recovery** — one-click recovery is limited to allowlisted HTTPS HEAD or binding-local R2 HEAD probes. Healthy verification may resolve the incident; results are stored in `operational_recovery_events`. Provider execution and R2 deletion remain closed.
12. **Non-secret exact Preview smoke** — the smoke never sends authentication/service-token headers and never weakens Cloudflare Access. The canonical Preview is Access-protected, so anonymous home, manifest, service-worker and public-API probes must all be intercepted consistently; matching source artifacts are verified from the exact checked-out SHA.
13. **Accessibility acceptance** — source gate checks keyboard-native controls, visible focus, live status announcements, image alt text, iframe titles, captions for HTML video and the Update 2 Operations controls.

Canonical migration `0002_release464_operational_acceptance.sql` owns the new operational retention/recovery tables. The old `runtime-incidents` request-time CREATE/ALTER/INDEX repair path has been removed.

### Exact Update 2 Development evidence

- technical green source SHA: `40fd75bc833407f96dfa249fa5935aa55ac79b16`
- System Gate: `33415361384`
- source-gate job: `99564590843` — PASS
- deploy-development job: `99564723020` — PASS
- exact Preview: `https://b10e991f.devilndove-site.pages.dev`
- Development D1 tables: `580`
- canonical native migration rows: `2`
- migration proof rows: `2`
- foreign-key violations: `0`
- migration manifest SHA-256: `f5e559a44dd098182bc2cd5f182422a15e49b9166089c2fda812901350f5f667`
- Update 2 proof artifact ID: `9766829652`
- Preview mode: Cloudflare Access protected
- smoke authentication headers: `0`
- Cloudflare Access weakened: **NO**
- provider execution invoked: **ZERO**
- Production mutation for Update 2: **ZERO**

The final run also proved migration idempotence: Wrangler reported **No migrations to apply**, `newly_applied` was empty, and both canonical ledger/proof counts stayed at exactly two.

## Promotion rule

Production promotion is exact green Development tree only:

1. work lands on `dev`;
2. canonical System Gate passes;
3. canonical migrations apply/prove on Development D1;
4. that exact `dev` SHA/tree deploys to Preview with Development bindings;
5. `main` must contain an exact tree already reachable on `dev` with a successful System Gate;
6. Production applies/proves the same canonical migrations before dependent code;
7. exact `main` SHA deploys with Production bindings and control-plane proof.

Main-only application patches are forbidden. Native Git-triggered Pages deployments remain frozen; GitHub Actions owns explicit deployment.

**Production has not been promoted for Update 2.** Canonical migrations `0001` and `0002` remain Development-proven and are applied to Production only during a deliberate future promotion, immediately before dependent Production code.

## Canonical modules

- Storefront
- Creators
- Socials / CAIP
- Financials / Accounting
- I.T.

Public pages continue to require SEO guardrails including one exposed H1, canonical metadata and structured-data checks.

## Provider boundary

Stripe/PayPal/provider execution and publication remain closed unless a later deliberate test/live authorization explicitly opens them. Configuration presence alone never authorizes transactions.

## Next work after Update 2

Proceed to **Release 464 Update 3 — items 14–20, Business Application Growth**. Do not reopen Update 1/2 infrastructure unless a current gate proves drift.

Update 3 is the business-growth layer: Storefront/product depth, SEO/content depth, merchandising, inventory/material genealogy, Financials/month-end cockpit, Creator→CAIP→Storefront production flow, and the I.T. operational control centre according to the Release 464 roadmap.

## Canonical reading order

1. `development-release.json`
2. `AI_HANDOFF.md`
3. `PROJECT_STATUS_AND_ROADMAP.md`
4. `SANITY_HEALTH_CHECK.md`
5. `docs/operations/RELEASE_464_THREE_UPDATE_ROADMAP.md`
6. `docs/operations/DEVELOPMENT_CLOUDFLARE_CONNECTION_AUTHORITY.md`
7. `release463-environment.json`

Older Build/Release material is provenance only and must not override these current authorities.
