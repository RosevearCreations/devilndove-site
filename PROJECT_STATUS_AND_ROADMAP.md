# Project Status and Roadmap — Development Build 442

Updated: 2026-08-27

This file and `AI_HANDOFF.md` are the two full mutable current-state authorities.

## Release status

- Current Development release: **Build 442 — I.T. & Platform enforcement rollout**
- Source: `dev`
- Development application: `devilndove-site-dev`
- Previous accepted checkpoint: **Build 441 / `96e3256b608190a8780829ea9e6409670a898fb4`**
- Build 441 source gate: **GREEN**
- Build 441 Windows D1 transport gate: **GREEN**
- Build 441 exact Cloudflare Development deployment: **GREEN**, deployment `594c671f-3893-4a06-9eac-becf4e6a1a3e`
- Product/Inventory/Tool authenticated and source evidence: **GREEN provenance carried forward**
- Responsive/cross-mutation source evidence: **GREEN 35/35 provenance carried forward**
- Build 442 I.T. user-grant migration: **PHASE A — packaged; remote Development apply pending**
- Build 442 runtime I.T. enforcement: **HOLD until Development D1 proof**
- Build 442 Stripe Development checkout evidence: **HOLD — current-release test bridge active in I.T.**
- Build 442 PayPal Development checkout evidence: **HOLD — current-release test bridge active in I.T.**
- CAIP private-media live evidence: **HOLD carried into Build 442**
- Separate live Production baseline/project: `main` / `devilndove-site`
- Production promotion: **CLOSED**

A HOLD always travels into the active release with its reason, completed evidence and exact remaining proof. It never leaves an obsolete release artificially open and is never silently converted to PASS.

## Build 442 work

### Phase A — migration-first safety boundary

- Add the `it-platform` fourth-module registry row through an additive D1 migration.
- Add explicit `app_module_user_access` per-user authority with `read` / `manage` access.
- Keep role-derived I.T. access denied for both current `member` and `admin` roles.
- Bootstrap explicit manage access only for active administrators present during the first grant initialization; future admins are not auto-granted on migration replay.
- Reuse the proven guarded Windows-safe Development D1 query transport.
- Refuse Production targets, automatic retries and bulk import.
- Keep existing Build 438 three-module runtime enforcement unchanged until the new Development D1 authority is proven.

### Phase B — after D1 proof only

- Add `it-platform` to runtime module registry and route ownership.
- Require authenticated user + enabled module + explicit user grant.
- Enforce `read` versus `manage` in middleware/APIs.
- Add audited I.T. grant management and last-active-manager lockout protection.
- Extend Application Modules health/acceptance to four modules.
- Prove authenticated allowed/denied/read-only behavior on the Development deployment.

## Current HOLD register

| ID | Work | State |
| --- | --- | --- |
| IT-442-H1 | Apply/verify fourth-module and user-grant schema in `devilndove-dev` | **HOLD — blocks Phase B** |
| IT-442-H2 | Runtime `it-platform` per-user route/API enforcement | **HOLD — intentionally off until IT-442-H1 passes** |
| PAY-442-H1 | Stripe test configuration, checkout, return, signed webhook and duplicate replay on exact Development deployment | **HOLD — earlier payment builds are provenance, not the active requirement** |
| PAY-442-H2 | PayPal sandbox configuration, approval/capture, return, verified webhook and duplicate replay on exact Development deployment | **HOLD — earlier payment builds are provenance, not the active requirement** |
| CAIP-442-H1 | Private R2 delivery/range seeking/timecode/storage live evidence | **HOLD — promotion blocking** |
| UI-442-N1 | Automated authenticated viewport evidence | **NOTE — source 35/35 green; no known defect** |
| OPS-442-H1 | Separate live Production promotion | **HOLD BY POLICY** |

## Business roadmap carried forward

### Shop & customer experience
Continue Shop information architecture, product discovery, filters/search, truthful availability, cart/checkout readiness, customer documents, policies and mobile usability. Never expose internal Inventory-only Tool/Supply rows.

