# Release 467 Build 298 — Merchant/Search Distribution + Public Content Discovery

Build 298 reuses the existing Product and reviewed Content Publication authorities for external discovery without creating another catalog or publication system.

The public Merchant feed at `/api/merchant-feed` supports RSS XML, TSV, and JSON preview. Only active reviewed/published onsite or hybrid physical Products can enter the feed, and the feed requires CAD pricing, a public Product URL, image, description, online Canadian shipping, and confirmed Merchant shipping/return configuration. Missing facts are reported as blockers rather than invented.

IndexNow support is admin-only and never automatic. A provider POST can occur only through the authenticated Build 298 admin endpoint and only after the operator submits the exact confirmation phrase `SUBMIT INDEXNOW`. The key and key location stay in Cloudflare environment configuration and are not returned by diagnostics.

The existing Local SEO Review workspace now shows Merchant eligibility/blockers, Search Console import coverage, IndexNow readiness, feed links, and the explicit submission control.

Build 298 also adds initial-response internal links where existing data proves a relationship: Product → reviewed Workshop Journal story, reviewed story → linked Product, and reviewed story → capability profiles whose public process relationships match the source Creative Project. Private CAIP media and inferred relationships are excluded.

Build 297 is the exact predecessor: Development `24c2a0dc4f81b4323d96387b1f5a7109e976c226`, Production `043799f8d89a6df392b4416a7908da4f9d92d537`, shared tree `22da804600e5d53151e06a4136b4a3c65d96a88f`.

Build 298 adds no schema and authorizes no automatic provider publication.

**Next: Build 299 — D1 Query Efficiency + Canonical Runtime/Repository Cleanup.**
