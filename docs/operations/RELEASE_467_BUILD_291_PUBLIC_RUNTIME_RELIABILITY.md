# Release 467 Build 291 — Public Runtime Reliability & Broken-Surface Closure

Build 291 closes the buyer-visible runtime failures identified on the public Capabilities and Creations surfaces without creating a second catalog or capability backend.

## Capabilities

The existing `/api/capabilities` authority remains canonical. The public client now reads response text first, parses JSON safely, and treats empty, invalid, or error responses as a degraded runtime state instead of exposing parser exceptions.

When detailed profile evidence is unavailable, the public page keeps its static capability identity and summary and presents a customer-safe recovery path to Custom Work. Raw implementation errors are retained for diagnostics only, not rendered to buyers.

All capability pages use the Build 291 client revision so previously cached Build 209 parsing code is not retained.

## Creations

The existing `/api/creations` authority remains canonical and the local JSON fallback remains the recovery source. The page now safely parses API response text and does not render raw API status strings.

If both API and fallback are unavailable, the buyer receives a plain-language recovery state with Gallery and Contact routes.

## Diagnostics and smoke coverage

The Admin public-API health surface now checks both Creations and Capabilities.

Preview smoke explicitly verifies the Capabilities and Creations pages when Preview is directly reachable, or verifies that both are consistently protected by Cloudflare Access when Preview is private.

Production smoke checks the Capabilities and Creations pages, both APIs, and every URL in the public sitemap.

## Boundary

Build 291 is schema-neutral and performs no D1, R2, payment, provider, or publication mutation.

After Production GREEN, the queue remains open.

**Next: Build 292 — Client Runtime Observer & Memory-Churn Hardening.**
