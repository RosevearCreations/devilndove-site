# Release 467 Build 73 — Product Media / Photo Studio Convergence

Build 73 starts from the exact fully-green Build 72 Production/Development checkpoint:

- Source SHA: `bcbee233cce61087111129d7b5879f72f403bef9`
- Source tree: `83d75db08d7a766a076819ed217803318aa8bc0a`
- Canonical D1 migrations: `0001`–`0004`
- Build 72 Development System Gate: GREEN
- Build 72 Production Pages Deploy: GREEN
- Build 72 Production Live Resource Integrity Proof: GREEN

## Purpose

Converge the existing Product photography systems into one **Product-owned Photo Studio authority** without creating another gallery, another R2 inventory, another publication path, or a new schema.

The operator should be able to choose one Product and understand, in one place, how its canonical gallery, linked R2 media, image roles, annotations, alt text, focal points, featured image, SEO/social image, quality evidence and unused-media review fit together. Existing specialist write APIs remain the owners of actual edits.

## Build 73 contract

1. **`product_images` remains the canonical Product gallery.** Build 73 does not replace it with `media_assets`, CAIP, Media Studio or a browser-only list.
2. **R2-backed `media_assets` is supporting Product evidence.** A linked Product media row can enrich/recover the gallery view, but it does not silently become a second canonical gallery.
3. **Role assignments remain buyer-facing media intent.** `product_media_role_assignments` continues to own main/close-up/scale/process/packaging/social role selection.
4. **Annotations remain per-image presentation metadata.** Alt text, focal point, crop/quality notes, public-use status and consent linkage stay attached to Product image evidence.
5. **Quality evidence is converged, not re-scored server-side.** Existing `product_image_quality_reviews` and `product_image_quality_assessments` are read as evidence; Build 73 does not invent a second scoring database.
6. **The convergence engine is pure.** `productMediaAuthority.js` receives rows and returns one deterministic Product-media projection. It performs no D1, R2, network, browser, timer or provider work.
7. **Duplicate URLs are canonicalized.** Query/hash variants and the same image referenced by several authorities converge into one image record with `evidence_sources` showing where support came from.
8. **Higher-priority ownership is preserved.** Gallery → linked R2 media → role assignment → annotation/history is the canonical source priority; lower-priority evidence may enrich metadata without stealing ownership.
9. **Featured image resolution is explicit.** The stored Product featured URL is reconciled to the converged image set, including cache/query variants.
10. **SEO/social image resolution is explicit.** `product_seo.og_image_url` is identified separately from the canonical gallery and featured-image role.
11. **Alt text readiness remains measurable.** Build 73 keeps the existing 12-character minimum as a visible readiness check; it does not auto-generate or silently overwrite alt text.
12. **Focal-point readiness is explicit.** Existing focal coordinates are surfaced so crop/display work can be completed in the specialist editor.
13. **Public-use status remains fail-closed.** `blocked` and `consent_needed` media never become Product-page or social-ready candidates through convergence.
14. **Product-page eligibility remains explicit.** An image needs an allowed Product public-use status plus sufficient alt text; Build 73 does not publish it.
15. **Social-photo eligibility remains stricter.** A candidate needs `social_ok`/`all_public_ok`, sufficient alt text, no block/consent hold and known quality score at/above 55.
16. **Social candidates are selection-only.** Build 73 prepares controlled candidates for later Socials work; it performs no Pinterest, Instagram, Meta or other provider publication.
17. **Unused-media review is review-only.** Linked R2 Product media outside the canonical gallery, featured/SEO selection and buyer-facing roles is surfaced for operator review.
18. **Unused review never means safe to delete.** Every candidate is explicitly returned with `safe_to_delete: false`; deletion still requires specialist reference review and the existing step-up protection.
19. **No R2 copy/move/delete is introduced.** The convergence endpoint reads references only.
20. **No CAIP raw-media deletion is introduced.** Creative/private/raw media boundaries remain unchanged.
21. **Static Website Media Studio remains separate.** `/admin/media-content-studio/` continues to own public/static site presentation and continues to exclude Product/catalog media.
22. **The focused Product Media workspace is the operator surface.** `/admin/catalog-media/` now labels itself Product Media & Photo Studio and adds a convergence panel above the established specialist editors.
23. **Existing Product upload/reorder/editor controls remain mutation authority.** `/api/admin/product-images` continues to own ordered gallery and annotation saves.
24. **Existing Product role/primary-quality controls remain mutation authority.** `/api/admin/product-media-score` continues to own buyer-facing roles and primary-image quality acceptance.
25. **Existing media asset management remains specialist authority.** Build 73 does not bypass step-up protections around replacement/deletion.
26. **The new authority endpoint is GET/read-only.** `/api/admin/product-media-authority?product_id=…` accepts one selected Product and exposes no POST/PATCH/DELETE handler.
27. **Every D1 read is selected-Product and bounded.** Product 1, SEO 1, gallery 20, linked media 30, role assignments 20, annotations 30, quality reviews 30 and quality assessments 30.
28. **No blank catalog scan is added.** The convergence endpoint requires a valid Product ID and cannot load a whole Product catalog.
29. **Build 63 read-budget compatibility remains stable.** `R467B63_V1` is retained while Build 73 adds the selected-Product media route contract.
30. **No new D1 migration is required.** Existing Product/media/role/annotation/quality authorities are sufficient; canonical migrations remain `0001`–`0004`.
31. **No Production business-data rewrite is introduced.** Build 73 is source/UI/read-projection work.
32. **Production promotion remains exact-green only.** System Gate, Current Application Quality Proof, I.T. Admin Runtime Proof and Repository Branch Hygiene must all pass on the exact Development SHA before `main` may fast-forward.

