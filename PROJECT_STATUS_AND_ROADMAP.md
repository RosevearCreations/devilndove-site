# Project Status and Roadmap — Development Build 443

Updated: 2026-08-27

This file and `AI_HANDOFF.md` are the two full mutable current-state authorities.

## Release status

- Current Development release: **Build 443 — editable Home carousel / safe static fallback**
- Source: `dev`
- Development application: `devilndove-site-dev`
- Previous accepted checkpoint: **Build 442 / `b8868c9b77ad12de4fee4984274fe80e1d096613`**
- Build 442 source gate: **GREEN**
- Build 442 Windows D1 transport gate: **GREEN**
- Build 442 exact Cloudflare Development deployment: **GREEN**, deployment `b72eb8b4-ac52-4b12-bdd2-cd85ea6b400d`
- Product/Inventory/Tool authenticated and source evidence: **GREEN provenance carried forward**
- Responsive/cross-mutation source evidence: **GREEN 35/35 provenance carried forward**
- Build 443 carousel source/editor/runtime: **IMPLEMENTED — static fallback remains active until remote Development D1 proof and published slides**
- Build 443 carousel migration/live acceptance: **HOLD — remote Development apply pending**
- Build 443 I.T. user-grant migration/runtime enforcement: **HOLD carried forward at the same guarded D1 boundary**
- Build 443 Stripe and PayPal Development checkout evidence: **HOLD — current-release test bridge active in I.T.**
- CAIP private-media live evidence: **HOLD carried into Build 443**
- Separate live Production baseline/project: `main` / `devilndove-site`
- Production promotion: **CLOSED**

A HOLD always travels into the active release with its reason, completed evidence and exact remaining proof. It never leaves an obsolete release artificially open and is never silently converted to PASS.

## Build 443 work

### Home carousel increment

- Add an audited draft/preview/publish/pause/archive/reorder editor at `/admin/home-carousel/`.
- Add schedule, sort order, approved same-site image, alt text, CTA and rotation controls.
- Keep the existing Home H1 and static hero as the fail-safe for missing schema/API/slides/first-image evidence.
- Respect reduced motion; expose previous/next, indicators, keyboard behavior and pause/resume.
- Apply and verify the additive Development D1 migration before claiming live editing/publishing acceptance.

### Carried I.T. boundary

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
| CAR-443-H1 | Apply/verify carousel schema and live draft/publish/pause/schedule/fallback behavior in `devilndove-dev` | **HOLD — static Home hero remains safe** |
| IT-443-H1 | Apply/verify fourth-module and user-grant schema in `devilndove-dev` | **HOLD — blocks I.T. Phase B** |
| IT-443-H2 | Runtime `it-platform` per-user route/API enforcement | **HOLD — intentionally off until IT-443-H1 passes** |
| PAY-443-H1 | Stripe test configuration, checkout, return, signed webhook and duplicate replay on exact Development deployment | **HOLD — earlier payment builds are provenance, not the active requirement** |
| PAY-443-H2 | PayPal sandbox configuration, approval/capture, return, verified webhook and duplicate replay on exact Development deployment | **HOLD — earlier payment builds are provenance, not the active requirement** |
| CAIP-443-H1 | Private R2 delivery/range seeking/timecode/storage live evidence | **HOLD — promotion blocking** |
| UI-443-N1 | Automated authenticated viewport evidence | **NOTE — source 35/35 green; no known defect** |
| OPS-443-H1 | Separate live Production promotion | **HOLD BY POLICY** |

## Business roadmap carried forward

### Shop & customer experience
Continue Shop information architecture, product discovery, filters/search, truthful availability, cart/checkout readiness, customer documents, policies and mobile usability. Never expose internal Inventory-only Tool/Supply rows.

### Home & merchandising
Build 443 now implements the editable responsive Home carousel source, editor, APIs and static-hero fallback. Complete its guarded Development D1/live acceptance before claiming publish readiness. The next bounded merchandising direction should extend approved media selection and restore/version review rather than silently broadening carousel scope.

### Catalog, Shop & Collections
Strengthen catalog editing, collection/taxonomy management, merchandising rules, import/duplicate safeguards, SEO and public/private eligibility while keeping Collections distinct from raw Inventory identity.

### Inventory
Continue receiving, purchase lots/source provenance, physical counts, usage setup, ingredient review, kits, barcode-first workflows, reversals and atomic/audited stock actions. Do not fabricate uncertain historical provenance.

### Tools
Continue lifecycle/service/inspection completeness, reusable usage history, publication linkage, maintenance schedules and do-not-reuse safety.

### Creative Projects & CAIP
Carry `CAIP-443-H1` until private media evidence is proven. Continue verified processing artifacts, bounded retry/dead-letter, Creative Project → Content Studio handoff, reviewed material usage, lessons/recommendations, profitability and private storyboard notes. Human approval remains mandatory before public handoff.

### Gallery / Movies / video / media
Strengthen approved Gallery storytelling and reviewed video/media presentation without leaking private CAIP source footage. Continue thumbnails/posters, responsive playback, captions/transcripts, range-seeking/performance evidence and truthful fallbacks.

### Packaging & labels
Continue exact-size templates, reusable ingredient/soap/formula libraries, prepress PDF, proof photos, barcode/QR, transactional packaging consumption, bilingual/INCI/claim review and physical print/laser evidence.

### Orders, Payments & Accounting
Build 443 owns the unresolved Stripe and PayPal testing requirements through `PAY-443-H1/H2`; do not tell operators to finish an obsolete payment build. The I.T. page shows safe readiness flags and exact correction/pass mechanics without exposing secret values. Continue order lifecycle, customer documents, provider-confirmed payments/refunds/disputes, webhook replay, reconciliation, AR/AP/journal/tax/fees/profitability/export/close, percentage marketplace fees and shared project-cost allocation.

### SEO, content & analytics
Preserve one H1, truthful metadata/schema, noindex Admin and appropriate Canadian/local quality. Continue unified search, consent-aware analytics, social publishing proof, Search Console/sitemap/indexing, Merchant Center and Business Profile evidence.

### Reliability, security & backup
Keep structured/sanitized failures, permission tests, Worker CPU/subrequest/5xx review, bounded/no-idle polling, cache/service-worker recovery, accessibility/performance and isolated D1/R2/config backup-restore rehearsal.

### Go-live
Freeze a small launch list only after facts, stock, media, packaging and ownership are verified. Rehearse tax, delivery/pickup, checkout, email, payment, refund and fulfilment. Separate live Production promotion remains an explicit owner decision.

## Release sequencing

- **Build 441:** closed Development convergence checkpoint at `96e3256b608190a8780829ea9e6409670a898fb4`.
- **Build 442:** closed safe Development checkpoint at `b8868c9b77ad12de4fee4984274fe80e1d096613`; unresolved I.T./provider/CAIP evidence carried forward.
- **Build 443 current:** editable responsive Home carousel source/editor/runtime/fallback plus guarded additive D1 acceptance; all inherited obstacles now use Build 443 HOLD IDs.
- **Build 444+:** continue bounded roadmap work after the exact Build 443 source/deployment checkpoint. Never reopen old build numbers; unresolved items carry forward as current-release HOLD/OPEN items.

## Environment terminology

**Dev-project Production** = Cloudflare Pages Production deployment of `devilndove-site-dev` sourced from `dev`; it is the Development runtime. **Separate live Production** = `main` / `devilndove-site`. Never conflate them.
