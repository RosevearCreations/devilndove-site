# Brand V3 50-image upload — verified Development gate evidence

Devil n Dove's owner uploaded the 50 mapped WebP artworks to `assets/images/brand-v3/` on `dev` (Oct 19, 2026). This change provides a documentation-only, explicitly tracked signal for the canonical System Gate. The workflow's push path filter did not cover WebP-only uploads, so a new exact Development gate is required before promoting these assets.

- Exactly 50 distinct WebP files under `assets/images/brand-v3/` (plus `README.md`).
- The production `public/js/brand-v3-auto.js` maps all 50 exact filenames.
- No Product images, stock, pricing, checkout, database, provider, fulfilment or shipping changes.
- All images are illustrative, not proof that the depicted items are products for sale.
- Missing images preserve the previous visible media via preload-before-swap fallbacks.
- The production release must reproduce the same entire Development tree and pass the exact SHA's System Gate, Current Application Quality, I.T. Admin Runtime, and Repository Branch Hygiene proofs.

This documentation is deliberately part of the promoted tree so the image upload can be validated through the existing fail-closed Development-to-main procedure.
