# Build 360 — Creative & Production CAIP Runtime Expansion

Build 360 extends the passive `creative-production` umbrella runtime to the `caip` domain.

## CAIP activation prerequisites

The CAIP top-level boundary requires exactly two passive read services:

```text
caip-read
caip-media-intake-read
```

`public/js/modules/creative-production/caip-read-services.mjs` registers both services without making a request. HTTP occurs only if a consumer explicitly calls a service `list()` method.

## Runtime invariants

```text
BUILD                    360
ACTIVATION_BUILD         361
supported CAIP page      /admin/creative-assets/
createsNetworkTransport  false
caipMutationOwnership    false
ownsCaipMutations        false
```

The runtime does not intercept CAIP uploads, R2 operations, governance changes, probes, derivative plans, secure-review grants, or project/evidence mutations.

Build 358's Creative Process dependency-gate correction remains intact and Inventory mutation authorities remain separate from passive activation services.
