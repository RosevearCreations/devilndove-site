// Devil n Dove Build 405 Operations-owned Gift Card template/resend mutation authority.

import { onRequestPost as implementationPost } from '../gift-card-delivery-templates.js';

export const BUILD = 405;
export const CONTRACT_ID = 'operations-gift-card-template-write';
export const OWNER = 'operations';
export const IMPLEMENTATION_ROUTE = '/api/admin/gift-card-delivery-templates';

export const metadata = Object.freeze({
  build: BUILD,
  contract: CONTRACT_ID,
  owner: OWNER,
  actions: Object.freeze(['save_template', 'resend']),
  implementationRoute: IMPLEMENTATION_ROUTE,
  migrationAuthority: 'database_gift_card_runtime_parity.sql',
  requestTimeSchemaMutation: false,
  requestTimeDefaultSeeding: false,
  consumerMoved: false,
});

export async function onRequestPost(context) {
  return implementationPost(context);
}
