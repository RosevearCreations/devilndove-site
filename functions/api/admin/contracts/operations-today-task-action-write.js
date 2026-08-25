// Devil n Dove Build 392 Operations-owned Today Tasks action authority.
// Build 393 moves action schema creation/repair to migration authority while retaining the mature write implementation.

import { onRequestPost as legacyPost } from '../today-task-actions.js';

export const BUILD = 392;
export const IMPLEMENTATION_BUILD = 393;
export const CONTRACT_ID = 'operations-today-task-action-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/today-task-actions';
export const MIGRATION_AUTHORITY = 'database_today_task_actions_runtime_parity.sql';

export const metadata = Object.freeze({
  build: BUILD,
  implementationBuild: IMPLEMENTATION_BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  implementationRoute: IMPLEMENTATION_ROUTE,
  migrationAuthority: MIGRATION_AUTHORITY,
  allowedActions: Object.freeze(['completed', 'ignored', 'snoozed']),
  consumerMoved: false,
  requestTimeSchemaRepairRemoved: true,
  requestTimeSchemaMutation: false,
  schemaOwnershipBuild: 393,
});

export async function onRequestPost(context) {
  return legacyPost(context);
}
