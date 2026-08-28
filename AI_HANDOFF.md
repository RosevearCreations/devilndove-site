# AI Handoff — Release 448 Platform Expansion

Updated: 2026-08-28

Read this first, then `PROJECT_STATUS_AND_ROADMAP.md`. These are the two mutable current-state Markdown authorities. `development-release.json` is the machine-readable release authority. Git history is the historical archive.

## Current release

- Development release: **Release 448 — Platform Expansion**
- Release track: **one current release**; historical Build numbers are provenance only
- Source branch: `dev`
- Development Pages project: `devilndove-site-dev`
- Development D1: `devilndove-dev` (`dbc1615b-dcbe-4951-973b-b47c99c73bfa`)
- Development R2: `devilndove-toolshed-images-dev` and `devilndove-caip-media-dev`
- Canonical modules: **Storefront, Creators, Socials, Financials, I.T.**
- Canonical clients: **Web, Phone, Desktop**
- Phone/Desktop mode today: shared responsive/installable PWA application with service worker, offline fallback and explicit opt-in notifications
- Client notifications: **new application releases + newly published items**
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

Always resolve the exact current `dev` SHA from GitHub rather than copying an old checkpoint SHA into a new handoff.

## Release 447 closure

Release 447 — Platform Convergence is **COMPLETE**.

Its source/D1/platform/client convergence and exact Development deployment were completed. The following work was deliberately moved forward into the I.T. test environment and **does not gate Release 448 or later feature work**:

- authenticated Development runtime evidence;
- Stripe test checkout/webhook/reconciliation/replay;
- PayPal sandbox approval/capture/webhook/reconciliation/replay;
- CAIP private-media delivery/range/timecode/derived-artifact evidence.

These are deferred, not assumed accepted. Keep them visible until real evidence exists, but never revive them as an old-release gate.

## Forward-development rule for external keys/providers

Until dedicated I.T. work resumes, implement normal Development features as though required provider/key **references** are populated or use safe mock/provider abstractions. Do not block application work because real external credentials have not yet been entered.

Never invent a successful provider transaction or claim a real credential was tested. The distinction is:

- feature development: proceed;
- provider integration metadata/config references: proceed;
- real credential/provider acceptance: deferred to I.T.;
- Production credential use/promotion: closed unless explicitly authorized.

## Canonical platform direction

The application has a minimum of five top-level modules:

1. **Storefront** — public commerce presentation, Shop, Collections, Collages, Carousels, product discovery and customer-facing purchase surfaces.
2. **Creators** — creative projects, production evidence, packaging/formula/content preparation and creator workflow.
3. **Socials** — publication/campaign/channel workflow and CAIP-facing social distribution behavior.
4. **Financials** — accounting, payments, refunds/disputes, reconciliation, profitability, tax/fees, journals/export/close.
5. **I.T.** — bindings, API/provider configuration references, external-platform test environment, release diagnostics, access/security/infrastructure recovery.

One or more future top-level modules may be added when ownership boundaries justify them. Do not invent extra modules merely to split a page; Shop/Collections/Collages/Carousels remain Storefront capabilities unless a stronger domain boundary emerges.

## Web / Phone / Desktop

Web, Phone and Desktop are active first-class clients of the same application authority.

Current client behavior includes:

- responsive layouts;
- installable PWA mode on supported phone/desktop browsers;
- service worker and offline fallback;
- API/admin cache bypass;
- explicit notification opt-in;
- new-release alerts;
- new-item alerts;
- launch/resume checking rather than idle timer polling.

Do not let future feature work become Web-only. Every new major surface should be evaluated on Web, Phone and Desktop.

## Development D1 / R2 baseline

The Release 447 convergence baseline is **APPLIED AND VERIFIED** in Development:

- five canonical module rows;
- zero legacy module rows;
- 10 canonical role rows;
- one explicit I.T. manager;
- Storefront Home-carousel tables;
- clean foreign keys.

Permanent startup rule: **read-only D1/R2 verification first**. Do not rerun `database_platform_convergence.sql` merely because a new chat or release starts.

Release 448 **may add protected Development D1 migrations when current feature work requires them**. Every new migration must be additive/safe, regression tested, included in aggregate schema authority where appropriate and must never target Production from normal Development work.

## Release 448 active workstreams

