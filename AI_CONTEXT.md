# Devil n Dove AI Context — Build 279 Pointer

Read `AI_HANDOFF.md` first and `PROJECT_STATUS_AND_ROADMAP.md` second. They are the only cross-project current authorities. Build 274 clarifies one Creative Process lifecycle for maker and content-only work, separates planned material estimates from actual Inventory posting, and adds audited edit/void/correct usage. It requires focused migration `database_build274_creative_process_lifecycle_corrections.sql` after the retained Build 269 CAIP migration boundary.


Build 276 added reference-only Inventory links for Packaging ingredients. Build 277 restores separate English/French ingredient panels and widens claim spacing again. Build 276 remains the Packaging schema boundary.

Build 279 adds an admin-only page-wide public Edit switch and a live Media Studio checklist for all 139 static visual slots; no D1 migration is required.


Build 279 hardens Cloudflare runtime efficiency before go-live: lightweight/fail-open analytics, no idle Live Activity polling, opt-in release checks, bounded retries, slimmer CAIP multipart work and Workers Logs enabled. No new production D1 migration is required.
