# Devil n Dove — Build 227 Entry Point

For a new AI/chat, read only these two files first:

1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`

Use `MARKDOWN_INDEX.md` to find specialist or historical evidence only when the task requires it.

## Current operating routes

- Startup Readiness: `/admin/startup-readiness/`
- Labeling & Packaging System: `/admin/packaging-studio/`
- Client Documents: `/admin/customer-documents/`
- Social Publishing and Meta tests: `/admin/social-publishing/`
- Orders/refunds: `/admin/orders/`
- Accounting: `/admin/accounting/`
- Inventory: `/admin/inventory-operations/`

## Current migration

Back up D1. Apply `database_build227_unified_business_operations.sql` or the identical `database_upgrade_current_pass.sql`, not both. The Build 225 readiness/packaging baseline must already exist.

Follow `BUILD227_VALIDATION.md`, `POST_DEPLOY_SMOKE_TEST.md` and the 37 database-backed launch gates before opening.
