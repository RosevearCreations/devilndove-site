# Devil n Dove I.T. & Platform Module

Status: **APPROVED REQUIREMENT / ARCHITECTURE READY / RUNTIME IMPLEMENTATION GATED UNTIL BUILD 440 CLOSES**

Updated: 2026-08-27

## Purpose

The I.T. & Platform module keeps web hosting, deployment, database, storage,
diagnostics, recovery and behind-the-scenes maintenance away from ordinary
creator workflows. Creators should be able to make products, document projects,
prepare labels and publish reviewed content without navigating technical
controls or understanding Cloudflare terminology.

The target top-level module key is:

```text
it-platform
```

This becomes the fourth top-level application module beside Commerce &
Operations, Creative & Production, and Business & Administration. It remains in
the same repository, Cloudflare Pages application, D1 database and R2 binding
architecture.

## Boundary

### I.T. & Platform owns

- release identity, deployment evidence and rollback readiness;
- Cloudflare Pages, Functions, D1 and R2 environment diagnostics;
- schema migration, ledger, aggregate-schema and drift review;
- runtime incidents, API health, route usage and structured failure review;
- bindings/secrets presence checks that never reveal secret values;
- cache/service-worker version health and recovery controls;
- backup/restore plans and isolated restore evidence;
- provider connectivity health, retry/replay infrastructure and dead-letter review;
- maintenance mode, bounded repair utilities and recovery runbooks;
- automated technical sanity checks and plain-language maintenance summaries;
- technical audit history.

### I.T. & Platform does not own

- Product, Inventory, Tool or Order business rules;
- Creative Project, CAIP editorial evidence or Content decisions;
- Packaging formulas, claims, ingredients or print approval;
- Accounting treatment, reconciliation or close approval;
- marketing copy, SEO content decisions or social post approval;
- users, ordinary business roles or creator profiles.

Those authorities remain in their owning modules. I.T. may report that an
authority is unhealthy, but it must not silently rewrite the business fact.

## Creator-safe experience

1. Ordinary creator navigation does not show I.T. routes or technical wording.
2. Business & Administration may show one plain-language system status:
   **Healthy**, **Needs I.T. review**, or **Maintenance active**.
3. Technical details, raw diagnostics and repair actions remain inside
   `it-platform`.
4. A creator-facing error explains what is safe to do next and preserves work;
   it does not expose stack traces, SQL, tokens, binding names or provider
   payloads.
5. No technical background task starts merely because a creator opens Admin.

## Access authority

The current application has `member` and `admin` role rows. Role alone is
not enough to meet the creator-isolation requirement because a creator may also
need ordinary administrator capabilities.

The implementation should therefore add an explicit user-level module grant:

```text
app_module_user_access
----------------------
module_key
user_id
is_allowed
access_level          read | manage
granted_by_user_id
granted_at
updated_at
PRIMARY KEY (module_key, user_id)
```

For `it-platform`:

- no explicit grant means denied, including for an ordinary `admin`;
- `read` permits technical health/evidence reads but no repair or configuration mutation;
- `manage` permits only the separately authorized bounded actions exposed by I.T.;
- Application Core keeps the recovery route needed to grant/revoke access;
- every grant and I.T. mutation is audited;
- hidden navigation is presentation only—middleware and APIs enforce the grant.

No Production credential, secret value or unrestricted Cloudflare token is
stored in this table.

## Route transfer map

The first implementation pass should classify and move ownership—not mass-rename
URLs—of these existing route families:

| I.T. area | Existing representative routes |
| --- | --- |
| Release and deployment | `/admin/deployment-preflight*`, `/admin/release-control*`, `/admin/deploy-readiness*`, `/admin/promotion-control*` |
| Runtime health | `/admin/application-sanity*`, `/admin/runtime-incidents*`, `/admin/public-api-health*`, `/admin/route-usage*` |
| Data/schema health | `/admin/schema-drift*`, `/admin/markdown-sanity*` |
| Recovery and continuity | `/admin/operational-continuity*`, backup/restore evidence and bounded Development repair routes |
| Controlled opening | `/admin/go-live-execution*`, `/admin/live-ops-followthrough*` |
| Module recovery | `/admin/application-modules*` remains Application Core owned, not I.T.-owned |

User/role/profile/security administration remains Business & Administration
unless a route is strictly infrastructure-security diagnostics.

## Service contracts

I.T. reads other modules through narrow health/evidence contracts. It may not
import or mutate their private implementations.

Initial reviewed contracts should be read-only:

```text
release-health
schema-health
runtime-health
storage-health
provider-health
module-health
```

Any repair contract must be a separate named mutation with:

- Development/Production environment refusal rules;
- explicit scope and authorization;
- bounded work;
- idempotency or compensating reversal;
- preview/evidence before execution;
- audit record;
- post-action verification;
- no secret values in responses.

## Background activity

Background activity is off by default. A future technical scheduler may run only
when all are true:

1. `it-platform` is enabled;
2. background permission is enabled;
3. the specific job is enabled;
4. the job has a bounded cadence and work limit;
5. the owning environment is positively identified;
6. retries are capped and do not amplify Worker failures;
7. failures enter a visible review/dead-letter state.

Creator inactivity or “no current job” should suppress business-work polling.
Technical monitoring must use scheduled/event-driven checks rather than keeping
creator pages alive.

## Plain-language I.T. dashboard

The first bounded dashboard should answer:

- Is the deployed commit the expected Development commit?
- Are required D1/R2 bindings present?
- Is the current schema/migration ledger ready?
- Are APIs returning structured responses?
- Are any recent runtime incidents unresolved?
- Are backups/restore evidence current?
- Is cache/service-worker identity aligned?
- Are provider integrations disabled, healthy or awaiting review?
- Is any repair action safe and authorized in this environment?

It should show **what happened**, **what is affected**, **what is safe now**, and
**the next reviewed action**. Raw technical detail belongs in a collapsible
evidence panel.

## Implementation sequence

1. Close Build 440 authenticated live acceptance and the current sanity gate.
2. Start the next Development release deliberately; do not relabel Build 440.
3. Add `it-platform` to the module registry, route maps and four-module health
   contract.
4. Add the explicit user-level I.T. grant authority and audited grant UI in
   Application Core.
5. Move platform/runtime route ownership from Business & Administration to
   I.T. without changing their URLs.
6. Add the plain-language I.T. landing page and read-only health aggregation.
7. Prove creators cannot see or directly access I.T. pages/APIs.
8. Prove an explicitly granted I.T. user can read health without starting
   polling or changing business data.
9. Add repair actions one bounded workstream at a time only after read-only
   health is proven.
10. Run the full source, Windows D1, deployment and authenticated live gates on
    the exact resulting Development commit.

## Acceptance

The I.T. module is not complete until:

- Application Core reports exactly four expected top-level modules;
- creator/member and ungranted admin sessions cannot access I.T. pages/APIs;
- an explicitly granted I.T. reader cannot mutate;
- an explicitly granted I.T. manager can perform only named authorized actions;
- ordinary creator pages load no I.T. runtime and start no I.T. polling;
- Business & Administration shows only the plain-language health summary;
- all transferred routes resolve to `it-platform`;
- existing business-module contracts and data remain unchanged;
- source, D1, responsive, failure/fallback and authenticated live acceptance pass;
- the separate live `main` / `devilndove-site` Production site remains untouched.
