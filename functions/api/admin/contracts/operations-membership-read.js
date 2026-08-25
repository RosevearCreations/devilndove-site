// Devil n Dove Build 362 contract / Build 365 implementation hardening — Operations-owned Membership startup read contract.
// Wraps the three retained admin GETs used by /admin/membership/ without moving
// assignment or policy-edit mutations. Build 365 ensures one thrown child read cannot
// collapse the aggregate endpoint into an opaque platform 500.

import { onRequestGet as usersGet } from '../users.js';
import { onRequestGet as accessTiersGet } from '../access-tiers.js';
import { onRequestGet as tierPoliciesGet } from '../tier-policies.js';

export const BUILD = 362;
export const IMPLEMENTATION_BUILD = 365;
export const CONTRACT_ID = 'operations-membership-read';
export const OWNER = 'operations';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

async function invoke(name, handler, context) {
  try {
    const response = await handler(context);
    const data = await response.json().catch(() => null);
    return Object.freeze({ name, response, data, error: null });
  } catch (error) {
    return Object.freeze({ name, response: null, data: null, error });
  }
}

export async function onRequestGet(context) {
  const [usersResult, tiersResult, policiesResult] = await Promise.all([
    invoke('users', usersGet, context),
    invoke('access-tiers', accessTiersGet, context),
    invoke('tier-policies', tierPoliciesGet, context),
  ]);

  for (const result of [usersResult, tiersResult, policiesResult]) {
    if (result.error) {
      return json({
        ok: false,
        build: BUILD,
        implementation_build: IMPLEMENTATION_BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        request_time_schema_mutation: false,
        mutation_ownership_moved: false,
        failed_read: result.name,
        error_code: 'membership_startup_read_threw',
        error: String(result.error?.message || result.error || `${result.name} read failed.`),
      }, 500);
    }

    if (!result.response?.ok || result.data?.ok === false) {
      return json({
        ok: false,
        build: BUILD,
        implementation_build: IMPLEMENTATION_BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        request_time_schema_mutation: false,
        mutation_ownership_moved: false,
        failed_read: result.name,
        child_error_code: result.data?.error_code || null,
        error: result.data?.error || `Membership startup read failed (${result.response?.status || 500}).`,
      }, result.response?.status || 500);
    }
  }

  const policy = policiesResult.data || {};
  return json({
    ok: true,
    build: BUILD,
    implementation_build: IMPLEMENTATION_BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    schema_ready: policy.schema_ready !== false,
    missing_tables: policy.missing_tables || [],
    tier_policy_read_build: policy.build || null,
    tier_policy_read_implementation_build: policy.implementation_build || null,
    tier_policy_source: policy.source || null,
    tier_policy_defaults_materialized: policy.defaults_materialized === true,
    users: usersResult.data?.users || [],
    access_tiers: tiersResult.data?.access_tiers || [],
    tier_policies: policy.items || [],
  });
}
