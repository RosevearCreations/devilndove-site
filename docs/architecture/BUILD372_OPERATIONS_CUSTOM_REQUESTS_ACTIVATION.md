# Build 372 — Operations Custom Requests Activation

Build 372 adds a real dedicated admin workspace:

```text
/admin/custom-request/
```

The route was already classified under the `operations` domain. Build 372 supplies explicit Commerce & Operations lifecycle coverage and loads Core before the retained Custom Requests UI.

## Page load order

```text
/public/js/admin.js?v=372
/public/js/admin-custom-requests.js?v=372
```

The existing UI continues to use the mature compatibility endpoint for automatic list data and explicit workflow POSTs. The top-level runtime separately proves the Build 370 owned read contract is registered and available.

## Mutation boundary

No quote, job, product-plan, reply, payment, order, fulfillment, marketplace, consent, or review mutation is moved. The runtime reports `customRequestsMutationOwnership=false`.

The legacy marketplace CSV GET remains a compatibility/export cleanup item and is not part of activation proof.
