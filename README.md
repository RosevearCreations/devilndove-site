# Devil n Dove — Build 233 Entry Point

For a new AI/chat, read `AI_HANDOFF.md`, then `PROJECT_STATUS_AND_ROADMAP.md`. Use `MARKDOWN_INDEX.md` only to locate a scoped operating playbook or historical evidence.

Current control surfaces:

- Startup Readiness: `/admin/startup-readiness/` (43 gates, including the Critical missing-image blocker)
- Visual Image Manifest: `/admin/image-manifest/` (20 D1-backed requirements plus an honest read-only fallback)
- Prelaunch Process Map: `/admin/prelaunch/`
- Creative Automation Studio: `/admin/creative-automation/`
- Labeling & Packaging: `/admin/packaging-studio/`
- Client Documents: `/admin/customer-documents/`
- Orders, accounting and inventory: `/admin/orders/`, `/admin/accounting/`, `/admin/inventory-operations/`

Build 233 is a code-only login/session and Worker-startup resource-limit hotfix retaining the Build 231 autosave/reload and Build 232 archived-product removal repairs. Login POST no longer runs per-request schema discovery or rereads the new session, a temporary 5xx/network session check no longer erases a valid browser token, and the private 897-row Amazon registry is compressed/demand-loaded instead of allocated by unrelated routes. Back up D1 and confirm Build 229; apply `database_build230_visual_image_manifest.sql` or the identical `database_upgrade_current_pass.sql` only if its ledger key is not already present, never both. Do not add explicit SQL transaction statements. Follow `BUILD233_VALIDATION.md`, `PRELAUNCH_PROCESS_PLAYBOOKS.md` and all 43 Startup gates before opening. Packaging direction remains anchored by `PACKAGING_REFERENCE_BASELINE.md`; visual status/evidence is in D1 with `IMAGES_REQUIRED.md` and `GENERATED_VISUAL_ASSET_REGISTER.md` as specialist guides.
