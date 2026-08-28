# Project Status and Roadmap — Release 447 Platform Convergence

Updated: 2026-08-28

`development-release.json` is the machine-readable current-release authority. This file and `AI_HANDOFF.md` are the current human-readable planning/handoff authorities. Git history is the archive.

## Current Development status

- Current release: **Release 447 — Platform Convergence**
- Source/runtime: `dev` → `devilndove-site-dev`
- Canonical modules: **Storefront / Creators / Socials / Financials / I.T.**
- Canonical clients: **Web / Phone / Desktop** from the same responsive/installable application
- D1 convergence: **APPLIED AND VERIFIED** against `devilndove-dev`
- R2 Development visibility: **PROVEN** for product media and CAIP private media buckets by prior read-only evidence
- Public SEO authority: public HTML keeps exactly one H1 and carousel code is prohibited from injecting H1
- Installable client/PWA source authority: service worker, manifest, shared client bootstrap and explicit-opt-in notification behavior are covered
- Runtime acceptance authority: **release-independent, Development-only, authenticated/read-only GET harness added**
- Separate live Production promotion: **CLOSED**

Always resolve the exact current `dev` head and its System Gate/Pages deployment evidence from GitHub. Do not copy an older checkpoint SHA forward as if it were the current release.

## Development D1 / R2 authority

Development D1 is `devilndove-dev` with ID `dbc1615b-dcbe-4951-973b-b47c99c73bfa`. The current migration `database_platform_convergence.sql` produced and verified:

- five canonical module rows,
- zero legacy module rows,
- 10 canonical role rows,
- zero role-derived I.T. grants,
- one active explicit I.T. manager,
- required module/user-access/Home-carousel tables,
- clean foreign-key verification.

Do not reapply this migration on chat startup. Use `python scripts/cloudflare_development_access.py --auth-only` and the read-only `/api/admin/infrastructure-readiness` contract first. Local tooling pins the Development Cloudflare account using `CLOUDFLARE_ACCOUNT_ID`; `wrangler.toml` must remain Pages-compatible and must not contain `account_id`.

## Release 447 acceptance authority

`LIVE_TESTING_GUIDE.md` and `scripts/development_runtime_acceptance.py` replace the old numbered live-testing procedures. The runtime harness:

- accepts only `https://devilndove-site-dev.pages.dev`;
- refuses Production/custom/arbitrary targets;
- accepts the authenticated Development session only through `DND_DEV_SESSION_COOKIE`;
- performs GET requests only;
- checks D1/R2 readiness without migration;
- checks the five-module authenticated authority plus Storefront, Creators and Financials read contracts;
- represents Socials through the authenticated canonical module authority without publication mutation;
- represents I.T. through infrastructure plus module authority;
- reports Stripe/PayPal configuration readiness separately from provider acceptance;
- emits sanitized evidence without credentials.

## Current HOLD register

| Work | State |
| --- | --- |
| Release 447 authenticated runtime execution | **HOLD** — deterministic harness/runbook now exist; fresh authenticated deployed-runtime evidence remains |
| Stripe Development checkout/return/signed webhook/replay | **HOLD** — readiness is not transaction acceptance |
| PayPal sandbox approval/capture/return/verified webhook/replay | **HOLD** — readiness is not transaction acceptance |
| CAIP private media delivery/range/timecode/artifact evidence | **HOLD** |
| Separate live Production promotion | **HOLD BY POLICY** |

These HOLDs must not be converted to PASS from source inspection, schema readiness or provider-configuration flags alone.

## Completed Release 447 convergence work

### Application architecture
The application has five top-level ownership domains rather than old broad build-era groupings. Route ownership and shared-service contracts protect cross-module access without destructive route renames. I.T. remains explicit-user only.

### Storefront
Home carousel schema and editor/public authority are part of Storefront. Public fallback remains available when no approved slide is published. Storefront public SEO preserves a single meaningful H1.

### I.T. / Platform
The I.T. authority carries the current release, D1/R2 readiness, provider-readiness checks, correction mechanics and current HOLDs. Cloudflare authentication recovery is durable: account/D1/R2 preflight is explicit, credential values are never printed, OAuth can deliberately override a stale environment token, and Production targets are rejected.

### Runtime acceptance
The active runtime procedure is now release-independent instead of tied to stale historical build numbers. System Gate validates the harness safety/manifest without network/provider writes. Active shared read contracts expose current-release metadata rather than returning stale build identities.

### Web / Phone / Desktop
The responsive web application is installable through the current manifest/service worker. Shared middleware injects one PWA client across public/member/admin HTML responses while APIs/static resources remain untouched. New-item notification permission is explicit opt-in; checks occur on launch/resume with throttling rather than continuous polling.

