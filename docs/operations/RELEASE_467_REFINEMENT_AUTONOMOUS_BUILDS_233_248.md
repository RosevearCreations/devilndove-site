# Release 467 — Refinement Autonomous Roadmap (Builds 233–248)

## Why this roadmap exists

Build 232 correctly exhausted the prior evidence-driven manufacturing roadmap. The owner has now explicitly authorized a new capability direction focused on refinement rather than more core business authorities:

1. quality-of-life and contextual help;
2. workflow streamlining;
3. security hardening;
4. non-Product visual completeness;
5. final measured review.

This roadmap does not reopen Build 232's empty real-business-evidence lanes and does not create parallel Product, Inventory, Custom Work, Creative Project, Finance, publication, manufacturing, Media or provider authorities.

## Exact starting boundary

- Build 232 Production main: `d5e9922b629f99c5653f5b884861a2c18358b44f`
- Shared Production tree: `3fcfd435a8618dc64244f53d0ceca1379878dcdd`
- Build 232 Development was fully GREEN before promotion.
- Build 232 measured D1 provider rows read: 8,808 / 25,000.
- D1/R2 business mutation: ZERO.
- Capability coverage: 22/22 active canonical processes.

The new roadmap is authorized by the owner's explicit request for new refinement capability, satisfying Build 232's reactivation rule.

---

# Phase 1 — Quality of life and help

## Build 233 — Universal Help & Quality-of-Life Coverage

Turn the existing shared ⓘ help primitive into an application-wide help contract.

Scope:
- one customer-facing Help Centre at `/help/`;
- one Creator-and-up operating Help Centre at `/admin/help/`;
- a page-level ⓘ help entry point on every meaningful public/customer and Admin/Creator surface where the shared runtime is active;
- preserve existing field/term contextual help;
- explain purpose, audience, what the screen changes, what it does not change, prerequisites, next step and where to recover from common confusion;
- keep help read-only and free of API/provider/business-data mutation;
- add regression coverage so new major screens cannot silently ship without help.

Exit: application-wide page-help coverage is proven, both audience Help Centres are clearly separated, and existing specific contextual help remains intact.

## Build 234 — Workflow Help, Empty States & Recovery Guidance

Add richer task-oriented help to the highest-friction workspaces.

Scope:
- explain first-use/empty state versus broken state;
- show prerequisite and next-valid-action guidance;
- add recovery text for failed saves, stale data, missing media, provider HOLD, permissions and unavailable business evidence;
- add "Why can't I do this?" explanations beside disabled/high-consequence actions;
- link help to the owning workspace rather than duplicating business logic.

Exit: key Creator/Admin workflows have usable start → work → review → finish guidance without adding a parallel workflow engine.

## Build 235 — Resume Work & Cross-Workspace Handoff

Reduce time spent finding the next place to work.

Scope:
- converge recent work, favorites, Today Needs Attention and existing command palette into a bounded "Resume / Continue work" experience;
- preserve current navigation manifest as authority;
- show direct next-step links where an existing authority already knows the next action;
- never auto-execute business actions.

## Build 236 — Save Confidence, Unsaved-Work Protection & Safe Batch Review

Improve editing confidence across forms and long workspaces.

Scope:
- consistent saved/saving/failed/stale status language;
- unsaved-change warnings for high-value editing surfaces that do not already have recovery;
- retry/recover affordances that reuse existing APIs;
- safe multi-select review where current APIs already support bounded item-level actions;
- no new automatic Product publication, Inventory movement, Finance posting or provider action.

## Build 237 — Mobile, Touch, Keyboard & Dense-Workspace Ergonomics

Refine the application for phone/tablet and long admin sessions.

Scope:
- sticky local action bars where appropriate;
- touch target and focus improvements;
- table/card switching on narrow screens;
- reduce horizontal page overflow;
- improve keyboard flow and visible focus;
- preserve existing responsive and accessibility gates.

## Build 238 — Attention, Notifications & Operator Signal Cleanup

Streamline operator attention without hiding evidence.

Scope:
- converge duplicated attention signals into existing notification/incident authorities;
- rank by severity, age and owner using existing facts;
- make stale or informational records visually quieter;
- preserve audit history and explicit resolution.

---

# Phase 2 — Streamlining

## Build 239 — Admin Surface & Navigation Consolidation

Identify overlapping admin routes, duplicate entry points and redundant actions.

