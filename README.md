# Devil n Dove — Build 225 Entry Point

Read these first:
1. `AI_HANDOFF.md`
2. `PROJECT_STATUS_AND_ROADMAP.md`
3. `STARTUP_GO_LIVE_GUIDE.md`
4. `PACKAGING_STUDIO.md`
5. `MARKDOWN_INDEX.md`

## Build 225 operating additions
- Startup Readiness Cockpit: `/admin/startup-readiness/`
- Soap Label Studio: `/admin/packaging/soap-labels/`
- Packaging Studio: `/admin/packaging-studio/`
- Product Release Preflight: `/admin/release-preflight/`
- Deployment Preflight: `/admin/deployment-preflight/`
- Current migration: `database_build225_startup_readiness_packaging_authority.sql`
- Identical current-pass migration: `database_upgrade_current_pass.sql`

Apply one current migration file, not both.

Build 225 stores launch-gate status, owner, due date, evidence, blocked reason, completion, and history in D1. `PACKAGING_STUDIO.md` is the single packaging and soap-label source of truth. Builds 223–224 product-detail and seven-image gallery fixes remain included.
