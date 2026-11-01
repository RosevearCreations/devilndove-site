# Devil n Dove — Build 563: Cross-Channel Synchronization & Recovery

## Owner-facing workflow

Product Entry → Destinations now includes **Cross-channel recovery**, with a receipt-check action on each non-Etsy destination card. It reads the saved Product's existing Etsy draft linkage, Product-linked Social Queue records and historical attempts in one bounded, authorized local read. It never creates a new external post or draft, contacts a provider, silently retries an uncertain request, or fabricates a remote ID.

The panel classifies each destination as:

- **No receipt** — no local proof of external publication; inspect the destination before any new posting.
- **Queued for review** — an existing Product-linked Social Queue item; inspect it rather than creating a duplicate.
- **Local receipt only** — a stored reference or manual/API attempt, **not** independently verified provider state; hold re-posting until owner verification.
- **Uncertain** — a timeout/failure/pending attempt or missing remote ID after an attempt; repeat is blocked by policy pending manual confirmation.
- **Conflict** — multiple local remote IDs or conflicting draft claims; no single identifier is accepted.
- **Unavailable** — a required evidence source could not be read; fail closed.

Existing channel-specific guarded update/publishing tools remain separate. After a recovery readback, local handoff buttons for destinations on HOLD are disabled; **Open provider** remains available for manual verification. A failed recovery read also holds those handoffs rather than interpreting missing evidence as success. This does not police activity done directly on a provider website, and an operator who has not opened the receipt check still needs to do so before a new post. The readback cannot authorize an Etsy draft update, social API publication, new platform permissions or any retry. **No new provider write path was introduced:** preserving idempotence here means keeping the existing saved source/queue ID and refusing an uncertain or duplicate new action. A provider-confirmed remote ID and current status are still required for a true synchronized state, so live reconciliation is explicitly unavailable rather than simulated.

## Security and evidence

- `GET /api/admin/product-channel-recovery-563?product_id=...` requires verified module Admin authority and an exact positive Product ID.
- Reads `products`, `marketplace_syndication_drafts`, `social_post_queue` and `social_post_attempts` from the primary D1 session with strict per-Product bounds (24 draft claims, 24 queue items, 100 attempts); no extra D1 schema, no token read, no provider request or write.
- A social queue row must have `source_type='product'` and the exact matching source ID. Attempts are limited to those Product queue IDs; a workshop post with the same numeric source ID does not become a Product receipt.
- HTTPS-only saved URLs are emitted; no arbitrary HTML or token material is rendered. No remote record is marked live-verified solely because a local ID exists.
- All read failures yield **Unavailable**, never a false green or a success claim. Product changes invalidate the handoff until a new saved-Product readback.

## Release checks and next build

Focused tests cover uncertain attempts, exact Product linkage, local Etsy claims, conflicting IDs, unavailable evidence, denied Admin access, SELECT-only reads, and one-click lazy UI recovery. Prior Product Entry, Etsy, Meta, TikTok, X and Pinterest regressions remain enabled.

**Next: Build 564 — Admin Modernization: Commerce.** Apply the approved deep navy/purple and copper/gold Admin card pattern selectively to remaining legacy Product, Inventory, Orders and Fulfillment screens while preserving successful revamps and their existing actions.
