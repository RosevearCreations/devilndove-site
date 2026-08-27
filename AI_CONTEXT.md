# AI Context — Compatibility pointer — Build 440

The current Devil n Dove Development truth is maintained in exactly two mutable canonical documents:

1. `AI_HANDOFF.md` — architecture, authority boundaries, release/deployment rules and current technical state.
2. `PROJECT_STATUS_AND_ROADMAP.md` — ordered status, open acceptance work and next steps.

Current release markers:

- Development: **Build 440** (`development-release.json`)
- Production baseline: **Build 437**
- Production promotion: **CLOSED**

Important current invariants:

- D1 is authoritative for Product/Inventory operational state.
- Desktop and mobile Product resource saves share one atomic persistence authority.
- Tool/Supply public eligibility is Catalog-owned; live identity/metadata is Inventory-owned.
- Legacy Tool/Supply JSON is emergency read-only fallback only.
- Request-time schema repair is not an accepted Product/Inventory/Tool architecture.
- Numbered Build/migration documents are historical evidence unless the canonical handoff explicitly names them as active.
- `database_upgrade_current_pass.sql` is a legacy Build 264 compatibility snapshot, not the Build 440 release authority.
- Build 440 source/CI is green; exact-head Development live acceptance is the next release-closing stage.
- Build 439 CAIP media/video live-browser acceptance remains a separate open item.

Do not restore older “current release” descriptions from historical chats or files.
