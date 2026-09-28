# Release 467 Build 285 — Real Inventory Linkage Prerequisite Inventory

## Goal

Measure the **existing** Development prerequisites for real Creative Process ↔ Inventory adoption before Build 286 changes any operator workflow.

Build 285 is read-only. It measures Creative Process material events, hybrid operation plans, operation-resource references, Product/resource links, active Supply/Tool Inventory associations, and whether the current schema contains a direct event/resource linkage.

## Existing workflow support

Build 212 already provides an operator-visible **Save planned resource** action in the Creative Process workspace. It searches active Inventory and stores planning-only `creative_project_operation_resources` references. The API explicitly reports `inventory_mutation:false`.

Build 285 therefore distinguishes two questions:

1. **Data gap** — do real existing projects actually contain Supply/Tool resource references that overlap projects with material events?
2. **Workflow/schema gap** — can a real material event be explicitly bound to the operation/resource that should supply its Inventory identity, rather than relying on name inference or a temporary fixture?

## Exact predecessor

Build 284 is fully GREEN:

- Development SHA: `64bc134807fb8a353f2a33c09d4fa7563684339b`
- Production main: `0ad2adcec970d3dc96336bdee88192fea32531a9`
- shared tree: `eefd83a3e142c627baa1082238d14a9e73f583e9`
- Development System / Quality / I.T. / Hygiene / Build 284: `36367208103 / 36367208059 / 36367207996 / 36367208070 / 36367208032`
- Production Pages / Live Resources / Product Browser / Product Route / Build 284: `36367368997 / 36367419236 / 36367419244 / 36367419227 / 36367369039`

## Measurement

The dedicated Development workflow runs `scripts/release467_build285_measurement.sql` against `devilndove-dev` with a 25,000-row provider-read ceiling and retains only counts/booleans/classification. It performs **zero D1 mutation** and never queries Production business data.

The exact Development measurement completed GREEN on `d606572be9855d263757c651c539d05ef0657125` at **14,698 / 25,000 provider rows read**.

Measured data:

- active Creative Projects: **5**
- projects with active material events: **1**
- active material events: **3** — **1 planned**, **2 approved/reviewed-unposted**
- active Creative Project operations: **0**
- operation-resource rows: **0**
- Supply/Tool operation-resource rows: **0**
- active Supply/Tool Inventory items: **1,040**
- Supply/Tool Inventory items with usage profiles: **1,040**
- Supply/Tool Inventory items with process assignments: **0**
- Product resource links: **8**, all **8 Supply/Tool**, and all **8 resolve to active Inventory**
- Creative Project Product links: **0**
- direct `creative_work_events.creative_project_operation_id` linkage columns: **0**
- direct material-review → operation-resource linkage columns: **0**
- Inventory post/reversal history: **2 / 2**
- foreign-key violations: **0**

Classification: **`MISSING_REAL_LINKAGE_DATA_AND_EXPLICIT_EVENT_RESOURCE_WORKFLOW`**.

This separates the residual cleanly: Inventory data and Product-resource linkage are present, and the Build 212 planning UI/API already supports saving an operation resource; however, no real Creative Project has adopted that operation/resource plan yet, and the actual material-event path has no explicit resource identity binding.

## Next

Build 286 — **Creative Process Resource-Link Operator Workflow** — remains next. Its exact scope will be constrained by this measurement rather than assumptions.

## Safety

No schema change, project/event creation, resource-link creation, Inventory movement, Finance posting, R2 mutation, provider execution/publication, Product publication, payment/refund, or Production business-data query/copy is authorized.
