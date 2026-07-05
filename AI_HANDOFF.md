# Devil n Dove AI Handoff — Build 208

## Read this first

Use only these two documents for current cross-project decisions:

1. `AI_HANDOFF.md` — technical boundaries, live incidents, deployment/testing rules, and implementation state.
2. `PROJECT_STATUS_AND_ROADMAP.md` — business workflow, public SEO/media rules, completed work, and priority backlog.

`MARKDOWN_INDEX.md` identifies specialist documents. Historical Build 154–207 notes are retained as evidence only and do not override this handoff.

## Current Build 208 release

Build 208 adds a **read-only Product Release Preflight** for a selected product:

- New protected workspace: `/admin/release-preflight/?product_id=<id>`.
- New protected API: `/api/admin/product-release-preflight?product_id=<id>&destination=both|workshop_journal|website_gallery`.
- It combines five real workflow stages in one operator decision view:
  1. catalog facts and approval state;
  2. featured image, media role, and existing consent/review signals;
  3. Content Studio package/source-media/selected-destination deliverable approval;
  4. CAIP project/governance/evidence/right-status signals;
  5. Content Release Board draft/readiness/approval checks for the chosen destination.
- It returns two distinct results:
  - **Ready to pass to Release Board** — checks the upstream handoff only.
  - **Ready to publish destination(s)** — adds the public-draft/release checks.
- The preflight is read-only. It does not create or approve a package, CAIP project, evidence, rights record, public draft, publication, derivative, external post, or provider job.
- Every failed check links to the owner page that can correct it.

### Explicit featured-image sync

Build 208 also adds `/api/admin/product-featured-image-sync` and a **Sync resolved featured image** control inside Catalog Media. It appears only when `product-detail` resolved a legitimate gallery/media-library image but `products.featured_image_url` is blank.

The action is confirmation-gated and audited. It only writes the selected existing URL to `products.featured_image_url`. It does **not** change source files, R2 objects, gallery order, annotations, roles, consent records, Content Studio, CAIP, or release status.

## Architecture and deployment facts

- Hosting: Cloudflare Pages + Pages Functions.
- Database: Cloudflare D1 binding `DB`.
- Media: R2 binding `PRODUCT_MEDIA_BUCKET`.
- Project root must directly contain `functions/`, `index.html`, `_routes.json`, and `wrangler.toml` when deployed to Pages.
- Admin routes are `noindex,nofollow`. Public pages require one visible H1.
- Product media remains source-led. `products.featured_image_url`, `product_images`, and non-deleted `media_assets` may coexist. Build 206 resolves them safely; Build 208 allows only an explicit administrator to mirror a known resolved URL back into the product field.

## No D1 migration rule for Build 208

No D1 migration is required for Build 208. The new preflight detects missing optional Content Studio/CAIP/Release Board tables and reports the appropriate owner step; it does not run `CREATE`, `ALTER`, migrations, or repairs on page load.

Do not rename or rebuild D1 auth tables because of catalog/media/release work.

## Login incident — accurate current state

The unresolved `POST /api/auth/login` 500 is a separate incident. The selected live D1 database was confirmed to contain current `users` and `sessions` tables and no `members` table.

Do not run an old `members` migration or a `PRAGMA foreign_keys = OFF` batch. The only next evidence for the auth incident is the sanitized failed-response JSON body or matching Cloudflare Pages Function log. Never share passwords, cookies, session tokens, Authorization headers, or raw request bodies.

## Public SEO and source-media guardrails

- One visible H1 per public page.
- Use buyer language only where it accurately describes the actual item.
- Keep visible product facts, title/meta, canonical URL, Product schema, price/availability, featured image, and alt text consistent.
- Use real, approved imagery. Admin-only placeholders never become storefront/schema/Open Graph/marketplace images.
- Descriptive contextual alt text is required; keyword lists are not alt text.
- `blocked` / `consent_needed` media remains non-public. CAIP never creates consent or public rights.
- A CAIP score, technical observation, derivative plan, or internal CAIP approval is not publication approval.

## Required post-deploy proof for Build 208

1. Sign in as an administrator and open `/admin/release-preflight/?product_id=<known-product-id>`.
2. Verify the product summary and featured-image preview identify the correct record.
3. Test a Draft/Revision product: the Catalog stage must block handoff.
4. Test an Approved/Active product lacking a Content Studio package: Catalog/Media can pass while Content Studio blocks handoff.
5. Test one package with public-allowed source media but no CAIP governance/evidence: CAIP must block handoff.
6. Test a fully prepared package without a public draft: **handoff** can pass while **publish** still blocks on Release Board.
7. Choose Workshop Journal, Website gallery, and Both; confirm only the selected release destination checks affect the publish decision.
8. On a product that resolves an image from `product_images` or `media_assets` but has an empty stored featured URL, use **Sync resolved featured image** once. Confirm only `products.featured_image_url` changes and the product-media audit/admin audit record appears.
9. Confirm no action in the preflight creates a new Content Studio package, CAIP project, evidence row, derivative, publication, provider job, or public post.
10. Re-run Build 206/207 catalog-media and public-image consent tests, plus `POST_DEPLOY_SMOKE_TEST.md`.

## First next work after Build 208

1. Capture and fix the verified login failure code/log only.
2. Perform the required live Build 208 preflight proof using actual approved, blocked, consent-needed, legacy-unannotated, and explicitly permitted media examples.
3. Use release-preflight results to harden only proven weak points in existing product records; do not auto-fill claims or rights.
4. Add separate, explicitly approved derivative-worker controls only after source checksum, rights, output namespace, cost budget, human review, output verification, retry, and rollback controls are accepted.
5. Add public-page evidence only from actual published output and Search Console/marketplace observations.
