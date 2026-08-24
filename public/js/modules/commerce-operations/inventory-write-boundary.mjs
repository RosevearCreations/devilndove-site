// Devil n Dove Build 307 Inventory write-side authority boundary.
// Build 307 adds an Inventory-owned compensating reversal contract route while keeping
// consumer migration disabled. The umbrella runtime still performs no mutation itself.

export const BUILD = 307;
export const OWNER = 'inventory';
export const LEGACY_AUTHORITY_ROUTE = '/api/admin/site-item-inventory';
export const POST_ACTION = 'consume_usage';
export const REVERSE_CONTRACT_ROUTE = '/api/admin/contracts/inventory-reverse';
export const REVERSE_CONFIRMATION = 'REVERSE INVENTORY';

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
    authorityRoute: REVERSE_CONTRACT_ROUTE,
    authorityAction: 'compensating-reversal',
    implementationState: 'implemented-not-consumer-enabled',
    requiresOriginalMovementId: true,
    requiresCreativePostingId: true,
    requiresTypedConfirmation: true,
    confirmationText: REVERSE_CONFIRMATION,
    usesExistingCreativeReversalLedger: true,
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
