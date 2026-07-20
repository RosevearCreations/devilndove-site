# Devil n Dove Project Status and Roadmap — Build 219

## Current business outcome
Tools and supplies can now be maintained through a fast row-based table editor while retaining the full editor for advanced fields. The next development phase remains launch confidence: product completeness, deployed payment/order evidence, media reliability, policies, tax/shipping, accessibility, and recovery procedures.

## Completed in Build 219
- Inline row editing for inventory name, category, supplier, quantity, reorder point, cost and active status.
- Independent authenticated row save with existing audit, movement and cost-history behavior.
- Mobile-safe table controls and CSS polish.
- Seven-image product-gallery operating rule documented: one featured plus six supporting images, managed through Catalog Media.
- Build 219 validation and launch checklist refreshed.

## Next 20 steps
1. Prove login, logout, password reset and session expiry on production.
2. Run Stripe test and one low-value live payment, webhook, order and receipt path.
3. Test cancellation, partial refund, full refund and inventory restoration.
4. Verify Ontario/Canada tax treatment against accountant-approved rules.
5. Verify pickup, Canadian shipping, US shipping and unavailable-region behavior.
6. Confirm order, payment, shipping, refund and review-request emails.
7. Prove R2 upload, public delivery, thumbnails and failed-image fallback.
8. Complete seven-image galleries for launch products with alt text and rights review.
9. Run product-release preflight on every launch product.
10. Confirm price, stock, availability and Product schema match visibly.
11. Test cart/checkout/order confirmation on iPhone, Android, tablet and desktop.
12. Run keyboard, focus, contrast, form-label and screen-reader checks.
13. Run broken-link, canonical, sitemap, robots and one-H1 checks.
14. Verify analytics consent, GA/Search Console events and no secret leakage.
15. Perform database backup and a documented restore rehearsal.
16. Confirm admin-role boundaries for inventory reversals and accounting exports.
17. Compare realized product margins against allocated Creative Project costs.
18. Allow approved CAIP summaries to be selected deliberately for Content Studio packages.
19. Add cost-template edit, clone, deactivate and channel-preset controls.
20. Complete social OAuth only after provider credentials, permissions and safe dry-run proof.

## Go-live guidance
The store can open with a controlled launch subset once every published product passes release preflight and the complete payment → order → email → fulfillment → refund chain is proven in production. Unfinished advanced automation may continue in the background; payment, legal/policy, inventory accuracy, media access, customer communication and recovery cannot be deferred.

---

# Devil n Dove Project Status and Roadmap — Build 216

## Current business outcome
Reviewed project materials can now be posted to real inventory through an explicit, idempotent transaction, and selected project lessons/process evidence can be mirrored into CAIP as internal review-required evidence. Products may still be created directly or by phone without a project.

## Completed in Build 216
- Approved material review → explicit inventory consumption with before/after quantities and movement audit.
- Duplicate material posting prevention.
- Selected project evidence → CAIP evidence mirror with `needs_review` status.
- Reusable project cost-template records for labour, packaging, overhead, channel assumptions and shipping.
- Responsive Creator controls and unchanged dropdown mobile navigation.

## Highest-value next work
1. Add inventory-post reversal with reason, authorization and compensating movement.
2. Add template-apply controls and percentage-based channel fee calculation.
3. Generate reviewed lessons/future-recommendation summaries from CAIP evidence without inventing claims.
4. Add project-level product profitability allocation when one project creates several products.
5. Complete social OAuth only after provider approval and credentials are available.
6. Continue deployed evidence for login, R2, Stripe, email/webhooks, Search Console and Google Business Profile.

## SEO rule
Project evidence may improve product pages, articles and listings only after factual review. Visible copy, Product structured data, price, availability, materials and images must remain consistent.

---

# Devil n Dove Project Status and Roadmap — Build 214

## Current business outcome
The Creator path is now project-first without becoming project-mandatory. A documented Creative Project may link several product outputs, while phone capture and direct catalog entry continue to support valid products with no project.

## What is complete
- Optional many-to-many Creative Project ↔ product links.
- Link, unlink and primary-product controls in the Creative Process workspace.
- Phone capture project selector with an explicit `No project — independent product` default.
- Project-aware phone-capture links that preselect, but do not force, the relationship.
- Existing direct catalog creation remains unchanged.
- Mobile-safe linked-product cards and controls.

## Highest-value next work
1. Add reviewed Creative Project → Content Studio package creation using selected timeline evidence without copying source media.
2. Add explicit material-usage review and transactional inventory posting.
3. Add project profitability rollups using material, labour, packaging and selling-channel costs.
4. Add a project evidence selector for lessons learned and future recommendations.
5. Add optional project association to the full catalog editor as a convenience, while preserving unlinked products.
6. Complete social OAuth/token lifecycle after provider approvals.