Scope:
- keep canonical business authorities;
- redirect or retire redundant shells where safe;
- reduce duplicated controls and repeated explanatory panels;
- keep deep links and route compatibility where required.

## Build 240 — API Read Budget, Cache & Batch Streamlining

Reduce unnecessary Cloudflare/D1 pressure.

Scope:
- identify repeated identical reads in dashboard/workspace startup;
- consolidate bounded bootstrap payloads where it reduces subrequests;
- use safe client caching only for read-only data with clear invalidation;
- preserve provider-metered ceilings and avoid bucket/database-wide scans.

## Build 241 — Cross-Authority Handoff Simplification

Reduce duplicate re-entry between existing Product, Media, Creative, Custom Work, Inventory, Finance and Content workflows.

Scope:
- pass identifiers/context between workspaces;
- preselect the record the operator came from;
- show return-to-source links;
- do not copy authoritative business records.

## Build 242 — Release, Diagnostics & Evidence Streamlining

Simplify operator-facing release and diagnostic surfaces while preserving exact evidence.

Scope:
- consolidate repeated readiness summaries;
- keep immutable historical proof separate from current action;
- reduce duplicated release-state language;
- preserve exact-SHA Development → main → Production requirements.

---

# Phase 3 — Security hardening

## Build 243 — Session Architecture Hardening

Current code sets an HttpOnly session cookie but also returns the same session token to JavaScript and mirrors it into localStorage/script-readable cookie state. Migrate toward a cookie-first session architecture.

Scope:
- stop exposing bearer-equivalent session material to normal browser JavaScript once compatibility is proven;
- preserve same-site authenticated fetches;
- add session rotation/expiry compatibility where needed;
- migration must be staged and regression-tested across member/Admin routes.

## Build 244 — CSRF / Origin Protection for Mutating Routes

Add explicit same-origin mutation protection appropriate to the cookie-first model.

Scope:
- Origin/Referer validation and/or a dedicated CSRF token contract for state-changing browser requests;
- protect sensitive Admin and customer mutation routes;
- keep webhooks/provider callbacks on separately validated provider-signature paths;
- do not break legitimate same-site forms or API clients.

## Build 245 — CSP & Browser Injection-Surface Hardening

The current CSP still permits `'unsafe-inline'` for scripts/styles. Reduce that exposure without destabilizing the static application.

Scope:
- inventory inline scripts/styles and dynamic HTML;
- move practical inline script to versioned same-origin assets;
- use nonce/hash strategy only where necessary;
- tighten CSP incrementally and prove public/Admin compatibility.

## Build 246 — Abuse Resistance, Session Control & Security Operations

Scope:
- bounded login/password/reset throttling;
- clearer session/device management and explicit revoke-other-sessions UX;
- broaden sensitive-action step-up coverage;
- improve security summary so it reports actionable configuration and stale/expired session facts;
- preserve audit evidence and avoid logging secrets.

---

# Phase 4 — Visual completeness and final quality

## Build 247 — Non-Product Visual Coverage & Media Placement Closure

Use `SITE_WIDE_NON_PRODUCT_IMAGE_REQUIREMENTS.md` as the capture/illustration plan.

Scope:
- public page photography;
- non-Product service/process/workshop imagery;
- Admin diagrams and empty-state illustrations where photography would be misleading;
- Media & Content Studio remains the authority for non-Product public photography;
- generated/editorial art must remain clearly non-evidentiary;
- no Product gallery placeholders are included in this build.

## Build 248 — Refinement Outcomes Review & Roadmap Renewal

Measure:
- help coverage;
- operator clicks/route duplication removed;
- startup/subrequest/read-budget movement;
- mobile/accessibility regressions;
- session/security posture;
- CSP progress;
- unresolved non-Product visual placeholders;
- Production reliability.

Exit with either a new evidence-driven roadmap or `AUTONOMOUS_QUEUE_EXHAUSTED`.

---

## Shared safety boundaries

- Do not duplicate existing canonical authorities.
- No synthetic customer/project/manufacturing evidence.
- No automatic Product publication/unpublication.
- No automatic price rewrite or Inventory movement.
- No automatic Finance posting/period close.
- No provider/OAuth/payment publication without its existing explicit authority and evidence.
- Keep Canada/CAD storefront policy and the U.S. sales/shipping pause unchanged.
- Protect D1/R2 provider budgets and avoid unbounded scans.
- New security work must be staged to avoid locking legitimate users out.
