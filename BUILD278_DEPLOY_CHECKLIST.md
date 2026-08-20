# Build 278 Deployment Checklist

1. **No D1 migration is required.** Do not invent or run a Build 278 schema migration.
2. Deploy the Build 278 application package.
3. Hard-refresh a managed public page and `/admin/media-content-studio/` so `media-content-runtime.js?v=278`, `admin-media-content-studio.js?v=278` and `styles.css?v=278` load.
4. While logged in as Admin, open a managed public page:
   - confirm one **Admin page preview** toolbar appears;
   - confirm Edit OFF shows no per-slot badges/outlines;
   - click **Edit page** and confirm the exact editable locations/badges appear;
   - turn editing OFF and confirm the page returns to a clean preview without changing published content.
5. Open `/admin/media-content-studio/` and inspect **Editable image spaces & outstanding artwork**:
   - `Required first` should identify live P1 slots not already filled in D1;
   - `Outstanding` should include live P1 + P2 slots;
   - `All 139 spaces` should include completed/default and optional-background locations;
   - test **Download CSV**.
6. Assign one test image to a placeholder and confirm the live checklist immediately moves that location to complete/custom-assigned.
7. Use **Use original/default** to remove the test assignment and confirm the checklist returns to the source baseline state.
8. Prioritize the six baseline P1 hero placeholders before optional decorative backgrounds.

## Baseline P1 hero replacements

- Social Hub / Hero image — 1600×1000.
- Workshop Journal Story / Hero image — 1600×1000.
- Coin & Spoon Ring Care / Hero image — 1600×1000.
- Polymer Clay Earring Care / Hero image — 1600×1000.
- Handmade / Vintage / Sourced Guide / Hero image — 1600×1000.
- Marketplace Guide / Hero image — 1600×1000.
