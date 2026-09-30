# Release 467 Build 311 — Buyer Discovery Evidence Freshness & Search Intake

Build 311 starts from exact Build 310 Development/Production GREEN.

The goal is to remeasure real discovery evidence for reviewed Workshop Journal stories and reviewed Products, expose evidence freshness and attribution clearly, and make Search Console intake fail closed when its canonical schema is unavailable. Zero views, clicks, impressions or staged Search Console rows remain valid factual evidence and are never synthesized.

## Search Console intake hardening

The existing Search Console CSV workflow remains explicit operator-controlled intake. Build 311 removes request-time schema creation/alter/index repair from the Search Console import endpoint. The endpoint now performs read-only schema readiness checks against the existing canonical tables and returns a blocked response when required tables are missing.

Required existing tables:

- `search_console_import_batches`
- `search_console_page_queries`
- `seo_opportunity_actions`
- `seo_page_overrides`

No schema migration is introduced by Build 311.

## Freshness and attribution

The Development evidence capture measures a 30-day window and reports:

- published reviewed Workshop Journal story coverage;
- public page-view freshness, including the latest stored page-view timestamp;
- Search Console row/click/impression freshness and latest report date;
- most recent Search Console import batch and staged-row count;
- Search Console attribution split between reviewed-story URLs, reviewed Product URLs and other public URLs;
- active reviewed Product factual discovery readiness;
- dynamic sitemap story/Product coverage;
- required Search Console table readiness and foreign-key integrity.

The admin Buyer Discovery panel surfaces the same freshness/readiness concepts and links to the existing Search Console import workspace.

## Boundaries

- Development D1 measurement is read-only.
- No Search Console CSV/API import runs automatically.
- No page views, clicks or impressions are fabricated.
- IndexNow remains explicit-owner-only and still requires `SUBMIT INDEXNOW`.
- No social, marketplace or other provider execution occurs.
- No Production D1 query or business-data mutation occurs during Build 311 evidence capture.
- Production promotion is code-only and promotes the exact verified Development tree.

Next after Build 311 Production GREEN: **Build 312 — Content Adoption Coverage Outcomes Renewal II & Roadmap Renewal**.
