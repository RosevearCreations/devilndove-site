# Release 467 Build 297 — Search-First HTML, Product + Story SEO & Crawl Control

Build 297 moves dynamic Product and reviewed Workshop Journal search identity into the initial HTML response while retaining the existing Product and Content Publication authorities.

For a published Product slug, middleware reads the same products, optional product_seo, and bounded product_images records already used by the public Product detail flow. The first response owns title, description, canonical, robots, Open Graph, Twitter metadata, visible Product heading/intro, Product + Offer structured data, and BreadcrumbList. The same bounded Product snapshot is embedded into the response and reused by the existing browser renderer; the API remains a fallback rather than an immediate duplicate read.

For a reviewed/published Workshop Journal story, middleware reuses publicContentPublications over content_publications. The first response owns article metadata, canonical, robots, visible heading/summary, BlogPosting structured data, and BreadcrumbList. The browser reuses the embedded published story snapshot. Missing or unpublished Product/story slugs remain noindex,follow.

Any Shop URL with query parameters is treated as a browsing/filter permutation: it remains usable for buyers but is noindex,follow and canonicalizes to https://devilndove.com/shop/. Intentional standalone collection, capability, service, and Workshop Journal routes retain their existing index authority.

The checked-in sitemap.xml remains the static canonical-route source. At runtime, /sitemap.xml appends only currently active published Product URLs and reviewed published Workshop Journal story URLs. The response is cacheable for one hour with stale-while-revalidate, and it falls back to the static sitemap if dynamic data is unavailable.

Build 296 is the exact predecessor: Development 8b9a556e5d267f6c333032a1af64d1bb776bcf49, Production 120b5b607bfe3b7ddcf36abf4aefaad772477ba9, shared tree 65ab192e1dfb0b8f14ab88b9136d3bc925f6292d. Production proofs are Pages 36614590327 and Live Resource Integrity 36614722378.

Build 297 is schema-neutral, read-only for SEO projection, and authorizes no automatic publication, provider action, payment, private-media exposure, or search-engine cloaking.

The future queue remains open.

**Next: Build 298 — Merchant/Search Distribution + Public Content Discovery.**
