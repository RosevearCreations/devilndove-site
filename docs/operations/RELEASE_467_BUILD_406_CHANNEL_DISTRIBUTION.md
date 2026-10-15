# Release 467 Build 406 — Unified Product Channel-Publishing Configuration, Canonical Media Mapping & Safe Distribution Policy Enforcement

## Delivered
- One canonical Product Editor for title, description, CAD price, quantity and Product Images. Independent Etsy and Facebook Marketplace destination switches from Build405 remain local-only.
- A click-to-load Build406 image selection and owner review panel beside the Product Editor. Images come only from Product's own \`product_images\` records and must be approved for public use, 800×800 minimum, useful alt text and non-placeholder URLs.
- Owner attestation that U.S. shipping/sales remain disabled; selection plus review is saved in D1 as a transactional local receipt under \`product_distribution_policy_406\` with canonical Product version signature. Subsequent edits invalidate the previous review.
- External-channel local CSV preparation selects **only opted-in Products**, uses saved canonical image IDs (never arbitrary URLs), requires a matching owner shipping/image approval receipt, and still refuses API publication. Existing manual/Pinterest/TikTok preview paths remain local-only as before.
- Old direct marketplace-export image-url write and bulk-image overrides cannot bypass Build406 rules for Etsy/Facebook. Creating new Etsy local syndicated drafts is blocked without destination opt-in and current media/shipping review.
- Verified-admin Production Variables audit button under I.T. Integrations that returns name/status only, never secrets, with separate operator checklists for obtaining Meta/Instagram/Etsy and other provider credentials.
- Two handoff reports: \`docs/operations/RELEASE_467_BUILD_406_MISSING_IMAGE_REGISTER.md\` and \`docs/operations/RELEASE_467_BUILD_406_PRODUCTION_CONFIGURATION_AUDIT.md\`.

## Non-goals and follow-up
**No automatic provider creation, listing write, activation, US shipping enablement or publication.** Facebook Marketplace seller listing APIs require independently confirmed authorization and policy; Meta App ID by itself does not grant such a right. Existing Product editor saves do not create a second Product per destination. Product #54 soap images remain pending owner verification if not yet uploaded in the canonical gallery. Stored secret values and live R2 gallery inventory are not readable via GitHub.

The next proposed milestone is **Build 407 — Shared Product Destination Acceptance & Safe Listing-Sync Adapter Readiness**; implementation must preserve manual and provider-specific approval gates.

## Starting GREEN release
Build405 Development: SHA \`846fe228e8badbea3e40179d9b2d288164241085\`, tree \`e872fa969c635ba4547e218be1a47265a4111e83\`, System 38745648871, Quality 38745648503, I.T. 38745648640, Branch hygiene 38745648531, D1 38745648726, dedicated Build405 38745648915.
Build405 production: main \`24fe434294b03353eb03ce6cf872fc780e315b4c\`, Pages 38745999418, live resource integrity 38746149983.
