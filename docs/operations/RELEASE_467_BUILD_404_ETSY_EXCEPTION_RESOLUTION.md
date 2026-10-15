# Release 467 Build 404 — Etsy Operator Exception Resolution Evidence & Publication Decision Revalidation

**A GREEN software release does NOT mean a real Etsy listing was published or accepted. Etsy remains unpublished.** Every Etsy request in this build is one operator-requested GET; D1 receives only small audit receipts. No retries, uploads, OAuth refresh, Product mutation, inventory change or publication.

## Controlled operator steps
1. On https://devilndove.com/admin/it-integrations/, identify the linked Build 399/400 local draft ID. In Build 404 click **Read local HOLD ledger** (D1 only). Select the exact Build 403 HOLD audit receipt.
2. Correct the actual Etsy/product/compliance/shipping problem outside this Build as needed, observing Devil n Dove's US sales and shipping suspension.
3. Enter meaningful corrective evidence (what changed and how verified), click **Record correction evidence**. This stores an OWNER_REPORTED_UNVERIFIED receipt only; it does NOT resolve the HOLD.
4. Acknowledge the owner checks, then **Inspect current Etsy draft** (operator-authorized two GETs). Select the actual image ID. Fresh evidence must match exact Etsy shop, draft, product title, CAD price, stock quantity, Build401 compliance image receipt, and Build402 final acceptance receipt. If not, status stays HOLD.
5. Enter the correction receipt ID and click **Resolve this HOLD**. The endpoint performs fresh Etsy GET again and atomically attaches the specific resolution to the original HOLD and correction evidence ID. Each HOLD can be resolved only once; a conflicting second correction cannot replace the first resolution.
6. Resolve each additional HOLD separately. Return to Build 403 and record a NEW owner READY decision **after the latest HOLD**. If a HOLD remains unresolved or the last Build403 decision is HOLD, Build 404 refuses revalidation.
7. Reload and inspect again. With all confirmations, choose the exact image, click **Revalidate publication decision**. This repeats fresh provider GET and stores an append-only local receipt. **No listing is activated or published here.** A real publication requires a separately authorized manual owner action in Etsy.

## Reliability / acceptance notes
- Local GET has no Etsy provider reads. No polling or startup fetch.
- Evidence is labeled OWNER_REPORTED_UNVERIFIED until backed by an owner-triggered Etsy draft/image GET.
- Exact source HOLD IDs, listing IDs, image IDs and previous Build401–403 receipts must match. Missing/changed evidence fails closed.
- Atomic D1 exception resolution rejects conflicts for the same HOLD; idempotent client request keys avoid duplicate audit records.
- Current US shipping restrictions and applicable cosmetic/soap labeling and ingredient requirements remain owner-attested; no automated legal certification is claimed.
- All admin requests require verified active Administrator role.

Starting GREEN Build403: development 1ab8f0f3f1c5fc6e1650c380864a423deef9cc44, tree 2ea547cb46d5bccb3c3a6cd332c89e0c5fb446cd.
System 38709368501; Quality 38709368333; I.T. 38709368341; Hygiene 38709368563; D1 38709368345; Build403 38709368344.
Production main f404ae90e039af70405f6bdb4ec7886515e87b53; Pages 38709622328; Live integrity 38709740946.

Next proposed: **Build 405 — Etsy Owner Publication Decision Packet & Non-Publishing Final Review.**
