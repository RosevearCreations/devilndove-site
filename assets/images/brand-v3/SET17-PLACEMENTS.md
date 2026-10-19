# Devil n Dove Brand V3 Set 17 — Artwork 161–170

Ten separate 1712 × 324 WebP banners, not a sample board. The owner can extract all ten files from `devilndove-set-17-artwork-161-170.zip` and upload them directly into `assets/images/brand-v3/` on `dev`. Use the HYPHEN `brand-v3`, not `brand_v3`.

| ID | Exact WebP filename | Admin page route |
|---|---|---|
| 161 | `161-admin-business-pipeline.webp` | `/admin/business-pipeline/` |
| 162 | `162-admin-trust-moderation.webp` | `/admin/trust-blocks/` |
| 163 | `163-admin-help-centre.webp` | `/admin/help/` |
| 164 | `164-admin-members-access.webp` | `/admin/members/` |
| 165 | `165-admin-custom-work-handoff.webp` | `/admin/custom-request/` |
| 166 | `166-admin-marketplace-readiness.webp` | `/admin/marketplace-readiness/` |
| 167 | `167-admin-analytics-visitors.webp` | `/admin/analytics/` |
| 168 | `168-admin-creative-automation.webp` | `/admin/creative-automation/` |
| 169 | `169-admin-product-editor.webp` | `/admin/product-editor/` |
| 170 | `170-admin-release-control.webp` | `/admin/release-control/` |

## Mapped code

- `public/js/admin-brand-v3-set17.js` maps the actual Admin route to its exact WebP filename and injects the banner only **after successful image load**.
- `css/admin-brand-v3-set17.css` uses `object-fit:contain` to avoid cropping artwork and allows horizontal scroll on narrow screens. It modernizes the surrounding page panels, while keeping the original data/control HTML functional.
- Each Admin page includes the dedicated `?v=17` CSS and JS resources. `public/js/brand-v3-auto.js` stores the shared IDs 161–170.
- The actual images are independently packaged for owner upload; a mapped filename alone does not imply the WebP has been uploaded, or `main`/Cloudflare Production GREEN.
- No real products, tools, supplies, or showcase photographs are overwritten; no new Admin reads, writes, automatic polling or security changes are introduced.
