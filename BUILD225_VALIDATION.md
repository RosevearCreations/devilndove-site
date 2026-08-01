# Build 225 Validation and Deployment Guide

## Build purpose
Build 225 replaces the static startup checklist with a D1-backed Startup Readiness Cockpit and makes `PACKAGING_STUDIO.md` the single packaging and soap-label specification. It retains the Build 223 product-detail repair and Build 224 seven-image gallery repair.

## Deployment order
1. Back up production D1 and record the backup location/date.
2. Apply `database_build225_startup_readiness_packaging_authority.sql` **or** the identical `database_upgrade_current_pass.sql`, not both.
3. Deploy the complete Build 225 ZIP rather than selected files.
4. Open `/admin/startup-readiness/` and confirm all 37 gates load.
5. Follow the production/manual checks below and record evidence in the cockpit.

## Startup Readiness functional checks
1. Open `/admin/startup-readiness/` while signed in as an administrator.
2. Confirm the default **Open only** filter, search, severity filter, section filter, progress, and launch-state summary work.
3. On a disposable gate, set **In progress**, owner, due date, and evidence notes. Save and refresh; the information must persist.
4. Set **Blocked** without a reason; the API must reject it with a clear validation message.
5. Set **Complete** without evidence notes/link; the API must reject it.
6. Add evidence and use **Mark complete**; the item must close and appear in Recent status history.
7. Use **Reopen**; the item must return to In progress and create another history row.
8. Simulate a network or 5xx failure. The browser may retain the attempted change, but the card and page must state that it is **Unsynced** and must not claim D1 success.
9. Restore connectivity and use **Sync browser changes**. Confirm the Unsynced marker disappears only after a successful server save.
10. Use **Download status report** and confirm the Markdown contains every gate, status, owner, evidence, detailed instructions, and pass condition.

## Packaging authority checks
1. Open `/admin/packaging-studio/` and `/admin/packaging/soap-labels/`.
2. Confirm both interfaces identify `PACKAGING_STUDIO.md` as the single source of truth.
3. Confirm the root and docs-tree `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md` files are short compatibility pointers rather than independent editable specifications.
4. Confirm `PACKAGING_STUDIO.md` contains the complete user-provided Version 1.0 specification verbatim, followed by the current implementation mapping and maintenance directive.
5. Repeat the Build 222 physical SVG/print-proof tests before approving any actual soap label.

## Automated validation results
- JavaScript syntax: **494 files passed; 0 failed**.
- Exposed HTML: **104 pages checked; every page has exactly one H1, a title, and a meta description**.
- Public indexable pages: **40 pages identified**; public metadata/canonical checks passed.
- Key local-search pages: **16 pages passed** title, description, canonical, structured-data, H1, image-alt, and local-term checks.
- Local static references: **1,028 script/style/image/data references checked; 0 missing**.
- CSS: **2,284 opening and 2,284 closing braces**.
- JSON: **25 key JSON files parsed; 0 failed**.
- SVG/XML: **39 SVG files parsed successfully**.
- Aggregate schemas: `database_full_schema.sql`, `database_store_schema.sql`, and `database_schema.sql` executed successfully in fresh SQLite databases and contained all readiness, Packaging Studio, and normalized soap-label tables.
- Build 225 migration: applied twice successfully; **37 readiness gates remained exactly 37 and an operator status/owner/evidence edit was preserved**.
- Migration identity: `database_build225_startup_readiness_packaging_authority.sql` and `database_upgrade_current_pass.sql` are identical.
- Packaging authority: the embedded Version 1.0 user specification matched the uploaded specification exactly (**18,051 characters**).
- Static deployment preflight: **ready, 0 blockers, 0 warnings**.
- Final deployment blocker check: **passed**.
- Merge markers and generated Python cache files: **none**.
- Release manifest: generated as **Build 225**.

## Production evidence still required
Static/package checks cannot prove production secrets/bindings, login recovery, lower-role denial, payment provider signatures, exact-once webhooks, inventory concurrency, tax/shipping results, email delivery, physical label fit, cosmetic notification, R2 recovery, paid fulfilment, refund recovery, or launch-day ownership. These remain explicit gates in `/admin/startup-readiness/` and `STARTUP_GO_LIVE_GUIDE.md`.

## Rollback
If deployment or migration testing fails:
1. Stop public promotion/checkout if customer-impacting.
2. Restore the prior Pages deployment.
3. Restore D1 from the recorded backup only when the migration/data state requires it.
4. Preserve runtime, deployment, and provider evidence before retrying.
5. Record the failure and recovery in Startup Readiness rather than marking the gate Complete.
