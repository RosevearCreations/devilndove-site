# Release 467 — Build 173 Product Media repair

Build 173 repairs the Product Media failures observed on Product #50 (Dreamsicle).

## Boundaries

- Corrects the Release 465 publication trigger with canonical migration `0006`; previously applied migrations are unchanged.
- Draft-to-active publication still requires the full Storefront readiness contract.
- Already-active legacy Products may repair non-empty fields such as the featured image without re-triggering every historical readiness prerequisite.
- Valid active Storefront fields/readiness cannot be degraded by ordinary edits.
- Removing a featured image moves the Product featured pointer first and deletes the gallery row only after that succeeds.
- An active Product cannot remove its only featured/gallery image without a replacement.
- Product Editor thumbnails try the actual public media URL first, then one bounded same-origin recovery route, then the placeholder.
- No catalog scan, R2 listing, autosave, timer, observer, or background media refresh is introduced.

## Acceptance

Run `python scripts/release467_build173_gate.py`, the canonical migration policy, JavaScript syntax, the normal Development System Gate, then promote only the exact fully-green Development SHA.
