# Devil n Dove — Project Status & Roadmap

## Current Development release

**Release 464 — Platform Integrity and Migration Authority.**

**Update 2 — Operational Acceptance and Recovery — is Development green.** Release 463 remains the environment/cutover authority. The canonical operating model is one Cloudflare Pages project (`devilndove-site`): `dev` → Preview/Development and `main` → Production/Live, with isolated D1/R2 resources.

## Update plan

| Update | Items | Theme | State |
|---|---:|---|---|
| Update 1 | 1–7 | Platform Integrity and Migration Authority | Complete / Development green |
| Update 2 | 8–13 | Operational Acceptance and Recovery | Complete / Development green |
| Update 3 | 14–20 | Business Application Growth | Next |

The detailed 20-item grouping is maintained in `docs/operations/RELEASE_464_THREE_UPDATE_ROADMAP.md`.

## Update 1 — items 1–7 complete

1. **Canonical D1 migrations** — forward schema changes are immutable files under `migrations/canonical/`, applied by `scripts/d1_migrate.py`, with Cloudflare native `d1_migrations` plus SHA-256/source/recovery proof.
2. **Branch/release safety** — source/deploy controls fail closed. Native GitHub branch-protection state remains a separately observable repository setting and is never inferred from source controls.
3. **Exact Development → Production promotion** — `main` deployment requires an exact tree already reachable on `dev` with a successful canonical System Gate.
4. **Legacy cleanup** — temporary Release 464 codemod/source workflows are removed after use; historical Build/Release material remains provenance only.
5. **Documentation convergence** — canonical authority files identify the current operating model.
6. **Accounting statement imports** — migration-owned, read-only schema inspection, fail-closed; no request-time schema repair.
7. **Runtime D1 schema mutation blockade** — shared D1 firewall blocks schema mutation authority at request time while preserving business reads/writes; source gate requires zero raw D1 bypasses carrying DDL.

## Update 2 — items 8–13 complete

8. **Operational thresholds / Today Needs Attention** — failed notifications, failed upload/media operations, payment/provider failures, critical incidents and stale-open incidents are surfaced as actionable operational attention.
9. **Retention review before deletion** — closed incident rows are archived first, archive counts must match, explicit Admin approval is required, and cleanup deletes only approved archived source IDs. All stages are audited.
10. **Orphaned-storage diagnostics** — a bounded read-only D1/R2 metadata scan identifies orphan candidates without object-body reads, D1 mutation, R2 mutation or R2 deletion.
11. **Audited safe recovery** — allowlisted HTTPS HEAD and binding-local R2 HEAD probes can verify recovery. Results are recorded and an incident resolves only after healthy verification. Provider execution remains closed.
12. **Non-secret exact Preview smoke** — the gate uses no authentication/service-token headers and never weakens Cloudflare Access. On the current Access-protected Preview, anonymous home/manifest/service-worker/public-API requests must all be intercepted consistently; exact source artifacts are also checked.
13. **Accessibility acceptance** — keyboard-native controls, visible focus, status announcements, alt text, iframe titles, HTML-video captions and Update 2 Operations controls are source-gated.

## Database authority

Release 461 is the historical verified baseline only. It is not replayed. Release 464's forward canonical stream now contains:

1. `0001_release464_migration_authority.sql`
2. `0002_release464_operational_acceptance.sql`

Update 2 Development proof is exact: 580 tables, two native migration ledger rows, two migration proof rows and zero foreign-key violations. The final technical run reported no pending migrations, proving canonical migration 0002 was not replayed.

Future rule:

**Dev migration + Dev proof → exact green Dev tree → Production migration + Production proof → Production code deployment.**

Production transactional/business data remains Production-owned and is never overwritten wholesale from Development.

## Exact Update 2 Development evidence

- technical source SHA: `40fd75bc833407f96dfa249fa5935aa55ac79b16`
- System Gate: `33415361384`
- source-gate job: `99564590843` — PASS
- deploy-development job: `99564723020` — PASS
- exact Preview: `https://b10e991f.devilndove-site.pages.dev`
- Development D1: `580` tables / `2` native migration rows / `2` proof rows / `0` FK violations
- proof artifact: `9766829652`
- Preview smoke: `CLOUDFLARE_ACCESS_PROTECTED` — PASS
- authentication headers used by smoke: `ZERO`
- Cloudflare Access weakened: `NO`
- provider execution invoked: `ZERO`
- Production mutation: `ZERO`

## Release gates

A Development release is green only when the same `dev` tree has:

- canonical System Gate PASS;
- canonical migration policy PASS;
- runtime D1 schema authority/firewall PASS;
- Development D1 migration apply/proof PASS;
- Development D1/R2 boundary verification PASS;
- exact SHA Cloudflare Preview deployment/control-plane proof PASS;
- Update-specific source acceptance PASS;
- accessibility acceptance PASS where relevant;
- non-secret exact Preview smoke PASS without weakening Access.

Production remains a separate deliberate promotion boundary and is not required to call a Development update green.

## External acceptance still deliberately separate

- CAIP private-media browser/range-streaming evidence;
- Stripe test transaction/webhook/reconciliation;
- PayPal sandbox transaction/webhook/reconciliation;
- live provider authorization;
- deliberate Production promotion.

Configuration or credential presence never authorizes execution.

## Forward direction — Update 3

Proceed with **Update 3 — items 14–20, Business Application Growth**. The intended growth layer is Storefront/product depth, public SEO/content depth, merchandising, inventory/material genealogy, Financials/month-end operations, Creator→CAIP→Storefront production flow, and the I.T. operational control centre.

Do not reopen Release 461 migration replay, the retired `devilndove-site-dev` authority, request-time schema DDL, blind Development-to-Production data copying, raw R2 deletion, or provider execution as part of ordinary Update 3 work.
