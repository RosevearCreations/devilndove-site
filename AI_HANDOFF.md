# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 17 — Creator & Content Completeness** is the active Development source candidate.

Read `current-development-authority.json` first, then this file, then `docs/operations/RELEASE_467_BUILD_17_CREATOR_CONTENT_COMPLETENESS.md`, then `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`. `development-release.json` remains **INHERITED_REGRESSION_COMPATIBILITY** and the middleware Release 466 header remains **INHERITED_RUNTIME_COMPATIBILITY**.

Exact Development-green predecessor: **Release 467 Build 16 — Custom Request & Made Today Journey**:

- merged `dev`: `c05c7ff64e01672b04ec1768b696e163adeeca0f`
- tree: `1635f19b24df5c37358925948b51e5a43c20cf99`
- System Gate `33658864411` — SUCCESS
- Build 16 Proof `33658864422` — SUCCESS

Build 16 retained **Release 467 Build 15 — Storefront / SEO Parity**, whose source base was `dd92a10799f0f7656fe9508a25a983839117a1d0`; Build 15 retained **Release 467 Build 14 — Product Release Quality Command Center**. Build 14 retained **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** at `794fd5b36191fff4c9e8376197f968d9c6d6da80`, and Build 13 retained exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`.

## Build 17 scope — autonomous items 16–20

1. Creative Project → Content Studio completeness: material usage, costing, finished output, lessons learned and Content Studio handoff are projected from existing Creative Process facts.
2. CAIP story-candidate ranking: active `story_candidate=1` evidence is ranked from existing review/verification/confidence/transcript/note/link/time-range facts only. Ranking is not approval.
3. Media assignment/orphan diagnostics: unassigned public/static media and unfilled visual slots are surfaced; recommended targets are routing hints and assignment remains explicit in Media Studio.
4. Marketplace presets: existing Etsy, Facebook Marketplace and Pinterest preset rows can be explicitly edited and preflighted. Policy overrides stay locked; Canada only, review before publish and no automatic posting remain required. No provider is called.
5. No-silent-placeholder gate: critical fallback/placeholder states require explicit reason, owner and remediation. Invented marketing fallback content is forbidden.

Primary Build 17 authorities:

- `release467-build17-creator-content-completeness.json`
- `release467-build17-placeholder-registry.json`
- `scripts/release467_build17_gate.py`
- `scripts/release467_build17_placeholder_gate.py`
- `.github/workflows/release467-build17-proof.yml`
- `/admin/creator-content-completeness/`
- `/api/admin/creator-content-completeness`
- `/api/admin/marketplace-presets`

## Release 467 retained authority separation

**Release 467 Build 8 — Authority Convergence and Restart Safety** remains locked provenance with Build 7 predecessor `5eef764a67466dc2989a4681c6a7cc782b9d4df9`, System Gate `33591744817`, Build 7 Proof `33591744787`, external state `HOLD_EXTERNAL`.

**Release 467 Build 9 — Historical CI Retirement & Gate Fanout Reduction** remains retained.

**Release 467 Build 10 — I.T. Control Tower Consolidation and Self-Diagnostics** remains the technical first stop. Build 4 consolidates source-proof authorities into its same-session evidence and acceptance ledger; Build 10 preserves that ledger rather than replacing it.

Release 467 Build 11 — Admin Operations Command Center remains the daily business first stop. **Release 467 Build 12 — Finance Operations Command Center** remains read-only with exact Build 11 source base `ce42f3b2ea553b69085705f500a9e2bd2f689818`. **Release 467 Build 13 — Repository Hygiene and Historical CI Cleanup** remains retained with exact Build 12 predecessor `374983f68fb16172fb357b1755293a29e5d2953f`. **Release 467 Build 14 — Product Release Quality Command Center** remains the Product quality owner. **Release 467 Build 15 — Storefront / SEO Parity** remains the visible-fact SEO/shipping authority. Build 16 remains the customer-safe Custom Request / Made Today authority.

Build 5 — CI / Cloudflare Access readiness remains separate from Production Promotion Readiness. Masked references `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` are names only; secret values never belong in source, UI, logs or evidence.

## Environment / safety boundary

- source: `dev`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev` / `dbc1615b-dcbe-4951-973b-b47c99c73bfa`
- Product R2: `devilndove-toolshed-images-dev`
- CAIP R2: `devilndove-caip-media-dev`
- canonical migrations: exactly `0001`–`0004`
- Build 17 schema migration/request-time DDL/new broad D1/R2 authority: NONE
- explicit existing marketplace preset-row updates: authenticated/audited only
- automatic media assignment/raw R2 deletion: NONE
- provider execution/publication: NONE
- Cloudflare Access policy mutation: NONE
- `main` / Production mutation: NONE

External lanes remain **`HOLD_EXTERNAL`**: Cloudflare Access service token, Stripe Development, PayPal sandbox, Social/OAuth. CAIP private-media status uses fresh Build 7 evidence.

Canada-only fulfillment and the existing U.S. sales/shipping suspension remain intact.

## Main / Production boundary

`main` / Production remain separately verified at **Release 467 Build 15** SHA `296e53b079bba53126c80902be36a9271d82cea4`; Production Pages Deploy `33655223149` succeeded there. Builds 16–17 remain Development-only until a separate deliberate promotion.

## Canonical reading order

1. `current-development-authority.json`
2. `AI_HANDOFF.md`
3. `release467-build17-creator-content-completeness.json`
4. `docs/operations/RELEASE_467_BUILD_17_CREATOR_CONTENT_COMPLETENESS.md`
5. `release467-build17-placeholder-registry.json`
6. `docs/operations/RELEASE_467_AUTONOMOUS_20_ITEM_BACKLOG.md`
7. `PROJECT_STATUS_AND_ROADMAP.md`
8. `SANITY_HEALTH_CHECK.md`
9. `release467-build16-custom-request-made-today-journey.json`
10. `release467-build15-storefront-seo-parity.json`
11. `release467-build14-product-release-quality.json`
12. `release467-build13-repository-hygiene-cleanup.json`
13. `release467-build12-finance-operations-command-center.json`
14. `release467-build11-admin-operations-command-center.json`
15. `release467-build10-it-control-tower-consolidation.json`
16. `release467-build9-historical-ci-retirement.json`
17. `release467-build8-authority-convergence.json`
18. `release467-build7-external-commercial-acceptance.json`
19. `release467-build6-access-acceptance-harness.json`
20. `release467-build5-production-promotion-readiness.json`
21. `development-release.json` — compatibility evidence only

## Restart point

Do not redo Builds 14–16. Continue Build 17 on `release467-build17-creator-content-completeness` from exact green Build 16 base `c05c7ff64e01672b04ec1768b696e163adeeca0f`. Prove the exact Build 17 feature SHA, require the complete current/historical PR fanout green, merge only the unchanged green head, then require exact merged Build 17 proof and canonical System Gate Development deployment before calling Build 17 complete.
