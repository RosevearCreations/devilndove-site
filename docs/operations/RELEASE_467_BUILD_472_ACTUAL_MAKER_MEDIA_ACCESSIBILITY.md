# Build 472 — Actual Maker Photography, Video & Accessibility Remediation

**Source of truth:** `/admin/maker-media-acceptance/` reuses the authenticated, bounded Maker Story source, its selected original frame IDs and current consent evidence. No synthetic media or source rights are admitted to Production.

## Owner test on genuine source photographs and videos

1. Open the owner-created Creative Project and its specific Maker Story revision. For each frame, open the original in the owning workspace; confirm it exists, is the correct image/video and matches the story's caption. If missing, leave HOLD and correct the owning source.
2. Measure the **actual original** width/height and orientation. Enter the intended display aspect ratio and *contain* or *cover* crop. A large predicted cover crop is a warning to examine the subject/focal point on the actual desktop/phone layouts. The calculation is not proof of how a browser or platform crop looks.
3. Write an accurate alternative text description and factual caption based on actual visible source matter, not AI guesses, file names or mere text length. Correct captions/alt descriptions in the original Maker Story or Product Media source and create a new immutable revision where appropriate.
4. Open the actual source-rights agreement and confirm its media identity, destination scope, permission, expiry and any identifiable people's permission. Record the **reference**, not passwords, private object keys or raw secret URLs. Text entered in Build 472 is not a rights receipt.
5. For each video with audible dialogue or meaningful sound, manually check synchronization and completeness of captions/subtitles. A short transcript/summary alone does not establish synchronized-caption conformance.
6. On real devices test keyboard-only operation, focus, actual phone touch/reflow, 200% browser zoom, displayed contrast and reduced motion, and assistive-technology descriptions. Correct source and UI failures before rechecking.
7. The new `Download private remediation plan` action exports *only* bounded source IDs and owner-entered notes as local JSON. Keep it private. It triggers **zero D1 writes, R2 reads, remote publishing, or approval changes**. Clear pending work by updating the original source and independently recording legitimate owner evidence, not by treating the JSON as acceptance.

## Acceptance boundary

Technical checks can prove the workflow and flag missing evidence; **physical originals, rights documents, accessibility observations and publication approvals remain HOLD** until owner-supplied evidence is available. Project privacy, customer consent, Etsy/Meta permissions, Canadian product safety, and original media rights remain governed by their own owner-reviewed systems.

Reference: [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) — non-text alternatives, captions for prerecorded synchronized media, keyboard access, resized/reflowed text and target accessibility.

Automated regression: `node --test scripts/release467_build472_actual_media_remediation.test.mjs scripts/release467_build460_maker_media_accessibility.test.mjs`.
