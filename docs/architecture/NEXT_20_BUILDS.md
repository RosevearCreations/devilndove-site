# Devil n Dove — Current Rolling 20-Build Queue

Updated 2026-11-17. **The old August 25 Builds 383–412 queue was stale and is preserved in [historical archive](ARCHIVED_NEXT_20_BUILDS_383_412.md).** These are **new proposals, not previously approved or completed tickets**. The most recently authorized release is Build **735** (Recovery Delivery Readiness and Atomic Abuse Limits); these 20 are the **following proposed builds**, so the count after 735's successful promotion is **20 proposed builds (736–755)**. This list is not a claim that all remaining company work can be done in 20 builds.

## After Build 735 — proposed queue (20 items)

| Build | Next proposed work | Original-evidence and owner boundary | Status |
| --- | --- | --- | --- |
| 736 | Resend Recovery Deliverability & Owner Inbox Acceptance | Check production sender configuration and a separately consented original inbox pilot; never infer inbox delivery from provider acceptance. | PROPOSED / NOT STARTED |
| 737 | Password Recovery Threat-Model & Abuse-Resistance Review | Verify mixed-IP/email concurrency, 30-minute expiry, token replay and safe lockout recovery without automatic credential changes. | PROPOSED / NOT STARTED |
| 738 | Forgot Account Support Queue & Identity Review | Admin triage and privacy-safe manual account identification; no disclosure to an unverified alternate email. | PROPOSED / NOT STARTED |
| 739 | Original Three-Master Peer Enrollment Pilot | Independently attest original master receiver URL, Ed25519 key ownership and true live signed challenges, with HOLD if any peer is unavailable. | PROPOSED / NOT STARTED |
| 740 | Owner-Gated Privacy Sender Activation Ceremony | Separate explicit authorization only after all original peer proofs; preserve disabled defaults and no auto-send otherwise. | PROPOSED / NOT STARTED |
| 741 | Signed Withdrawal Retry & Dead-Letter Operations | Reconcile genuine live ACKs, SLA closure and no duplicate/remote erasure claims. | PROPOSED / NOT STARTED |
| 742 | Dovlin Collection Landing & Approved Eight-Plush Catalog | Design dedicated branded collection linked to original approved Dovlin imagery and sellable SKUs only with actual assets/rights. | PROPOSED / NOT STARTED |
| 743 | Dovlin Gallery, Character Fidelity & Material Evidence | Check authorized colourways, collector photos, 3+ labelling and sample evidence; no invented certifications. | PROPOSED / NOT STARTED |
| 744 | Dovlin Stories, Collectibles & Product Bundle Presentation | Curate genuine stories and merchandise links without automatic listing or unsupported imagery. | PROPOSED / NOT STARTED |
| 745 | Mobile Storefront Product-First Navigation | Bring actual products above introductory content, clarify menus and maintain responsive accessibility. | PROPOSED / NOT STARTED |
| 746 | Mobile Product Camera Capture & Draft Recovery | Verify photos/videos, draft auto IDs, upload consistency and no duplicate media writes. | PROPOSED / NOT STARTED |
| 747 | Unique Product Card Images & Gallery Provenance | Audit missing and repeated images using approved shop media; no AI guesses about customer assets. | PROPOSED / NOT STARTED |
| 748 | Customer Account, Checkout & Saved-Profile Usability | Improve sign-in, registration and checkout continuity while keeping payment controls explicit. | PROPOSED / NOT STARTED |
| 749 | Canada Shipping, HST & Returns Readiness | Connect shipping and tax source evidence; never claim provider, carrier or CRA acceptance without proof. | PROPOSED / NOT STARTED |
| 750 | Deposits, Refunds & Invoice Source Reconciliation | Link actual orders and provider settlement evidence without invented financial closure. | PROPOSED / NOT STARTED |
| 751 | Workshop Inventory, Materials & Costing | Relate jewelry supplies, approved materials, finished lots and original cost receipts. | PROPOSED / NOT STARTED |
| 752 | Maker Job Traveler & QC Handoffs | Link production steps, source photos, worker observations and actual sign-off. | PROPOSED / NOT STARTED |
| 753 | Social Content & Catalog Publication Review | Source-link media and product drafts for owner-approved posting; never auto-post. | PROPOSED / NOT STARTED |
| 754 | Seven-App Read-Only Master Status Assurance | Show verified source statuses and signed provenance, not unproven live integrations. | PROPOSED / NOT STARTED |
| 755 | Mobile Accessibility, Security Acceptance & Queue Renewal | Run owner-visible device checks, audit unresolved acceptance and replan the next 20. | PROPOSED / NOT STARTED |

## How to use the queue
1. Only a separately owner-authorized build is released; this queue itself grants no authority for customer email pilots, external privacy-message sends, automatic posting, payments, key rotation, data deletion or Master receiver enrollment.
2. Exact-head Development checks must pass (System Gate, Current Application Quality, I.T. Admin Runtime and Branch Hygiene), including canonical Development preview, before protected `dev` → `main` promotion.
3. Protected `main` must pass independent Production Pages, D1 migration (when applicable), live-resource integrity, and the still-disabled Cloudflare scheduled privacy Worker verification. An externally unverified provider or Master receiver remains HOLD even if the website application is GREEN.
4. Reprioritize or split builds when original D1/Cloudflare evidence, owner needs, or dependencies change. A build number does not certify actual supplier/material/financial/customer acceptance.
5. After Build 755, review authentic open work and renew the queue. Never subtract 20 from a made-up fixed lifetime target.

## Queue accounting
- Authorized current build before promotion: **735**.
- Next proposed after 735: **736**.
- Future proposals in this list: **20** (736 through 755 inclusive).
- Verified completed builds in this table: **0**. Historical builds 383–412 are not counted.
- Unbounded project work outside these 20 proposals: **not numerically determined**.
