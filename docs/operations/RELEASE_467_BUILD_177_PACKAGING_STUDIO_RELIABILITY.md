# Release 467 — Build 177 Packaging Studio Reliability & Progressive Loading

Build 177 keeps **Labeling & Packaging Studio** in the **Creator** application module under **Materials, tools & packaging** and preserves the Packaging business-domain authority inside Creative & Production.

## Why

The Packaging page had its own sources of browser lockup beyond the shared Build 176 Admin fixes:

- Packaging-owned bootstrap collections were unbounded;
- the save/preview stabilizer watched the whole editor subtree with a permanent MutationObserver;
- the Content artwork picker installed another subtree MutationObserver;
- Material Intelligence → Label Composition → Label Production → Release Workflow all loaded eagerly;
- owner-contract readiness could programmatically press Refresh and trigger a second full Packaging bootstrap;
- the no-project welcome screen rendered the entire Material Library editor immediately;
- long-lived browser tabs could combine old Packaging module cache generations.

## Build 177 behavior

### Startup

- Packaging Studio is a lean Admin route.
- Server middleware remains the security/access authority.
- The Packaging module runtime activates through the static five-module presentation snapshot without an automatic `/api/modules` D1 read.
- Manual module refresh remains available when authoritative module presentation needs to be re-read.
- The page uses one Build 177 cache generation through the Packaging module chain.

### Bounded Packaging-owned data

Normal Packaging bootstrap is capped at:

- 80 recent Packaging projects;
- 48 active Packaging templates;
- 24 printer profiles;
- 32 adopted reference sources;
- 80 formula-library rows;
- 120 content-library rows;
- 120 source-material rows;
- 240 formula/source-material links.

Selected-project detail is also bounded, including versions, claims, ingredients, components, source materials, exports and print-test history.

### Progressive editor

- Inventory expands only when the administrator types at least two characters into a Packaging Inventory field.
- Each Inventory search is capped at 40 rows and the in-session merged Inventory cache is capped at 240.
- The standalone Material Library is closed on normal page startup and opens only when **Open Material Library** is pressed.
- Advanced Material Intelligence, Label Composition, Label Production and Release Workflow layers wait until a Packaging project is actually opened.
- Content artwork refresh remains an explicit user action.

### Main-thread containment

- the Packaging save/preview stabilizer no longer uses a subtree MutationObserver;
- the Content artwork picker no longer uses a subtree MutationObserver;
- both react to the explicit `dd:packaging-editor-rendered` lifecycle event;
- owner-contract readiness no longer clicks Refresh or triggers a second full Packaging bootstrap;
- below-fold reference imagery is lazy-loaded and async-decoded.

## Authority preserved

Build 177 does not move Packaging ownership. Native reads remain under `/api/admin/packaging-bootstrap`; native writes remain under `/api/admin/packaging-write`. Catalog, Inventory and Content remain owner-contract sources. No Production business-data, R2, payment, refund, provider or accounting mutation is introduced by this code-only build.

## Acceptance

Build 177 must pass its dedicated bounded-startup proof, all retained Packaging design/material/composition/production/release gates, normal Quality/System Gate checks, exact Development Preview deployment, identical-tree Production promotion and post-deploy live-resource proof.
