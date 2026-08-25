# Build 365 — Membership Read Resilience

Build 365 corrects the browser-discovered failure in the Build 362 Membership read implementation without changing the Build 363/364 Commerce & Operations loader boundary.

## Browser evidence that triggered the patch

On `/admin/membership/`, the Commerce runtime activated correctly, but both:

```text
GET /api/admin/tier-policies
GET /api/admin/contracts/operations-membership-read
```

returned HTTP 500 before Build 362 metadata could be parsed.

Because Build 362 already returned an explicit non-mutating fallback for a genuinely absent table, this failure indicated a thrown read assumption rather than the intended missing-schema path.

## Correction

The Tier Policy read authority now:

- preserves public contract Build `362`;
- exposes implementation Build `365`;
- reads only `membership_tier_policies`;
- uses `SELECT *` during the compatibility window so optional/legacy columns cannot cause the readiness probe itself to fail;
- maps known legacy aliases defensively;
- returns in-memory defaults plus `schema_ready=false` only for a genuine missing-table condition;
- performs no CREATE/ALTER/INSERT/UPDATE/DELETE during GET;
- returns structured JSON if an unexpected read error remains.

The aggregate `operations-membership-read` contract also catches thrown child reads and reports the failed child instead of allowing a generic Pages Functions 500.

## Authority unchanged

Build 365 does not move Membership mutation authority. Existing tier assignment/removal and Tier Policy POST compatibility remain where they were. Build 363/364 runtime identities and page coverage remain unchanged.
