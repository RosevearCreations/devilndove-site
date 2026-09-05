# Build 56 — Product Photo Guidance + Packaging Onboarding

## Objective

Build 56 improves two existing admin workflows without changing their underlying data authority:

1. Existing Product images can be scored directly from the Product Editor using the same Release 448 deterministic browser/Canvas scoring contract as Product Photography Manager.
2. Packaging Studio gains a first-time-user guided workflow with resumable progress, contextual navigation, blocker explanations and an Advanced mode.

## Source boundary ingested before mutation

Build 55 Development closure:
- `dev` SHA `190a8960ab259bbb3cfb87d8215d32b2d6da13cb`
- tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- System `33936132522`
- Quality `33936132397`
- I.T. `33936132405`
- Hygiene `33936132426`

Build 55 Production:
- `main` SHA `ee42e7838a83def94e858b3d0d6c1a23947e2344`
- same tree `a338071e446f5b18db3f26d8a0c0ca07141cd158`
- Production Pages Deploy `33936229477`

The first Build 56 source mutation is `release467-build56-product-photo-guidance-packaging-onboarding.json`.

## Product Editor image scoring

When an existing Product is loaded, Build 56 listens to the existing `dd:product-editor-target` event and reads the currently loaded featured image plus gallery image URL fields. The new panel:

- loads previously stored `product_image_quality_assessments`;
- shows per-image total and component scores;
- supports **Score unscored images**;
- supports deliberate **Rescore all images**;
- links to the full Product Photography Manager;
- explains likely improvements for weak lighting, clarity, background, framing, resolution, colour, compression artifacts and set consistency;
- never publishes, hides, deletes or replaces a Product image.

The scoring contract remains `browser_deterministic` / `r448-browser-v1`. Build 56 does not introduce a competing scoring model.

## Product Photography Manager coaching

The existing manager keeps its scoring and duplicate detection authority. Build 56 adds a plain-language coaching panel explaining what to adjust for each component and a recommended score → inspect → improve → rescore → human-review workflow.

Subjective presentation such as styling, reflections, angle and premium hero appeal remains a human/optional vision-assisted review concern rather than a deterministic publishing gate.

## Packaging Studio guided mode

Build 56 adds a 12-step onboarding sequence:

1. Choose/create project.
2. Confirm package type and physical size.
3. Select template/layout.
4. Attach purchased material/source evidence when applicable.
5. Review ingredients / INCI / bilingual declarations when applicable.
6. Choose artwork/brand presentation.
7. Review claims and customer-facing text.
8. Inspect SVG preview, safe area and text fit.
9. Record packaging components, inventory links and cost.
10. Complete review/readiness checks.
11. Record physical print/wrap/laser proof.
12. Save version, approve and export.

The walkthrough stores progress in browser local storage, offers **Show me** navigation to visible controls, explains common blockers, and can be hidden with **Advanced mode**. It does not override Packaging Studio validation, regulatory review, physical-proof or approval gates.

## Data / environment boundary

- No canonical migration.
- No D1 mutation introduced by the build itself.
- No R2 mutation introduced by the build itself.
- No provider execution.
- Production promotion remains closed until the exact merged Development head is externally proven green.

## Regression protection

`scripts/current_build56_product_photo_packaging_onboarding_gate.py` verifies:

- exact Build 55 restart provenance ingestion;
- the Product Editor bridge uses the existing image-quality API and scorer version;
- Product Editor score/rescore/explanation controls remain present;
- Photography coaching guidance remains present;
- Packaging guided/advanced modes, persisted progress, Show-me navigation and blocker explanations remain present.

The Build 56 gate is carried by `scripts/current_application_quality_gate.py`.
