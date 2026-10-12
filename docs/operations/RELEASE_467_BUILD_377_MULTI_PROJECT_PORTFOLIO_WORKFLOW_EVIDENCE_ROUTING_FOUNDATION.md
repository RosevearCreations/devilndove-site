# Release 467 Build 377 — Multi-Project Portfolio, Workflow & Evidence Routing Foundation

## Application delivery

New [Multi-Project Workflow & Evidence Routing](/admin/project-workflow-routing/) is linked from the admin home and System-wide Project & Discovery Portfolio. Authenticated GET `/api/admin/project-workflow-routing?cursor=0&limit=25` uses keyset pagination with strictly validated cursor, maximum 50 per request, and two read-only D1 queries (project rows and total). Filters apply only to the loaded page; previous/next navigation maintains source cursor history. All active projects are eligible regardless of ID, title or type. Each row has a canonical Creative Process URL, observed work events, selected real evidence, CAIP source presence, Maker Story profile and human review status. It derives unfinished stages and the next safe operator action; **no synthetic task row, assignment, completion, review or publishing action** is written.

The workflow is foundational and explicitly not a full independent task-manager or completed evidence verification. Review and public/media rights decisions remain human-controlled. No new environment variables, database migration, subscription costs, provider requests or R2 writes are required.

## Development evidence

Read-only Development D1 measurement has two statements to inspect all active project routing sources and relational integrity, bounded to 20,000 provider rows read. Build-specific source contract additionally verifies fail-closed authentication, source-derived steps, no hard-coded project ID, pagination, bounded queries and UI navigation.

## Exact proven predecessor

Build 376 Development `94c5c0868054108998a648b4e169a464f83c1e93` Production `f91124ccc8f93a64ce2a2afb939776e629e41ccc`, shared tree `6cc4ab9a39c37e62bb3dc0df55dd12f0df64ea5c`. Exact Development proof workflows 38160832487, 38160832541, 38160832512, 38160832494, 38160832420 and D1 guard 38160644907. Production Pages 38161002762, live resources 38161072785.

## Next queued

**Build 378 — Cross-Project Workstations, Equipment & Capacity Planner**. Future Builds 379–384 deliver shared work orders, material costing, schedules, customer commissions, accounting and system analytics. The release queue does not refocus on any one named project.
