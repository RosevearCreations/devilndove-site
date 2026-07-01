# Content Automation Studio and Release Board — Build 200

This specialist runbook describes the review-first content system. The canonical business priority source is `PROJECT_STATUS_AND_ROADMAP.md`; the technical deployment source is `AI_HANDOFF.md`.

## Outcome target per completed project

Every approved finished product creates a reviewable package preparing:

- 1 landscape YouTube long-form plan
- 3 Facebook video plans
- 5 Instagram Reel plans
- 5 TikTok plans
- completed-image and website-gallery selections
- a Google Business Profile photo plan
- SEO page assets
- one blog draft
- one thumbnail plan
- captions and production directions for every social item
- Build 200 release drafts: one Workshop Journal article and one website-gallery feature

The structure can later accept detailing-job source records. In Builds 199–200, live sources are Devil n Dove approved products.

## What is automated now

1. Product approval creates/refreshes one Content Studio source archive by reference only.
2. Content Studio creates the factual, review-first deliverable plan and preserves explicitly edited/locked copy.
3. Content Release Board prepares website gallery and Workshop Journal drafts from the approved package. It uses selected `public_allowed` source media only.
4. The Board validates public release requirements, allows public-copy editing/locking, then requires separate **Approve public copy** and **Publish after approval** actions.
5. Publishing exposes only the final published record through `/api/workshop-journal`; the public Journal/Gallery UI consumes that read-only endpoint.
6. Unpublishing removes the item from public results immediately but retains all source records and audit history.

## What is deliberately not claimed complete

- No encoded MP4/video file is rendered. `content_render_jobs` remains a provider-neutral/manual-export handoff.
- No direct upload to YouTube, Facebook, Instagram, TikTok, Google Business Profile, or external website CMS occurs.
- No consent is inferred. A source must be selected and `public_allowed`; project-level review labels do not replace media consent records.
- No product media is copied, reordered, replaced, deleted, or made featured by Content Studio or the Release Board.
- No manual metric is an automatic integration or confirmed sale.
- Client-rendered public Journal story pages are an initial publication surface. Confirm real indexing/crawl results before scaling the number of content pages.

## Release Board workflow

1. Complete product facts, media, consent/public-use review, and Content Studio deliverables.
2. Ensure the relevant Blog and Website Gallery deliverables are approved in Content Studio.
3. Open `/admin/content-publications/`; choose the content project and select **Prepare / refresh website drafts**.
4. Review the release checklist. Fix every blocker, especially source approval, factual visible content, public-cleared media, lead image alt text, stable slug, and meta copy.
5. Edit any public text. Turn on the copy lock after substantial manual editing.
6. Select **Approve public copy**. This does not make it public.
7. Inspect the public path preview, then select **Publish after approval**.
8. Visit `/workshop-journal/`, `/gallery/`, and the story path. Check public content, original product media, mobile rendering, and stop/unpublish behavior.
9. Later, record a small manual metric snapshot with source/date. Prefer quality/enquiries/order evidence over raw views.

## Data model

- `content_projects` — one content package per source.
- `content_project_media` — non-destructive source archive rows and media review selection.
- `content_project_deliverables` — channel plans, copy, render/output fields, and review state.
- `content_render_jobs` — future rendering/export work.
- `content_project_events` — package audit events.
- `content_publications` — public release drafts and their title/copy/media references/status/metrics.
- `content_publication_events` — publication preparation, edit, approval, publish, unpublish, and manual-metric audit entries.

## SEO and visual rules

- Public structured data must match visible content on the same page.
- Use real, crawlable public media URLs only. Do not reference a raw internal, deleted, or consent-blocked object.
- Lead image alt text should describe the actual finished item or shown workshop detail—not repeat a generic phrase across every story.
- Keep articles useful. Add material/process/care/condition context only when the source record or visible media supports it.
- Placeholder SVGs are decorative and never count as product proof, a GBP photo, or public-cleared content media.
- For Google Business Profile, prepare images manually and review the platform’s current photo/video policies before uploading.
