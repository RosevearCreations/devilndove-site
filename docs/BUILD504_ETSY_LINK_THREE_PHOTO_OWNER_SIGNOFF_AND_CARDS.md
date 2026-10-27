# Build 504 — Existing Etsy Link, Three-Photo Provider Readback, Owner Sign-Off & Uniform Cards

## Owner screenshot / failure classification

- Saved local Product **#53**: `Adventurine Argon`, SKU `DND-01130`, slug `adventurine-argon`.
- Existing Etsy draft **#4603838854** remains authoritative; **never delete it, publish it or create another** to clear a link error.
- The screenshot showed `This Etsy listing is already linked to another local draft or Product` and occasional Cloudflare 503. This is a **local claim conflict**, distinct from failed Etsy authorization, actual media readiness or a changed Product field. We cannot determine which local Product owns the claim from a screenshot alone.
- The preexisting `Open Etsy Drafts` URL returned Etsy 404. Build 504 opens the exact previously witnessed draft editor when its ID is known.
- The saved Etsy override `Soap bars`, Product description containing only its title, and Etsy `Bar Soaps` category must be confirmed by the owner. No product facts or tags were fabricated.

## Shipped changes

1. An authorized **read-only candidate claim check** now distinguishes unclaimed, same-Product and another-Product listing IDs, naming the other local Product, SKU and a safe Product Editor link. The source of truth is existing `marketplace_syndication_drafts`, not a browser guess.
2. After live shop, unpublished draft and Canada-only shipping verification, an **already-present #53 receipt** can have its exact saved verification refreshed without inserting a duplicate. Claims owned by another Product stay blocked; the application never silently steals or deletes them. All link operations are explicit, exact-ID and audited.
3. The Etsy panel now offers **Read Etsy's three-photo receipts** for Product image IDs **#344, #345, #346**. It reads the real draft, saved original Product/gallery, confirmed transfer receipts and live Etsy image IDs. It also checks the saved Product's title, meaningful description, CAD price, quantity and native Etsy tags. Each missing photo/field is named. A Cloudflare error means an inconclusive read, not that an image is bad.
4. A distinct owner checkbox and **Record final owner sign-off** control appears only after a complete independent readback. The server reruns the same readback and atomically stores an owner approval in the **existing** audit table. No Etsy publication, new listing, shipping edit, image transfer, automatic retry, D1 migration or added database occurs as part of sign-off.
5. The Home Featured Workshop, Shop, Creations and Recently Viewed cards use a shared responsive **4:5 photo frame** with contained real product imagery (no crop/stretch), equal card height, consistent text spacing, metadata alignment and bottom actions.

## Gate / production truth

- Unit and regression: `node --test scripts/release467_build504_etsy_link_photo_signoff_cards.test.mjs scripts/release467_build503_etsy_owner_diagnostics.test.mjs scripts/release467_build502_etsy_existing_link_media_owner.test.mjs scripts/release467_build501_etsy_save_sync_mobile.test.mjs scripts/release467_build500_etsy_complete_package.test.mjs`.
- Release gate: `python scripts/current_application_quality_gate.py`.
- Main promotion must pass protected PR/dev checks, exact-`main` Cloudflare Pages deployment, custom domain smoke and final live-resource integrity proof.
- **Local code/CI GREEN is not owner Etsy GREEN.** An actual signed-in Owner must first verify #53's local claim, inspect the original Etsy draft, correct the content issues, transfer eligible original photographs through the existing at-most-once flow, observe all **3/3** verified images in Etsy, and explicitly sign off. Until then **Etsy owner acceptance = HOLD**.

**Next expected Build 505 — Local Etsy Claim Conflict Owner Resolution, Verified Original Gallery Remediation & Production Sign-Off Retest.**