## Permanent architecture rule
A Creative Project is preferred when we are documenting a process. It is never required for vintage items, sourced items, quick captures, legacy products, incomplete records, or products whose making process was not documented.

## SEO rule
Project evidence may support future copy, but no link itself proves materials, origin, rights, price, availability or claims. Public pages and structured data must stay aligned with reviewed catalog facts.

---

# Devil n Dove Project Status and Roadmap — Build 213

## Current business outcome
Devil n Dove now has the foundation for a project-first operating model. A creative project can document the complete process and carry a standard output blueprint for YouTube, Shorts, Reels, TikTok, Facebook, Pinterest, Etsy, the website, articles, galleries, archive, material use, cost analysis, lessons and future recommendations.

## What is complete
- Additive Creative Project, timeline-event and output-plan records.
- Admin workspace for project overview, process entries, materials, time, cost and output status.
- Mobile/desktop layout and an internal visual workflow placeholder.
- Links into the existing Product, Content Studio and CAIP owner screens.

## Highest-value next work
1. Link selected project events/media into Content Studio without copying originals.
2. Add inventory-resource selection so material usage can be posted through an explicit reviewed transaction.
3. Add time/cost rollups and project profitability comparison.
4. Create reviewed conversion actions: Creative Project → product draft, Etsy draft and Content Studio package.
5. Add lessons/future-recommendation extraction from approved timeline evidence.
6. Complete social OAuth/token lifecycle after platform credentials are approved.

## SEO rule
Generated listing, article and social copy must remain tied to verified project evidence and visible page facts. No output blueprint is permission to invent materials, origin, pricing, availability, claims or rights.

# Devil n Dove Project Status and Roadmap — Build 211

## Current business outcome

Build 211 lets the team continue preparing social content while platform applications, API permissions, and credentials are being validated. The new social preflight catches preventable caption, link, and image problems before a queue item reaches Dry Run or Publish. It does not weaken the existing review-first policy.

## Highest-value next work

1. Use the new platform preflight with several real product images and correct any inaccessible or poorly sized media.
2. Complete Meta app validation, then test one Facebook Page post and one Instagram image post through Dry Run first.
3. Add encrypted OAuth callback/token-refresh storage only after the first provider connection is proven.
4. Add a queue-level scheduler only after connection health, platform previews, and failure recovery are proven.
5. Continue evidence-first diagnosis of the login POST 500.
6. Continue real-device testing of catalog, inventory operations, release preflight, Content Studio, and CAIP.

## SEO and public-content rule

Social captions, product pages, visible availability, images, and Product structured data must remain consistent. The preflight can identify format and access risks, but it cannot prove product facts, ownership, consent, or availability.

---

# Devil n Dove Project Status and Roadmap — Build 210

## Purpose

This is the business, operations, SEO, and release-readiness source of truth. `AI_HANDOFF.md` is its technical companion. Together, these two documents replace the need to read older root Markdown files first.

## Current operating flow

```text
Make/source item
→ truthful catalog facts, price, tax, stock and SEO
→ approved real media with roles and public-use/consent review
→ product resource / inventory context
→ Content Studio
→ CAIP evidence/governance
→ destination-aware Release Preflight
→ explicit Release Board approval
→ optional review-first social draft
→ explicit platform posting or manual publishing
→ UTM measurement and learning
```

## Build 210 business outcome

Build 210 connects the product workflow to social planning without treating social media as a blind autopilot.

An administrator can enable **Automatic Product Social Drafts** in `/admin/social-publishing/`. An eligible Active + Approved/Published product with a usable image then creates one social queue draft linked to the product. The draft includes a UTM-tagged product link and default platforms/hashtags but remains unapproved until a person verifies it.

This is the right starting point for a small workshop brand: a new piece appears in the social work queue automatically, while we still retain control over wording, photos, privacy, timing, and platform choice.

## Social publishing policy

- A tracking pixel is not a posting integration.
- No automatic public post is enabled in Build 210.
- No post may claim availability, price, material, origin, or shipping terms that do not match the visible product listing.
- No post may use a customer, family, third-party, or unclear-rights image without explicit review.
- A product social draft must not change the product, its gallery, CAIP record, Content Studio status, Release Preflight, or Release Board outcome.
- TikTok and YouTube remain manual until dedicated OAuth/video upload integrations are completed.
- Product hashtags and local references must remain truthful; do not use fake locality, material, or trend claims merely to chase reach.

## Current direct-publishing candidates

1. **Facebook Page** — useful for local followers, makers, customer updates, and workshop stories.
2. **Instagram Professional** — useful for finished-product images and maker process; single-image feed support first.
3. **Pinterest** — useful for evergreen product discovery, visual search, and jewellery/craft inspiration.
4. **X** — optional short workshop/product updates, not a priority image storefront.
5. **TikTok/YouTube** — reserve for video once a reliable scripted content habit, consent guard, and dedicated upload flows are established.

