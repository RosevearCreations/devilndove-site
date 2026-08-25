# Build 367 — Commerce & Operations Today Tasks Runtime

Build 367 extends the shared Commerce & Operations runtime without changing the three top-level application modules.

## Passive service

New runtime-local service:

```text
operations-today-tasks-read
```

It invokes the Build 366 GET-only contract only when `list()` is explicitly called. Registration performs no HTTP request.

## Page-specific service gate

Operations prerequisites are now:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
/admin/today-tasks/         operations-today-tasks-read
```

The runtime reports:

```text
build=367
activationBuild=368
createsNetworkTransport=false
operationsMutationOwnership=false
membershipMutationOwnership=false
todayTasksMutationOwnership=false
```

The retained Today Tasks action authority is metadata only:

```text
/api/admin/today-task-actions
```

The top-level runtime does not register a mutation service for it and does not call it automatically.
