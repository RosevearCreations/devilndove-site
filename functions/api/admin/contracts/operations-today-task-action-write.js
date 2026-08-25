// Devil n Dove Build 392 Operations-owned Today Tasks action authority.
// Delegates to the mature completed/ignored/snoozed implementation.

import { onRequestPost as legacyPost } from '../today-task-actions.js';

export const BUILD = 392;
export const CONTRACT_ID = 'operations-today-task-action-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/today-task-actions';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  implementationRoute: IMPLEMENTATION_ROUTE,
  allowedActions: Object.freeze(['completed', 'ignored', 'snoozed']),
  consumerMoved: false,
  requestTimeSchemaRepairRemoved: false,
  schemaOwnershipFollowupBuild: 393,
});

export async function onRequestPost(context) {
  return legacyPost(context);
}
