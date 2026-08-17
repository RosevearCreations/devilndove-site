# Build 270 Changed Files

- `public/js/admin-caip-media-intake.js` — separates preserved integrity failures from normal project media and labels historical progress clearly.
- `admin/creative-assets/index.html` — cache-bust updated to `v=270`.
- `functions/api/_lib/caipMediaIntake.js` — Build 270 manifest marker only; no schema behavior change.
- `_lib/caipMediaIntake.js` — synchronized helper mirror.
- `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `RELEASE_NOTES.md` — Build 270 recovery-state documentation.
- CAIP regression scripts — later-build acceptance widened where older tests had fixed 265–269 cache/build ranges.
- `scripts/build270_caip_recovery_presentation_test.mjs` — regression for the failed-row presentation issue.
