# Devil n Dove — Brand V3 Set 11: Homepage navigation cards

**Status:** Exact image-to-card mapping lives on branch `dev` in `index.html`, `public/js/brand-v3-auto.js` and `css/brand-v3-theme.css`. These ten binary WebP files are supplied in the Set 11 downloadable ZIP and must be uploaded by the owner to `assets/images/brand-v3/` on `dev` for those cards to show new artwork.

Each image is a *new decorative composition from previously generated Devil n Dove artist artwork*, not a photograph of a specific real product. The HTML navigation cards keep their genuine destinations, membership visibility, text and keyboard behavior.

| ID | Exact asset filename | Homepage navigation card | Link |
|---|---|---|---|
| 101 | `101-home-workshop-journal-card.webp` | Workshop Journal | `/workshop-journal/` |
| 102 | `102-home-gallery-card.webp` | Gallery | `/gallery/` |
| 103 | `103-home-creations-card.webp` | Creations | `/creations/` |
| 104 | `104-home-collections-card.webp` | Collections | `/collections/` |
| 105 | `105-home-marketplaces-card.webp` | Marketplaces | `/marketplaces/` |
| 106 | `106-home-events-card.webp` | Events | `/events/` |
| 107 | `107-home-local-pickup-card.webp` | Local Pickup | `/pickup/` |
| 108 | `108-home-tools-card.webp` | Tools | `/tools/` |
| 109 | `109-home-supplies-card.webp` | Supplies | `/supplies/` |
| 110 | `110-home-members-area-card.webp` | Members Area | `/members/` |

No artwork is shown unless an `Image()` preload succeeds; therefore missing uploads don't create broken artwork tiles. Each image is displayed with CSS `background-size: contain` in its dedicated pseudo-element, so the artwork is not cropped. CSS never replaces genuine product or tool/supply photos.

The login-gated Members Area remains gated by its original `data-show-when-logged-in` attribute. `dev` is not proof that `main` / Cloudflare Production is live.