# Project Status and Roadmap — Release 448 Platform Expansion

Updated: 2026-08-28

`development-release.json` is the machine-readable current-release authority. This file and `AI_HANDOFF.md` are the current human-readable planning/handoff authorities. Git history is the archive.

## Current Development status

- Current release: **Release 448 — Platform Expansion**
- Previous release: **Release 447 — Platform Convergence — COMPLETE**
- Source/runtime: `dev` → `devilndove-site-dev`
- Canonical modules: **Storefront / Creators / Socials / Financials / I.T.**
- Canonical clients: **Web / Phone / Desktop**
- Phone/Desktop delivery: shared responsive/installable PWA authority
- Notifications: explicit opt-in **new-release + new-item** alerts
- D1 baseline: Release 447 convergence **APPLIED AND VERIFIED** against `devilndove-dev`
- R2 Development visibility: previously proven for product media and CAIP private-media buckets
- Public SEO authority: one meaningful H1 per public page; carousel code may not inject H1
- Historical Build numbers: provenance only; no active build-number gates
- Separate live Production promotion: **CLOSED**

Always resolve the exact current `dev` head and its System Gate/Pages deployment evidence from GitHub.

## Release rule: forward motion is not blocked by deferred I.T.

Authenticated Development runtime, Stripe test acceptance, PayPal sandbox acceptance and CAIP private-media acceptance are now part of the **deferred I.T. test environment**. They carry forward automatically until completed and **do not gate Release 448 or later normal feature development**.

For feature work, Development provider/key references may be treated as available or safely mocked behind provider abstractions. This keeps implementation moving without pretending real external credentials or transactions have been accepted.

Real credential/provider evidence remains truthful and separate. Production remains explicitly closed.

## Canonical application architecture

### Storefront
Owns customer/public commerce presentation. Current and forward capabilities include Home, Shop, product discovery, Collections, Collages, Carousels, Movies/showcase presentation, cart/checkout/customer documents, delivery/pickup presentation and SEO truthfulness.

Shop/Collections/Collages/Carousels remain Storefront capabilities unless a future ownership boundary justifies a new top-level module.

### Creators
Owns Creative Projects, production/creation evidence, packaging/formula/ingredient templates, Content Studio preparation, material-usage review, lessons/recommendations and creator workflow.

### Socials
Owns social content/publication/campaign/channel workflow and CAIP-facing publication/distribution behavior. I.T. owns the provider connection references that Socials consumes.

### Financials
Owns accounting, payment-state interpretation, refunds/disputes, reconciliation, AR/AP/journal/tax/fees/profitability/export/close and marketplace economics.

### I.T.
Owns infrastructure, API/provider connection references, external-platform test environment, module/user access, release/readiness diagnostics, incidents/schema drift, recovery mechanics and secret-reference governance.

### Future modules
The application has a **minimum** of five canonical modules, not a permanent maximum. Additional modules may be added deliberately when a domain has a clear independent ownership/lifecycle/security boundary. Do not create a module simply to reduce menu length.

## Web / Phone / Desktop platform

All three are first-class clients of the same application authority.

Current enforced client behavior:

- responsive layouts;
- site-wide manifest;
- standalone installable mode on supported phone/desktop browsers;
- shared service worker;
- offline fallback;
- admin/API cache bypass;
- push/notification-click support;
- explicit user notification permission;
- new-release notifications;
- newly published item notifications;
- launch/resume checks instead of idle timer polling.

Every major future surface should be evaluated on Web, Phone and Desktop rather than implemented as Web-only admin functionality.

## D1 / R2 baseline and current migration policy

Development D1 is `devilndove-dev` with ID `dbc1615b-dcbe-4951-973b-b47c99c73bfa`.

The verified Release 447 baseline produced:

- five canonical module rows;
- zero legacy module rows;
- 10 canonical role rows;
- zero role-derived I.T. grants;
- one active explicit I.T. manager;
- required module/user-access/Home-carousel tables;
- clean foreign-key verification.

Permanent startup rule: **read-only D1/R2 verification first**. Never replay the baseline migration merely because a new chat or release starts.

Release 448 is now active and **may introduce new protected Development D1 migrations when current work requires them**. New migrations must be additive/safe, idempotent where practical, migration-tested, reflected in aggregate schema authority and must not touch Production through normal Development workflow.

## Deferred I.T. test environment

The following tasks stay visible but are non-blocking:

| I.T. task | State | Release effect |
| --- | --- | --- |
| Authenticated Development runtime evidence | **DEFERRED** | does not block forward release work |
| Stripe test checkout/webhook/reconciliation/replay | **DEFERRED** | does not block forward release work |
| PayPal sandbox approval/capture/webhook/reconciliation/replay | **DEFERRED** | does not block forward release work |
| CAIP private media delivery/range/timecode/artifact evidence | **DEFERRED** | does not block forward release work |

`LIVE_TESTING_GUIDE.md` is the non-blocking procedure for completing this work later.

The eventual I.T. test environment should manage safe metadata for all external integrations: platform/provider, capability, consuming module, environment, secret/binding reference name, callback/webhook, scopes, configured state, tested state, last safe result/error, correction mechanics and evidence references. Actual secret values remain outside D1/UI/source/logs.

## Release 448 active workstreams

### 1. Client platform continuity

