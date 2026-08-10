# Build 246 current integrity note

Creative Project deletion now supports an explicit audited delete-and-return path. Only **unreversed** project inventory consumption is returned; correction movements and `creative_project_deletion_audit` evidence are written before project-owned rows are removed. Meaningful downstream/external output references still block deletion. Finished-product releases outside Creative Projects use the separate Product Production Release authority.


Build 246 retains the seven-stage Creative Automation authority. Fractional inventory use from Build 244 remains current, and recovered product-media references remain evidence links rather than automatic stage approval or publication.

# Devil n Dove Creative Automation Studio — Build 241

Creative Automation is the master operating view for a Creative Process project. It coordinates ownership, deadlines, seven human-reviewed stages and evidence without copying or replacing specialist facts.

## Authority model

| Stage | Specialist authority | Build 235 computed evidence |
|---|---|---|
| 1. Creative process | Creative Process Engine | Saved project summary plus factual timeline event |
| 2. Materials, inventory and cost | Material reviews, inventory posts/reversals, profitability | Reviewed material state and documented cost/profitability evidence; deliberate Not applicable allowed when no material applies |
| 3. Assets, rights and evidence | CAIP, private raw media and evidence selections | Selected evidence plus CAIP mirror/rights review; private raw uploads remain immutable/internal until reviewed promotion |
| 4. Content package | Content handoff and Content Studio project | Source-linked handoff/project and deliverable plan |
| 5. Channel drafts and approvals | Content deliverables and Social Publishing | Intended deliverables approved or deliberately excluded; queue status is never publication proof |
| 6. Public release | Content Release Board/publication history | Approved or published `content_status` plus observable release evidence |
| 7. Measure, learn and repurpose | Outputs, publications and reviewed knowledge | Finished output/result evidence plus reviewed lesson or recommendation |

The master tables remain orchestration only:

- `creative_automation_workflows` — owner, status, stage, due date, blocker and notes.
- `creative_automation_stage_reviews` — one human review/evidence pointer per stage.
- `creative_automation_events` — append-only workflow/review history.

Computed readiness is returned from bounded reads of specialist tables. It is not stored as a competing business fact.


## Build 241 CAIP private-media stage extension

Stage 3 now includes an intentional private raw-media intake path in addition to existing reference-only catalog/Content Studio sources. Operators can batch image/video/audio files into `CAIP_PRIVATE_MEDIA_BUCKET`, resume multipart parts, review governance, inspect the internal-only CAIP asset, and request reviewed public promotion. Completed raw originals cannot be overwritten/deleted through the intake control. Planned proxy/frame/audio/transcript jobs are not completion proof. See `docs/creative-asset-intelligence-platform/16_Private_Raw_Media_Intake.md`.

## Work queue

The page prioritizes work in this order: Blocked, Overdue, Due soon, Unassigned, then Active. A queue card shows project, stage, owner, due date and blocker. Dates are operational aids; the saved D1 workflow remains authoritative.

## Operator procedure

1. Open `/admin/creative-automation/` and select an existing Creative Process project.
2. Select **Add to master workflow** if it is not already linked.
3. Save owner/status/stage/due date. A Blocked workflow requires the exact blocker and next action.
4. Review each server-computed check against the linked specialist workspace. Correct the source authority rather than editing a count in the master page.
5. Save a human stage review. Complete requires a safe evidence reference; Blocked requires correction notes. Use Not applicable only where the rule explicitly permits it.
6. Reload and confirm the human review and computed source state agree. A disagreement is shown as needing source evidence; it is not silently passed.
7. Use **JSON packet** for machine-readable evidence or **Print-ready packet** for an accessible review/filing copy. Both require an authenticated admin request.
8. Record provider/public IDs or URLs only after they are observable. Drafted, queued or approved content is not the same as published content.

## Evidence packet

The packet includes available project/workflow facts, timeline, materials, inventory posting/reversal, outputs, product links, evidence selections, CAIP mirrors, content handoffs/projects/media/deliverables, stage reviews/events, publication events, profitability/allocation and knowledge summaries. Missing specialist tables or optional records produce empty sections rather than invented facts.

Never include credentials, access tokens, full payment data or unrelated private customer data in notes/evidence fields. Review print output before filing or sharing.

## Mobile, accessibility and fallback

Metrics and cards use auto-fit layouts; project/stage controls stack at phone width; tables remain contained; actions retain touch-sized targets. The HTML packet uses headings, landmarks, labelled tables and print CSS. When the master endpoint fails, Retry and specialist routes remain available, and no approval/publish claim is fabricated.

## Guarded duplicate cleanup

Permanent deletion remains limited to untouched accidental project shells after exact `DELETE <project_key>` confirmation. Timeline, inventory, evidence, content, cost, review, publication or other meaningful history blocks deletion and must be preserved.

## Next improvements

1. Extend Build 241 CAIP Private Raw Media Intake into camera-first mobile capture with explicit offline/file-reselection recovery.
2. Observable provider-result reconciliation for Meta and future channels.
3. Delivery/retry-backed notifications for blocked, overdue and failed approval work.
4. Reviewed analytics snapshots and experiment comparison without inferred performance.
5. Deliberate low-risk batch review only after per-item evidence and rollback remain visible.