### Reliability and SEO
The canonical System Gate executes current module architecture, D1 migration simulation/idempotency, Development transport safety, runtime-acceptance self-check, public SEO, PWA/client safety and Product/Inventory/Tools source gates. CI has no D1/R2/provider/Production write capability.

## Release 448 preparation — scope ready, release not open

No Release 448 D1 migration is authorized while Release 447 remains live-acceptance HOLD unless a proven Release 447 defect requires a repair. Database design may be prepared, but Development D1 stays at the verified Release 447 authority until that boundary changes deliberately.

### 1. Product material lineage and publication enforcement

For products created by Devil n Dove, raw goods must already exist in Inventory and the product must ultimately have real material-consumption lineage through the existing inventory ledger before publication. We will not create a second stock ledger.

Required origin/lineage states must support at minimum:

- in-house created — inventory lineage required;
- legacy in-house product — `legacy_pending` until reconstructed where possible;
- antiquity/resale/external finished good — explicitly inventory-exempt;
- pending/unverified/verified states plus evidence references.

Existing finished goods are not to receive fabricated historical consumption records.

### 2. Product tools and molds

Products should record which durable tools/molds were used in creation. This association is provenance/production evidence and must not deduct the durable tool as a consumable. Material consumption and tool usage remain separate authorities.

### 3. Manufacturer/vendor provenance and company-authored reviews

Raw goods and tools should be linkable to manufacturer/vendor provenance. Devil n Dove-authored reviews of purchased items can be stored locally and associated with the relevant item/manufacturer plus an ASIN or other external identifier/source URL when available. The application must not scrape/copy marketplace review text or require Amazon to be reachable for normal product operation.

This enables later tagging/credit of manufacturers when showing products made with their raw goods or tools, subject to truthful attribution and channel rules.

### 4. I.T. social/provider integration registry

I.T. will own the configuration authority used by Socials/CAIP to communicate automatically with external platforms. The registry/interface must support:

- platform/provider;
- purpose/capability;
- secret or binding **name/reference only**;
- callback and webhook locations;
- requested/granted scopes;
- Development/Production environment distinction;
- configured status;
- tested/accepted status kept separate;
- last test time/result/error;
- explicit correction/recovery mechanics;
- ownership/module consumer.

Secret values never belong in D1, logs, evidence output or visible admin HTML.

### 5. Storefront carousel reuse on Movies

Generalize the current Storefront carousel presentation so the Movie surface can reuse the component/configuration pattern without duplicating Home-carousel database authority where that would be inappropriate. Public output must still preserve one H1.

### 6. Movie data convergence

Audit Movie records for incorrect names and missing core data. Correct only values supported by current source/evidence; unknown values remain visibly incomplete/pending rather than guessed. Add completeness/verification state where the existing model cannot distinguish unknown from verified blank data.

### 7. Database design rule for unconfirmed processes

New Release 448 schema must leave explicit room for `pending`, `legacy_pending`, `exempt`, `unverified`, `verified` and evidence references. A schema row existing is never proof that a business process or external provider workflow has been accepted.

## Forward roadmap by module

### Storefront
After the Release 448 provenance work, continue Shop/Collections/search/cart/checkout truthfulness, approved-media controls, pickup/delivery, marketplace display, customer documents and responsive purchase flows. Preserve one H1, canonical metadata/schema, truthful inventory/publication state and no internal Inventory leakage.

### Creators
Continue Creative Project → Content Studio handoff, material-usage review, packaging/formula/ingredient templates, lesson/recommendation evidence, profitability context and optional private storyboard notes. Human approval remains required for public handoff.

### Socials
Continue social publication packages, connected-channel readiness, campaign/publication evidence, social proof and content distribution. Socials owns content/publication workflow; I.T. owns provider credential/configuration references.

### Financials
Continue provider-confirmed payments/refunds/disputes, reconciliation, AR/AP/journal/tax/fees/profitability/export/close, percentage marketplace fees and shared-project cost allocation. Stripe/PayPal testing is current-release acceptance work, never an old-build gate.

### I.T.
Continue API/binding/provider configuration references, release/readiness evidence, module/user access, incident/schema diagnostics, backup/restore rehearsal, service-worker recovery, performance/accessibility and exact Development deployment evidence. Never expose secret values.

### CAIP private media
Prove authenticated R2 object delivery, Range semantics, playable seeking, exact evidence timecodes/ranges, derived-artifact verification and storage-audit/provider-off behavior before closing the current HOLD.

## Release rule

A feature is complete only when source authority, D1 authority where applicable, failure/fallback behavior, responsive behavior, tests/CI, exact Development deployment and required authenticated/live evidence agree. Production remains a separate deliberate promotion decision.
