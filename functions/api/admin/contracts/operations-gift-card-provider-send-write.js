// Devil n Dove Build 406 Operations-owned Gift Card provider/send authority.

import { onRequestPost as implementationPost } from '../gift-card-delivery-send.js';

export const BUILD = 406;
export const CONTRACT_ID = 'operations-gift-card-provider-send-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/gift-card-delivery-send';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['queue_outbox', 'send_provider', 'mark_sent', 'mark_failed']),
  implementationRoute: IMPLEMENTATION_ROUTE,
  giftCardMigrationAuthority: 'database_gift_card_runtime_parity.sql',
  notificationMigrationAuthority: 'database_notification_runtime_parity.sql',
  requestTimeSchemaMutation: false,
  providerBehaviorChanged: false,
  consumerMoved: false,
});

export async function onRequestPost(context) {
  return implementationPost(context);
}
