# Retained reference — current pointer refreshed in Build 207

For all current planning, start with `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`. This file is retained for historical/specialist evidence and must not override the Build 207 catalog-media, public-media consent, CAIP, deployment, or auth rules.

---

# Content Automation Studio — Build 201 Operating Guide

Content Automation Studio (Build 199) remains the source-linked package and deliverable planner. Content Release Board (Build 200) remains the public-release authority. Creative Asset Intelligence Platform (Build 201) is the governed intelligence/evidence layer between them.

```text
Approved Product
→ Content Automation Studio package
→ CAIP asset/evidence/story project
→ Content Release Board draft
→ explicit approval and publish action
```

## Which system owns which decision

| System | Owns | Must not do |
|---|---|---|
| Product/catalog | Product fields, listing facts, product images, review state | Treat generated copy as source truth |
| Content Studio | Source-linked archive, media selection/review, deliverable plans | Publish externally or delete source media |
| CAIP | Canonical asset references, rights inheritance, evidence, story segments, recommendations, policy signals, manifest | Copy/move/delete source media, infer consent, publish, render, invent claims |
| Content Release Board | Workshop Journal/gallery public draft, public release checks, publish/unpublish | Alter source asset ownership or bypass consent |
| Social Queue | Approved finished deliverable scheduling/queueing | Claim an unpublished/unfinished render exists |

## CAIP integration

When a finished product is created as Approved/Published, moved to Approved/Published, or approved in the review screen, Content Studio prepares its one package and CAIP then mirrors it into one `creative_project`. Content Studio create/refresh and source-media review also request a CAIP refresh.

A CAIP error is non-blocking. It is recorded as a warning and cannot undo product approval or remove a Content Studio package. From `/admin/creative-assets/`, choose the matching Content Studio project and use **Sync / refresh CAIP** to retry.

## CAIP operating rules

- CAIP carries a source URL/ID/fingerprint and logical archive path. It does not create a new copy of the original photo/video.
- An upstream `public_allowed` source may be considered for public-review candidates; a non-public source may not be elevated to public by CAIP.
- Score components are deterministic metadata review aids. They are not image recognition, legal clearance, “best photo” certification, accessibility text, or a claim about what occurred.
- Evidence records preserve product/Content Studio source facts. Story segments can be edited and locked, but public copy still passes downstream Content Release Board checks.
- CAIP internal approval means the project has been reviewed for its own internal decision. It is not publication approval and does not send anything to a social platform.

## Routine workflow

1. Finish and approve the product.
2. In Content Studio, review source media, mark only suitable assets as selected/public allowed, and approve the relevant deliverable planning records.
3. Open CAIP, select the Content Studio package, and review asset source/rights/score reasons.
4. Add/tighten rights and review notes; never turn a non-public source into a public asset without actual upstream consent.
5. Review evidence facts and story spine. Correct/lock wording as needed.
6. Review reusable hero/gallery/thumbnail/short-video candidates.
7. Export the CAIP manifest if an approved future editor/renderer needs a controlled input package.
8. Continue to Content Release Board for public Website/Workshop Journal draft preparation and its separate approval/publish gate.

## Honest current boundary

The system does not yet render MP4s, generate thumbnail files, use an AI model, transcribe recordings, upload to platforms, retrieve metrics, create derivatives, or use signed private R2 transfers. Those future adapters must follow the CAIP contract and be separately verified.

For detailed CAIP architecture, source controls, storage, governance, provider rules, APIs, operations, migration safety, and acceptance criteria, use `docs/creative-asset-intelligence-platform/README.md`.


## Build 202 CAIP media-operations note

CAIP now records safe metadata/R2-header observations, immutable future-output plans, and short-lived administrator-bound internal review grants. It still does not create derivatives or publish media; source-media preservation remains mandatory.

## Build 208 release-preflight integration

Product Release Preflight reads existing Content Studio package, source-media, and deliverable records as one stage in a wider review. It does not modify a package, select media, alter rights, approve a deliverable, or create/publish a Release Board record. See `docs/creative-asset-intelligence-platform/15_Product_Release_Preflight.md`.
