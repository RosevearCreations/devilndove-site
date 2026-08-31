# Devil n Dove — Project Status & Roadmap

## Current Development release

**Release 464 — Platform Integrity and Migration Authority.**

Release 463 remains the environment/cutover authority. The canonical operating model is one Cloudflare Pages project (`devilndove-site`): `dev` → Preview/Development and `main` → Production/Live, with isolated D1/R2 resources.

## Update plan

| Update | Items | Theme |
|---|---:|---|
| Update 1 | 1–7 | Platform Integrity and Migration Authority |
| Update 2 | 8–13 | Operational Acceptance and Recovery |
| Update 3 | 14–20 | Business Application Growth |

The detailed 20-item grouping is maintained in `docs/operations/RELEASE_464_THREE_UPDATE_ROADMAP.md`.

## Update 1 — items 1–7

1. **Canonical D1 migrations** — forward schema changes are immutable files under `migrations/canonical/`, applied by `scripts/d1_migrate.py`, with Cloudflare native `d1_migrations` plus SHA-256/source/recovery proof.
2. **Branch/release safety** — source/deploy controls fail closed. Native GitHub branch-protection state remains a separately observable repository setting and is never inferred from source controls.
3. **Exact Development → Production promotion** — `main` deployment requires an exact tree already reachable on `dev` with a successful canonical System Gate.
4. **Legacy cleanup** — temporary Release 464 codemod/source workflows are removed after use; historical Build/Release material remains provenance only.
5. **Documentation convergence** — `development-release.json`, AI handoff, project roadmap, sanity authority and Release 464 roadmap all identify the current operating model.
6. **Accounting statement imports** — migration-owned, read-only schema inspection, fail-closed; no request-time schema repair.
7. **Runtime D1 schema mutation blockade** — shared D1 firewall blocks schema mutation authority at request time while preserving business reads/writes; source gate requires zero raw D1 bypasses carrying DDL.

## Database authority

Release 461 is the historical verified baseline only. It is not replayed. Release 464 starts the forward canonical stream with `0001_release464_migration_authority.sql`.

Future rule:

**Dev migration + Dev proof → exact green Dev tree → Production migration + Production proof → Production code deployment.**

Production transactional/business data remains Production-owned and is never overwritten wholesale from Development.

## Release gates

A Development release is green only when the same `dev` SHA has:

- canonical System Gate PASS;
- canonical migration policy PASS;
- runtime D1 schema authority/firewall PASS;
- Development D1 migration apply/proof PASS;
- Development D1/R2 boundary verification PASS;
- exact SHA Cloudflare Preview deployment/control-plane proof PASS.

Production remains a separate deliberate promotion boundary and is not required to call a Development release green.

## External acceptance still deliberately separate

- CAIP private-media browser/range-streaming evidence;
- Stripe test transaction/webhook/reconciliation;
- PayPal sandbox transaction/webhook/reconciliation;
- live provider authorization;
- deliberate Production promotion.

Configuration or credential presence never authorizes execution.

## Forward direction

Close Update 1 on exact Development evidence, then begin **Update 2 — items 8–13**. Do not reopen Release 461 migration replay, the retired `devilndove-site-dev` authority, request-time schema DDL, or blind Development-to-Production data copying.
