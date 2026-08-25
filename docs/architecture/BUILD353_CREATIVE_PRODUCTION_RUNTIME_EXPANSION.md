# Build 353 — Creative & Production Runtime Expansion

Build 353 expands the passive `creative-production` top-level runtime from Packaging-only coverage to two bounded domains: `packaging` and `creative`.

Packaging keeps its existing three registered dependencies: `inventory-read`, `catalog-read`, and `content-media`.

Creative Process requires four registered services: `creative-process-read`, `inventory-read`, `inventory-post`, and `inventory-reverse`. The Build 353 Creative Process adapter is passive: registration performs no HTTP request, and its `list()` method contacts only the Build 352 read contract when explicitly invoked.

The top-level runtime still creates no network transport and owns no Packaging or Creative mutations.
