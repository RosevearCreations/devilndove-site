# Devil n Dove — Build 529 real Etsy and three-Product safe readback

30 October 2026 · Source: `RosevearCreations/devilndove-site` · Product Editor

## Real owner check

The expanded **Verify saved Etsy drafts and photos (read-only)** panel accepts one, two or three *exact, saved* Product IDs. The selected Product ID is prefilled where available. Pressing Verify performs authenticated GETs for:

1. Stored main-site Etsy OAuth connection and verified shop receipt (no token is displayed).
2. Each Product's saved D1 row and one uniquely confirmed primary Etsy listing-ID receipt.
3. Each linked listing's live, unpublished Etsy draft and remote photo inventory, matching each source Product image to one verified image receipt and live Etsy image ID.

No new Product, Etsy listing, media upload, OAuth grant, or publication is attempted. A failed Etsy read or uncertain save is **HOLD**. An exact matching inventory reports **VERIFIED (read-only)**; it does not prove a past browser Save payload matched every server field or grant publication authority. The existing save-recovery comparison remains the path for a failed Save, without blind retries.

The owner has not supplied the three failed soap Product IDs in the conversation. Older #53/#54 product histories do **not** prove they are the three affected soaps. The authenticated three-Product live readback cannot be represented as complete until the owner selects the exact three IDs in the production editor, authenticates and reviews the results.

The existing Etsy API connection may report HOLD due to missing OAuth credentials, expired access, shop mismatch, insufficient scopes, Cloudflare/D1 availability or remote draft/photo discrepancies. Do not create a replacement draft to bypass a 409. Explicit OAuth connection management remains under Admin → I.T. Integrations.

## Release verification

- Quality gate: `node scripts/release467_build529_owner_readback.test.mjs` plus inherited Build 528 and older application tests.
- Production gate: exact `dev` SHA system/quality/runtime/hygiene successes, merged `main` SHA, Production Pages Deploy success and `https://devilndove.com/release-version.json` showing Build 529 on the exact main source SHA.
- QL nonproduction cross-app connectivity remains separate and HELD; no signing proof or owner-private custodian task is silently completed by this Etsy build.

**Queued Build 530:** Owner-confirmed three-soap Etsy receipt closure, save outcome reconciliation and final image/tag acceptance.
