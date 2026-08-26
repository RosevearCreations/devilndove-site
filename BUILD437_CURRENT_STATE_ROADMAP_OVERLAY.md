# Build 437 — Current State Roadmap Overlay

## Membership work is closed

Membership Build 395 is **COMPLETE / PROVEN** in Production. Do not schedule further Membership parity/rebuild micro-gates unless a future Membership source change explicitly invalidates the Build 437 proof.

## Current completed release chain

```text
Build 427 Product numbers                  COMPLETE / PROVEN
Build 430 Gift Card                        COMPLETE / PROVEN
Build 432 Notification Build 403           COMPLETE / PROVEN
Build 433 annotation index                 COMPLETE / PROVEN
Build 437 Membership Build 395             COMPLETE / PROVEN
```

## Canonical current documentation

Current cross-project authority is now:

1. `AI_HANDOFF.md` — Build 438 source / Build 437 Production baseline architecture and safety.
2. `PROJECT_STATUS_AND_ROADMAP.md` — Build 438 source/development status and prioritized open functionality.
3. `BUILD438_APPLICATION_CORE_MODULE_PLAN.md` — current specialist Application Core / Module Activation authority.
4. `BUILD438_VALIDATION.md` — Development-first owner-run validation/rollout authority.

This Build 437 overlay is retained release evidence only and does not override those newer canonical files.

## Current module direction

Repository inspection during Build 438 confirmed that Builds 281–397 already established:

```text
Devil n Dove Application Core
    |
    +-- commerce-operations
    +-- creative-production
    +-- business-administration
```

Customer storefront/member account are Commerce & Operations surfaces; they are not a fourth top-level runtime module.

Build 438 is adding the missing persistent/server-authoritative enable/disable, role-access, route/API guard, runtime-suppression and background-permission layer around those existing three modules.

After Build 438 Development proof, continue the prioritized functionality in `PROJECT_STATUS_AND_ROADMAP.md`, especially CAIP timecode evidence, Creative Process/Content Studio handoff, Packaging physical proof, Media Studio visual completion, Product/Inventory operational workflows, mobile tooling and go-live acceptance.

## Remaining schema/parity families

These remain known future technical debt but are not implicitly next and are not authorized:

```text
Fractional Inventory / Creative Project numeric rebuilds
Product / foreign-key rebuilds
Accounting default / nullability rebuilds
Other remaining structural drift
```

When one is chosen, begin with fresh read-only scope and issue a new family-specific authorization only if Production mutation is genuinely required.

## Release safety state

```text
Membership authorization token             SPENT / COMPLETE
Build 438 Development module migration      PENDING OWNER RUN
Build 438 Production module migration       NOT AUTHORIZED
R2/provider mutation                        DISABLED unless explicitly scoped
CAIP D1-only copy                           FORBIDDEN
Broad Production promotion                  CLOSED
Main/Production broad promotion             FROZEN pending broader release acceptance
```

## Build 437 release evidence to retain

```text
Membership backup:
local_backups\build428_prod_before_membership_20260826T025115Z.sql
SHA-256: 2f94f5bcd0006f98c4cdfcc2bc6de9441d047a4f97ccc702c735191a90cf5513

D1 final bookmark:
00000d48-00000006-000050d3-dc23940f2dba8f8defefe8c58f115840

Release metadata:
RELEASE_NOTES.md -> Build 437
data/site/release-package-manifest.json -> Build 437
source_scope: git_tracked_release_files
file_count: 1872
total_size_bytes: 66279989
```

## Next-session instruction

Start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. For Build 438 implementation/validation, read `BUILD438_APPLICATION_CORE_MODULE_PLAN.md` and `BUILD438_VALIDATION.md`. Do not infer that older Build 434–436 Membership instructions or this historical overlay represent pending Membership work.
