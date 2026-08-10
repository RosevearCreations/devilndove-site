# New Chat Status — Build 245 Pointer

Start with `AI_HANDOFF.md`, then `PROJECT_STATUS_AND_ROADMAP.md`. Build 245 is the current D1 migration boundary. Apply `database_build245_admin_media_resilience.sql` or byte-identical `database_upgrade_current_pass.sql`, not both. Build 245 includes the Build 244 D1 inventory/fractional transition, retains cached admin UI identity on temporary 5xx while keeping server API authorization mandatory, reduces admin request fan-out, restores recoverable product gallery references non-destructively, and fixes Product Readiness blocker navigation.
