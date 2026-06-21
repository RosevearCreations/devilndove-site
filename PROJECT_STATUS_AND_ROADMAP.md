# Devil n Dove Project Status and Roadmap — Build 193

This is the primary human/business roadmap. Read `AI_HANDOFF.md` for technical deployment details and `MARKDOWN_INDEX.md` for the remaining specialist references.

## Executive sanity check

Devil n Dove is a full small-business operating platform: storefront, handmade/vintage presentation, custom requests, product/media workflows, inventory and cost groundwork, marketplace exports, gift cards, local SEO, customer proof, accounting support, and deployment controls.

The app is now structurally broad enough. The biggest value is no longer more isolated dashboards. It is **real operational data, approved photographs, live verification, and a calmer daily workflow**.

Build 193 converts the remaining live-only work into a tracked, evidence-based playbook inside `/admin/command-center/`. It also adds an R2 multipart/resume workflow for larger mobile images so poor connectivity does not force a full restart.

## Build 193 completed — 20 practical improvements

1. Added a Command Center Live Readiness Playbook with detailed owner test steps.
2. Added 15 prioritized live-readiness cases covering costs, margins, mobile, R2, SEO, GBP, Stripe, email, performance, and legacy admin consolidation.
3. Added status, notes, evidence-link, and run-history records for every live test.
4. Added Markdown export of the current live testing playbook.
5. Added a no-secret test evidence rule in the admin workflow.
6. Added actual R2 multipart upload session metadata.
7. Added multipart part tracking so completed mobile upload parts are not resent.
8. Added secure admin-only upload-session creation, progress, completion, and abort actions.
9. Added product-image attachment after a resumable R2 upload completes.
10. Added featured-image fallback when a completed resumable upload is the first image.
11. Added a phone-facing “Safer large-photo upload” panel.
12. Added clear recovery instructions: save/reopen a text-only draft, reselect the same file, resume.
13. Added 50 MB file protection and 5 MB chunk sizing for the mobile resume path.
14. Added Command Center usage events to support evidence-based legacy-page consolidation.
15. Added responsive CSS for test cards, evidence forms, and mobile upload status.
16. Preserved one-H1 rules: new operational panels use H2/H3 only.
17. Updated all main schema files and current upgrade SQL with Build 193 additions.
18. Updated the canonical roadmap/handoff and specialist documentation.
19. Added a dedicated `LIVE_TESTING_GUIDE.md` for step-by-step owner testing.
20. Added static Build 193 test-plan/report files for future AI/developer handoff.

## Current strengths

- One-H1, title/meta, canonical, descriptive image-alt, structured-data, sitemap, and local-page guardrails.
- Product readiness, cost/margin gates, marketplace validation, and reviewed temporary overrides.
- Mobile and desktop product administration with D1 field recovery.
- Consent-controlled public proof, customer stories, and before/after gallery foundations.
- Responsive visual placeholders, low-bandwidth support, reduced-motion handling, and image-role guidance.
- Search Console CSV mapping, GBP evidence records, local freshness tasks, and performance schedules.
- Deployment preflight, release control, smoke tests, fallback handling, and Cloudflare environment checks.
- A two-file canonical Markdown handoff system with historical archives retained.

## Current risks and limitations

1. Actual fee and cost values still need owner entry before margins become reliable.
2. R2 multipart upload and derivative generation require a deployed R2 binding for real verification.
3. The derivative worker still needs to create real WebP/AVIF files and write final `srcset`.
4. Browser security requires reselecting a file after a page reload; the server remembers completed parts, not browser file bytes.
5. Real workshop/product photography remains more valuable than any placeholder.
6. Search Console remains export/scheduled-import based until OAuth/API credentials are deliberately chosen.
7. GBP evidence is manual by design; the app cannot query or promise a local ranking position.
8. Customer duplicate suggestions require a human review; shared household emails must not be merged automatically.
9. Stripe webhook, email delivery, R2 signed reads, and Cloudflare API actions require live test evidence.
10. Low-use admin pages should not be removed until usage data shows the Command Center is a safe replacement.

## SEO and competitive direction

Google recommends clear, useful titles and headings, relevant on-page text around images, descriptive alt text, crawlable links, and a mobile page experience with content parity. Google Business Profile says local results are mainly based on relevance, distance, and prominence, so the app improves controllable signals but cannot guarantee first-page placement. Etsy guidance continues to emphasize accurate first photos, clear listing information, real product context, and trust-building presentation.

Keep the public-site habits:

- One visible H1 per route.
- A clear unique page title and useful meta description.
- Descriptive alt text that explains the actual image.
- Real approved images near relevant copy.
- Accurate local/service wording—never fake location coverage.
- Structured data that matches the visible page and true price/stock facts.
- Mobile content parity with desktop.

## Next 20 highest-value steps

1. Enter reviewed Stripe, Etsy, PayPal, marketplace, and local-sale fee settings.
2. Enter actual material, labour, packaging, overhead, and waste costs for the main product families.
3. Review individual high-value or custom products with product-specific costs.
4. Run the marketplace unhealthy-margin gate using a disposable test draft.
5. Run the mobile D1 draft-recovery test on a phone.
6. Run the new resumable R2 upload test with a non-sensitive test photo.
7. Deploy and verify a real R2 WebP/AVIF derivative worker.
8. Replace the homepage workshop placeholder with one approved real workshop image.
9. Replace one product/listing placeholder with an approved real product/scale photo.
10. Add one approved consented before/after gallery item.
11. Export and import one real Search Console report after checking headers and sample rows.
12. Complete the first monthly GBP evidence record.
13. Review customer duplicate candidates manually and record outcomes.
14. Run a Stripe dashboard test webhook and verify de-duplication.
15. Run an owner-only email provider test send while customer automation remains disabled.
16. Run R2 upload, signed-read, expiry, and delete verification.
17. Record mobile and desktop Lighthouse/PageSpeed measurements.
18. Capture real-device evidence for narrow phone, large phone, tablet, laptop, and large desktop.
19. Use Command Center daily for several weeks and collect usage events.
20. Review legacy page usage before redirecting, consolidating, or retiring any destination.

## Release readiness opinion

Build 193 is ready for deployment after its D1 migration and normal preflight checks. Business readiness depends on the live-playbook steps: real data, approved media, provider tests, actual devices, and evidence-based use of the Command Center.

Do not claim guaranteed local rankings, automated financial accuracy, or completed live provider checks until supporting evidence is saved.
