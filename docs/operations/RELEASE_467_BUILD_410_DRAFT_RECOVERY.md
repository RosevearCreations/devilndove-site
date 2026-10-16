# Release 467 Build 410 — Provider Draft Outcome Exception Resolution, Safe Manual Recovery & Destination Evidence Dashboard

## Delivered
- A click-to-load, verified-Admin Storefront I.T. Integrations dashboard for one canonical Product and destination (Etsy draft ID required for Etsy).
- Bounded D1-only evidence shows Build 399 attempt claim, Build 409 operator authorization, Build 400 verified-unpublished reconciliation receipt, linked listing ID, and Build 410 latest case receipt. An Etsy GET is never implied by loading the dashboard.
- An unknown remote attempt is **HOLD**, not a new retry budget. A Build 399 one-shot attempt claim remains intact even after a case is closed.
- Manual operator HOLD case records investigation notes with no provider calls. Case closure requires matching saved Build 400 proof of that exact claimed draft, linked unpublished listing, and explicit operator approval.
- Uses immutable audit entries in existing `admin_action_audit`; no new schema, provider writes, additional listing attempts, automatic retry, secrets, U.S. sales, or publication.
- Facebook Marketplace destination shows permission HOLD (not falsely approved for external listing creation).
- Case state and receipts are **historical D1 evidence**. For a fresh Etsy state, use existing Build 400 deliberate GET; the dashboard never calls Etsy or asserts live provider state.
- Concurrent case updates are guarded by an expected latest receipt; request-key replay returns the previous receipt only for the same action and Product.

## Manual recovery
1. In I.T. Integrations, enter Product ID, select Etsy, and enter a saved local draft UUID.
2. Click **Read saved destination evidence** to inspect local claim, the linked listing ID, and saved Build 400 reconciliation.
3. If the outcome is unknown, investigate Etsy Draft Listings manually and record a HOLD note. Do not repeat Build 399 creation.
4. If the original remote listing exists, use Build 400 user-initiated GET verification and local linking.
5. Reload the Build 410 dashboard. Only when matching unpublished Build 400 proof exists, record a local verified-case closure.
6. No 410 action clears the durable one-attempt remote claim or triggers a new Etsy listing request.

## Next proposed
Build 411 — Provider Evidence Audit Lifecycle, Destination Status Snapshot Governance & Exception Escalation.
