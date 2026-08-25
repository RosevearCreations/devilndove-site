# Build 364 — Operations Membership Activation

Build 364 adds `/admin/membership/` to explicit Commerce & Operations runtime coverage.

The page now loads `/public/js/admin.js?v=364` before the retained access-tier and tier-policy UI scripts. Core therefore classifies and activates the `operations` top-level runtime before the mature Membership UI performs its normal GETs.

Build 364 also fixes the page's existing Tier Policy mount mismatch:

```text
old: adminTierPolicyMount
new: tierPolicyAdminMount
```

That restores the intended policy panel. Because Build 362 removed GET-time table creation/seeding, the restored panel is safe to load without request-time schema mutation.

No access-tier assignment/removal or tier-policy POST authority moves. `membershipMutationOwnership=false` and the Commerce runtime creates no network transport.
