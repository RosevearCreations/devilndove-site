# Sanity Health Check — Build 200

## Local static/implementation status

- Build 200 adds a review-first Content Release Board and public Workshop Journal/Gallery output path on top of the Build 199 source-linked content package.
- The publication layer stores only public copy/settings and references to selected public-allowed source media. It has no media deletion, R2 move, automatic social posting, or video encoding path.
- The public API returns published content only and provides an empty safe fallback before the Build 200 migration is applied.
- The Workshop Journal and Gallery use progressive enhancement: original static content remains visible when D1/public content is unavailable.
- New mobile CSS keeps release controls, status chips, publication previews, checklists, editors, and metric forms reachable at phone width.

## Local validation completed

- 455 JavaScript files passed `node --check`.
- 48 public HTML files passed the one-H1 check.
- The stylesheet brace count is balanced (1,472 opening and 1,472 closing braces).
- Build 199 followed by Build 200 ran twice successfully in a fresh SQLite migration test, leaving one ledger row for each release.
- A seeded release-flow test confirmed a published gallery record resolves its related Workshop Journal path, and source-media rows stay unchanged after unpublish or deletion of a publication record.
- Service-worker shell cache is now `devilndove-shell-v5`.

## Required deployment proof

- Run Build 200 migration and record the ledger row.
- Prove product source media has not changed before/after preparing/releasing a publication.
- Prove draft, approve, publish, public visibility, and unpublish behaviors on one disposable product.
- Inspect public image URLs, alt text, source/product link, canonical path, Article/ImageGallery JSON-LD, page H1, and noindex admin pages on the deployed domain.
- Inspect Cloudflare Function logs for Content Studio, Content Release Board, and public Workshop Journal endpoints.

## Explicit gaps

- No actual MP4 rendering/provider execution yet.
- No OAuth direct social/YouTube/GBP publishing.
- No server-rendered per-story HTML or automatic sitemap submission yet; verify Search Console before expecting scalable article indexing.
- No remote media dimension/file-validation at publication time; final GBP and platform media checks remain manual.
- No claim that manual metrics are automatic analytics or sales data.
