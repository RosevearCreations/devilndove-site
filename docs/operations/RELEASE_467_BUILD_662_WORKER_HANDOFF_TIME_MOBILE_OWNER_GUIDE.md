# Release 467 Build 662 — Worker Roles, Task Handoffs, Actual Time & Device Acceptance

## What this build changes

- The existing protected Work Orders page uses real Creative Process tasks, dependencies, status, recorded minutes and linked milestone counts.
- Phone/tablet task cards, status filters and 44-pixel touch targets supplement the original desktop task table. Task/time authority remains the original creative_work_order_events source.
- A recorded **pause** with factual handoff notes can be reviewed and **resumed** by an authenticated Admin. Source rules require dependencies and a genuine milestone before completion.
- The original Admin POST now supplies a unique valid request_key and retains the exact body and key when a write result is uncertain. Retrying does not silently create a new event.
- The Creators-module guard and verified active Admin session apply to both page and API. A different worker or customer session receives no work-order write authority.

## Original-device walkthrough

1. Sign in as an authorized Admin and open https://devilndove.com/admin/project-work-orders/ on the actual desktop, tablet and phone. Select a real project and test selection, status filtering, readable labels, keyboard focus and touch controls.
2. On a real **in-progress** task, log personally observed date and 1–720 whole minutes with factual notes. Confirm the write receipt, refresh and verify the original total and audit row. Time is not payroll, billed labour, estimated time or proof of an assigned employee.
3. Where a pause is warranted, select **paused** with a factual next-step handoff note. Review that original audit event before resuming. A second worker's acceptance must never be inferred from an Admin actor ID.
4. If a browser loses the POST response, check the original source and use **Retry same original receipt** if needed. Do not invent a new action/key for an uncertain write. A stale transition needs a fresh source review.
5. At https://devilndove.com/admin/module-acceptance/ separately record observed worker.desktop.work, worker.tablet.work, worker.mobile.work, worker.desktop.handoff, worker.tablet.handoff and worker.mobile.handoff checkpoint evidence. An owner review alone is not independent worker-role certification.
6. Test a genuinely separate non-Admin role on its own device; preserve denial evidence for the Admin page and mutation API. Never claim approved separate worker assignment or payroll when no such role exists.

## HOLD / independent boundaries

Original work-order records and the verified Admin actor are source facts. This build creates **no** employee roster, task-assignee authority, worker portal, staffing certification, labour rate, payroll posting, inventory deduction, customer communication, provider action or Master Shell publisher. A real distinct-worker negative-access test and owner/worker device signoff remain HOLD until independently witnessed. Master Shell completion remains null / HOLD.

## Verification

The Build 662 quality step checks the original API/JS syntax, module routes, source receipt semantics, allowed transitions, responsive field controls and the retained Build 379 SQL regression. Production GREEN requires both protected branch merges, current quality gates, Cloudflare production deployment and live-resource proof. It does not substitute for real-device field signoff.
