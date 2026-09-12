# Release 467 Build 108 — Mobile Workshop Assistant

## Starting authority

Build 108 starts only from externally proven Build 107 — Storefront Discovery & Collection Improvements:
- Development SHA `943d7af070bc1b01506f2b8d3e8fc36b8aed7750`
- tree `a16e55754b40279050b781ed5bad1892ee62b76c`
- System Gate `34662074529`
- Current Application Quality `34662074545`
- I.T. Admin Runtime Proof `34662074524`
- Repository Branch Hygiene `34662074579`
- Production Pages Deploy `34662205783`
- Production Live Resource Integrity `34662253285`.

Build 108 is a closure candidate and does not self-record its own later external proof.

## Product

The new `/admin/mobile-workshop-assistant/` workflow is optimized for phone use in the workshop:

1. Capture or choose one photo using an `accept="image/*" capture="environment"` input.
2. Choose privacy intent: private workshop reference, internal review, or public-use candidate.
3. Record consent evidence: unknown, owner-created/no other identifiable people, explicit release, or third-party hold.
4. Choose an image-role routing hint: process, technique, materials, Product gallery/hero, proof, packaging, or social candidate.
5. Optionally associate an existing Product through the established read-only Product API.
6. Record a workshop story note while the context is fresh.
7. Prepare/edit a caption or content draft.
8. Copy a review summary or download a JSON handoff for Media Studio, Product Capture, Content Studio, CAIP Content Handoff or Photo Moderation.

## Privacy and media boundary

The selected image is previewed through `URL.createObjectURL` and remains local to the active browser tab. The file bytes are not converted to a data URL, written to localStorage, inserted into D1/R2, or embedded in the JSON handoff. LocalStorage key `dd_mobile_workshop_assistant_v1` contains only lightweight metadata and draft text.

After a reload, the file must be reselected before the image can be viewed or uploaded by a specialist workflow.

## Consent boundary

A public-use candidate is fail-closed unless consent evidence is either:
- owner-created media with no other identifiable people; or
- explicit consent/release evidence exists.

Unknown consent and customer/third-party hold states remain blocked from public-ready status. Even positive consent only makes the package eligible for downstream specialist review; it never authorizes publication itself.

## Mutation/publication boundary

Build 108 performs:
- one optional existing Product GET: `/api/products?limit=100`;
- browser-local session save;
- local preview;
- local caption generation;
- clipboard copy; and
- local JSON download.

Build 108 performs **no** Product/Inventory/D1/R2 mutation, media upload, provider execution, marketplace publication, Social publication, schema change or automatic Production promotion. Exported handoff evidence records `binary_included: false`, `upload_performed: false`, `publication_authorized: false`, and `downstream_review_required: true`.

## Release safety

Canonical D1 migrations remain exactly `0001`–`0004`. Stripe Development, PayPal sandbox, Social OAuth and Cloudflare Access remain `HOLD_EXTERNAL`; CAIP private-media remains `EVIDENCE_DEPENDENT`. Canada-only CA/CAD commerce remains authoritative, U.S. sales/shipping remain disabled and local pickup remains supported.

Build 108 must earn the exact merged-`dev` four-proof chain before any non-force `main` promotion. Build 109 must ingest Build 108's final external Development + Production closure.
