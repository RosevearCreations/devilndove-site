# Build 359 — CAIP Startup Read Contracts

Build 359 formalizes the two automatic CAIP startup reads without moving any mutation authority.

## Owned GET-only contracts

```text
/api/admin/contracts/caip-read
/api/admin/contracts/caip-media-intake-read
```

Both contracts are owned by `caip`, delegate to the retained GET implementations, and report:

```text
build                         359
request_time_schema_mutation  false
mutation_ownership_moved      false
schema_verification_only      true
```

The existing CAIP helpers named `ensureCreativeAssetIntelligenceSchema`, `ensureCreativeAssetOperationsSchema`, and `assertCaipMediaIntakeSchema` are verification-only in the current source: they issue SELECT checks and do not create/alter schema.

## Mutation authority unchanged

The contracts do not expose POST handlers. Existing CAIP actions remain on the retained compatibility endpoints, including project sync/review, evidence/story edits, probes, derivative planning, secure review grants, private-media upload/session lifecycle, governance, duplicate cleanup, and public-promotion review requests.

No R2 write, binary transfer, source-media mutation, or publishing authority moves in Build 359.
