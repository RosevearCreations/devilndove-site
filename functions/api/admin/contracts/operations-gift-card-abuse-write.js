// Devil n Dove Build 407 Operations-owned Gift Card abuse lock/unlock authority.

import { onRequestPost as implementationPost } from '../gift-card-abuse.js';

export const BUILD = 407;
export const CONTRACT_ID = 'operations-gift-card-abuse-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/gift-card-abuse';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['lock', 'unlock']),
  unlockIdentity: 'gift_card_lookup_lockout_id',
  implementationRoute: IMPLEMENTATION_ROUTE,
  migrationAuthority: 'database_gift_card_runtime_parity.sql',
  requestTimeSchemaMutation: false,
  consumerMoved: false,
});

export async function onRequestPost(context) {
  return implementationPost(context);
}
