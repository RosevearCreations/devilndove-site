# Repo Rules

Current sync: 2026-05-10 cleanup pass.

## Required every pass
- Update active Markdown docs when behavior, schema, routing, or workflows change.
- Update schema files when DB expectations change.
- Keep `database_upgrade_current_pass.sql` limited to the next deployable migration batch.
- Keep one H1 per exposed public/admin HTML page.
- Run JavaScript syntax checks.
- Check for missing linked scripts and styles.
- Check CSS for drift on public and admin pages.
- Keep SEO titles, descriptions, and main headings clear and locally relevant.

## API rule
Only `/functions/api/` is active backend API code. Do not add or restore duplicate root-level API `.js` files.

## Data rule
Use D1 for authoritative app data. Use JSON only as fallback, static bridge, import template, export, or recovery snapshot.

## Archive rule
Do not edit archived files as if they are active. Use `/archive/` only for history and rollback reference.

## Accounting rule
Do not describe accounting as complete until payment application, journal posting validation, reconciliation review, sales-tax review, period close, and accountant export are working end to end.
