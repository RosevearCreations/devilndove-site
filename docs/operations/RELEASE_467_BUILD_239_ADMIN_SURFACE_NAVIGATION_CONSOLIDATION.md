# Release 467 Build 239 — Admin Surface & Navigation Consolidation

Build 239 starts from exact Build 238 Development head `26bd3f755bd486e41335431136f6fed36cabde9f` and Production main `44e52cfc905b7864c31c2921ea5e34146a02361a`.

## Consolidation delivered
- The navigation manifest now has one canonical menu owner per route.
- Search & SEO Review and Responsive Layout Review remain valid deep links but are listed only in Storefront, their business-facing owner.
- Repeated exact links inside shared admin navigation/tool grids are collapsed client-side without changing the underlying route.
- Existing bookmarks and direct links are preserved; Build 239 does not force redirects or retire a route whose compatibility cannot yet be proven safe.
- No schema, D1/R2 business data, provider, Product publication, Inventory or Finance mutation is introduced.

The next authorized release is Build 240 — API Read Budget, Cache & Batch Streamlining.
