# Build 248 changed files

Build 248 advances Packaging Studio from a reusable finished-formula library into a source-aware production model. The central distinction is now **Purchased Source Material → Finished Formula → Packaging Project**, with supplier evidence retained separately from owner-reviewed finished-product facts.

## Packaging Studio application

- `functions/api/admin/packaging-studio.js`
  - Build 248 source-material CRUD/apply/detach APIs.
  - Soap-base-only finished-formula inheritance.
  - Project source-material snapshots and review state.
  - Master INCI/source verification and fragrance-allergen print-readiness gates.
  - Build 247 label deletion, Truth renderer and rose behavior retained.
- `public/js/admin-packaging-studio.js`
  - Purchased/source material cards and editor.
  - Supplier/product/SKU/source image/document fields.
  - Raw supplier ingredient text, structured Master INCI, allergen evidence, benefits and supplier-claim templates.
  - Formula source-base attachment/inheritance.
  - Supplier claims remain unapproved drafts; supplier benefits are deliberate reusable source evidence.
  - Unverified supplier allergen statements are visibly identified.
- `admin/packaging-studio/index.html`
  - Build 248 JS/CSS cache keys; one H1 retained.
- `css/styles.css`
  - Responsive source-material cards, evidence panels, benefits grid and phone stacking.
- `assets/packaging/placeholders/soap-base-source-template.svg`
  - Neutral admin-only source-material fallback; never public product proof.
- `sw.js`
  - shell cache advanced to v24.

## D1/schema

- `database_build248_packaging_source_material_templates_compliance.sql`
  - Adds `packaging_source_material_templates`.
  - Adds `packaging_project_source_materials` with source snapshots.
  - Adds `packaging_formula_source_material_links`.
  - Seeds the owner-provided Goat’s Milk Melt & Pour source template with nine supplied ingredient names and six supplier benefit sections.
  - Keeps source ingredient/INCI rows review-required by default.
  - Adds source image/document references and Canadian fragrance-allergen review policy settings.
- `database_upgrade_current_pass.sql`
  - Byte-identical Build 248 deployment migration.
- `database_full_schema.sql`, `database_schema.sql`, `database_store_schema.sql`
  - Build 248 synchronized into aggregate schema authorities.
- `BUILD248_D1_VERIFICATION.sql`
  - Read-only production verification for migration, source templates, Master INCI rows, project/formula links and fragrance review state.

## Documentation/SEO

- `AI_HANDOFF.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `MARKDOWN_INDEX.md`
- `AI_CONTEXT.md`
- `NEW_CHAT_STATUS.md`
- `PACKAGING_STUDIO.md`
- `IMAGES_REQUIRED.md`
- `GENERATED_VISUAL_ASSET_REGISTER.md`
- `LOCAL_SEO_PLAYBOOK.md`
- `COMPETITIVE.md`
- `RELEASE_NOTES.md`

The two cross-project current authorities remain `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. Superseded root `BUILD*.md` copies were retired into `docs/archive/build-history/`; historical evidence remains preserved there.

## Regression tooling

- `scripts/build248_packaging_source_material_regression.py`
  - 85 Build 248 source-material/Packaging Studio/schema/documentation checks.
- `scripts/build247_packaging_studio_regression.py`
- `scripts/build246_product_project_packaging_regression.py`
  - Historical regressions were made forward-compatible so a newer current-pass migration is not treated as a failure.

## Historical-root cleanup

71 superseded `BUILD*.md` files were removed from the repository root. Their historical copies are preserved under `docs/archive/build-history/`. Build 246 and 247 current-at-the-time release notes were added to that archive where they were not already present.
