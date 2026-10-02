# Release 467 Build 347 — Maker Story Advancement & Publication Readiness Continuity V

## Purpose

Build 347 continues the five-project Maker Story/publication-readiness measurement after Builds 344–346. Advancement remains evidence-based: substantive result/lesson facts, explicit human review, reviewed public-candidate state, approved/locked copy, human publication traceability, and separate media-rights review.

## Starting production baseline

Build 346 is successor-ingested as fully GREEN:

- Development SHA: `0f58e0243b5f4ca4b78278972e76b3514a395414`
- Development/Production tree: `19e7512f525608ce4a0e5dbf683be85d38a3165a`
- Production main SHA: `f6f0d17f0cd8b7a879a8b771c236915fc39cb0c3`
- Production Pages: run `37016934208`
- Production Live Resource Integrity: run `37017058797`

## Operator-requested Inventory Operations improvements

Build 347 also includes bounded usability fixes for `/admin/inventory-operations/`:

- Previous/Next pagination gains a direct page-number jump.
- Canonical category `All Stations` is added for general-purpose tools/supplies.
- `Current Location` is stored independently from category/many-to-many workstation membership and selects any active workstation Tool, so a general caliper/ruler can be categorized All Stations while physically located at Laser Engraving, CNC, etc.
- Notification Queue and Saved App Settings use the same shared admin-session authority as the rest of the current admin application instead of stale bearer-only checks.

The schema extension is forward-only migration `0028_release467_inventory_all_stations_current_location.sql`. It is applied/proven in Development first and Production before dependent code. It does not copy Development business rows to Production and introduces no request-time DDL.

## Measurement

The Maker Story lane is read-only and produces an exact Development evidence artifact. The initial candidate does not invent a measurement; the exact artifact is ingested before Development is declared GREEN.

## Successor

**Build 348 — Content Adoption & Discovery Outcomes Renewal VIII.**
