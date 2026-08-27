# Build 441 — System Convergence Release Gate

Updated: 2026-08-27

Build 441 is the active Devil n Dove Development release. Builds 439 and 440 are retained as provenance and regression evidence; unfinished evidence is carried forward as a Build 441 **HOLD** rather than keeping an obsolete release number active.

## Environment boundary

- Source: `dev`
- Development runtime/project: `devilndove-site-dev`
- Development D1: `devilndove-dev`
- Separate live Production: `main` / `devilndove-site`
- Production promotion: **CLOSED**

## Carried evidence

### Product / Inventory / Tools — GREEN provenance
Build 440 source, Windows D1 transport, Product reversible persistence/restoration, Inventory/kit safety, Tool lifecycle/history/publication and public Tool/Supply authority are retained as permanent regression evidence.

### Responsive acceptance — GREEN source / live harness limitation noted
The 35/35 responsive/cross-mutation source gate is green. Automated authenticated live viewport harnessing was blocked first by the correct `frame-ancestors 'none'` CSP and then by Firefox popup protection. That is recorded as a browser-harness limitation, not an observed UI defect. CSP must not be weakened to satisfy a test harness.

## Build 441 HOLD register

| Hold | Reason | Evidence already complete | Exact remaining proof | Promotion impact |
| --- | --- | --- | --- | --- |
| CAIP private media evidence | Live private-media delivery was not fully proven during historical Build 439 | Temporal-evidence schema/source gate; verified-artifact fail-closed rule; provider profiles may be disabled by design | Development private R2 media delivery, byte/range seeking, exact timecode/range evidence, storage audit and expected provider-off behavior | **HOLD — blocks separate live Production promotion; does not block continued Development work** |
| Responsive live automation | Browser security prevented automated viewport harness | 35/35 source/responsive gate; deployed routes returned HTTP 200; no observed responsive defect | Future Cloud Browser or equivalent authenticated top-level viewport evidence when available | **NOTE / not a known product defect** |
| Separate live Production promotion | Deliberately closed | Development-only release path remains isolated | Explicit owner promotion decision plus all required go-live gates | **HOLD by policy** |

## Build 441 acceptance

Build 441 can advance Development when its source gate is green and its exact Development deployment is healthy. A HOLD remains visible until resolved; it is never converted into a false PASS. Separate live Production remains closed while any promotion-blocking HOLD remains.
