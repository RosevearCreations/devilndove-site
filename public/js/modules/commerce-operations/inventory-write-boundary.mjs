// Devil n Dove Build 306 Inventory write-side authority boundary.
// This module is declarative only. It creates no network transport and performs no stock mutation.
// Build 306 records the existing post authority and blocks contract-level reversal until a true
// compensating movement can reference the original Inventory movement.

export const BUILD = 306;
export const OWNER = 'inventory';
export const LEGACY_AUTHORITY_ROUTE = '/api/admin/site-item-inventory';
export const POST_ACTION = 'consume_usage';

export const INVENTORY_WRITE_BOUNDARY = Object.freeze({
  build: BUILD,
  owner: OWNER,
  post: Object.freeze({
    contractId: 'inventory-post',
    authorityRoute: LEGACY_AUTHORITY_ROUTE,
    authorityAction: POST_ACTION,
    implementationState: 'existing-authority-not-yet-contract-route',
    requiresPositiveQuantity: true,
    requiresInventoryItemId: true,
    createsMovementRecord: true,
    consumerWritesReady: false,
  }),
  reverse: Object.freeze({
    contractId: 'inventory-reverse',
    authorityRoute: null,
    authorityAction: null,
    implementationState: 'blocked-pending-compensating-movement-service',
    requiresOriginalMovementId: true,
    compensatingMovementOnly: true,
    directStockAddBackAllowed: false,
    consumerWritesReady: false,
  }),
  cost: Object.freeze({
    contractId: 'inventory-cost',
    implementationState: 'declared-separate-read-authority-required',
  }),
  createsNetworkTransport: false,
  mutatesInventory: false,
  consumerMutationReady: false,
});

export function getInventoryWriteBoundaryStatus() {
  return INVENTORY_WRITE_BOUNDARY;
}

if (typeof window !== 'undefined') {
  window.DDInventoryWriteBoundary = Object.freeze({
    build: BUILD,
    getStatus: getInventoryWriteBoundaryStatus,
  });
}