1. **Client platform continuity.** Preserve Web/Phone/Desktop behavior, release/item notifications, offline safety and no idle polling as features grow.
2. **Product material lineage.** New Devil n Dove-made products should connect to real raw Inventory and consumption authority before publication. Existing products can be `legacy_pending`; resale/antiquity/external finished goods may be explicitly exempt.
3. **Product tool/mold lineage.** Record durable tools/molds used to create a product without consuming the durable tool.
4. **Manufacturer/vendor provenance and Devil n Dove reviews.** Associate supplies/tools with manufacturer/vendor provenance and locally authored reviews. Support ASIN/external IDs plus owner-supplied Amazon review/profile/source links or imports where available. Do not make Amazon reachable at runtime and do not copy third-party review text.
5. **I.T. integration/test registry.** Build the eventual test-environment authority for provider/platform reference names, callback/webhook, scopes, environment, configured/tested state, last safe result/error and correction mechanics. Real secret values never belong in D1.
6. **Carousel reuse for Movies.** Reuse/generalize carousel presentation without duplicating Home authority or adding an extra H1.
7. **Movie data convergence.** Correct provably wrong names/core fields and mark unknown/incomplete values rather than guessing.
8. **Unverified-process states.** Current/future D1 features should support `pending`, `legacy_pending`, `exempt`, `unverified`, `verified` and evidence references where truth state matters.

## Forward queue after/alongside Release 448

Continue moving through meaningful groups rather than waiting on deferred I.T. work:

- Storefront Shop;
- Collections;
- Collages;
- Carousels;
- CAIP;
- Inventory;
- Supplies;
- Tools;
- additional top-level module boundaries if justified.

## Amazon/Vevor review direction

The user has heavily invested in Vevor equipment and has authored Amazon reviews for some tools. Treat those reviews as potentially useful first-party provenance/content.

Design for:

- manufacturer/vendor link (for example Vevor);
- purchased Tool/Supply link;
- ASIN or marketplace identifier;
- public review/profile/source URL when owner-supplied or discoverable legitimately;
- locally authored Devil n Dove review text/notes when the user provides or imports it;
- review verification/source state.

Do **not** assume Amazon Business exposes a stable review-list API. Do not scrape behind authentication or make Amazon a live application dependency. Prefer owner-controlled import/linking or an official export/API if one is actually available later.

## Canonical repository gates

Run:

```bash
python scripts/repository_forward_sanity.py
python scripts/module_architecture_gate.py
python scripts/database_platform_gate.py
python scripts/public_seo_gate.py
python scripts/pwa_platform_gate.py
python scripts/product_inventory_tools_source_gate.py
python scripts/cloudflare_development_access.py --transport-preflight
python scripts/development_runtime_acceptance.py --self-check
```

The active CI workflow is `.github/workflows/system-gate.yml`. CI never applies remote D1 and never mutates Cloudflare R2, payment providers, or Production.

## Deferred I.T. test environment

`LIVE_TESTING_GUIDE.md` is now the non-blocking I.T. test-environment procedure. Deferred tasks carry forward automatically until evidence exists. They are not release gates.

The I.T. page should eventually become the complete test/setup cockpit for external providers and platform integrations: configuration references, callbacks/webhooks, scopes, environment, configured/tested state, errors, correction mechanics and evidence references. Secret values remain in Cloudflare/provider secret authorities, never D1/UI/source/logs.

## Invariants

- One current release only.
- Historical Build numbers never become active gates.
- D1 is operational write authority; no request-time DDL.
- Legacy JSON is not write authority.
- Public pages preserve one meaningful H1 and truthful canonical metadata/schema.
- Home carousel is Storefront-owned and may never inject a second H1.
- I.T. owns provider/infrastructure configuration references; consuming modules own business workflow.
- Deferred I.T. work never blocks unrelated forward releases.
- Web/Phone/Desktop remain first-class clients.
- Notification permission is explicit opt-in; no idle background polling.
- Production remains untouched without explicit authorization.

## Workflow

1. Work on `dev` only.
2. Move forward within the one current release; do not create parallel build tracks.
3. Run the canonical System Gate on the exact resulting head.
4. Require Cloudflare Pages `devilndove-site-dev` success on the same SHA.
5. Use read-only D1/R2 verification before recovery; apply new Development migrations only when current work requires them.
6. Carry deferred I.T. tests forward automatically instead of freezing the release.
7. Keep Production untouched without explicit authorization.
8. Keep this file, `PROJECT_STATUS_AND_ROADMAP.md`, `development-release.json`, `LIVE_TESTING_GUIDE.md` and the I.T. page synchronized when release state changes.
