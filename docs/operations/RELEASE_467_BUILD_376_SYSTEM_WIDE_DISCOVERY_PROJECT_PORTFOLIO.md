# Release 467 Build 376 — Search Console Real Export & Fresh Discovery Intake XI

## From one-project release loops to a shared system

Build 375 finished GREEN with Dev `c59a7a7c82b705462a378d6b5eb4a2aac10cfdfe`, main `8e5400227cb209b9f821aaf987b809062fe3eb87`, matching tree `802af36bd8b3b9c2bcc7a6d7e6791cfb58c9b174`. This Build 376 still maintains genuine Google Search Console Performance CSV-only intake, explicit report-date freshness within 30 days, import audit traceability, human reviewed SEO action and no automatic import or provider execution.

**New working application feature:** /admin/project-discovery-overview/ (linked from Admin). Authenticated read-only dashboard displays every active Creative Process project (bounded to 100, with truncation warning), Maker Story profile coverage, active event counts, selected evidence, linked CAIP presence, project-specific deep links and verified Search Console report-date freshness. Uses one project-list D1 query, one count and one Search Console aggregate; no per-row HTTP fetches, no N+1 requests, no raw private media links, no schema migration or writes. Errors expose safe retry information rather than raw SQL. User-initiated Refresh only, no automatic polling.

## Release evidence

The 10-statement read-only Development D1 measurement repeats Build 370's nine audited Search Console queries and appends the portfolio of active projects. Verifier enforces canonical schema, batch/row reconciliations, operator CSV source and import audits, valid explicit report dates, zero FK violations, 20,000 provider rows-read ceiling and distinct project IDs. Production D1 is never queried by CI.

## Forward roadmap

Build 377: Multi-Project Portfolio, Workflow & Evidence Routing Foundation; Builds 378–384: workstations, equipment, work orders, inventory/costing, scheduling, customers and business financials. See `docs/operations/RELEASE_467_SYSTEM_WIDE_PLATFORM_BUILDS_377_384.md`.

## Operator use

Visit /admin/project-discovery-overview/ after signing into Admin. Click Open project for any active project. Genuine Search Console data comes from explicit user-provided exports through existing authorized import UI. Absence of exports means evidence-pending, not a failure of the portfolio.

## Exact Development measurement (system-wide)

The 10-statement read-only Development D1 measurement [workflow 38160645007](https://github.com/RosevearCreations/devilndove-site/actions/runs/38160645007) used 2,095 of 20,000 rows-read budget: statement counts 1685, 6, 319, 1, 1, 2, 1, 1, 46, 33. Evidence artifact 11710131448 (SHA256 61bd0ca5164358d9a633367edc6d39e8731d4c501ccd203cee02d3c300c9f986). Across the system, 5 active Creative Process projects, 5 linked CAIP workspaces, 2 Maker Story profiles and 2 projects with active events. Projects measured: lime in you coconut; Shirley Not; 35th promo; Grey Hair; Under the Sea. The two profiles belong to 35th promo and Under the Sea. The real Search Console record set remains 0 batches, 0 rows, 0 recent report rows, with no imported results or eligibility claimed. Decision: EVIDENCE_PENDING_NO_REAL_EXPORT. Missing real exports require an operator action, not synthetic fill.
