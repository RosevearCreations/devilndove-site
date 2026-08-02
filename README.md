# Devil n Dove — Build 234 Entry Point

For a new AI/chat, read `AI_HANDOFF.md`, then `PROJECT_STATUS_AND_ROADMAP.md`. Use `MARKDOWN_INDEX.md` only to locate a scoped operating playbook or historical evidence.

Current control surfaces:

- Startup Readiness: `/admin/startup-readiness/` (44 D1-backed gates, including missing launch images and candle-top physical proof)
- Labeling & Packaging: `/admin/packaging-studio/` (one soap, candle-top, round engraving, label/card/insert, BOM, version and proof system)
- Creative Automation Studio: `/admin/creative-automation/` (guarded cleanup for unused accidental duplicate projects)
- Visual Image Manifest: `/admin/image-manifest/` (20 D1-backed requirements plus an honest read-only fallback)
- Prelaunch Process Map: `/admin/prelaunch/`
- Client Documents: `/admin/customer-documents/`
- Orders, accounting and inventory: `/admin/orders/`, `/admin/accounting/`, `/admin/inventory-operations/`

Build 234 makes the selected packaging template authoritative, rebuilds the approved soap ribbon around permanent static brand elements and centred SVG text, adds editable wedding/general candle tops and reusable exact-size templates, embeds artwork in SVG exports, and adds guarded deletion of unused Creative Project duplicates while preserving real products and meaningful work. Packaging, Creative Process, Creative Automation and Startup Readiness no longer execute schema DDL on request; all 44 Startup definitions now install through the migration.

Back up D1 and confirm ledger keys `build229_packaging_reference_authority` and `build230_visual_image_manifest`. Apply `database_build234_packaging_templates_creative_cleanup.sql` or the identical `database_upgrade_current_pass.sql`, not both. The migration contains no explicit SQL transaction statement. Deploy the full package, hard refresh to service-worker shell v15 and follow `BUILD234_VALIDATION.md`, `STARTUP_GO_LIVE_GUIDE.md` and `PRELAUNCH_PROCESS_PLAYBOOKS.md` before opening.

SEO remains evidence-led: one H1 per exposed page, clear titles/main headings, truthful local wording, accurate structured data, descriptive real media and no first-page guarantee. Admin pages remain `noindex,nofollow`.
