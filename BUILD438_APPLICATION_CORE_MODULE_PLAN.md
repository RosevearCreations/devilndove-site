# Build 438 — Application Core / Module Registry Plan

## Status

**PLANNED NEXT APPLICATION RELEASE / NO PRODUCTION MUTATION AUTHORIZED**

Build 438 is the next planned application-architecture release after the completed Build 437 Membership/release work. It does not reopen Membership and it does not authorize any Production schema mutation by itself.

## Why Build 438 exists

Devil n Dove already has several substantial application surfaces, but they are currently separated mainly by routes and authentication. The missing architectural layer is one central authority that defines which application modules exist, whether each module is active, which roles/users may load it, which routes belong to it, and whether any module-specific background activity is allowed to run.

The goal is **one application with separately loadable modules**, not several disconnected applications and not one monolithic Admin surface.

## Current functional application surfaces

The existing codebase already maps naturally into four modules.

### 1. `customer_commerce` — Customer Commerce

Existing capabilities include the public website, Shop, Cart/checkout, product discovery, custom requests, registration/login and customer-facing content.

Initial activation rule: public module, normally enabled globally.

### 2. `member_account` — Customer / Member Account

Existing capabilities include `/members/`, profile/account tools, orders/order detail, wishlist, reviews, downloads and Membership tier presentation.

Initial activation rule: requires authenticated user; access may later vary by account state or registration.

### 3. `operations` — Creative & Production Operations

Existing capabilities include Creative Process / Creative Project Workflow, CAIP / Creative Assets, Packaging Studio, Content Studio, production/material usage workflows, operational Inventory use and related review/evidence tools.

Initial activation rule: authenticated staff/operator roles only. When inactive, no Operations navigation, startup API reads, timers, polling, sync or provider work should run.

### 4. `business_admin` — Business Administration

Existing capabilities include Catalog administration, Inventory administration, Members, Orders/Payments, Accounting, Analytics, Operations/settings/security, Application Sanity, Release & Go-Live and other business-management surfaces.

Initial activation rule: authenticated business-admin roles only.

## Current modularity truth

The four functional surfaces exist, but the true module control layer does **not** yet exist. Current separation is primarily route/auth based.

A repository search at the Build 437 baseline found no central `module_registry`, `app_modules` or `enabled_modules` authority. Therefore Build 438 must add the control layer without rewriting the working subsystems.

## Required core data model

Preferred canonical model:

```text
app_modules
────────────────────────────────────────
module_key                TEXT PRIMARY KEY
name                      TEXT NOT NULL
description               TEXT NOT NULL DEFAULT ''
is_enabled                INTEGER NOT NULL DEFAULT 1
requires_login            INTEGER NOT NULL DEFAULT 0
default_route             TEXT NOT NULL DEFAULT '/'
load_priority             INTEGER NOT NULL DEFAULT 100
background_activity       INTEGER NOT NULL DEFAULT 0
created_at                TEXT NOT NULL
updated_at                TEXT NOT NULL
```

Per-role access should be explicit rather than encoded only in browser navigation:

```text
app_module_role_access
────────────────────────────────────────
module_key
role_code
is_allowed
access_level
```

Optional per-user overrides may be added only if a real use case requires them:

```text
app_module_user_access
────────────────────────────────────────
user_id
module_key
is_allowed
access_level
```

Do not add per-user overrides merely because the schema can support them.

## Required runtime contract

A module that is disabled or unavailable to the current user must be **inactive**, not merely hidden.

For an inactive module:

1. Do not show module navigation/cards.
2. Direct browser routes fail closed with an appropriate access/unavailable response.
3. Module JavaScript bundles should not initialize when avoidable.
4. Module startup/bootstrap API calls do not run.
5. Module timers/polling do not run.
6. Module autosave/synchronization does not run.
7. Module provider/R2 work does not run.
8. Module-specific diagnostics do not continuously poll.
9. Shared core services may remain available only when another enabled module genuinely needs them.

This is both an architecture requirement and a Cloudflare resource-efficiency requirement.

## Required shared core

The following stay in the shared application core and are not individually switchable business modules:

- authentication/session handling;
- authorization helpers;
- D1 access wrappers and schema/read helpers;
- common error/fallback handling;
- shared navigation shell and responsive design primitives;
- core security/CSP behavior;
- bounded analytics where applicable;
- shared release/build metadata;
- module-registry read service and route guard.

## Build 438 implementation sequence

1. Add the canonical module registry authority and default four module records.
2. Add role-to-module access authority using existing role semantics rather than inventing a second unrelated role system.
3. Add one shared server-side module-access service.
4. Add a read-only client bootstrap endpoint returning only the current user's available module summary.
5. Add server-side route/API guards for module-owned endpoints where needed.
6. Add a client module loader/guard that does not initialize inactive surfaces.
7. Map existing routes to the four module keys.
8. Update Admin Dashboard navigation/cards to render by module availability.
9. Update member/customer navigation similarly where appropriate.
10. Gate module timers, polling, autosave, sync and expensive startup work.
11. Add an Admin **Application Modules** screen showing module state, roles and dependencies.
12. Changes to module activation must be audited.
13. Disabling a module must never delete its business data.
14. Re-enabling a module must restore access without data reconstruction.
15. Add mobile/desktop regression checks for module-aware navigation.
16. Add API tests proving hidden navigation is not the security boundary.
17. Add tests proving direct access to a disabled module fails closed.
18. Add tests proving inactive modules generate no startup/background requests.
19. Update `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md` with implementation evidence when complete.
20. Only then consider Build 438 complete.

## Initial role direction

Do not hard-code this as irreversible policy, but use it as the first mapping unless existing role evidence requires a narrower rule:

```text
customer/member roles     -> customer_commerce + member_account
operator/creator roles    -> operations
admin/business roles      -> business_admin + operations
```

An administrator may have access to all enabled modules, but global module disablement should still win unless a deliberate break-glass mechanism is later designed.

## Build 438 non-goals

Build 438 should not rewrite Creative Process, CAIP, Packaging Studio, Content Studio, Catalog, Accounting or Member functionality.

It should not automatically begin the remaining schema-parity families.

It should not authorize:

```text
Fractional Inventory / Creative Project Production rebuilds
Product / foreign-key rebuilds
Accounting default/nullability rebuilds
R2/provider mutation
CAIP D1-only media copy
Broad Production promotion
```

## Functional roadmap after the module core

Once Build 438 is complete, high-value functionality continues inside the appropriate module:

1. CAIP video review with exact timecode/range evidence.
2. Verified bounded proxy/frame/audio/transcript provider integration.
3. Reviewed Creative Process -> CAIP -> Content Studio story/package handoff.
4. Packaging physical print/wrap proof, bilingual overflow strategy and source/INCI/allergen review.
5. Product/Inventory reversal, lot-aware costing, reference inspection and review queues.
6. Media & Content Studio P1/P2 real-image replacement and public-page polish.
7. Reviewed social scheduling/publishing and downstream analytics.
8. Dedicated mobile operator/admin workflows including quick expense/write-off/product/receiving actions.
9. Final go-live reliability evidence and controlled broad promotion when the remaining release gates are genuinely green.

## Release safety

Build 437 is the current completed release baseline. Membership Build 395 is complete/proven and its Production authorization token is spent.

Production mutation remains explicit and scope-specific. A normal feature-development request does not authorize Production DDL/DML. Broad Production promotion remains closed until separately approved.
