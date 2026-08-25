// Devil n Dove Build 395 Operations-owned Membership tier-policy mutation authority.
// Delegates to the mature policy implementation after schema ownership moved to migration authority.

import { onRequestPost as legacyPost } from '../tier-policies.js';

export const BUILD = 395;
export const CONTRACT_ID = 'operations-membership-policy-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/tier-policies';
export const MIGRATION_AUTHORITY = 'database_membership_tier_policy_runtime_parity.sql';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  implementationRoute: IMPLEMENTATION_ROUTE,
  migrationAuthority: MIGRATION_AUTHORITY,
  consumerMoved: true,
  requestTimeSchemaMutation: false,
  requestTimeDefaultSeeding: false,
  readContractPreserved: true,
  readContractBuild: 362,
});

export async function onRequestPost(context) {
  return legacyPost(context);
}
