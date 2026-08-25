# Build 416 — Development Browser Gate

## Status

**SOURCE PREFLIGHT ADDED / LIVE DEVELOPMENT BROWSER PROOF REQUIRED / PRODUCTION CLOSED**

Build 416 hardens the read-only browser validation handoff after the successful Build 410 Development D1 parity application and the already-green Build 412 local release-candidate gate.

No Build 416 validation step authorizes a Production deployment or a Production data write.

## What changed

The Gift Cards admin page previously requested current scripts with the stale cache identities `admin.js?v=386` and `admin-gift-cards.js?v=386`.

Build 416 refreshes those identities to:

```text
/public/js/admin.js?v=397
/public/js/admin-gift-cards.js?v=407
```

This is a browser/CDN cache correction only. It does not move mutation ownership or alter Gift Card write behavior.

Orders already requests `admin.js?v=397` and `admin-order-contract-bridge.js?v=408`, so no Orders HTML change is required.

Customer Documents already requests `admin.js?v=397` and `admin-customer-documents-contract-bridge.js?v=415`.

## Local source preflight

Run on the `dev` branch:

```bash
python scripts/build416_development_browser_gate_preflight.py
```

Expected final output:

```text
CUSTOMER DOCUMENTS SOURCE GATE: PASS
GIFT CARDS SOURCE GATE: PASS
ORDERS / PAYMENT SOURCE GATE: PASS

BUILD 416 DEVELOPMENT BROWSER GATE PREFLIGHT: PASS
No Cloudflare resource was contacted.
LIVE DEVELOPMENT BROWSER PROOF: REQUIRED
PRODUCTION PROMOTION: CLOSED
```

The preflight is intentionally local-only. It checks the Development project/database pin, current browser cache identities, GET-only read contracts, passive read services, contract bridges, owned mutation routes, and the Build 409 payment-provider fail-closed gate.

## Live Development proof rules

Use the **Development site only** while signed in as an administrator.

Do not activate, void, refund, reissue, resend, save, lock, unlock, fulfill, change order status, or submit a payment/provider action during this gate.

Keep DevTools **Console** and **Network** open. A passing gate has no unexpected console exception and no failed 4xx/5xx read request.

### 1. Customer Documents

Open:

```text
/admin/customer-documents/
```

Paste this read-only console probe:

```js
(async () => {
  const runtime = window.DDCommerceOperations?.getStatus?.() || null;
  const bridge = window.DDCustomerDocumentsContractBridge || null;
  const response = await window.DDAuth.apiFetch('/api/admin/contracts/operations-customer-documents-read');
  const data = await response.json();
  return {
    http: response.status,
    readBuild: data.build,
    contract: data.contract,
    owner: data.owner,
    schemaReady: data.schema_ready,
    missingTables: data.missing_tables || [],
    missingColumns: data.missing_columns || [],
    requestTimeSchemaMutation: data.request_time_schema_mutation,
    runtimeState: runtime?.state,
    runtimeBuild: runtime?.build,
    requiredServices: runtime?.requiredServices,
    activeRequiredServices: runtime?.activeRequiredServices,
    runtimeMutationOwner: runtime?.ownsCustomerDocumentsMutations,
    bridgeBuild: bridge?.build,
    bridgeReadBuild: bridge?.readContractBuild,
    bridgeWriteBuild: bridge?.writeContractBuild,
  };
})()
```

Expected core proof:

```text
http                       200
readBuild                  397
schemaReady                true
missingTables              []
missingColumns             []
requestTimeSchemaMutation  false
runtimeState               active
runtimeBuild               397
requiredServices           [operations-customer-documents-read]
runtimeMutationOwner       false
bridgeBuild                415
bridgeReadBuild            397
bridgeWriteBuild           414
```

### 2. Gift Cards

Open:

```text
/admin/gift-cards/
```

Do not click any Gift Card action button. Paste this GET-only probe:

```js
(async () => {
  const runtime = window.DDCommerceOperations?.getStatus?.() || null;
  const response = await window.DDAuth.apiFetch('/api/admin/contracts/operations-gift-cards-read');
  const data = await response.json();
  return {
    http: response.status,
    startupReadBuild: data.build,
    mutationAuthorityBuild: data.mutation_authority_build,
    schemaReady: data.schema_ready,
    missingTables: data.missing_tables || [],
    queryErrors: data.query_errors || [],
    requestTimeSchemaMutation: data.request_time_schema_mutation,
    requestTimeDefaultSeeding: data.request_time_default_seeding,
    ownedMutationRoutes: data.mutation_authorities,
    runtimeState: runtime?.state,
    runtimeBuild: runtime?.build,
    activeRequiredServices: runtime?.activeRequiredServices,
    runtimeMutationOwner: runtime?.ownsGiftCardsMutations,
    uiMutationBuild: document.documentElement.dataset.ddGiftCardMutationUiBuild,
  };
})()
```

Expected core proof:

```text
http                       200
startupReadBuild           385
mutationAuthorityBuild     407
schemaReady                true
missingTables              []
queryErrors                []
requestTimeSchemaMutation  false
requestTimeDefaultSeeding  false
runtimeState               active
runtimeBuild               397
activeRequiredServices     [operations-gift-cards-read]
runtimeMutationOwner       false
uiMutationBuild            407
```

`ownedMutationRoutes` must report the four Operations contracts introduced across Builds 404–407:

```text
operations-gift-card-action-write
operations-gift-card-template-write
operations-gift-card-provider-send-write
operations-gift-card-abuse-write
```

### 3. Orders / payment provider gate

Open:

```text
/admin/orders/
```

Do not submit a status, fulfillment, refund, dispute, or provider action. Paste this inspection-only probe:

```js
(() => {
  const runtime = window.DDCommerceOperations?.getStatus?.() || null;
  const bridge = window.DDOrderContractBridge || null;
  return {
    runtimeState: runtime?.state,
    runtimeBuild: runtime?.build,
    runtimeMutationOwner: runtime?.ownsOperationsMutations,
    bridgeBuild: bridge?.build,
    installed: bridge?.installed,
    statusContract: bridge?.statusContract,
    fulfillmentContract: bridge?.fulfillmentContract,
    paymentContract: bridge?.paymentContract,
    bridgeCreatesTransport: bridge?.createsNetworkTransport,
  };
})()
```

Expected core proof:

```text
runtimeState            active
runtimeBuild            397
runtimeMutationOwner    false
bridgeBuild             408
installed               true
bridgeCreatesTransport  false
```

The three routes must be:

```text
/api/admin/contracts/operations-order-status-write
/api/admin/contracts/operations-order-fulfillment-write
/api/admin/contracts/operations-payment-action-write
```

Build 409 remains fail-closed for external payment-provider mutation. Provider mutation requires both:

```text
PAYMENT_PROVIDER_MUTATIONS_ENABLED=1
provider_sync_confirmed=true
```

No provider write is required or permitted for this browser proof.

## Pass / stop rule

If all three pages load, the console probes match the expected boundaries, and their read requests have no unexpected 4xx/5xx response, record the Development browser gate as passed.

If any value differs, preserve the Console result plus the failed Network request/response and repair that exact boundary before proceeding.

Do **not** compensate for a browser failure by moving DDL/default seeding back into request handlers or by bypassing the owned mutation contracts.

## Production

Production remains frozen after Build 416. The next promotion decision still requires the remaining live read-only schema/data mapping evidence. Build 416 itself is not a Production promotion gate.
