# Release 467 Build 436 — Admin Artwork & Media Content Studio Reliability

## Scope and safety

Build 436 continues the installed Brand V3 **Standard** design, concentrating on reliably loading real owner-selected site media and on diagnosing optional Admin banners without causing broken image frames or overwriting owner assignments.

### Delivered

- **Runtime image adoption:** `public/js/media-content-runtime.js` now preloads the assigned public image before changing the visible `src` or background, removes authored-placeholder styling only after a successful image load, ignores stale/out-of-order image events, and signals `dd:media-image-unavailable` without changing the persisted assignment or the owner's existing visible image when the new URL fails. Unsafe `data:`, protocol-relative and script URLs are rejected.
- **Truthful asynchronous readiness:** the runtime now marks the page `pending` while an owner-selected image is being preloaded, `applied` only after successful image adoption, and `degraded` after a failed assigned image. It emits `dd:media-content-ready` with pending/failed counts; a prior visible image is never erased to manufacture a green state.
- **Executable browser-runtime acceptance:** `scripts/release467_build436_media_runtime.test.mjs` runs the actual runtime in a deliberately bounded Node VM. It verifies successful preload swap, failed-load preservation of original owner art/alt, out-of-order success rejection, and unsafe URL rejection. No D1/R2, Etsy, checkout or deployment calls.
- **70 Admin banner asset audit:** `scripts/release467_build436_admin_artwork_audit.mjs` checks Sets 13–19 (70 exact route/filename mappings), route existence, owner-selected WebP presence and RIFF/WEBP signatures. It distinguishes a **missing optional banner** from an invalid binary. Existing Admin page content remains visible when any optional WebP is absent. An audit JSON is written with per-file and per-route status; it never replaces or fabricates an image.
- **Independent workflow evidence:** `.github/workflows/release467-build436-admin-media.yml` runs the two regressions and uploads `release436-admin-artwork-audit.json` for the owner to review. The main `Current Application Quality Proof` also executes both tests.
- **Media Studio ownership:** The existing `/admin/media-content-studio/` remains the authorized place to assign and remove page-slot media. It retains separate controls for **Save details only** versus **Save details & use in this location**, with the latter requiring the Admin session and explicit action. The public manifest returns only active image assignments with undeleted/unarchived media; owner-selected uploaded images override authored defaults, and the authored default remains the visual fallback on error.

### How to inspect

1. In GitHub Actions, open **Release 467 Build 436 Admin Media Reliability** for the exact `dev` SHA. Download `release436-admin-artwork-audit`; inspect `missing_optional`, `invalid` and `assets[]` to identify any Admin WebPs needing owner upload. **Missing optional art is not falsely considered a shipped file.**
2. Visit `/admin/media-content-studio/` with an authorized Admin session, review a specific page's media slot and dimension guidance, and verify the owner's selected image remains in place. Save metadata without assigning, then explicitly assign a different valid image only when intended.
3. Check an Admin route whose decorative banner exists and one whose banner is absent. The absence of optional artwork must not produce a broken image or hide controls.
4. Check Shop/Product pages, Tools/Supplies, Admin navigation, mobile layout and an authored placeholder with an override. If media cannot be loaded, the visible authored/previous image should remain present; the owner should not be forced to redo an assignment.

### Known limits

The source audit is not a rendered-browser screenshot audit, and a source image may be available in GitHub without yet being served by Cloudflare. The audit lists missing optional files rather than manufacturing artwork. A successful GitHub source merge is **not** evidence of Cloudflare Production GREEN.

Promotion requires successful four exact-Development-SHA workflows, Preview, protected Production Pages Deploy, Cloudflare deployment identity, live custom-domain release marker and post-deployment smoke. The Etsy one-Product test remains on hold until owner resumes it.

**Next queued:** Build 437 — Storefront Purchase & Shipping Safety Review.


## Product Editor Build 406 / 408 canonical Etsy review loading repair

Owner observed Product **Bar Soap Sweet Orange** (SKU `DND-01131`, Draft / Pending Review) showing both `Canonical gallery cannot be verified` and `Local D1 evidence unavailable` in the Product Editor. This was a **local Product/D1 evidence failure**, not proof that Etsy OAuth failed or that a listing was sent.

Builds 406/408 previously selected `image_role`, `public_use_status`, `width_px`, and `height_px` directly from `product_images`. The canonical Product Media editor stores these values in `product_image_annotations`. The shared `functions/api/_lib/canonicalDistributionGallery436.mjs` now joins owner-owned gallery rows to image annotations for **both** read endpoints. A legacy database without the annotation table may show unapproved Product images (never fake approvals/dimensions). Any other D1 failures still hold safely, and writes or provider posting are not retried automatically.

The Product Editor loads `css/admin-product-channel-review-436.css` so Build 405/406/408 consent checkboxes no longer become enormous separate-line purple controls. The gallery and local-acceptance scripts are cache-busted; the fix doesn't check any owner consent automatically.

Acceptance: `node --test scripts/release467_build436_channel_gallery_regression.mjs`, plus dedicated `Release 467 Build 436 Canonical Etsy Media Read Regression` and Current Application Quality workflows, test that the correct joined SQL runs, annotations are required for approval, missing metadata cannot be approved, and real D1 failures remain fail-closed.

**Operator after confirmed live deployment:** Reload the Product Editor, open the Media tab to confirm at least one approved canonical photo with >=800×800 dimensions and suitable alt text, click Build 406 `Load approved Product gallery`, select a qualified photo, review U.S. shipping exclusion, and save local mapping. Only after the resulting local receipt is confirmed should Build 408 `Load current source & readiness` be attempted. The product's Draft / Pending Review state is not itself proof of missing D1, and does not authorize Etsy publication.
