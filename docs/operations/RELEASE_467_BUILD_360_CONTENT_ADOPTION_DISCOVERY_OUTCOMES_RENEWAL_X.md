# Release 467 Build 360 — Content Adoption & Discovery Outcomes Renewal X

Build 360 succeeds exact Build 359 Development/Production GREEN and repeats comparable content-adoption, discovery, runtime, identity and read-cost measurement. The next roadmap is renewed from observed evidence only.

## Raw Inventory identity confirmation

Raw Inventory is intentionally **one operational record per active source identity** (`source_type + external_key`). Receiving more of the same item adds to that record's on-hand quantity; it must not create a second active Inventory record. The create path returns `inventory_identity_exists` instead of allowing a duplicate.

Purchase/receiving lots are different: multiple `inventory_purchase_lots` rows may be linked to the same `site_item_inventory` record so supplier order, date, cost, expiry and lot provenance remain factual. Those lot rows are provenance, not duplicate Inventory items.

Build 360 additionally measures current Development for duplicate active Inventory identities. A non-zero duplicate identity count fails the Build 360 measurement proof rather than silently accepting drift.

## Permanent boundaries

- Measurement is Development-only and read-only.
- Search Console evidence remains real-only and freshness requires an explicit report date.
- Manual operator testing remains on main Production after GREEN Development proofing.
- No automatic story generation, approval, publication, social posting, SEO apply or provider publication.
- Private media remains private unless explicitly reviewed for public use.
- Production data remains Production-owned.
