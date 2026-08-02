# Devil n Dove Creative Automation Studio — Build 230

Build 230 does not change this orchestration boundary. It adds a D1 Visual Image Manifest and generated-editorial provenance; Creative Automation may link that evidence but cannot approve packaging geometry, turn an illustration into product proof or make placeholder media launch-ready.

Creative Automation Studio is the master operating process for product stories, media, channel content and public release. It combines navigation, ownership, seven stages and evidence without deleting or duplicating specialist features.

## Authority model

| Stage | Specialist authority | Master responsibility |
|---|---|---|
| 1. Creative process | Creative Process Engine | Owner, status, due date and cross-stage progress |
| 2. Materials, inventory and cost | Creative Process material reviews and audited inventory actions | Readiness/evidence pointer only |
| 3. Assets, rights and evidence | Creative Asset Intelligence Platform (CAIP) | Rights/evidence stage decision |
| 4. Content package | Content Automation Studio records | Handoff and package-stage decision |
| 5. Channel drafts and approvals | Content Studio deliverables and Social Publishing | Approval-stage decision; never inferred publishing |
| 6. Public release | Content Release Board/publication history | Release-stage decision and evidence link |
| 7. Measure, learn and repurpose | Analytics, outputs and reviewed lessons | Final factual result/next-use decision |

The master tables store orchestration only:

- `creative_automation_workflows`: one row per Creative Process project, owner/status/current stage/due date/blocker/notes.
- `creative_automation_stage_reviews`: one reviewed status and evidence reference per stage.
- `creative_automation_events`: append-only workflow and stage transition history.

Project facts, media, deliverables, publications, provider results, inventory movements and accounting facts stay in their existing authoritative tables. JSON remains appropriate for static templates and public read-only configuration; changing business status belongs in D1.

## Operator procedure

1. Open `/admin/creative-automation/` and choose an existing Creative Process project.
2. Select **Add to master workflow**. This links the project; it does not copy its specialist records.
3. Set workflow owner/status/current stage/due date. A Blocked workflow requires the exact blocker.
4. Open the stage’s specialist workspace and complete its native review/actions.
5. Return to the master page. Compare the displayed source facts with the specialist result.
6. Choose the stage review status. Complete requires a safe evidence URL or record reference; Blocked requires correction notes.
7. Move to the next stage only when the specialist evidence and stated pass condition agree.
8. If the master API fails, use the displayed specialist links. Do not assume any unsaved master change reached D1.

## Review rules

- Human approval remains mandatory for facts, rights/privacy, public copy, channel media and publish actions.
- A completed master review cannot make an unready specialist record ready. The UI reports `needs_source_evidence` when these disagree.
- Publishing success requires a provider/public ID or observable public result; a queued draft is not published.
- Inventory posting/reversal, pricing, payment, refunds and customer documents use their own audited systems.
- Product/customer/private media is not public until its rights/privacy status allows the intended use.
- Never put credentials, access tokens, private customer data or full payment data in evidence fields.

## Mobile operating pattern

At phone width the project list, workflow form and stage cards stack vertically; buttons become full-width touch targets and tables scroll inside their own container. Operators can resume from the current stage and use direct specialist links. A future enhancement should add camera-first evidence upload and explicit offline-draft synchronization, while preserving the current rule that browser-only changes are visibly unsynced.

## Failure and fallback

When the master endpoint is unavailable, the page shows a failure message, Retry and all specialist routes. It never reports an approval or publish action as successful. Runtime failures are sent to the incident system with sanitized context. Correct the dependency, retry the master load and confirm the saved D1 event before relying on the stage decision.

## Next improvements

1. Add a server-computed readiness rule registry per stage instead of the current conservative source-count checks.
2. Add camera-first mobile evidence upload with R2 derivative/rights checks.
3. Add deliberate batch review for low-risk drafts while retaining per-item approval and rollback.
4. Add provider result reconciliation for Meta and future channels.
5. Add analytics result snapshots and experiment comparisons without writing inferred performance.
6. Add notification/assignment queues for overdue and blocked stages.
7. Add accessible print/export of a complete project evidence packet.
