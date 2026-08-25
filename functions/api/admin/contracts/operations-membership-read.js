// Devil n Dove Build 362 — Operations-owned Membership startup read contract.
// Wraps the three retained admin GETs used by /admin/membership/ without moving
// assignment or policy-edit mutations.

import { onRequestGet as usersGet } from '../users.js';
import { onRequestGet as accessTiersGet } from '../access-tiers.js';
import { onRequestGet as tierPoliciesGet } from '../tier-policies.js';

export const BUILD = 362;
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

async function parsed(response) {
  return {
    response,
    data: await response.json().catch(() => null),
  };
}

export async function onRequestGet(context) {
  const [usersResult, tiersResult, policiesResult] = await Promise.all([
    usersGet(context).then(parsed),
    accessTiersGet(context).then(parsed),
    tierPoliciesGet(context).then(parsed),
  ]);

  for (const result of [usersResult, tiersResult, policiesResult]) {
    if (!result.response.ok || result.data?.ok === false) {
      return json({
        ok: false,
        build: BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        request_time_schema_mutation: false,
        mutation_ownership_moved: false,
        error: result.data?.error || `Membership startup read failed (${result.response.status}).`,
      }, result.response.status || 500);
    }
  }

  const policy = policiesResult.data || {};
  return json({
    ok: true,
    build: BUILD,
    contract: CONTRACT_ID,
    owner: OWNER,
    request_time_schema_mutation: false,
    mutation_ownership_moved: false,
    schema_ready: policy.schema_ready !== false,
    missing_tables: policy.missing_tables || [],
    tier_policy_source: policy.source || null,
    tier_policy_defaults_materialized: policy.defaults_materialized === true,
    users: usersResult.data?.users || [],
    access_tiers: tiersResult.data?.access_tiers || [],
    tier_policies: policy.items || [],
  });
}
