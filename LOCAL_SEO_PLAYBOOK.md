# Local SEO Playbook (Devil n Dove)

This checklist focuses on **local discovery** without risky keyword stuffing. It is meant to be used alongside the site's existing SEO fields.

## Quick wins (1–2 hours)

1. **Google Business Profile (GBP)**
   - Claim/verify it
   - Use accurate categories
   - Add photos regularly (workshop, finished pieces, behind-the-scenes)
   - Ensure hours, phone, and website are consistent

2. **Consistency (NAP)**
   - NAP = Name, Address, Phone.
   - Keep this consistent across GBP, website contact page, Facebook page, and listings.

3. **Local landing content (no stuffing)**
   - Add 1–2 short paragraphs on the contact/about pages describing:
     - where you are (region, not full address if home-based)
     - what you make (jewelry, custom work, casting, engraving)
     - what customers can do next (contact, shop, request custom)

4. **Site basics**
   - Ensure every page has:
     - one clear H1
     - a unique title and meta description
     - fast image loading (avoid oversized images)

## Next layer (half day)

1. **Add a location/service area section**
   - Example: “Serving Southern Ontario, including …”
   - Keep it short and real.

2. **Structured data (JSON-LD)**
   - If you have a public storefront address, you can add LocalBusiness schema.
   - If you are home-based, use a service-area approach and avoid publishing a private address.

3. **Reviews workflow**
   - Ask for reviews after delivery.
   - Reply to every review.

## Search engine criteria tuning in this repo

- Use product SEO fields (`product_seo`) for:
  - descriptive titles (what it is + material + style)
  - plain-language descriptions
  - keywords that match how people search

Examples of safe keyword patterns:
- “sterling silver ring”, “custom engraved pendant”, “lost wax casting”, “wax carving”, “laser engraving”

Avoid:
- repeating city names everywhere
- copying the same meta description across pages

## Measurement

- Track:
  - impressions/clicks from Search Console
  - GBP searches and actions
  - top pages and queries

## Notes

Local SEO is mostly consistency + trust + relevance. The site can support that, but GBP + reviews + strong product pages are usually the biggest drivers.


## Current pass local SEO reminder
- Keep page titles and meta descriptions localized and natural for Southern Ontario intent rather than stuffing repeated city names.
- Continue using dedicated public landing pages and clean department/admin separation so private routes stay non-indexed and public content remains easier for crawlers to understand.


## Current pass addendum
- Replaced the long phone Admin link list with a grouped tree-style mobile menu so the phone workflow uses collapsible sections instead of one uninterrupted list.
- Continued mobile-first workflow tuning by surfacing Today, quick expense, quick write-off, product cost, and export actions closer to the top of the phone dashboard.
- Continued docs/current-build synchronization for the present mobile-navigation and admin-usability pass.


## Current pass addendum
- Customer-facing home/shop flow was made friendlier and clearer on phone and desktop with stronger exploration sections and clearer action cards.
- Accounting moved forward with monthly overhead allocations and a rough net-after-overhead view in the accounting report so operating costs can start flowing toward fuller P&L reporting.
- Mobile admin moved forward again with a direct overhead-allocation shortcut from the phone dashboard.
- Schema and template files were updated for the new overhead allocation layer.


## Current pass note
- Continue prioritizing clear mobile entry points and task-oriented navigation because better mobile experience improves engagement and local conversion signals.

## Current pass addendum
- Reinforced Southern Ontario / Canada relevance in key public-page descriptions so the public copy stays closer to the real regional service/workshop identity.
- About and Contact now carry a stronger Organization/LocalBusiness structured-data graph tied to the public site identity, region, and social profiles.
- Keep validating structured data against visible page content and avoid adding location precision that the public pages do not actually support.

## 2026-04-10 deploy hotfix

- Fixed a Cloudflare Pages build blocker in the accounting CSV export helpers by replacing the regex-based CSV quoting check with a simpler string-contains check.
- This hotfix does not change the database shape. Schema files remain current for this pass because no SQL migration was required.

## Current pass note

- Continue preferring centralized API-backed public catalog reads over page-local JSON reads because consistent shared content sources reduce title/body drift and make future local-search improvements easier to manage across pages.



## Current pass update
- SEO work remains paired with reliability work: if a page can keep rendering with a safe fallback, search users and direct visitors are less likely to hit dead-end empty experiences.
- Continue keeping one clear H1 per exposed page, descriptive titles/meta, and locally relevant wording while the fallback/runtime hardening work continues underneath.

## Current pass SEO note
- This pass kept the one-clear-title pattern on exposed pages while improving runtime resilience, which helps avoid blank/failed catalog screens that can hurt user trust and crawl usefulness.
- Shop and movie shelf fallback now preserve descriptive page content more reliably during temporary endpoint problems.

## Current pass note

This pass was mostly admin-resiliency work. Keep the usual one-H1, descriptive title, and local-service wording habits unchanged while order/payment fallback hardening continues in the back office.

## Latest pass note

- SEO work this pass stayed focused on preserving one clear H1 per public page and avoiding layout/fallback regressions while the admin resilience layer was expanded.

## Current pass note
- The public social hub now uses API-backed thumbnail cards for YouTube content, which keeps the page more stable and more descriptive for visitors while preserving the one-clear-title rule on exposed pages.
