# Devil n Dove Project Status and Roadmap — Build 199


**Automatic trigger paths:** dedicated review approval, direct product creation with Approved/Published status, and an editor save that changes a product from an unapproved review status to Approved/Published.

**Source gate:** only a product with review status **approved** or **published** can create or refresh a Content Automation Studio package.
This is the primary business and release-readiness source. Read `AI_HANDOFF.md` for technical deployment instructions and `MARKDOWN_INDEX.md` for retained specialist runbooks.

## Executive sanity check

Build 199 introduces the strongest next business system after product/media integrity: **one approved finished product becomes one review-ready content package**. It gives Devil n Dove a repeatable way to turn real workshop media into long-form and short-form video plans, gallery choices, Google Business Profile photo preparation, SEO copy, a blog draft, thumbnail instructions, and captions without losing original files or publishing anything by accident.

The system is complete as a **content operations foundation**, not as a complete video-production or auto-posting service. The platform now prepares, records, protects, and queues the work; external rendering and platform publishing still require connected providers, credentials, and live validation.

## What now works

1. Approving a finished product creates or refreshes its source-linked content package automatically.
2. Every retained product image/video source is represented in a structured archive without moving or deleting original R2/product records.
3. The archive scores media from recorded source order, role, media type, and existing metadata. The score is transparent review assistance, not a claim of visual truth.
4. Every package contains an exact output plan: 1 YouTube long-form, 3 Facebook videos, 5 Instagram Reels, 5 TikToks, website/gallery images, Google Business Profile photo plan, SEO assets, blog draft, thumbnail, and captions.
5. Content Studio works on phone and desktop widths. It includes source preview cards, mobile-safe controls, deliverable editors, review state, output/thumbnail fields, manifest export, and handoff to the Social Post Queue.
6. Edited copy remains protected from automatic refresh; source media remains protected from automatic deletion.
7. Existing product-metadata, image role, consent, SEO, social queue, and product story work is reused instead of duplicated.

## Business value

- A completed workshop project no longer leaves photos, clips, and story notes scattered across phones, R2, product records, and social ideas.
- The workflow creates consistent content volume while retaining human judgment, humour, accuracy, and maker voice.
- The system can power the same content model for future completed Rosie Dazzlers detailing jobs without rebuilding the archive/review/publishing framework.
- The output supports the strongest honest discovery loop: completed item → useful images/video → product/gallery/blog context → social distribution → review and repeat visibility.

## SEO and public-content guardrails

- Use only truthful, visibly supported product facts. Product title, price, availability, page copy, metadata, structured data, images, captions, and video claims must agree.
- Use descriptive, content-specific image alt text. Decorative graphic placeholders remain non-descriptive.
- Keep one visible H1 per public route. The Content Studio is admin-only and excluded from indexing.
- Make final media/image URLs stable and crawlable before putting them into public structured data or pages.
- Do not manufacture before/after or transformation claims where the archived source media does not show that progression.
- For future detailing-job projects, never expose identifying customer, vehicle, home, or location information without appropriate approval/consent.

## Highest-value next work

1. Deploy Build 199 and run the content-studio smoke test on a disposable approved product with multiple images and one video/link.
2. Select a secure video-rendering provider and build a provider adapter around `content_render_jobs`; keep manual export available as the failure-safe option.
3. Add reviewed website-gallery and Workshop Journal publishing from individual approved deliverables.
4. Add the future detailed-job source adapter: real-time photos/videos/notes, client-visible controls, detailer-only notes, consent gates, and customer approval states.
5. Add native social/YouTube/GBP publishing only after OAuth, platform permissions, preview, rate limits, error recovery, and owner test evidence are complete.
6. Add approved content-performance rollups linked to source project and channel without turning low-quality vanity metrics into business decisions.
7. Continue core business hygiene: real materials/costs, product facts, accessibility, Search Console/GBP evidence, provider testing, and real-device screenshots.

## Release-readiness opinion

Build 199 is ready for D1 migration and Pages deployment after local checks. It should not be called a fully automated video/publishing system until actual render jobs and platform publishing have been tested with real credentials and outputs. The review-first archive and content-plan foundation can safely go live first.
