# Build 363 — Commerce & Operations Membership Runtime Expansion

Build 363 adds one passive browser service:

```text
operations-membership-read
```

Registration makes no HTTP request. `list()` is the only network boundary and calls the Build 362 Operations-owned read contract.

The shared Commerce & Operations runtime advances to Build 363 and keeps `catalog`, `inventory`, and `operations` as its only domains.

Operations prerequisites are now page-specific:

```text
/admin/operations/          catalog-read, inventory-read, accounting-read
/admin/customer-documents/  catalog-read, inventory-read, accounting-read
/admin/orders/              catalog-read, inventory-read, accounting-read
/admin/membership/          operations-membership-read
```

This preserves the original three-page boundary while avoiding unrelated Catalog/Inventory/Accounting prerequisites on Membership.

The top-level runtime still creates no transport and owns no Inventory, Operations, or Membership mutations.