## Canonical media resolution

For one Product, Build 73 gathers bounded evidence from:

1. `product_images` — canonical ordered Product gallery;
2. non-deleted Product-linked `media_assets` — R2/storage recovery and technical reference;
3. non-removed `product_media_role_assignments` — buyer-facing role intent;
4. `product_image_annotations` — alt/caption/focal/crop/public-use/consent metadata;
5. `product_image_quality_reviews` — primary/support quality acceptance;
6. `product_image_quality_assessments` — existing deterministic/assisted quality evidence;
7. `product_seo` — current SEO/social image reference.

The pure convergence engine normalizes the URL key, merges evidence, retains source priority and reports `evidence_sources` so an operator can see why an image exists in the projection.

## Photo Studio operator experience

The Build 73 convergence panel shows, for the selected Product:

- unique converged images;
- canonical gallery count;
- linked R2 media count;
- buyer-facing role count;
- featured image resolution and whether it is in the canonical gallery;
- SEO/social image resolution;
- social-ready candidate count;
- missing alt-text count;
- missing focal-point count;
- review-only unused-media count;
- per-image dimensions, quality, role, public-use status and evidence sources;
- social-ready candidate details;
- unused-media review candidates with explicit no-delete safety language.

Actual upload, reorder, alt/crop/focal edits, role saves, image-quality review and specialist asset actions remain in the established Product Media controls below the convergence panel.

## D1 / R2 boundary

Build 73 adds no table, column, index, trigger or canonical migration. The authority endpoint performs only bounded selected-Product reads. The pure engine cannot access D1 or R2. The UI performs one selected-Product GET and never mutates media through the convergence endpoint.

No R2 object is copied, moved or deleted. No media is automatically detached. No social provider is called. No image is automatically made public merely because it appears in the projection.

## Acceptance

The Build 73 gate and pure Node runtime acceptance prove:

- duplicate evidence converges to one canonical Product image;
- R2 metadata can enrich a canonical gallery row without replacing gallery ownership;
- featured URL variants resolve safely;
- annotation alt/focal metadata enriches the canonical image;
- role assignments merge without duplicating media;
- social-ready candidates require allowed public use, alt readiness and sufficient quality;
- consent-needed media remains blocked;
- R2-linked media outside gallery/roles is review-only;
- unused-media review never declares an object safe to delete;
- selected-Product D1 reads remain bounded;
- the endpoint stays GET/read-only with no runtime DDL or D1 mutation SQL;
- the convergence UI performs no Product/R2/provider mutation;
- canonical D1 migration authority remains `0001`–`0004`.

## Next build

After Build 73 is exact-green, continue with **Release 467 Build 74 — Storefront Product Experience**.
