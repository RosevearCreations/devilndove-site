# Build 194 Release Notes

## Summary

- Added customer-facing storefront discovery: clearer homepage hero and calls to action, What We Make cards, workshop process strip, featured creations, and Workshop Journal guides.
- Added buyer-question product listing profiles and public Quick Facts gated behind approved/published status.
- Added media-role coverage scoring and safe role-to-public-placeholder replacement inside Catalog Media.
- Added mobile-friendly shop quick filters and browser-local recently viewed items.
- Added `database_build194_storefront_discovery_product_facts_media_roles.sql`, Build 194 audit rows, canonical Markdown consolidation, and detailed owner testing steps.

## Required post-deploy action

- Run `database_build194_storefront_discovery_product_facts_media_roles.sql` after Build 193.
- Follow `BUILD194_TESTING_GUIDE.md` before treating customer-facing facts or photo roles as complete.

## Validation

- Static deployment preflight, final blocker, predeploy sanity, JavaScript/Python/JSON/HTML/CSS checks, full schema, and Build 193→194 migration rerun are recorded in `data/site/build194-validation.json`.

---

# Release Notes — Devil n Dove

## Build 193 — Live readiness playbook and resumable mobile media

- Added Command Center live-readiness cases with detailed owner instructions, evidence links, status, and run history.
- Added R2 multipart/resume mobile media API and phone UI.
- Added safe product-image attachment after completed multipart uploads.
- Added Command Center usage telemetry for evidence-based legacy admin consolidation.
- Added `LIVE_TESTING_GUIDE.md` and refreshed the canonical roadmap/handoff documents.

# Build 191

## Summary

- Configurable marketplace fee settings and product-family cost defaults
- Hard margin gates with temporary approval history
- Customer timeline notes and story-output drafts
- Search Console CSV mapping previews and GBP monthly tasks
- Review-request eligibility checks
- Consented before/after gallery publication workflow
- D1-backed mobile product draft recovery
- Deployed performance imports and responsive-image job queue
- Owner Daily summary exports and campaign readiness
- Real-device QA and live-environment verification

## Release package manifest

- Static manifest: `data/site/release-package-manifest.json`
- The manifest is regenerated after release notes so its own hash does not create a documentation loop.

## Changed files

- `AI_CONTEXT.md`
- `AI_HANDOFF.md`
- `AMAZON_MATCHING_NOTES.md`
- `CLOUDFLARE_ENVIRONMENT_CHECKLIST_DETAILED.md`
- `COMPETITIVE.md`
- `DATABASE_SCHEMA_REFERENCE.md`
- `DEVELOPMENT_ROADMAP.md`
- `IMAGES.md`
- `KNOWN_GAPS_AND_RISKS.md`
- `LOCAL_SEO_PLAYBOOK.md`
- `MARKDOWN_INDEX.md`
- `NEW_CHAT_STATUS.md`
- `POST_DEPLOY_SMOKE_TEST.md`
- `PROJECT_STATUS_AND_ROADMAP.md`
- `README.md`
- `RELEASE_NOTES.md`
- `REPO_BASE_GUIDE.md`
- `REPO_RULES.md`
- `SANITY_HEALTH_CHECK.md`
- `admin/command-center/index.html`
- `admin/mobile-product/index.html`
- `admin/products/index.html`
- `css/styles.css`
- `custom-gifts-southern-ontario/index.html`
- `data/site/build191-changed-files.json`
- `data/site/build191-validation.json`
- `data/site/build191-value-operations-followthrough.json`
- `data/site/deployment-preflight.json`
- `data/site/release-notes.json`
- `data/site/release-package-manifest.json`
- `database_build191_value_operations_followthrough.sql`
- `database_full_schema.sql`
- `database_schema.sql`
- `database_store_schema.sql`
- `database_upgrade_current_pass.sql`
- `functions/api/admin/marketplace-export-preview.js`
- `functions/api/admin/value-ops-followthrough.js`
- `functions/api/admin/value-ops.js`
- `functions/api/before-after-gallery.js`
- `gallery/index.html`
- `public/js/admin-mobile-product-recovery.js`
- `public/js/admin-product-image-role-prompts.js`
- `public/js/admin-value-ops-followthrough.js`
- `public/js/admin-value-ops.js`
- `public/js/before-after-gallery.js`
- `scripts/deployment_preflight_static_check.py`
- `scripts/final_deployment_blocker_check.py`
- `scripts/generate_release_manifest.py`

