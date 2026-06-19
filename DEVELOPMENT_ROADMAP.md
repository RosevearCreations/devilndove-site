# Development Roadmap — Current Build 191

> Canonical direction: read `PROJECT_STATUS_AND_ROADMAP.md` first. Historical roadmap content remains under `docs/archive/`.

## Build 191 completed — 20 value-added steps

1. Configurable sales-channel fee settings.
2. Product-family material/labour/packaging/overhead/waste defaults.
3. Channel-aware Product Readiness margin calculation.
4. Marketplace CSV hard margin gate.
5. Audited temporary margin overrides.
6. Customer timeline search/private notes.
7. Four-output customer-story draft builder.
8. Consent evidence links in story records.
9. Search Console CSV mapping/sample preview.
10. Monthly GBP reminders.
11. Review-request eligibility rows.
12. Approved public before/after/process gallery.
13. Phone and desktop image-role prompts.
14. Authenticated D1 mobile draft snapshots.
15. Deployed performance imports.
16. Responsive derivative publication queue.
17. Owner Daily summary history.
18. Campaign readiness checks.
19. Local freshness and real-device QA evidence.
20. Environment configuration verification.

## Next 20

The next 20 steps are maintained in `PROJECT_STATUS_AND_ROADMAP.md` to avoid duplicate task lists.

## Roadmap rule

Prefer integration into Command Center, Products, Members, Local SEO, Marketplace, Visual, or Deployment surfaces. A new admin page must have a clear owner workflow that cannot reasonably fit an existing surface.


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
