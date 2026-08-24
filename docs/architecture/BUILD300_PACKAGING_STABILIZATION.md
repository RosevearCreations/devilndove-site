# Build 300 — Packaging Save + Preview Stabilization

## Why this build exists

Build 298 proved the native Packaging read/write client. Build 299 then added a browser print-source controller, but during live validation the Packaging editor began showing two regressions from the owner perspective:

1. changed Packaging details/claims appeared not to persist after Save Project;
2. Preview could continue looking stale after edits.

Forward modularization is paused until the mature editor is trustworthy again.

## Runtime correction

Build 300 restores the live Packaging page to the proven Build 298 editor/client stack by unloading the Build 299 browser print-source controller. The Build 299 saved-version artifact endpoint and historical source remain in the repository but are dormant from the normal Packaging page.

Build 300 adds one stabilization wrapper between `DDPackagingClient` and the mature editor:

`public/js/admin-packaging-save-stabilizer-v300.js`

### Verified Save Project

Only `action: save_project` is wrapped. The flow is:

1. call the unchanged Build 298 native client;
2. POST to `/api/admin/packaging-write` through the proven Build 292 -> 291 server authority;
3. if the write succeeds, immediately perform a fresh native read of the same project;
4. compare the fresh D1-backed project against the editor payload for core fields and the complete structured claim rows;
5. only return success to the mature editor when the read-back matches;
6. return an explicit HTTP 409 verification failure otherwise so the mature editor retains the browser draft instead of showing false success.

The successful response presented to the editor uses the fresh authoritative read detail, so the editor rerenders from what D1 actually persisted.

### Preview stabilization

Live Build 300 proof established that Save Project was correct: D1 read-back matched all tested core fields and all three edited structured claims. The remaining stale-looking Preview was therefore isolated to presentation.

The mature soap SVG is a wide 1100-unit ribbon. Its claims zone begins at x=875 and extends to the far-right edge. Existing Packaging CSS deliberately forced the soap SVG to roughly 1080 px wide for detail legibility. Inside the narrower editor column this creates a horizontally scrolling Preview. A Save Project rerender replaces the Preview DOM and resets that horizontal scroll to the left, so claim changes can be rendered correctly but remain off-screen.

Build 300 corrects that presentation problem without changing the SVG source or physical output:

- soap Preview defaults to **Fit full label**;
- the Preview-only DOM SVG is overridden to `width: 100%`, `min-width: 0`, `max-width: 100%`, `height: auto`;
- the SVG's own millimetre dimensions and viewBox are unchanged;
- exports and print functions continue generating fresh `svgMarkup()` and therefore retain the existing physical-size authority;
- **Detail / scroll** restores the former wide view when close inspection is useful;
- a Preview audit compares the current structured claim rows against the actual SVG text;
- if the SVG text does not contain the current printable claims, Build 300 triggers one input-driven mature-renderer refresh and audits again;
- a visible status line reports the number of printable claims found in the SVG and whether the current editor matches the last verified D1 save.

For soap labels the existing renderer gives `Product identity — English` precedence over `Product / variant`. Build 300 preserves that explicit-identity authority while fixing only the derived/default case:

- when English identity is blank or still equal to the prior Product / variant, Product / variant changes keep the identity synchronized;
- when the owner explicitly edits English identity to a different value, synchronization stops;
- rerenders after Save Project are rebound through a MutationObserver.

The mature soap renderer also prints `Front tagline`; Build 300 does not relabel or suppress it.

## Preserved authorities

Build 300 does not change:

- `public/js/admin-packaging-studio.js` mature Build 298 editor;
- `public/js/admin-packaging-native-client-v298.js`;
- `public/js/modules/packaging/native-client-v298.mjs`;
- Build 293/286 native read authority;
- Build 292/291 native write authority;
- retired `/api/admin/packaging-studio` tombstone;
- Packaging SQL/schema;
- Cloudflare bindings/config;
- R2;
- real Production.

## Completion requirement

Build 300 is not complete until live Development proves all of the following on the same project:

- edit at least one ordinary project field and one claim;
- Save Project returns success containing `Verified by fresh D1 read-back.`;
- `DDPackagingSaveStabilizer.getStatus()` shows `verifiedSaveCount >= 1`, `failedVerificationCount = 0`, `lastVerification.ok = true`, `claims_match = true`, and `core_match = true`;
- after Refresh the changed field and claim remain present;
- Preview defaults to `previewMode = fit` and displays the complete soap ribbon without requiring horizontal scrolling;
- `lastPreviewAudit.preview_claims_match_dom = true`;
- `lastPreviewAudit.dom_matches_verified = true` after a verified save;
- `rendered_claim_count` equals `preview_claim_target_count`;
- Preview contains the verified saved English identity;
- explicitly customized English identity is not overwritten by later Product / variant edits.

No more Packaging retirement/modularization passes should start before this gate is green.