## D1 migration summary

- Run `database_build191_value_operations_followthrough.sql` after Build 190. The migration is additive and safe to rerun.

## Required post-deploy actions

- Run `database_build191_value_operations_followthrough.sql` in the production D1 database.
- Open `/admin/command-center/` and configure actual channel fees and product-family costs before relying on margin gates.
- Verify `/api/admin/value-ops-followthrough` while logged in as an admin.
- Test mobile product draft save/restore on a real phone.
- Import one Search Console CSV sample and one real deployed performance measurement.
- Confirm R2, Stripe webhook, email-provider, and Cloudflare API status in the environment verification card.
- Approve gallery items only after consent, public-use, alt text, and image accuracy are verified.

## Validation

- JavaScript syntax, JSON parsing, one-H1, CSS balance, Python compile, D1 upgrade, idempotency, preflight, blocker, and ZIP integrity checks completed for Build 191.


## Build 192 — Operational data connection and live proof follow-through

Build 192 keeps the project moving toward real business usefulness instead of adding another disconnected admin page. The new work is integrated into `/admin/command-center/` through `/api/admin/value-ops-next` and `public/js/admin-value-ops-next.js`.

Completed in this pass:

1. Added fee/cost change-audit rows so actual Stripe/Etsy/PayPal/local fee changes can be recorded with a reason and effective date.
2. Added R2 derivative worker readiness checks for bindings, WebP, AVIF, srcset writeback, and cleanup.
3. Added resumable mobile upload session rows and draft-conflict review rows beyond browser-only autosave.
4. Added approved real-media replacement plan rows for key public placeholders.
5. Added scheduled Search Console import rows for monthly pages/queries, weekly top pages, and quarterly image-search review.
6. Added Google Business Profile evidence records for monthly observations, photos, reviews, posts, and local-page proof.
7. Added customer duplicate/merge candidate rows and a Command Center action to refresh duplicate email candidates.
8. Added live provider test records for Stripe, email, R2, and Cloudflare checks without exposing secret values.
9. Added Lighthouse/PageSpeed import schedules for mobile and desktop routes.
10. Added legacy admin usage and consolidation recommendation rows so older admin pages are not retired until real usage data supports it.
11. Added extra visual placeholders to business-relevant public pages that still lacked visual enrichment.
12. Updated schema, release, roadmap, handoff, SEO, image, sanity, and deployment documentation.

Current opinion: the app is now past the “add structure” stage. The next business value comes from entering real costs/fees, uploading approved photographs, importing live evidence, and using the Command Center daily.

### Build 192 D1 migration

Run after Build 191:

```text
database_build192_operational_data_connection.sql
```

## Build 194 alignment

## Build 194 — Storefront Discovery, Product Facts & Media Roles

- Added homepage discovery/process/featured creations, Workshop Journal, recently viewed, and shop quick filters.
- Added approved public listing profiles, product video support, media-role scoring, and role-driven public proof slots.
- Added `database_build194_storefront_discovery_product_facts_media_roles.sql`.
- Updated canonical handoff/roadmap, schema references, visual notes, local SEO notes, and sanity checks.



## Build 194 testing reference

Use `BUILD194_TESTING_GUIDE.md` after deployment for the homepage, shop quick filters, product listing facts, media-role scoring, workshop journal, visual placeholders, and SEO/H1 verification.
