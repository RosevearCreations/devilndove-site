# Devil n Dove AI Handoff — Build 199


**Automatic trigger paths:** dedicated review approval, direct product creation with Approved/Published status, and an editor save that changes a product from an unapproved review status to Approved/Published.

**Source gate:** only a product with review status **approved** or **published** can create or refresh a Content Automation Studio package.
Read this file first in a new chat, then `PROJECT_STATUS_AND_ROADMAP.md` and `MARKDOWN_INDEX.md`. The two canonical files remain the current direction; retain specialist runbooks and history rather than deleting useful implementation context.

## What Build 199 changes

Build 199 adds the **Content Automation Studio**, a review-first workflow that turns one approved finished product into a structured source-media archive and a complete multi-channel content package.

- Product **Approve**, **Publish**, and **Override Publish** actions prepare/refresh a content project automatically. A content-package preparation error is recorded as a warning and does not reverse the product approval.
- `/admin/content-studio/` is a responsive dedicated workspace. It supports approved-product selection, structured source-media archive review, manual media selection, lead-source selection, public-use review labels, project controls, downloadable JSON manifests, and per-deliverable copy/production editing.
- The package creates exactly 1 YouTube landscape long-form plan, 3 Facebook short video plans, 5 Instagram Reel plans, 5 TikTok plans, a website gallery plan, Google Business Profile photo plan, SEO asset pack, blog draft, thumbnail brief, and caption bundle.
- Source media is linked by reference in D1. This build does not move, copy, overwrite, or delete `product_images`, `media_assets`, or R2 objects.
- Copy is generated from existing factual product/story fields. Saving changed deliverable copy sets `copy_locked=1`, preventing later factual refreshes from overwriting it.
- Completed output files remain external/manual at this stage: a real media URL must be added before an approved social deliverable can move to the existing Social Post Queue.
- `database_build199_content_automation_studio.sql` adds content projects, source archive rows, deliverables, render handoff rows, events, indexes, and the migration ledger entry. It is additive and safe to rerun.
- `CONTENT_AUTOMATION_STUDIO.md` is the implementation/owner runbook. Do not treat it as a third general roadmap.

## Deployable files and order

1. Back up production D1.
2. Confirm Builds 196, 197, and 198 are applied.
3. Run `database_build199_content_automation_studio.sql`. It is safe to rerun.
4. Deploy the full Pages build, including static assets and `functions/`.
5. Test the workflow in `POST_DEPLOY_SMOKE_TEST.md` before describing it as live.

## Build 199 routes and files

- `GET/POST /api/admin/content-studio`
- `/admin/content-studio/`
- `functions/api/_lib/contentAutomationStudio.js`
- `functions/api/admin/content-studio.js`
- `public/js/admin-content-studio.js`
- `database_build199_content_automation_studio.sql`
- `CONTENT_AUTOMATION_STUDIO.md`

## D1 migration order

Run only migrations missing from the production migration ledger. Do not rerun older non-idempotent migrations simply because they appear here.

```text
...
database_build196_product_correction_material_returns.sql
database_build197_application_resilience_media_catalog.sql
database_build198_inventory_editor_featured_media_integrity.sql
database_build199_content_automation_studio.sql
```

## Operational rules

- Product featured media and content-package lead media are separate concepts. Never let changing a content lead source overwrite `products.featured_image_url`.
- The content archive is an index of source references, not a destructive R2 reorganization task.
- "Public allowed" in Content Studio is a package-level reviewer decision and does not replace source consent/annotation records.
- A deliverable must be **Approved** and have an actual `output_url` before it can enter the Social Post Queue.
- Never say a render brief is a completed video. The worker creates plans and export handoff rows, not encoded MP4s.
- Never auto-publish. Every channel has platform-preview, account-permission, and final-human-review requirements.
- For future detailing jobs, preserve the same client-visible/detailer-only/consent controls used by the planned live job media workflow.

## Current limits / not yet claimed complete

Provider-dependent work still needs live owner evidence: video rendering, platform OAuth/publishing, YouTube upload, Meta/TikTok posting, Google Business Profile photo upload, article/gallery publishing, performance analytics, and real-device tests. Existing R2, Stripe, email, Search Console, and Google Business Profile integrations also remain live-only checks where they were previously open.

## Documentation policy

Canonical current files:

1. `PROJECT_STATUS_AND_ROADMAP.md` — business priorities and release decision source.
2. `AI_HANDOFF.md` — technical state, migration order, operational rules, and new-chat continuation source.

Keep specialist Markdown until its unique instructions are migrated to these canonical files or archived. Do not add another general-roadmap Markdown.
