# Release 467 Build 320 — Grey Hair Source-Evidence Review & Story-Plan Readiness

Build 320 starts from exact Build 319 Development/Production GREEN.

Grey Hair remains the closest unprofiled project, but Build 318/317 showed only one approved source-evidence range and no human-reviewed story plan. Build 320 does not bypass those facts.

## Operator workflow

A dedicated read-only workspace at `/admin/grey-hair-story-readiness/` composes the existing authorities:

- **CAIP Evidence Review** remains the only place to approve/reject temporal source evidence.
- **Grey Hair Sync & Audio Alignment** remains the synchronization prerequisite authority.
- **Grey Hair Story & Edit Planning** remains the only place to create/review the source-backed story plan.

The Build 320 workspace shows the current counts, source-evidence review metadata and story-plan review state, then routes the operator to the correct next action.

## Readiness rule

A later Maker Story decision is justified only when Grey Hair has:

1. at least **2 approved active source-evidence ranges**;
2. at least **1 human-reviewed or approved story plan**; and
3. at least **2 source-backed story-plan items**.

The existing story planner may also require a confirmed synchronization group before it can generate/review a plan.

Build 320 itself **never creates the Maker Story profile**. Meeting the readiness rule only changes the measured state to `GREY_HAIR_REVIEWED_EVIDENCE_READY_PENDING_MAKER_STORY_DECISION`.

Private media remains private; no raw private URLs are returned by the Build 320 endpoint, and media rights are never inferred.

Next: **Build 321 — Search Console Real Export Intake Continuity II**.
