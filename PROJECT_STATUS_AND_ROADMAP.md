# Project Status and Roadmap — Release 447 Platform Convergence

Updated: 2026-08-28

`development-release.json` is the machine-readable current-release authority. This file and `AI_HANDOFF.md` are the current human-readable planning/handoff authorities. Git history is the archive.

## Current Development status

- Current release: **Release 447 — Platform Convergence**
- Source/runtime: `dev` → `devilndove-site-dev`
- Canonical modules: **Storefront / Creators / Socials / Financials / I.T.**
- Canonical clients: **Web / Phone / Desktop** from the same responsive/installable application
- D1 convergence: **APPLIED AND VERIFIED** against `devilndove-dev`
- R2 Development visibility: **PROVEN** for product media and CAIP private media buckets
- Source gate: **GREEN** on accepted Release 447 deployment checkpoint `80efbdbf880f42838b0c6496432744125752c2b6`
- Cloudflare Pages: **GREEN** on that same checkpoint after removing the Pages-incompatible `account_id` entry from `wrangler.toml`
- Public SEO gate: **GREEN**; public HTML keeps exactly one H1 and carousel code is prohibited from injecting H1
- Installable client/PWA source gate: **GREEN**; service worker, manifest, shared client bootstrap and explicit-opt-in notification behavior are covered
- Separate live Production promotion: **CLOSED**

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

## Current HOLD register

| Work | State |
| --- | --- |
| Release 447 authenticated runtime acceptance | **HOLD** — source/D1/deployment are green; authenticated browser D1/R2/module/runtime proof remains |
| Stripe Development checkout/return/signed webhook/replay | **HOLD** |
| PayPal sandbox approval/capture/return/verified webhook/replay | **HOLD** |
| CAIP private media delivery/range/timecode/artifact evidence | **HOLD** |
| Separate live Production promotion | **HOLD BY POLICY** |

## Completed convergence work

### Application architecture
The application now has five top-level ownership domains rather than the old broad Build-era groupings. Route ownership and shared-service contracts protect cross-module access without destructive route renames. I.T. remains explicit-user only.

### Storefront
Home carousel schema and editor/public authority are part of Storefront. Public fallback remains available when no approved slide is published. Storefront public SEO preserves a single meaningful H1.

### I.T. / Platform
The I.T. page carries the current release, D1/R2 readiness, provider-readiness checks, correction mechanics and current HOLDs. Cloudflare authentication recovery is durable: account/D1/R2 preflight is explicit, credential values are never printed, OAuth can deliberately override a stale environment token, and Production targets are rejected.

### Web / Phone / Desktop
The responsive web application is installable through the current manifest/service worker. Shared middleware injects one PWA client across public/member/admin HTML responses while APIs/static resources remain untouched. New-item notification permission is explicit opt-in; checks occur on launch/resume with throttling rather than continuous polling. The service worker also supports future real Push events and same-origin notification clicks.

### Reliability and SEO
The one canonical System Gate now executes the current module architecture, D1 migration simulation/idempotency, public SEO, PWA/client safety and Product/Inventory/Tools source gates. CI has no D1/R2/provider/Production write capability.

## Forward roadmap

### Storefront
Continue Shop/Collections/search/cart/checkout truthfulness, approved-media controls, pickup/delivery, marketplace display, customer documents and responsive purchase flows. Preserve one H1, canonical metadata/schema, truthful inventory/publication state and no internal Inventory leakage.

### Creators
Continue Creative Project → Content Studio handoff, material-usage review, packaging/formula/ingredient templates, lesson/recommendation evidence, profitability context and optional private storyboard notes. Human approval remains required for public handoff.

### Socials
Continue social publication packages, connected-channel readiness, campaign/publication evidence, social proof and content distribution. Keep provider credentials/configuration in I.T.; Socials owns content and publication workflows.

### Financials
Continue provider-confirmed payments/refunds/disputes, reconciliation, AR/AP/journal/tax/fees/profitability/export/close, percentage marketplace fees and shared-project cost allocation. Stripe/PayPal testing is current-release work, never an old-build gate.

### I.T.
Continue API/binding/provider configuration references, release/readiness evidence, module/user access, incident/schema diagnostics, backup/restore rehearsal, service-worker recovery, performance/accessibility and exact Development deployment evidence. Never expose secret values.

### CAIP private media
Prove authenticated R2 object delivery, Range semantics, playable seeking, exact evidence timecodes/ranges, derived-artifact verification and storage-audit/provider-off behavior before closing the current HOLD.

## Release rule

A feature is complete only when source authority, D1 authority where applicable, failure/fallback behavior, responsive behavior, tests/CI, exact Development deployment and required authenticated/live evidence agree. Production remains a separate deliberate promotion decision.