## SEO and social alignment

Social captions should be human-first. The content must match the actual public product page:

- one clear, factual product name;
- a real product image;
- visible price/availability only if currently accurate;
- correct materials/origin language;
- useful descriptive alt text for the web listing;
- canonical product link with source/medium/campaign parameters;
- no keyword stuffing or unearned claims.

This supports social traffic without creating a mismatch between the social post, visible product listing, and product structured data.

## Documentation structure

Read these first:

1. `AI_HANDOFF.md` — technical/source/deployment truth.
2. `PROJECT_STATUS_AND_ROADMAP.md` — business/release/SEO truth.

Task-specific Build 210 reference:

- `SOCIAL_PUBLISHING_CONNECTION_GUIDE.md` — connection steps, protected secret names, provider scopes/limitations, and launch sequence.

All other Markdown files are specialist references or retained history. They do not override this pair.

## Immediate validation after deployment

1. Open `/admin/social-publishing/`.
2. Verify no secrets are shown.
3. Turn on automatic draft creation only.
4. Create/approve one safe test product with a real public product image.
5. Verify exactly one social queue draft is created.
6. Verify the draft is still Needs Review and has no public post attempt.
7. Run the privacy guard, then dry-run only.
8. With one configured account, publish one test post.
9. Check UTM visits and the attempt record.
10. Repeat only after the first platform behaves correctly.

## Highest-value next work

1. Complete documented Meta Page/Instagram connection and run one safe low-risk test post each.
2. Add a visual post preview and platform media validator (aspect, file type, public HTTPS, caption limits).
3. Add a safe optional scheduler only after platform connection proof and a visible “auto publish allowed” control with per-platform confirmation.
4. Add TikTok Direct Post only after full required OAuth/creator/media-transfer work.
5. Add YouTube resumable upload only after a channel release workflow exists.
6. Finish the evidence-first login 500 repair.

## Deliberately not complete

- The login `500` is not claimed fixed.
- Build 210 does not automatically publish any social post.
- TikTok and YouTube API publishing are not implemented.
- There is no OAuth callback/refresh-token vault yet; encrypted Cloudflare secrets are the only supported active credential configuration.
- Social platform account setup/app approval cannot be performed by the application or inferred from a browser pixel.
- Stripe/email/webhooks, R2/D1 live behavior, Search Console/Google Business Profile evidence, marketplace sync, and full real-device reliability still need deployed proof.


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


## Build 215 completed
- Reviewed Creative Project evidence packages can be passed to Content Studio when a primary product exists.
- Material usage has an explicit approval layer and does not consume inventory automatically.
- Project profitability includes materials, labour, packaging, overhead, channel fees, shipping, revenue and estimated content value.
- Lessons, mistakes, repairs and results can be selected as reusable CAIP/Content Studio evidence.
- Full Catalog keeps Creative Project linking optional.

### Next strongest work
1. Add a reviewed inventory-consumption transaction after approved material usage.
2. Mirror selected lessons and recommendations into CAIP evidence records.
3. Add project-level packaging and fee templates.
4. Complete provider OAuth only after credentials and platform approvals are available.

## Build 217 status
Completed: compensating inventory reversal, applied cost templates, percentage marketplace fees, multi-product shared-cost allocation, CAIP-based lessons/recommendation drafts, and Creative Assets contrast repair.

Next strongest work:
1. Add per-product revenue and realized-margin comparison against allocated project cost.
2. Add reversal authorization roles and accountant/export references.
3. Promote approved knowledge summaries into selectable Content Studio evidence, never directly to public copy.
4. Add cost-template edit/deactivate controls and channel presets.
5. Complete social OAuth only when provider credentials and app approvals are available.

## Build 218 status — Amazon link inventory intake

Completed:
- Inventory Operations now accepts an Amazon product URL and builds a review-only tool or consumable draft.
- The preview attempts to capture available title, description, image, ASIN/SKU, supplier, canonical link and category suggestion.
- The workflow deliberately does not create inventory, set price, or move stock until the administrator reviews and saves the normal inventory form.
- Mobile controls stack cleanly and a manual-entry fallback remains visible when Amazon withholds metadata.
- `AI_HANDOFF.md` and this document remain the canonical pair; historical Build files are retained only as evidence.

Strongest next work:
1. Compare per-product sales and realized margins against allocated project costs.
2. Add role-specific authorization for inventory reversals and accounting exports.
3. Allow approved CAIP summaries to be deliberately selected for Content Studio packages.
4. Add edit, deactivate, clone and channel-preset controls for cost templates.
5. Add profitability trends across repeated techniques and product families.
6. Complete social OAuth only after provider credentials and platform approvals are available.
