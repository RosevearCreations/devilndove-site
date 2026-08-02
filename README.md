# Devil n Dove — Build 230 Entry Point

For a new AI/chat, read `AI_HANDOFF.md`, then `PROJECT_STATUS_AND_ROADMAP.md`. Use `MARKDOWN_INDEX.md` only to locate a scoped operating playbook or historical evidence.

Current control surfaces:

- Startup Readiness: `/admin/startup-readiness/` (43 gates, including the Critical missing-image blocker)
- Visual Image Manifest: `/admin/image-manifest/` (20 D1-backed requirements plus an honest read-only fallback)
- Prelaunch Process Map: `/admin/prelaunch/`
- Creative Automation Studio: `/admin/creative-automation/`
- Labeling & Packaging: `/admin/packaging-studio/`
- Client Documents: `/admin/customer-documents/`
- Orders, accounting and inventory: `/admin/orders/`, `/admin/accounting/`, `/admin/inventory-operations/`

Back up D1 and confirm Build 229. Apply `database_build230_visual_image_manifest.sql` or the identical `database_upgrade_current_pass.sql`, not both. Do not add explicit SQL transaction statements. Follow `BUILD230_VALIDATION.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md` and all 43 Startup gates before opening. Packaging direction remains anchored by `PACKAGING_REFERENCE_BASELINE.md`; visual status/evidence is in D1 with `IMAGES_REQUIRED.md` and `GENERATED_VISUAL_ASSET_REGISTER.md` as specialist guides.
