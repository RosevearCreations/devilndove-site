# Release 467 Build 251 — CSP Style Injection-Surface Hardening

Build 251 starts from exact Build 250 Development `f2eb36f2cae76e44a7e225c38fb4102cf1f9a84d` and Production `4bbd5ffdd7063bdc7bb864c416b8a6f08cf2582e`, sharing tree `41409f1d0a50793d9dda1f1184a2b8dcc8a2fda1`.

## Purpose

Build 245 removed broad `script-src 'unsafe-inline'` from the runtime CSP but deliberately retained style inline compatibility. Build 251 narrows that remaining style injection surface without attempting a risky one-build rewrite of every legacy `style=""` attribute.

## Hardening model

For runtime HTML responses:

- every static `<style>` element receives the same cryptographic nonce already used for scripts;
- a nonce-stamped bootstrap runs at the start of `<head>` and automatically adds that nonce to dynamically created `style` elements;
- modern CSP engines enforce `style-src-elem 'self' 'nonce-…'`;
- legacy `style=""` attributes remain explicitly allowed through `style-src-attr 'unsafe-inline'`;
- the legacy `style-src 'self' 'unsafe-inline'` fallback remains only for older engines that do not understand the element/attribute split;
- the response-scoped report-only policy uses the same nonce and a strict `style-src 'self'` baseline;
- the static report-only fallback also separates style elements from style attributes.

This reduces the broad style-element injection allowance while avoiding a visual regression from removing all inline style attributes at once.

## Compatibility work

A pre-candidate repository inventory found:
- 18 JavaScript files using `createElement('style')`;
- 15 JavaScript files assigning `style.textContent`;
- one public JavaScript file containing raw `<style>` print markup;
- 155 HTML files containing at least one `style=""` attribute.

The dynamic style bootstrap covers the existing `createElement('style')` paths. The Packaging print-source path is explicitly nonce-stamped because it creates a separate print document. Reliability's inline `<style>` block is migrated to `/css/csp-style-surface-v251.css` as a concrete same-origin stylesheet reduction.

## Safety boundary

Build 251 changes browser policy and presentation plumbing only. It adds no schema or request-time DDL, D1/R2 business mutation, provider execution/publication, Product publication, Inventory movement, Finance posting, automatic business action, Production business-data copy, or secret capture.

## Acceptance

Build 251 is accepted only when:
1. exact Build 250 Development and Production GREEN closure is ingested;
2. Build 245 script-nonce protection remains intact;
3. runtime CSP contains nonce-bound `style-src-elem` and explicit legacy `style-src-attr` compatibility;
4. static and dynamic style elements receive the response nonce;
5. raw Packaging print `<style>` markup carries the inherited nonce;
6. Reliability uses its same-origin Build 251 stylesheet and no longer contains an inline `<style>` block;
7. report-only policy is stricter for style elements than the legacy fallback;
8. all retained release/security gates remain GREEN on the exact Development head before Production promotion.

Next authorized release: **Build 252 — Cross-Device Accessibility Acceptance Refresh**.
