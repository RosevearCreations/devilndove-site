# Build 371 — Commerce & Operations Custom Requests Runtime

Build 371 adds passive `operations-custom-requests-read` registration to the Commerce & Operations runtime.

## Runtime boundary

Dedicated page:

```text
/admin/custom-request/
```

Required service:

```text
operations-custom-requests-read
```

The broad `/admin/operations/` page keeps its existing prerequisites:

```text
catalog-read
inventory-read
accounting-read
```

Build 371 does not widen the broad Operations department gate.

## Ownership

```text
createsNetworkTransport=false
operationsMutationOwnership=false
customRequestsMutationOwnership=false
```

The compatibility Custom Requests endpoint remains the owner of existing POST workflow actions. The legacy marketplace CSV GET is explicitly reported as outside the Build 370 startup-read contract.
