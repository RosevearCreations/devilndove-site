# Release 467 Build 389 — Product Save, Pricing, Media and Invoice Evidence Acceptance

## Product Editor
- CAD Price and Compare-at inputs are two-decimal strings (for example 8.00) and convert to integer cents on explicit Save. The currency field remains CAD.
- Product Category and Shipping Code are dropdown-only, seeded from approved values and configured existing Product choices. Unknown category/shipping values are rejected on the server; retained historical choices remain valid. Shipping codes do not calculate shipping rates.
- Tax Class dropdown is loaded on focus through the current real tax_classes authority; no fictitious tax ID is assigned. No class means default/unassigned.
- New Product Inventory quantity is prefilled 1; previously saved inventory quantities, including 0, are not overwritten. Quantity does not automatically post materials.

## Product Video
- A Product may attach one MP4/WebM/MOV file (max 25 MB) through separate authenticated single-video R2 upload, with its own new canonical `product_video_attachments` source and explicit video title, caption, accessibility description and review status.
- Attachment defaults to `internal_review`; only an explicit operator approval `product_page_ok` allows it to appear in the public Product page, which loads at most three approved videos.
- MOV may not play on all browsers. Underlying R2 URLs may be accessible to anyone who knows the URL, even before listing, so do not upload confidential footage.
- No automatic video publication, scoring, R2 listing or retries. Videos are never passed through JPEG crop logic.

## Review each batch image
- The existing maximum-five sequential image uploads now show independently editable alt text, image title, caption and public-use approval for every file before the confirm dialog. Each item posts metadata to the established image file authority, which records annotations alongside canonical gallery references.
- Any failed/uncertain write stops the batch; operator checks the gallery rather than blindly retransmitting uploads. Existing single-image replacement and metadata editing remain available.

## Tax evidence acceptance
- The Build 388 read-only purchase HST correction review remains available. Product tax class assignment is separate from purchase-tax invoice evidence and never books tax credit eligibility, sales tax or financial postings automatically.

## Gate and promotion
Canonical migration **0039** is forward-only; do not drop existing Product or image tables. Development-first D1, independent source/quality/runtime/hygiene checks, exact identical `dev` → `main` tree, Production D1 schema validation, Cloudflare Pages and live-resource integrity evidence required before Production GREEN. Authenticated manual browser usage is an independent operator acceptance gate.

**Next queued Build 390 — Product Video Review & Inventory Tax Evidence Operational Acceptance.**
