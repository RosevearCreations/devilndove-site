# Build 361 — CAIP Top-Level Activation

Build 361 adds `/admin/creative-assets/` to explicit Creative & Production top-level runtime coverage.

The page already resolves to the `caip` domain. Build 361 adds the shared `admin.js` Core loader before the retained CAIP UI scripts:

```text
/public/js/admin.js?v=361
/public/js/admin-caip-media-intake.js?v=279
/public/js/admin-creative-assets.js?v=271
```

The retained CAIP UI and both compatibility endpoints remain unchanged. Their automatic GETs may execute as before; the new top-level runtime only supplies lifecycle classification and passive owned-read service registration.

## Coverage after Build 361

```text
creative-production
  packaging -> /admin/packaging-studio/
  creative  -> /admin/creative-process/
  content   -> /admin/content-studio/
  caip      -> /admin/creative-assets/
```

## Mutation safety

Top-level activation does not move CAIP project/evidence/story mutations, media-intake uploads, R2 writes, duplicate cleanup, governance changes, probes, derivative planning, secure review, or public-promotion review actions.

`caipMutationOwnershipMovedByTopLevelRuntime` remains `false`.
