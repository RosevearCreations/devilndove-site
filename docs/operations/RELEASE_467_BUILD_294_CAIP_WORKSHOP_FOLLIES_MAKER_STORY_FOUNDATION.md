# Release 467 Build 294 — CAIP Workshop Follies & Maker Story Foundation

Build 294 composes Workshop Follies, experiments, Maker Stories and research/learning projects into the existing Creative Process → CAIP → Content Studio chain. It does not create a second content system.

## Authority split

- **Creative Process** owns what we tried, why, process/category, workstation references, expected/actual outcome, lesson and next-time notes.
- **Inventory** remains the authority for process/category and workstation Tool identities.
- **CAIP** remains the authority for private raw media, source identity, evidence review, story structure and derivative/edit planning.
- **Content Studio** remains the authority for review-first Workshop Journal, video, short-form/social, gallery, SEO and caption drafts.
- **Publication/social release** remains explicitly human-approved.

Identity is unchanged:

`creative_work_project:{id} → one creative_projects CAIP workspace → one content_projects package`

A Product is optional.

## New Creative Process facts

One profile per Creative Project can classify the work as ordinary project, Workshop Folly, experiment, Maker Story or research/learning project. It records what/why, expected/actual result, outcome, surprise/problem, lesson, next-time change and whether we would try it again.

The project may reference zero, one or many existing Inventory Tools explicitly marked as workstations. No new workstation taxonomy is created.

## Reuse, not duplication

Saving Maker Story facts refreshes the existing CAIP source snapshot. Content Studio uses the same idempotent bridge and existing deliverables. Folly/experiment/Maker Story projects use **Workshop Journal** semantics for the existing journal/blog deliverable while ordinary projects retain **Project Journal**.

Build 294 never creates a duplicate Product merely for storytelling, and a Folly may remain permanently productless.

## Migration

`0027_release467_caip_workshop_follies_maker_story_foundation.sql` adds only:

- `creative_project_maker_story_profiles`
- `creative_project_maker_story_workstations`

Both reference existing authorities. The migration creates no business rows.

## Publication boundary

No provider publication, public release, social posting or media promotion occurs automatically. Existing review and approval authorities remain mandatory.

After Production GREEN the queue remains open.

**Next: Build 295 — Storefront Buyer Journey Simplification.**
