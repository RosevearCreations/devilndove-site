# Devil n Dove Release 467 — Build 448: Tools, Workstations & Maintenance

## What we can do now

The [Shared Tools & Workstations workspace](/admin/shared-tools/) reconciles **existing authoritative** Tool Inventory, many-to-many workstation assignments, current recorded location, service/calibration lifecycle, Build 381 resource calendar and the Build 446 Job Traveler. It does not create a separate warehouse or calendar.

1. Choose an Inventory Tool and the real Creative Project. Review all associated stations and the independent recorded physical location. Missing service or location evidence is **unverified**, not a pass.
2. Choose local start/end times and select **Check exact UTC conflicts**. Read the incumbent booking IDs, project owners, maintenance holds and any existing explicit review receipts. No recorded overlap is not a guarantee that the tool is physically available.
3. If another project has booked the Tool in that time, investigate the genuine operating situation. In **Record a human conflict decision**, enter 20+ characters explaining how both operations can safely coexist; explicitly approve each listed incumbent project booking. Every approval is immutable and scoped to that exact Tool, new project, time window, incumbent booking and **calendar request key**. A changed window or request must be re-reviewed.
4. If maintenance or a resource hold overlaps, **do not approve** the booking. Record legitimate maintenance and any cancellations in **Production Calendar**, and repairs/calibration/return-to-service in Inventory's authoritative Tool lifecycle. Choose another time until the source blocker is genuinely removed. A `do_not_reuse` Tool or one with unsafe, damaged, service-due or non-active lifecycle cannot be project-booked by an override.
5. In **Record a real safety inspection**, choose the exact inspection actually performed and its real **passed**, **failed** or **held** result, with factual notes and optional private evidence. No automatic checkbox, inspection, calibration, location confirmation or maintenance sign-off is created. A blocked Tool cannot be falsely recorded as passing.
6. Use **Save calendar booking with verified reviews** to create a real booking through the **original resource calendar API**. Existing receipts prevent duplicate submissions. Conflicts without the matching human decision fail closed even if an older calendar client attempts an override.
7. Open [Guided Manufacturing](/admin/guided-manufacturing/) to see actual Tool condition and any recorded maintenance/other-project bookings alongside each reviewed step. Historical Tool checks are labeled historical; an absent check is labeled **NO safety check recorded**. Continue to record start/pause/check/time/substitution only as actual human actions.

## Canonical D1

`migrations/canonical/0044_release467_shared_tools_maintenance_conflict_reviews.sql` adds two immutable, review-only tables:

| New Build 448 table | Authority retained | Result |
| --- | --- | --- |
| `maker_tool_safety_checks` | `site_item_inventory`, `inventory_tool_lifecycle_profiles`, optional Build 446 reviewed traveler step | Human check kind, actual result, note, optional real evidence, reviewer and unique request digest |
| `maker_tool_booking_decisions` | Existing `creative_resource_calendar_entries` and `creative_work_projects` | Human approval/decline against one actual conflicting booking, exact new booking request/window and reviewer |

Additive database triggers validate referenced Tool identity, reviewed traveler Tool references, immutable review histories, real overlapping calendar entries, and approval restrictions. A separate trigger on future **project** calendar inserts rejects an unsafe/out-of-service Tool, active maintenance or resource hold, or any project booking overlap without an exact human approval. The original calendar trigger still requires an explicit manual override and reason for any overlap. Existing calendar history and previous immutable migrations are not rewritten.

**Important:** Historical evidence is never a guarantee of live physical safety. Build 448 checks are independent of the canonical Tool Lifecycle status; successful human checks cannot silently clear damage, unsafe status, overdue service, or `do_not_reuse`. Use source-of-truth Inventory/Lifecycle screens to review and correct those facts. Do not record fake safety checks merely to make bookings succeed.

Build 448 does not consume stock, reserve consumables, operate a machine, perform maintenance, change Work Order minutes, create a customer invoice, post accounting entries, create Products, activate Etsy/Facebook listings or enable US shipping. Prototype and therapeutic projects remain valid with no customer or sale.

## Acceptance proof

`python scripts/release467_build448_shared_tools_sql_regression.py` recreates one Tool shared by two real workstations and two Creative Projects: the first booking succeeds, the second fails even with an override until a human approval matches the exact Tool, incumbent entry, project, UTC window and request key. It then succeeds; a changed key fails. Maintenance and resource holds remain hard booking blocks. Unsafe and do-not-reuse Tools fail booking or false pass attempts. A real reviewed traveler Tool may receive a factual inspection, while a different Tool cannot borrow that evidence. Inspection and owner decisions are append-only; existing Inventory stock/locations/memberships remain unchanged.

The [Current Application Quality workflow](../../.github/workflows/current-application-quality.yml) syntax-checks API and UI sources and runs the SQL fixture. Run canonical migration policy, preflight-truth and source-integrity gates. Development and Production **must** each apply migration 0044 before serving Build 448. Promote only after Development and Production workflows, exact-tree integrity and Cloudflare's custom-domain smoke checks are all GREEN.

## Recovery

If a source conflict or tool state is wrong, correct it in the actual Tool Lifecycle or cancel/reschedule the existing calendar entry with a real reason. Historic safety decisions are never deleted or edited; record a newer actual inspection to supersede history. Keep older project booking approvals for audit even when their calendar entries are later cancelled. If canonical migration 0044 needs correction, make a subsequent numbered migration; never mutate the published migration bytes or forcibly drop historical records.
