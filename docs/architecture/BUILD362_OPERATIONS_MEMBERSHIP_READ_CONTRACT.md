# Build 362 — Operations Membership Read Boundary

`/admin/membership/` loads the admin user directory, active access tiers, and member-facing tier policies.

Before Build 362, `GET /api/admin/tier-policies` called `ensureTierPolicyTable()` and `seedDefaultPolicies()`, so a read could create `membership_tier_policies` and insert Bronze/Silver/Gold rows.

Build 362 introduces `functions/api/_lib/membershipTierPolicyReadService.js` and `GET /api/admin/contracts/operations-membership-read`.

The Tier Policy GET now:

- checks `sqlite_master` for `membership_tier_policies`;
- performs SELECT-only reads when the table exists;
- returns in-memory Bronze/Silver/Gold defaults when the table is missing or empty;
- reports `schema_ready`, `missing_tables`, `source`, and `request_time_schema_mutation=false`;
- never creates or seeds schema during GET.

The retained Tier Policy POST still owns the legacy ensure/seed/update behavior until write/schema authority is separately extracted. Access-tier assignment/removal endpoints are unchanged.

`operations-membership-read` aggregates the existing `/api/admin/users`, `/api/admin/access-tiers`, and `/api/admin/tier-policies` GETs. It is GET-only, Operations-owned, and reports `mutation_ownership_moved=false`.