### Home & merchandising
The next probable bounded major direction is a **Build 443 editable responsive Home carousel**, after Build 442 reaches a safe checkpoint. Its in-application delivery contract now covers purpose/ownership, draft-preview-publish administration, scheduling/order, approved assets/text/CTA authority, static-hero fallback, reduced motion, keyboard/pause controls, one-H1/SEO protection, responsive performance and exact release acceptance. Continue featured creations, seasonal/editorial merchandising and display-order controls.

### Catalog, Shop & Collections
Strengthen catalog editing, collection/taxonomy management, merchandising rules, import/duplicate safeguards, SEO and public/private eligibility while keeping Collections distinct from raw Inventory identity.

### Inventory
Continue receiving, purchase lots/source provenance, physical counts, usage setup, ingredient review, kits, barcode-first workflows, reversals and atomic/audited stock actions. Do not fabricate uncertain historical provenance.

### Tools
Continue lifecycle/service/inspection completeness, reusable usage history, publication linkage, maintenance schedules and do-not-reuse safety.

### Creative Projects & CAIP
Carry `CAIP-442-H1` until private media evidence is proven. Continue verified processing artifacts, bounded retry/dead-letter, Creative Project → Content Studio handoff, reviewed material usage, lessons/recommendations, profitability and private storyboard notes. Human approval remains mandatory before public handoff.

### Gallery / Movies / video / media
Strengthen approved Gallery storytelling and reviewed video/media presentation without leaking private CAIP source footage. Continue thumbnails/posters, responsive playback, captions/transcripts, range-seeking/performance evidence and truthful fallbacks.

### Packaging & labels
Continue exact-size templates, reusable ingredient/soap/formula libraries, prepress PDF, proof photos, barcode/QR, transactional packaging consumption, bilingual/INCI/claim review and physical print/laser evidence.

### Orders, Payments & Accounting
Build 442 owns the unresolved Stripe and PayPal testing requirements through `PAY-442-H1/H2`; do not tell operators to finish an obsolete payment build. The I.T. page shows safe readiness flags and exact correction/pass mechanics without exposing secret values. Continue order lifecycle, customer documents, provider-confirmed payments/refunds/disputes, webhook replay, reconciliation, AR/AP/journal/tax/fees/profitability/export/close, percentage marketplace fees and shared project-cost allocation.

### SEO, content & analytics
Preserve one H1, truthful metadata/schema, noindex Admin and appropriate Canadian/local quality. Continue unified search, consent-aware analytics, social publishing proof, Search Console/sitemap/indexing, Merchant Center and Business Profile evidence.

### Reliability, security & backup
Keep structured/sanitized failures, permission tests, Worker CPU/subrequest/5xx review, bounded/no-idle polling, cache/service-worker recovery, accessibility/performance and isolated D1/R2/config backup-restore rehearsal.

### Go-live
Freeze a small launch list only after facts, stock, media, packaging and ownership are verified. Rehearse tax, delivery/pickup, checkout, email, payment, refund and fulfilment. Separate live Production promotion remains an explicit owner decision.

## Release sequencing

- **Build 441:** closed Development convergence checkpoint at `96e3256b608190a8780829ea9e6409670a898fb4`.
- **Build 442 Phase A:** additive I.T. module/user-grant migration package, guarded Development D1 apply/verification, no runtime enforcement race.
- **Build 442 Phase B:** activate explicit per-user I.T. enforcement only after D1 proof; close or carry remaining HOLDs.
- **Build 443 candidate:** editable responsive Home carousel, provided Build 442 reaches a safe checkpoint; otherwise carry every unresolved item forward under Build 443 IDs without reopening an old build.
- **Build 443+:** continue bounded roadmap work. Never reopen old build numbers; unresolved items carry forward as current-release HOLD/OPEN items.

## Environment terminology

**Dev-project Production** = Cloudflare Pages Production deployment of `devilndove-site-dev` sourced from `dev`; it is the Development runtime. **Separate live Production** = `main` / `devilndove-site`. Never conflate them.
