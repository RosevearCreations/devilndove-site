# Content Automation Studio — Build 199


**Automatic trigger paths:** dedicated review approval, direct product creation with Approved/Published status, and an editor save that changes a product from an unapproved review status to Approved/Published.

**Source gate:** only a product with review status **approved** or **published** can create or refresh a Content Automation Studio package.
This specialist runbook describes the review-first system that turns one approved finished product into an organised content package. `PROJECT_STATUS_AND_ROADMAP.md` remains the business priority source, and `AI_HANDOFF.md` remains the technical/deployment source.

## Outcome target per completed project

A package prepares exactly:

- 1 landscape YouTube long-form video plan
- 3 Facebook video plans
- 5 Instagram Reel plans
- 5 TikTok plans
- completed-image and website-gallery selections
- a Google Business Profile photo plan
- SEO page assets
- one blog draft
- one thumbnail plan
- captions and production directions for every social item

The same data structure supports future detailing-job sources. In Build 199, the live source is an approved Devil n Dove product; a future job record can use the same `content_projects` model through `source_type` and `source_id` without duplicating media architecture.

## What Build 199 actually automates

1. On product **Approve**, `/api/admin/product-review-actions` prepares or refreshes the product's content package.
2. It links every retained product image and media-asset URL into `content_project_media`. The archive is referential: no R2 source object is moved, replaced, deleted, or copied by this step.
3. It assigns a transparent selection score using source order, existing image role, media type, and recorded merchandising/quality metadata. This is only a review aid.
4. It creates deliverable briefs and factual template copy in `content_project_deliverables`.
5. It keeps every deliverable in a review-first state. No website, social, Google Business Profile, video service, or external API post is triggered automatically.
6. A finished output URL may be added after real rendering. A social deliverable can enter the existing Social Post Queue only after both **Approved** status and a real finished media URL are present.

## What is deliberately not claimed complete

- Build 199 does **not** render or edit actual MP4 files. Cloudflare Pages/Workers is not the appropriate place to execute a video encoder. `content_render_jobs` stores a provider-neutral render brief so an approved renderer can be connected later.
- It does not upload directly to YouTube, Facebook, Instagram, TikTok, Google Business Profile, or the website gallery.
- It does not declare a photo safe for public use. Existing public-use/consent status is imported as a starting signal, and the reviewer decides package use.
- It does not invent performance claims, transformation claims, product availability, materials, or customer testimonials.

## Admin workflow

1. Complete the product record and retain all intended photos/videos.
2. Approve the product. The content project is created automatically.
3. Open `/admin/content-studio/`.
4. Review the structured source-media archive. Set each item to **Public allowed**, **Needs review**, **Internal only**, or **Blocked**. Select the usable source media and one lead image/video.
5. Review each output plan and edit captions, script directions, SEO copy, or the blog draft. Saving edited text locks it so a later factual refresh cannot overwrite it.
6. Use the real video editor/render service to make the outputs from the prepared brief. Paste the finished file URL and thumbnail URL into the corresponding deliverable.
7. Approve each deliverable. Send approved Facebook, Instagram, TikTok, or YouTube entries with a finished file URL to the existing Social Post Queue for platform-preview and final publishing review.
8. Download the JSON project manifest for an external editor, an archive, or future rendering integration.

## Data model

- `content_projects`: one source-linked content package per `source_type` + `source_id`.
- `content_project_media`: immutable-reference archive rows and review selection state.
- `content_project_deliverables`: the exact channel/output plans, copy, scripts, output URLs, approval state, and social queue link.
- `content_render_jobs`: provider-neutral rendering handoff records; `manual_export` is the safe default.
- `content_project_events`: audit-friendly project activity log.

## Safety and media rules

- Original product and R2 media remains intact unless a separate explicit media-management action deletes it.
- A "lead source" only controls this content package. It does not change the product's featured image.
- Marking **Public allowed** in this studio means reviewed package suitability. It does not replace the underlying consent record or public-use annotation system.
- Do not mark content as published in the studio until the actual destination and output have been manually verified.
- For a customer vehicle/detailing job, customer identity, plate numbers, house numbers, private documents, location-sensitive details, and identifiable people must remain blocked or receive appropriate review/consent before public use.

## Production format assumptions

The package plans landscape 16:9 for the long-form YouTube output and vertical 9:16 for Facebook, Instagram Reels, and TikTok short-form plans. This aligns with current platform guidance but should be rechecked during every future external-rendering/platform integration because platform requirements change. YouTube currently categorizes square or vertical videos up to three minutes as Shorts; long-form plans therefore remain 16:9. Google also expects image URLs used in structured data to be relevant and crawlable, and public image text should be descriptive and accurate.

## Next engineering steps after Build 199

1. Attach a chosen hosted video-rendering provider through a secure job queue and a provider adapter; preserve manual export as a fallback.
2. Add direct upload/publish adapters only after each platform's OAuth, account permissions, platform preview, and failure/retry behaviour have been tested live.
3. Add actual static blog/article publishing and public gallery insertion after individual item approval.
4. Add a detailing-job source adapter that links real-time job photos, clips, notes, client-visible permissions, and detailer-only notes to the same project model.
5. Add accurate performance analytics by channel and deliverable after tracking/privacy disclosures are in place.
