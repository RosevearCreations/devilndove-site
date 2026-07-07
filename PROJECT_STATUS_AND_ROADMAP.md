# Devil n Dove Project Status and Roadmap — Build 209

## Purpose

This is the business, operations, SEO, and release-readiness source of truth. `AI_HANDOFF.md` is its technical companion. Together, these two files replace the need to read the older root Markdown files first.

## Current operating flow

```text
Make/source item
→ truthful catalog facts, price, tax, stock and SEO
→ approved real media with roles and actual public-use status
→ product resource / inventory context
→ Catalog approval
→ Content Studio package
→ CAIP evidence and governance
→ Product Release Preflight
→ explicit Release Board approval
→ explicit publication or marketplace action
```

Inventory context is useful for making, restocking, and honest operational planning. It is not a substitute for customer-facing availability, legal material claims, CAIP evidence, media consent, or Release Board approval.

## Build 209 complete

### Inventory Operations Desk

`/admin/inventory-operations/` is now more usable as a real workshop desk:

- readable dark-theme panels, inputs, messages, tables, and action controls;
- no white nested card backgrounds with low-contrast writing;
- action columns are visually contained instead of blending into tables;
- mobile table-to-card fallbacks keep actions within the page;
- the page can receive `?product_id=<id>` from Product Release Preflight and select the matching product in its resource-link workspace;
- internal inventory visuals are admin-only and never become storefront, Open Graph, schema, or product images.

### Release-preflight inventory context

Product Release Preflight now reads existing product tracking and linked tool/supply records as a transparent **context stage**:

- finished-product tracking quantity;
- number of linked tools/supplies;
- number of linked items with inventory records;
- unmatched linked inputs;
- internal reorder pressure;
- do-not-reuse signals.

The stage does not block a release decision and it does not write anything. This avoids inventing a supply-chain claim or converting a stock note into a customer promise.

### SEO and buyer trust direction

Public pages retain the existing guardrails:

- one visible H1 per public page;
- truthful visible title, price, stock, primary image, description, alt text, canonical URL, and structured data;
- placeholders remain internal until replaced with approved real assets;
- source rights, consent, CAIP review, Content Studio status, and Release Board status stay separate;
- no schema-only, AI-only, or internal-inference facts should become public copy without source evidence and human review.

Google’s product structured-data guidance is still the right model: rich product information needs to describe the actual product page and remain eligible under Google’s quality rules. Shopify’s current product-media guidance likewise treats media and alternative text as useful buyer and accessibility information, not keyword padding. citeturn610719search1turn610719search14turn610719search6turn610719search26

## Canonical next work

1. **Login evidence and repair.** Capture the sanitized failed login response or Cloudflare Function log. Do not run a generic D1 repair.
2. **Build 209 real-device proof.** Test inventory operations on phone, tablet, and desktop, including long item names, no-image records, many action buttons, and slow loading.
3. **Release-preflight proof.** Verify approved, blocked, consent-needed, legacy-unannotated, explicitly public-permitted, and no-media products.
4. **Inventory quality.** Use the new view to fill real supplier, unit, reorder, and source fields; do not mass-fill uncertain data.
5. **Release evidence.** Use actual public-page/Search Console/marketplace results to improve factual product copy, title/meta, internal links, and structured data.
6. **Future CAIP operations.** Only after an explicit design approval, add controlled derivative processing with checksum, rights, namespace, budget, review, output verification, retry, and rollback.

## Deliberately not complete

- The login `500` is not claimed fixed.
- Build 209 does not create reservations, stock movements, Content Studio packages, CAIP evidence, derivative files, publication drafts, social posts, or marketplace listings on page load.
- Inventory notes are not public stock promises.
- Stripe/email/webhooks, R2/D1 live behavior, Search Console/Google Business Profile evidence, marketplace sync, and full real-device reliability still need deployed proof.