Keep Web/Phone/Desktop fully usable as capabilities grow. Preserve release/item notifications, offline/fallback behavior, safe caching and responsive UI. Avoid introducing background polling simply to keep installed clients “alive.”

### 2. Product material lineage and publication truth

For Devil n Dove-created products, raw goods should already exist in Inventory and real material consumption should flow through the existing inventory ledger before publication where appropriate.

Required states include:

- in-house created — lineage required;
- legacy in-house — `legacy_pending` until reconstructed where possible;
- antiquity/resale/external finished good — explicitly exempt;
- `pending`, `unverified`, `verified` and evidence-reference states.

Do not fabricate historical consumption for existing products.

### 3. Product tools and molds

Products should record durable Tools/molds used during creation separately from consumable materials. Tool association records provenance/usage but does not consume the durable tool.

### 4. Manufacturer/vendor provenance and Devil n Dove reviews

Supplies and Tools should be linkable to manufacturer/vendor provenance, allowing later truthful manufacturer credit/tagging where appropriate.

Devil n Dove-authored reviews of purchased items should be storable locally and associated with:

- Tool/Supply record;
- manufacturer/vendor;
- marketplace/source;
- ASIN or external identifier;
- source/review/profile URL if owner-supplied or legitimately discoverable;
- locally authored review text/notes when imported/provided;
- verification/source state.

The application must not require Amazon to be reachable for normal operation and must not scrape/copy third-party review content.

For Amazon specifically, design for owner-controlled discovery/import from the user's own profile/review history when practical. Do not assume the Amazon Business account provides a stable review API.

### 5. I.T. social/provider integration registry

Continue building the future I.T. setup/test cockpit. The integration registry should support:

- platform/provider;
- purpose/capability;
- consuming module/workflow;
- Development/Production environment;
- secret/binding reference **name only**;
- callback/redirect/webhook locations;
- requested/granted scopes;
- configured state;
- tested/accepted state;
- last safe test time/result/error;
- correction/recovery mechanic;
- evidence reference.

This registry is infrastructure for later I.T. completion, not a reason to stop feature development now.

### 6. Storefront carousel reuse for Movies

Generalize carousel presentation/component behavior so Movie/showcase surfaces can reuse it without duplicating Home-carousel authority. Public rendering must preserve one H1 and appropriate heading hierarchy.

### 7. Movie data convergence

Audit Movie records for incorrect names and missing core data. Correct only values supported by current evidence; unknown values remain explicit rather than guessed. Add completeness/verification state where blanks are ambiguous.

### 8. Unverified-process states

Current/future D1 additions should preserve truth-state distinctions such as:

- `pending`;
- `legacy_pending`;
- `exempt`;
- `unverified`;
- `verified`;
- evidence references.

A row existing is never proof that an external provider, inventory history or business process was actually completed.

## Forward queue

We have many meaningful areas to continue without waiting for deferred I.T. acceptance. Move through them in cohesive release-sized groups:

### Storefront
- Shop
- Collections
- Collages
- Carousels
- product/category merchandising
- search/filter/discovery
- cart/checkout truthfulness
- approved media
- pickup/delivery presentation
- customer receipts/documents
- SEO/schema/local/public conversion work

### CAIP / Creators / Socials
- Creative Project → Content Studio handoff
- temporal/private media evidence
- story/evidence selection
- lessons/future recommendations
- publication packages
- channel-ready media variants
- manufacturer/tool/material evidence where useful
- private storyboard/client notes where applicable

### Inventory / Supplies / Tools
- material lineage
- lot/source/manufacturer provenance
- kit depletion/reversal
- durable-tool lifecycle
- molds/tool use association
- purchased-item reviews
- reorder/source intelligence
- truthful availability and publication integration

### Financials
- payment/refund/dispute truth
- reconciliation
- marketplace/channel fees
- shared project cost allocation
- profitability
- journal/AR/AP/tax/export/close

### I.T. — later dedicated work
- full provider setup/test cockpit
- secret-reference completion
- Stripe test acceptance
- PayPal sandbox acceptance
- social channel OAuth/webhooks/scopes
- authenticated runtime evidence
- CAIP private-media infrastructure acceptance
- backup/restore rehearsal
- performance/accessibility/runtime incident tooling

## Amazon/Vevor review opportunity

There is a useful content/provenance opportunity around the user's substantial Vevor equipment investment and product reviews written on Amazon.

The desired system should be able to capture the user's own review history without making Amazon the authority for normal runtime behavior. A practical future workflow is:

1. identify the user's Amazon profile/review entries or owner-supplied review URLs;
2. map each review to ASIN/product/source;
3. link it to the local Tool/Supply and manufacturer/vendor (for example Vevor);
4. import/store the user's own review content or notes when permitted/provided;
5. preserve the original source URL and verification date;
6. later reuse the local first-party review/provenance in creator/social/manufacturer-credit workflows where appropriate.

## Canonical release gates

Normal current-release source gates remain:

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

These gates validate current source/architecture/safety. The deferred authenticated/provider/media I.T. tests are **not** part of the release-blocking gate.

## Forward release policy

A normal feature is considered ready when its source authority, D1 authority where applicable, fallback/error behavior, Web/Phone/Desktop behavior, regression tests/CI and exact Development deployment agree.

External provider/live acceptance is required when we deliberately enter the dedicated I.T. test phase or before Production use of that provider—not as a permanent blocker to unrelated Development releases.

Production remains a separate deliberate promotion decision.
