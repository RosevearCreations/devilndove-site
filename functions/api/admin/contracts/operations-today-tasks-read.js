// Devil n Dove Build 366 contract / Build 369 implementation hardening — Operations-owned Today Tasks GET-only contract.
// Wraps the retained Today Tasks GET without moving Done/Ignore/Snooze mutation authority.

import { onRequestGet as legacyGet } from '../today-tasks.js';

export const BUILD = 366;
export const IMPLEMENTATION_BUILD = 369;
export const CONTRACT_ID = 'operations-today-tasks-read';
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

export async function onRequestGet(context) {
  try {
    const response = await legacyGet(context);
    const data = await response.json().catch(() => null);

    if (!response.ok || data?.ok === false) {
      return json({
        ok: false,
        build: BUILD,
        implementation_build: IMPLEMENTATION_BUILD,
        contract: CONTRACT_ID,
        owner: OWNER,
        request_time_schema_mutation: false,
        mutation_ownership_moved: false,
        error_code: data?.error_code || 'today_tasks_child_read_failed',
        error: data?.error || `Today Tasks read failed (${response.status}).`,
      }, response.status || 500);
    }

    return json({
      ...data,
      ok: true,
      build: BUILD,
      implementation_build: Number(data?.implementation_build || IMPLEMENTATION_BUILD),
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      action_authority: '/api/admin/today-task-actions',
      action_mutation_ownership_moved: false,
    });
  } catch (error) {
    return json({
      ok: false,
      build: BUILD,
      implementation_build: IMPLEMENTATION_BUILD,
      contract: CONTRACT_ID,
      owner: OWNER,
      request_time_schema_mutation: false,
      mutation_ownership_moved: false,
      error_code: 'today_tasks_contract_threw',
      error: String(error?.message || error || 'Today Tasks contract failed.'),
    }, 500);
  }
}
