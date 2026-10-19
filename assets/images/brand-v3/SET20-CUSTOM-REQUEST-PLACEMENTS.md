# Devil n Dove — Brand V3 Set 20 / Custom Request 191–195

Five independently exported **720 × 760 WebP** photos, packaged as separate files in `devilndove-brand-v3-custom-request-191-195.zip` with a CSV.

| ID | Exact filename | Customer site placement |
|---|---|---|
| 191 | `191-custom-request-what-made.webp` | `/custom-request/`, inspiration card 1 |
| 192 | `192-custom-request-making-method.webp` | `/custom-request/`, inspiration card 2 |
| 193 | `193-custom-request-material-ideas.webp` | `/custom-request/`, inspiration card 3 |
| 194 | `194-custom-request-occasion-use.webp` | `/custom-request/`, inspiration card 4 |
| 195 | `195-custom-request-not-sure.webp` | `/custom-request/`, inspiration card 5 |

**Upload:** Extract the five WebPs and put them in `devilndove-site/assets/images/brand-v3/` on `dev`. Do not upload the composite or ZIP as an image.

**Application wiring:** `custom-request/index.html` lists the five files as `data-dd-brand-v3-custom-upgrade`; `public/js/custom-request-brand-v3-cards.js` preloads each and changes only its corresponding decorative illustration once the file exists. Existing prior artwork displays until then. `css/brand-v3-frontsite-recovery.css` uses complete photo framing and independent visible text/link controls. No actual product, tool or supply media is replaced.

**Additional public fixes:** All six Homepage category tiles now have standalone approved artwork, and the four dynamic Shop origin cards use actual `img` tags (rather than CSP-sensitive inline image backgrounds). Dev only until explicitly and safely promoted to main and verified on Cloudflare.
