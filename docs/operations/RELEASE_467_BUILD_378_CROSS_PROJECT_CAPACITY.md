# Release 467 Build 378 — Cross-Project Workstations, Equipment & Capacity Planner

## Operator URL
/admin/project-capacity-planner/

## System boundaries
Read-only, authenticated and bounded. Source project authority: `creative_work_projects`. Planned tool/fixture demand: `creative_project_operations` and `creative_project_operation_resources`. Maker Story source references: `creative_project_maker_story_workstations`. Canonical station Tools: `inventory_workstation_roles` and `site_item_inventory`. A Tool/Supply may reference many valid station Tools through `inventory_workstation_memberships`. No shadow Inventory, project or station catalogue.

## Capacity interpretation
The planner shows demand by active project, station tool, linked equipment and project links. A shared station linked to two projects is **potential contention**, not a simultaneous booking. Multiple station memberships are **alternatives**, not mandatory simultaneous allocations. No authoritative dated reservation table, operator-confirmed occupancy or opening-hours/capacity source is in Build 378. Display **AVAILABILITY UNVERIFIED** until Build 381 (calendar and allocation authority); never claim a machine is idle, booked or available from missing data.

Unmapped required tool/fixture records surface separately. Page limits: 25 projects; 160 station tools; 400 Maker Story links; 800 operation-resource/station candidate rows. Pagination is keyed on canonical project ID, and truncation warnings prevent false completeness claims.

## Acceptance and verification
- Run `node --test scripts/release467_build378_capacity.test.mjs`.
- Run `node --check` for new Function and client JS.
- Review admin GET 401 for unauthenticated request; 400 for invalid cursor/limit; 503 for missing D1. Server returns no private media.
- Development source proof, runtime/quality and branch hygiene must pass for exact dev HEAD; production should deploy the identical Git tree, with passing Pages and live-integrity workflows.
- No D1 migration, mutation, provider call or extra Cloudflare deployment services needed.

## Recovery
Revert the page and GET route as code-only changes. Existing Creative Process/Inventory records are untouched.

**Next queued: Build 379 — Work Orders, Task Sequencing & Time Capture.**
