// Devil n Dove Build 310 Inventory write-side authority boundary.
// Inventory owns dedicated post and reverse contract routes, and Creative now consumes both.

export const BUILD = 310;
export const OWNER = 'inventory';
export const POST_CONTRACT_ROUTE = '/api/admin/contracts/inventory-post';
export const REVERSE_CONTRACT_ROUTE = '/api/admin/contracts/inventory-reverse';
export const REVERSE_CONFIRMATION = 'REVERSE INVENTORY';

export const INVENTORY_WRITE_BOUNDARY = Object.freeze({
  build: BUILD,
  owner: OWNER,
  post: Object.freeze({
    contractId: 'inventory-post',
    authorityRoute: POST_CONTRACT_ROUTE,
    authorityAction: 'reviewed-creative-usage',
    implementationState: 'implemented-creative-consumer-enabled',
    requiresPositiveQuantity: true,
    requiresInventoryItemId: true,
    requiresApprovedMaterialReview: true,
    createsMovementRecord: true,
    createsUsageMovementRecord: true,
    atomicReviewPosting: true,
    consumerWritesReady: true,
  }),
  reverse: Object.freeze({
    contractId: 'inventory-reverse',
    authorityRoute: REVERSE_CONTRACT_ROUTE,
    authorityAction: 'compensating-reversal',
    implementationState: 'implemented-creative-consumer-enabled',
    requiresOriginalMovementId: true,
    requiresCreativePostingId: true,
    requiresTypedConfirmation: true,
    confirmationText: REVERSE_CONFIRMATION,
    usesExistingCreativeReversalLedger: true,
    compensatingMovementOnly: true,
    directStockAddBackAllowed: false,
    consumerWritesReady: true,
  }),
  cost: Object.freeze({
    contractId: 'inventory-cost',
    implementationState: 'declared-separate-read-authority-required',
  }),
  createsNetworkTransport: false,
  mutatesInventory: false,
  consumerMutationReady: true,
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
