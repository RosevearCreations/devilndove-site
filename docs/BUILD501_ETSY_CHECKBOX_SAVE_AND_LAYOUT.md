# Build 501 — Clean Etsy checkbox + Save Product

## What the owner sees

1. On the Product's main page, choose **Sync this Product with Etsy when we Save**. Confirm that we own the Product/gallery rights and authorize only a Canada-only **unpublished draft**. Save the Product normally.
2. Save Product always saves the local Product first. If Etsy is selected and the destination preference is verified, it requests a single Etsy package create/update using the saved Product and **all** approved original gallery images. Every provider result must pass live readback.
3. When an existing draft is linked, the Etsy listing ID appears on the Product identity card. All later saves update the same listing ID. An already-saved image/gallery edit also requests a provider sync after Product authority and source approval checks.
4. When new mandatory Etsy category/processing/shipping and real packed parcel measurements are missing, the local Product remains saved. The Etsy tab shows one HOLD and the one-time setup. No partial or invented remote listing is created.
5. For Product #53, the owner-supplied screenshot ID **4603838854** is a candidate, not confirmed remote proof. **Verify and save Etsy listing ID** once against the actual shop, unpublished status, title and Canada-only shipping. Then Save or Update targets that same existing draft. Do **not** use Create to work around a previous attempt.

## Why the page was unusable

On the live Product Editor, the checkbox inherited full-width input sizing. The 1090px-wide checkbox squeezed its remaining consent sentence into a near-zero-width flex column, stretching a single label to about 3938px in height; the prior ID-link consent was about 1416px high. The CSS fix constrains checkboxes to 18×18px, prevents flex growth and gives Etsy sections intrinsic-height rows. The six older sections remain closed even if Etsy returns HOLD.

## Guardrails and sign-off

- Etsy opt-in plus a successful **verified** Product/destination save supplies explicit one-time authorization. If a provider write is uncertain, the current session holds further writes until independently reconciled; backend audit claims also fail closed.
- Gallery uploads happen only for rights-approved, verified original R2 JPEG/PNG files. A missing/uncertain image blocks the package. Old Etsy media is never overwritten or resent blindly.
- Etsy may need separate API calls internally to create a draft and transfer images. The owner sees one action. Nothing is published; Facebook Marketplace is manual.
- A local code test cannot sign off the real Product #53 or photos #344–346. That requires signed-in Etsy live readback and correct authorizations.

## Verification

`node --test scripts/release467_build500_etsy_complete_package.test.mjs scripts/release467_build501_etsy_save_sync_mobile.test.mjs`

Run all older Etsy regressions and current application quality proof. Confirm in a browser at desktop and mobile widths that no checkbox, consent text, action row or sticky footer overflows; confirm the listing ID and status banner stay readable. Once Production is green, the owner tests Save with Etsy OFF and ON, existing draft Update, photo addition and Product #53 listing-ID recovery. Do not claim a live Etsy transfer until provider receipts verify every photo.

**Next expected Build 502 — Owner Etsy Checkbox Flow Sign-Off, Resume Receipt Reconciliation & Product #53 Confirmed Photo Acceptance.**
