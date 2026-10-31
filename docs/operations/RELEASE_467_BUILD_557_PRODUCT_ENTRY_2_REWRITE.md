# Devil n Dove — Build 557 Product Entry 2.0

**Scope:** Admin-only Product Editor. No schema migration, live Product #54 write, Etsy image upload, social post, or automatic publication in this release.

## Everyday Product entry

The visible owner work area is now limited to **Details → Recipe → Photos → Destinations**. The Build 556 navy/purple/antique-gold foundation is applied only to this rebuilt Admin page. Existing Admin workspaces and the public storefront retain their own theme and behavior.

1. **Details:** name, SKU, category, Product type/status, CAD price, inventory, short/full description and shared search tags. Other saved fields remain available inside a concise **More fields** disclosure in the relevant section; nothing is deleted from the POST payload.
2. **Recipe:** existing saved base/fragrance/oil dropdowns and INCI candidate list. The owner must check the physical batch, ingredient order and **bar net weight**, then deliberately save. A scent/name conflict preserves the already saved official formula. Parcel shipping weight is a different field in advanced Details.
3. **Photos:** the existing Product gallery is shown once. Original file, alt text, public-use permission, quality and matching remain grounded in the same gallery/receipt APIs; optional featured image URL and destination mapping controls are collapsed.
4. **Destinations:** a verified existing Etsy ID connection, approved-photo transfer, and separate draft-text update are visible. Marketplace and social platforms provide clearly labeled **manual** copy/handoff only; no social posting API is claimed.

The normal Details opening no longer starts the separate live Etsy receipt/photo or draft-package requests. They load on **Destinations**, or when an explicit URL opens that area, so routine Product entry does less work during a busy server period. A local Product Save or create-redirect no longer triggers an automatic Etsy review/consent prompt; only a separate owner action in Destinations can lead to an external draft operation.

The single visible **Save Product** button retains the existing Product POST and confirmed price readback. For verified soap recipes, the existing source-selected formula save is a separately verified local POST after Product Save. An uncertain Product save locks repeated POSTs behind one authoritative server comparison. Saving Product destination preferences does **not** send to Etsy.

## Etsy owner safety

- Existing Sweet Orange Product **#54** / reported draft **#4601705477** remains an *unverified candidate* until the connected shop, saved listing claim, unpublished state and Canada-only shipping have been checked through the existing guarded Etsy endpoint.
- The new *Update verified existing Etsy draft* button only forwards to the existing draft-only action when the saved Product is clean and the connection UI has an independently confirmed receipt. The actual provider handler retains its own guards and owner confirmation.
- A new draft action is withheld from Sweet Orange. Other Products can open the prior advanced Etsy creation flow, which must independently prove no existing listing claim and require explicit owner action. No duplicate draft is created by merely opening the screen.
- Each Product photo transfer is an explicit owner action, individually checked against a confirmed Etsy photo ID. A timeout or unknown upload status is a HOLD, never an automatic retry.
- The Product Editor never automatically publishes to Etsy, Facebook Marketplace, Instagram, TikTok, X or Pinterest.

## Operator acceptance (Build 558 follow-up)

The acceptance check requires **actual Product #54 source data** and a live signed-in Etsy draft. This build cannot claim that the recipe is correct or that Etsy has all three images from static testing. Verify the four-tab desktop/mobile layout, choose the physical recipe, review the saved Product and exactly three original photographs, match their real Etsy image IDs and owner-approve the existing draft separately in Build 558.

## Technical release gates

- `node --test scripts/release467_build5*.test.mjs` includes the Build 557 contract and preserves older server-side safety checks.
- `node scripts/release467_build556_admin_interface_inventory.mjs --check` ensures no undeclared Admin route mutation.
- `python scripts/current_application_quality_gate.py` and GitHub Current Application Quality Proof must pass before promotion.
- Production is GREEN only after exact `main` SHA, successful GitHub production deploy and matching live `release-version.json` readback, plus HTTP 200 for the Product Editor and its new style/script assets.

**Next queued:** Build 558 — Sweet Orange Product #54 Owner Recipe Acceptance, Exact Existing Etsy Draft Link, and Three-Photo Verified Completion.
