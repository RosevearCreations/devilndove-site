# Build 220

- Added protected permanent cleanup for unused duplicate draft products.
- Added server-validated quantity price breaks.
- Added limited product sets with finished-component reservations and component availability protection.
- Added purchase-lot tracking for repeated supplier/Amazon purchases.
- Added explicit content-only Creative Projects that can create Content Studio plans without products.
- Added offer/set checks to Product Release Preflight.
- Added responsive visual placeholders and consolidated the canonical Markdown pair.

# Build 219

- Added fast table-row editing to Tools & Supplies Inventory Operations.
- Added row-level authenticated saves while preserving audit and inventory movement history.
- Improved mobile responsiveness for inventory operations.
- Refreshed the authoritative roadmap with the next 20 launch-readiness steps.
- Documented the seven-image product-gallery operating rule and launch validation requirements.

# Build 216 — Reviewed Inventory and CAIP Evidence

Adds explicit approved material-to-inventory posting, duplicate prevention, audited stock movements, internal review-required CAIP evidence mirroring, reusable cost templates, mobile-safe controls and updated canonical handoff documents.

# Build 210 — Social Publishing Workspace & Product Draft Automation

- Added `/admin/social-publishing/` with a focused product-social automation configuration, platform status cards, full queue, Social Media Privacy Guard, and practical in-app connection guide.
- Added a disabled-by-default `product_social_automation_settings` table and `database_build210_social_publishing_product_automation.sql`.
- Added a safe, idempotent product trigger:
  - An eligible Active + Approved/Published product can create one linked social **draft**.
  - The draft is initially `needs_review`, `draft`, `privacy_status=needs_review`, and `approved_for_public_post=0`.
  - It never auto-publishes or bypasses privacy/conset/release review.
- Wired the trigger into both Create Product and Update Product while preserving product-save success when the social draft cannot be prepared.
- Added UTM-tagged canonical product links to generated social drafts.
- Added secret-safe connection status for Facebook, Instagram, Pinterest, X, TikTok, and YouTube.
- Updated existing Meta Graph API default from v20.0 to v25.0, while retaining environment override.
- Added `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md`.
- Updated `AI_HANDOFF.md`, `PROJECT_STATUS_AND_ROADMAP.md`, `MARKDOWN_INDEX.md`, `NEW_CHAT_STATUS.md`, and schema reference pointers.

## Deployment note

Apply `database_build210_social_publishing_product_automation.sql` in D1 if desired. It is additive and leaves automation disabled. The runtime code also creates the minimal settings row safely when the Social Publishing admin page is opened.

## Known separate incident

The login `POST /api/auth/login` 500 remains evidence-first. Do not run a legacy auth migration; capture the sanitized response or matching Function log before changing login code or D1 schema.


# Build 212 — Social platform policy and callback prerequisites

The following production prerequisites now exist directly in the application:

- `https://devilndove.com/privacy/` and `/privacy.html`
- `https://devilndove.com/terms/` and `/terms.html`
- `https://devilndove.com/data-deletion/` and `/data-deletion.html`
- `https://devilndove.com/social-connections/` and `/social-connections.html`
- Exact OAuth callback routes for Meta/Facebook/Instagram, Pinterest, X, TikTok, and YouTube
- `https://devilndove.com/api/social/meta/data-deletion`
- `https://devilndove.com/api/social/integration-readiness`

The Pinterest verification meta tag is present in every HTML head. Callback routes are currently safe readiness endpoints: they do not exchange codes or store tokens until one-time state storage, encrypted token persistence, refresh, and disconnect controls are implemented.

## Build 214
- Added optional many-to-many Creative Project/product links.
- Preserved independent phone capture and direct catalog product creation.
- Added project-aware phone capture preselection, link/unlink, and primary-product controls.
- Added responsive flexible-entry workflow visual and Build 214 validation guide.


## Build 215 — Creative Intelligence Integration
Added reviewed project evidence handoffs, material-usage approval, profitability, optional Catalog project convenience controls, responsive integration panels, and an internal workflow visual.

## Build 217
Added authorized inventory reversals, cost-template application, revenue-percentage channel fees, shared linked-product cost allocation, CAIP-derived reviewed knowledge summaries, and a scoped dark contrast repair for Creative Asset Intelligence.

## Build 218
- Added a review-first Amazon link importer to Tools & Supplies Inventory Operations.
- Added authenticated Amazon metadata preview with ASIN/canonical-link extraction and safe fallbacks.
- Added mobile-responsive import controls and explicit no-auto-create safeguards.
- Consolidated Markdown authority around `AI_HANDOFF.md` and `PROJECT_STATUS_AND_ROADMAP.md`.
