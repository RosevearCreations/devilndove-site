# Release 467 Build 401 — Etsy Draft Image Readiness, Compliance Review & Controlled Listing Completion

Software release can be GREEN without a real listing accepted by Etsy. **Real provider acceptance and any image upload remain pending until explicit authenticated operator action on https://devilndove.com/admin/it-integrations/.**

## Scope
- Inspect the existing linked Build 400 physical draft and Etsy image metadata with explicit operator GETs. No provider request on page load.
- One manual JPEG/PNG upload to an *unpublished*, empty-image Etsy draft. Only JPEG/PNG magic, at most 8 MiB, manual alt text, secure request ID.
- A D1 claim is written before any Etsy image POST; any timeout, ambiguous response or claim conflict freezes the attempt. **Never retry automatically**; inspect Etsy images manually and reconcile in the next planned corrective build.
- All six operator compliance attestations required: photo rights, correct product depiction, truthful materials/description, applicable ingredients and labels, safety/claims, shipping/returns. These are owner attestations, not an automated legal certification.
- An additional operator action re-fetches live Etsy draft and images; if at least one image and reviewed evidence match, persist **local review receipt** only. Listing remains draft in Etsy. No updateListing PATCH, activation or publication.
- Preserve original Product price/inventory, local draft origin, and image records. No new D1 migration, R2 modification, OAuth automatic refresh or new secrets.

## Live operator procedure
1. Complete Build 399 remote unpublished draft and Build 400 verified local linking. Confirm real Etsy listing ID.
2. In Build 401 section, paste linked local UUID, Read local evidence, then Inspect Etsy images. If images exist already, do not upload another.
3. Review the photo rights, product and packaging/ingredient compliance, claims, shipping and returns. Choose a JPEG/PNG file with descriptive alt text.
4. Approve **one** upload only if no image already exists. If result unknown, check Etsy Drafts; NEVER press upload again for the same draft.
5. Inspect again; when Etsy returns a draft with image evidence, explicitly record the local review. Nothing is published; any activation is a separate future owner action directly in Etsy.

## Promotion evidence
- Dedicated Build 401, System Gate, Quality, I.T. Runtime, Branch Hygiene, D1 CI Fan-Out GREEN on one exact dev SHA.
- Preview deploy GREEN. Production main tree must be byte-identical to the verified dev tree.
- Production Pages and independent Production Live Resource Integrity GREEN on the same main SHA.
- GitHub CI cannot prove a real Etsy draft/image or regulatory compliance.

Build 400 verified predecessor:
Development 1278de0a3ff029061750bdd54ddaccd05d4f68a5, tree 6b5a50c1a37b581260ca48cd703bae790995fb57.
System 38630144380, Quality 38630146619, I.T. 38630144379, Hygiene 38630144400, D1 guard 38630144473, Build400 38630144446.
Production main 38c49a5146f962a7aef74b9da58c10908c42433e, Pages 38630586471, Live Integrity 38630754123.

Next proposed: **Build 402 — Etsy Image Upload Outcome Reconciliation & Final Operator Acceptance.**
