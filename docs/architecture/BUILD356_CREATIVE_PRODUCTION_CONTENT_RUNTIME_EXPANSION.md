# Build 356 — Creative & Production Content Runtime Expansion

## Goal

Extend the passive Creative & Production umbrella runtime to the `content` domain without moving Content Studio mutation authority.

## Runtime boundary

The Build 356 runtime supports exactly:

```text
packaging
creative
content
```

Content Studio coverage is limited to `/admin/content-studio/` and requires one passive service:

```text
content-studio-read
```

`public/js/modules/creative-production/content-studio-read-service.mjs` registers that service into Core when the Creative runtime loads. Registration performs no network request. The service contacts `/api/admin/contracts/content-studio-read` only when its `list()` method is called.

The umbrella runtime still reports:

```text
createsNetworkTransport: false
packagingMutationOwnership: false
creativeMutationOwnership: false
contentMutationOwnership: false
```

Packaging and Creative Process coverage remain intact.
