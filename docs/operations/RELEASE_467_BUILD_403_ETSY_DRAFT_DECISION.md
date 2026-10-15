# Release 467 Build 403 — Etsy Draft Review Exceptions & Owner Publication Decision Readiness

**Release GREEN means software deployed. It does not mean an Etsy draft was accepted by the owner or published. This release NEVER publishes or automatically retries any Etsy write.**

## Operator procedure
1. In https://devilndove.com/admin/it-integrations/, complete verified Build 399/400 local draft linking, Build 401 compliance and image review, and Build 402 final local acceptance, including any uncertain image outcome reconciliation.
2. In Build 403 paste the same linked local draft UUID and press **Read local history**. This is D1-only and makes no provider request.
3. Press **Inspect Etsy draft and exceptions**. This performs two deliberate, read-only Etsy GETs. Review product/shop/title/price/quantity, image ID and 401/402 receipts. Missing acceptance or mismatch is HOLD.
4. If Etsy read fails, a photo is absent, account scope is missing, ingredients/label claims need review, or US shipping is not properly disabled, select an exception category, type notes and press **Record owner HOLD**. Local audit only; no Etsy write. HOLD does not falsely certify a live listing.
5. Only after all blockers are cleared and the owner independently reviews photo, product, shipping destinations/country restrictions, Etsy policies, and acknowledges no publication, select a verified live image and press **Record owner readiness**. Endpoint repeats Etsy GETs and checks the Build 402 accepted image and exact stored receipt before writing one local audit receipt.
6. A READY entry is **readiness for a separate MANUAL Etsy decision**, not authorization to publish. It can become stale if Etsy or product data changes. A later HOLD or READY is a separate append-only audit event. Any publication would require a separate owner-initiated Etsy action outside this Build.

## Security and reliability
- All endpoints require verified active Administrator.
- Provider requests are GET only, redirect blocked, no automatic retry, no image upload or listing state update.
- Only six most useful administrative D1 queries and two deliberate provider reads; no refresh polling.
- No new D1 schema, secrets, Product changes, OAuth refresh or international shipping configuration changes.
- Request-key idempotency is enforced in an atomic audit INSERT with conflict checking, keyed per local Etsy draft.
- A successful automated test is not evidence of real Etsy acceptance, approval, availability, or regulatory compliance.
- US shipping is currently suspended by owner policy; compliance checkbox requires reviewing destination exclusions before declaring readiness.

## Starting point
Build 402 Development dev bffabd7017d2f15de4da017f6f5b97fa7b6cc6f5 / tree 81f61bf2271e3ab42ead3aaf4356b2a562011160.
System 38681819775; Quality 38681819726; I.T. 38681819825; Hygiene 38681819692; D1 38681819706; Build 402 38681819781.
Build 402 Production main 4f09d902ba4ce3ed8329c9a4822f09e21ac8eb16; Pages 38682071549; Live Resource Integrity 38682152607.

Next proposed: **Build 404 — Etsy Operator Exception Resolution Evidence & Publication Decision Revalidation.**
