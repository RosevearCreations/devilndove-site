# Build 763 — Maker's Shop acceleration and unique-stock pilot

Owner authorization 2026-11-26; issue #1041. Baseline Build 762 dev e7119ed80b31c111f4c815d6bd7a837a5dda5c3e, main b4d7e16e75f829896872c5faa3f73eac5a99a83b. Apply November 26 Source of Truth and roadmap 763–792. This is a development acceptance plan, not evidence of implementation.

## First workflow
Use existing canonical 0046 serialized finished pieces, order commitments and admin finished-pieces API. Test counter versus guest competing for one piece, both orderings and concurrent independent connections, cancellation/retry, immutable receipt and reconciliation. Identify first real defect before changing schema. Keep stock authority in existing Product/order/ledger records. No live charges or fake receipt certification.

## Immediate feature acceptance
1. QR passport: link approved serial to public minimal provenance; transfer care via single-use expiring authority; deny previous owner's invoice and private notes.
2. Creation timeline: customer sees only explicitly approved project events; revoke media and verify denial.
3. What can we make today: rank known recipes by available quantities and tools; missing data remains unknown; no machine action.
4. Experiment mode: private trial, failure lessons and costs; no automatic SKU or listing.
5. Material recognition: reuse receiving barcodes and supplier identifiers; uncertain camera match requires confirmation.
6. Accessible workshop: large controls, keyboard, voice-note optional with consent, durable pause/resume and no forced deadlines.
7. Scrap reuse: link actual recovered quantity and material lot; avoid double-counting stock or recovered cost.
8. Create once publish everywhere: generate drafts from consented source media; owner reviews channel-specific output; no automatic external publication.
9. Tool/supplier reviews: actual usage, purchase cost, maintenance and disclosed affiliate relationship; avoid invented observations.
10. Dovlin collectors: approved artwork, unique editions, no phantom stock, opt-in communications, privacy-safe care transfer.

For each feature inspect existing implementation, test authorized role journeys, extend the first missing capability; preserve established brand, independent finances and external provider holds. Use browser phone/tablet/desktop and Python/Node negative tests. Record exact dev/main source, Cloudflare deploy and separate external field acceptance. No bypass of release gates. Never certify a feature from this document alone.
