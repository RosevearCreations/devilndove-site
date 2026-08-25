// Devil n Dove Build 389 Operations-owned order-status mutation authority.
// Build 408 implementation removes the paid-order Gift Card request-time schema fallback.

import { onRequestPost as implementationPost } from '../update-order-status.js';

export const BUILD = 389;
export const IMPLEMENTATION_BUILD = 408;
export const CONTRACT_ID = 'operations-order-status-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/update-order-status';
export const MUTATION_OWNERSHIP = 'operations-order-status';

export const metadata = Object.freeze({
  build: BUILD,
  implementationBuild: IMPLEMENTATION_BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  mutationOwnership: MUTATION_OWNERSHIP,
  implementationRoute: IMPLEMENTATION_ROUTE,
  reviewedStatusValues: Object.freeze(['draft', 'pending', 'paid', 'fulfilled', 'cancelled', 'refunded']),
  providerBehaviorChanged: false,
  requestTimeSchemaRepairRemoved: true,
  giftCardMigrationAuthority: 'database_gift_card_runtime_parity.sql',
  consumerMutationReady: true,
});

export async function onRequestPost(context) {
  return implementationPost(context);
}
