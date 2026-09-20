# Release 467 Build 212 — Hybrid Creative Project Operations

## Goal

Add ordered multi-process manufacturing-operation plans to the existing Creative Process project authority so a single project can combine laser, resin, CNC, metalwork, 3D printing, Cricut/vinyl/HTV and other canonical workshop processes without creating a second project manager.

## Exact starting boundary

Build 211 **Manufacturing Triage & Route Proposal** is fully Production GREEN.

- Development SHA: `a7f07b18a4a3b24db1a148ec287cbf446041f573`
- Production main: `41bf65727771c7c302c022d0944945a0802a909d`
- Shared tree: `b80ccbfb772ccc4384e6fc0a2c53a62341e4caf7`
- Development proofs: `35524455791` / `35524455693` / `35524455845` / `35524455852`
- Build 211 Development proof: `35524455858` (attempt 2)
- Production Pages / Live Resources: `35524655164` / `35524741052`
- Product Browser / Route: `35524741050` / `35524741073`
- Build 211 Production proof: `35524655209`
- Exact Production URL: `https://1d28f0f1.devilndove-site.pages.dev`

Primary roadmap: `docs/operations/RELEASE_467_AUTONOMOUS_EXECUTION_BUILDS_205_224.md`.

## Existing authority extended

- `creative_work_projects` remains the Creative Process project authority.
- `creative_work_events` remains actual project-event/time/material evidence.
- `inventory_processes` remains canonical workshop-process identity.
- `site_item_inventory` remains Inventory identity and stock authority.
- CAIP `creative_projects` / `creative_assets` remain media/evidence authorities.
- Existing Creator/Finance authorities remain actual cost/profitability owners.

## Build 212 schema

Canonical migration `0012_release467_hybrid_creative_project_operations.sql` adds:

- `creative_project_operations` — ordered process-linked operation plans;
- `creative_project_operation_dependencies` — explicit predecessor/dependency evidence;
- `creative_project_operation_resources` — planning-only references to active Inventory items.

Each operation may store a canonical process, order, planning status, responsible workspace, setup notes, planned duration, output/evidence requirement and notes.

## Admin workflow

The planner is embedded directly in `/admin/creative-process/`.

Staff can:

1. choose an existing Creative Project;
2. add/edit operations using canonical `inventory_processes`;
3. reorder the operation sequence;
4. add predecessor dependencies only to earlier operations;
5. search active Inventory and reference planned materials/tools/consumables/fixtures;
6. retire an operation without claiming that actual execution was erased.

## Non-overlap / safety boundary

- No parallel project manager.
- No parallel process taxonomy.
- No Inventory reservation or consumption.
- No `creative_work_events` creation from operation planning.
- No CAIP media creation/mutation.
- No Finance posting or cost fact invention.
- No automatic provider/payment/publication action.
- No request-time DDL.
- Production business data remains Production-owned.

## Acceptance

1. One Creative Project can contain multiple ordered canonical-process operations.
2. Dependencies reference operations in the same project and predecessors must be earlier in the sequence.
3. Planned materials/tools reference active Inventory rows without changing Inventory.
4. Planned setup, duration and output/evidence requirements are visibly separate from actual Creative Process events.
5. Invalid project/process/resource references, cross-project dependencies, duplicate operation orders and foreign-key violations are zero.
6. The exact Development head passes System, Quality, I.T., Hygiene and Build 212 proof before Production promotion.

## Next

Release 467 Build 213 — Digital Proof & Customer Approval — remains blocked until Build 212 is exact-SHA Production GREEN.
