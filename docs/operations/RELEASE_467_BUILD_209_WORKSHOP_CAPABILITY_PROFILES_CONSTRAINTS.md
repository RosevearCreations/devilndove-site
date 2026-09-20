# Release 467 Build 209 — Workshop Capability Profiles & Constraints

## Goal

Create reusable, source-backed capability profiles for major Devil n Dove workshop disciplines with conservative public wording, explicit constraint evidence state, approved-example routing and Custom Work routing.

## Exact starting boundary

Build 208 is exact-SHA Production GREEN.

- Development SHA: `cc76ca21585e0b9a38e2b7f481799963943be056`
- shared tree: `7a3583f0f12275d5316b1fc63a3067bc3dd7d74a`
- System / Quality / I.T. / Hygiene: `35515481692` / `35515481732` / `35515481657` / `35515481717`
- Build 208 Development proof: `35515481737`
- Production main: `2d53ff1f65b0252e4c1812766e61577f530dccaa`
- Production Pages / Live Resources: `35515609351` / `35515652270`
- Product Browser / Route: `35515652261` / `35515652315`
- Build 208 Production proof: `35515609321`
- exact Production URL: `https://f784f34e.devilndove-site.pages.dev`
- deployment: `f784f34e-36b1-477e-9f58-047d831bf487`

## Authority

Canonical migration `0009_release467_workshop_capability_profiles.sql` adds `workshop_capability_profiles`.

This is a **profile layer**, not a second process taxonomy. Every profile carries one or more canonical `inventory_processes.process_key` references in reviewed JSON. Admin save rejects process keys that do not exist in the canonical process authority.

## Profiles

The initial reviewed set contains 12 capability families:

1. Laser Engraving & Cutting
2. Cricut, Vinyl & HTV
3. Resin Casting & Finishing
4. 3D Printing
5. CNC Machining
6. Metal & Lathe Work
7. Jewelry & Ring Work
8. Paracord
9. Lapidary
10. Candles, Soap & Bath/Body
11. Packaging & Labeling
12. Mechanical & Automotive Fabrication

## Constraint rule

Specific machine dimensions, speeds, power, feeds, temperatures, tolerances, material compatibility, load ratings and finish-performance limits remain **unknown unless measured or owner-supplied**.

The seeded profiles intentionally use `unmeasured` or `mixed` constraint states. No seeded profile claims a fully measured technical envelope.

Mechanical & Automotive Fabrication explicitly remains workshop fabrication/adaptation capability and **not a general automotive repair, diagnostic, inspection or safety-critical service promise**.

## Public and admin surfaces

- `/capabilities/` public hub
- one public page per seeded capability
- `/api/capabilities` public reviewed read
- `/admin/workshop-capabilities/` authenticated review surface
- `/api/admin/workshop-capabilities` authenticated GET/update
- Gallery links use the existing public Gallery authority and query only public/approved-visible records
- Custom Work links return to the existing `/custom-request/` authority

Build 210, not Build 209, owns capability-aware enrichment of the Custom Request data model.

## Safety

- forward-only canonical schema
- no request-time DDL
- no automatic Product publication/unpublication
- no automatic capability feasibility promise
- no arbitrary process creation in the capability editor
- no Inventory quantity/cost mutation
- no CAIP/R2 mutation
- no provider/payment/publication execution
- Production business data remains Production-owned
- Canada/CAD and U.S.-shipping pause remain unchanged

## Acceptance

1. Exactly 12 initial capability profiles exist after migration.
2. Profile process references resolve only to canonical `inventory_processes` keys.
3. Public hub and individual profile pages retain one H1 and route to Gallery/Custom Work.
4. Admin edits are authenticated, audited and reject noncanonical process keys.
5. Technical limits remain source-backed or explicitly unknown/unmeasured.
6. Mechanical wording remains fabrication-only and not a general repair-service promise.
7. Build 208 public discovery and Storefront/Product authorities remain intact.

## Next

Build 210 — Custom Work Intake 2.0 — remains blocked until Build 209 is exact-SHA Production GREEN.
