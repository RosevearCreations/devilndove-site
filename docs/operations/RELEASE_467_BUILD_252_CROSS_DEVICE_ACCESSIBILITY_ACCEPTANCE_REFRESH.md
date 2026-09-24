# Release 467 Build 252 — Cross-Device Accessibility Acceptance Refresh

Build 252 starts from the exact Build 251 Development tree `2d6d06e321693779cee55ed2dd892bff3b364a36` at `dev` `4d0c1c54c407393db5de3b6e3a519ddd7b1ce4dd`, promoted to Production `main` `f8e15d07e97e9a4e2953a65d09b494c73a36192a` on the identical tree.

## Purpose

Build 252 is an acceptance refresh, not a new UI framework. It re-proves the current post-refinement phone, tablet and desktop contracts, keyboard flow, focus visibility, coarse-pointer targets, dense Admin workspaces, local horizontal scrolling and reduced-motion behavior. The existing Build 237 ergonomics layer and the current responsive/adaptive layers remain the implementation authority.

## Acceptance matrix

- **Phone:** the <=420 px and <=720 px contracts retain readable form controls, single-column reflow, reachable content and coarse-pointer targets.
- **Tablet:** the 721–1023/1050 px contracts retain bounded two-column layouts where useful, Product workspace reflow and Packaging Studio reflow.
- **Desktop:** >=1024 px retains centered shells, bounded workspaces and local scrolling for intentionally wide data.
- **Keyboard/focus:** visible focus, Escape recovery and the dense-table Card/Table toggle remain keyboard-operable and expose `aria-pressed`.
- **Reduced motion:** global responsive CSS, adaptive shell, storefront discovery and carousel behavior retain reduced-motion handling.
- **Security compatibility:** Build 251 script/style nonce CSP hardening must remain intact while these presentation contracts are re-proved.

## Evidence boundary

The repository has no Playwright/Puppeteer/axe device-farm dependency. Build 252 therefore records a deterministic source-and-CI acceptance refresh over the actual shared runtime assets instead of pretending that a synthetic device lab was executed. Production promotion still requires the normal exact-tree release chain and live Production smoke/resource proof.

The push-only Repository Branch Hygiene workflow is not visible through the connected PR-run wrapper used during this build. Where its run ID cannot be retrieved, Build 252 records that limitation explicitly instead of inventing an identifier.

## Safety

Build 252 adds no schema or request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy or secret capture.

## Acceptance

Build 252 is accepted only when:

1. Build 251 exact Development and Production same-tree closure is ingested;
2. current responsive CSS retains phone, tablet and desktop boundaries plus local overflow and reduced motion;
3. Build 237 retains visible focus, coarse-pointer targets and dense table/card ergonomics;
4. adaptive shell, storefront discovery and carousel reduced-motion/responsive contracts remain present;
5. Build 251 CSP nonce protections remain intact;
6. System Gate invokes the Build 252 contract;
7. current I.T./Reliability/Preflight surfaces identify Build 252 over the Build 251 predecessor;
8. the exact Build 252 Development tree is promoted to `main` only after the required checks are GREEN.

Next authorized release: **Build 253 — Session & Abuse-Control Runtime Evidence**.
