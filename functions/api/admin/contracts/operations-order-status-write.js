// Devil n Dove Build 389 Operations-owned order-status mutation authority.
// Delegates to the mature compatibility implementation without changing provider/payment behavior.

import { onRequestPost as legacyPost } from '../update-order-status.js';

export const BUILD = 389;
export const CONTRACT_ID = 'operations-order-status-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/update-order-status';
export const MUTATION_OWNERSHIP = 'operations-order-status';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  mutationOwnership: MUTATION_OWNERSHIP,
  implementationRoute: IMPLEMENTATION_ROUTE,
  reviewedStatusValues: Object.freeze(['draft', 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded']),
  providerBehaviorChanged: false,
  requestTimeSchemaRepairRemoved: false,
});

export async function onRequestPost(context) {
  return legacyPost(context);
}
