# Release 467 Build 234 — Workflow Help, Empty States & Recovery Guidance

## Goal

Build 234 deepens the shared circular ⓘ help system from page descriptions into task guidance for Creator/Admin work. The same build also implements the owner-supplied Soap Cupcake label family inside the existing Packaging Studio.

## Exact predecessor

Build 233 is Production GREEN:

- Development: `c9882fef84e23f7416a7042f52ec8b5ea151287f`
- Shared tree: `6eef4a4edf79d5ce367b052823bede7d9a665465`
- System Gate: `35772128810`
- Current Application Quality: `35772128894`
- I.T. Admin Runtime: `35772128961`
- Branch Hygiene: `35772128724`
- Build 233 proof: `35772128756`
- Production main: `8de67c8e5a0e9fe745264a387f749c0cd8a4c6ad`
- Production Pages: `35772353686`
- Production Live Resource Integrity: `35772488495`
- Products Browser: `35772488386`
- Product Route: `35772488446`
- Build 233 Production proof: `35772353401`

## Workflow-help contract

Creator/Admin page-level ⓘ help now includes a task cycle appropriate to the owning workspace:

1. **Start** — identify/select the real source record and prerequisites.
2. **Work** — change only facts owned by the current authority.
3. **Review** — inspect status, evidence, permissions and HOLD conditions.
4. **Finish** — invoke the existing explicit next action only when its prerequisites are satisfied.

Profiles cover:

- Packaging;
- Product / Catalog / Product Media / Storefront;
- Custom Work / quote / proof / manufacturing handoff;
- Inventory / Supplies / Tools;
- Creative / CAIP / Content / Social;
- Finance / Accounting / Orders / Customer Documents;
- I.T. / Operations / release / security;
- a generic Creator/Admin fallback.

### Empty state versus broken state

Help explicitly distinguishes:

- **Empty / first use** — the real source record or qualifying evidence does not exist yet.
- **Broken / recovery** — a record that should exist failed to load, save or remain current.

Recovery guidance preserves the existing record identity, browser draft or evidence reference and directs work back to the owning workspace. It does not encourage duplicate records or synthetic evidence.

### Why can't I do this?

Disabled controls and bounded high-consequence Admin actions receive a nearby circular ⓘ explanation.

The shared explanation identifies common blockers:

- no selected record;
- missing prerequisite;
- insufficient permission;
- review/approval state;
- missing physical or business evidence;
- accounting lock;
- provider/OAuth HOLD;
- exact Development/Production proof boundary.

The help module remains read-only and makes no API request.

## Build 233 runtime defect repaired

Build 233's page-level help invocation was accidentally placed immediately outside `refresh()`. Source-string gates still passed, but the browser could evaluate an undefined `path` / `ordinal`.

Build 234 moves the invocation inside `refresh()` and adds JavaScript syntax checking to the build-specific workflow.

## Soap Cupcake labels

The five owner-supplied square concepts become an editable Packaging Studio family rather than flattened final artwork:

- Sweet Orange
- Charcoal
- Oatmeal & Goat Milk
- Sea Breeze
- Lavender Dream

### Physical contract

- package type: `soap_cupcake_label`
- renderer: `cupcake_soap_square`
- exact canvas: **50.8 × 50.8 mm / 2 × 2 inches**
- SVG remains the physical master.
- Sheet printing keeps the exact physical dimensions and may rotate labels for better sheet yield.

### Editable content

The current Packaging authority owns:

- label title;
- Product/variant wording;
- structured ingredients / INCI;
- purpose wording;
- website;
- Made in Canada wording;
- net quantity;
- background, ink, accent, secondary and decorative colours.

Five built-in visual directions are seeded by canonical migration 0023. Ten additional colour-only directions are available in the editor without replacing the Product/ingredient wording.

### Compact-label compliance boundary

A 2 × 2 inch front sticker is deliberately compact. The Studio warns that complete bilingual cosmetic identity, full ingredient/INCI declaration, metric quantity, dealer/address, warnings or other required information may need a reviewed companion/back/extended label.

The template must not obtain approval by shrinking required information below a legible size.

## Canonical migration

`migrations/canonical/0023_release467_cupcake_soap_label_templates.sql` is a data-only forward migration.

It inserts five system rows into the existing `packaging_templates` authority. It:

- adds no schema;
- does not rewrite existing Packaging projects;
- does not alter Products;
- does not change Inventory quantity/cost;
- does not change orders, customers or Finance;
- does not publish anything;
- does not call an external provider;
- does not mutate R2.

## Acceptance

- shared help syntax passes;
- page-level help executes inside `refresh()`;
- task-cycle and recovery profiles exist;
- disabled/high-consequence action help exists;
- Creator Help Centre documents Start → Work → Review → Finish and empty-vs-broken recovery;
- Packaging Studio recognizes `soap_cupcake_label`;
- five exact 50.8 × 50.8 mm system templates exist in migration 0023;
- `cupcake_soap_square` produces exact-size SVG;
- all primary label fields remain editable;
- ten additional colour directions exist;
- Packaging preflight holds the compact-label regulatory boundary;
- canonical migration stream advances from 22 to 23;
- Build 235 remains next and the future queue is not exhausted.
