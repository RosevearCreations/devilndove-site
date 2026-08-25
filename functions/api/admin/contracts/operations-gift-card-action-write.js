// Devil n Dove Build 404 Operations-owned Gift Card card-state mutation authority.

import { onRequestPost as implementationPost } from '../gift-card-actions.js';

export const BUILD = 404;
export const CONTRACT_ID = 'operations-gift-card-action-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/gift-card-actions';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['activate_paid', 'void', 'refund', 'reissue']),
  implementationRoute: IMPLEMENTATION_ROUTE,
  migrationAuthority: 'database_gift_card_runtime_parity.sql',
  notificationMigrationAuthority: 'database_notification_runtime_parity.sql',
  requestTimeSchemaMutation: false,
  consumerMoved: false,
  providerBehaviorChanged: false,
});

export async function onRequestPost(context) {
  return implementationPost(context);
}
