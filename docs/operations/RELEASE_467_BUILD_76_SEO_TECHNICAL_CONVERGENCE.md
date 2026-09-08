# Release 467 Build 76 — SEO Technical Convergence

Build 76 starts from the exact fully-green Build 75 Production/Development checkpoint:

- Source SHA: `93442669be79851e7c5a9316b87d5f758f7026d4`
- Source tree: `547662c9d179b67a41541de850d5705baa90a522`
- Build 75 Development System Gate: `34171398052` — SUCCESS after the Cloudflare D1 daily quota reset
- Build 75 Current Application Quality Proof: `34171398017` — SUCCESS
- Build 75 I.T. Admin Runtime Proof: `34171398040` — SUCCESS after the D1 quota reset
- Build 75 Repository Branch Hygiene: `34171398046` — SUCCESS
- Build 75 Production Pages Deploy: `34173117125` — SUCCESS
- Build 75 Production Live Resource Integrity Proof: `34173156013` — SUCCESS
- Canonical D1 migrations remain exactly `0001`–`0004`

## Purpose

Build 76 makes technical SEO a release-blocking repository authority instead of relying on occasional manual review. It crawls **all checked-in public HTML routes** and converges the existing Release 465 / Release 467 SEO work around one current technical contract.

This build is schema-neutral and content-safe. It does not invent marketing claims, publish provider content, change Product business data, rewrite Production records, or alter R2 objects.

## Technical SEO contract

1. Every checked-in public HTML document is included in the crawl unless it belongs to an explicitly non-public source tree such as Admin, scripts, functions, tests or assets.
2. Every public HTML document keeps **exactly one source H1**.
3. Every public route has an explicit index/noindex robots authority.
4. Indexable routes must explicitly declare `index,follow`.
5. Noindex routes are prohibited from the sitemap.
6. Indexable static routes must have exactly one clean Production canonical URL on `https://devilndove.com/`.
7. Static canonical URLs must match the checked-in route path exactly.
8. `pages.dev` canonicals are rejected.
9. Indexable routes require a useful title and meta description.
10. Indexable routes require Open Graph site name, type, title, description, URL and image.
11. `og:url` must match the canonical URL.
12. Indexable routes require a Twitter card declaration.
13. Indexable routes require at least one valid JSON-LD document using a Schema.org context.
14. Invalid JSON-LD blocks the build.
15. Indexable routes require at least two crawlable internal links.
16. Sitemap URLs must be unique HTTPS `devilndove.com` URLs without query strings or fragments.
17. Every indexable static route must appear in `sitemap.xml`.
18. Every sitemap route must correspond to a current indexable checked-in route.
19. Sitemap routes cannot leak noindex/private routes.
20. Every sitemap route except Home must have an inbound link from another indexable page.
21. `robots.txt` must keep the wildcard crawler authority and canonical sitemap declaration.
22. Principal public discovery routes cannot be disallowed by `robots.txt`.
23. The dynamic Product Detail template `/shop/product/` is audited for H1, robots, canonical, metadata, Open Graph, Twitter and JSON-LD but is an explicit sitemap exception because runtime slug URLs are the actual Product canonicals.
24. Existing dynamic Product SEO parity remains owned by `public/js/seo-page-overrides.js`, Product Detail parity and the shared Storefront parity model.
25. Existing release-neutral `public_seo_gate.py` remains authoritative and is rerun by Build 76.
26. Existing `public_seo_depth_gate.py` remains authoritative and is rerun by Build 76.
27. Existing Build 15 full-public SEO parity remains authoritative and is rerun by Build 76.
28. Build 76 adds no D1 read/write API or runtime endpoint.
29. Build 76 adds no timer, polling loop or browser network request.
30. Build 76 adds no payment, social, marketplace or publication provider execution.
31. Canonical D1 migrations remain `0001`–`0004`; no `0005` migration is introduced.
32. Production promotion remains exact-green only after System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene all pass on the exact Development SHA.

## Crawl authority

`scripts/release467_build76_seo_technical_crawl.py` derives routes from the checked-in HTML tree rather than maintaining a second hard-coded public-page inventory. That prevents new public pages from silently escaping the technical SEO contract.

The crawler reports:

- total public HTML documents;
- indexable routes;
- noindex routes;
- sitemap route count;
- internal indexable-link edges;
- H1 enforcement;
- canonical Production-origin enforcement;
- robots/index authority;
- sitemap parity;
- metadata/Open Graph/Twitter coverage;
- JSON-LD validity and Schema.org context;
- internal-link coverage.

## Index and sitemap boundary

A public HTML document is indexable only when it is not `noindex` and declares a Production-domain canonical. Build 76 then requires explicit `index,follow` and exact static canonical parity.

The sitemap is treated as a declaration of intended static discovery routes, not as a dumping ground for every application URL. Authenticated/private/noindex surfaces remain excluded. The Product Detail template remains the one explicit dynamic-template exception because each real Product receives its slug-specific canonical at runtime.

## Internal-link boundary

Build 76 does not create hidden SEO links or keyword stuffing. It verifies that indexable routes are actually connected through ordinary crawlable internal navigation. Sitemap-only orphan pages fail the crawl until a real buyer-facing path links to them.

## Structured-data boundary

Build 76 validates syntax and Schema.org context across indexable source documents. Product structured-data detail remains governed by the retained dynamic Product parity system so price, availability, shipping and other Product facts continue to derive from the same visible buyer facts rather than a separate SEO-only truth.

## Safety boundary

- D1 schema mutation: **NONE**
- D1 business-data mutation: **NONE**
- R2 copy/move/delete: **NONE**
- Product publication mutation: **NONE**
- Stripe/PayPal execution: **NONE**
- Social/OAuth publication: **NONE**
- Runtime polling: **NONE**
- Canonical migrations: **`0001`–`0004` unchanged**

## Acceptance

Build 76 is complete only when the exact Development SHA passes:

1. retained release-neutral public SEO structure gate;
2. retained public SEO depth gate;
3. retained Release 467 Build 15 full-public SEO parity gate;
4. Build 76 full technical SEO crawl;
5. Current System Gate with Build 76 chained into the carried-forward Release 467 contracts;
6. Current Application Quality Proof;
7. I.T. Admin Runtime Proof;
8. Repository Branch Hygiene;
9. exact Development Preview/D1/bindings/smoke proof;
10. exact Production Pages Deploy and live resource integrity after a non-force fast-forward promotion.

## Next planned build

**Release 467 Build 77 — Canada-Only Commerce Rules**: centralize the current Canada-only sales/shipping boundary so Storefront, Cart, Checkout, address validation, APIs and customer messaging all agree.
