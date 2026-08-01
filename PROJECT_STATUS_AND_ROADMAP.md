# Devil n Dove Project Status and Roadmap — Build 227

This is the second canonical handoff file. `AI_HANDOFF.md` contains architecture and deployment; this file records where the business system stands and what comes next.

## Build 227 completed actions

1. Preserved the Build 226 Startup Readiness Function syntax/loading repair.
2. Changed the initial readiness filter from Open only to All statuses so a completed D1 list does not appear missing.
3. Added preparation, gate-specific failure correction, evidence, full-retest and reopening guidance to all 37 gates.
4. Expanded the Meta gate to exact variables, read-only Page/Instagram identity tests, optional token validity/scope tests, one reviewed publish proof and failure/expiry behavior.
5. Regenerated the 1,304-line `STARTUP_GO_LIVE_GUIDE.md` from the API gate authority.
6. Combined Soap Label Studio and Packaging Studio at `/admin/packaging-studio/`.
7. Retained the old Soap Label route as a clear compatibility page without a second editor.
8. Added general product-label, candle-label, jewelry-card and package-insert templates.
9. Added a generic editable SVG layout for non-soap packaging while retaining the exact soap-ribbon renderer.
10. Added packaging components/BOM with inventory links, per-finished-unit quantity, waste, unit cost, lot traceability, supplier and notes.
11. Added packaging unit-cost summary and component duplication with a project.
12. Added sequential immutable invoices, receipts, packing slips, credit notes and refund confirmations.
13. Linked credit/refund documents to an existing recorded refund and included tax-adjustment review fields.
14. Added formal document voiding without deleting or rewriting the immutable snapshot.
15. Added printable/PDF-friendly formatted client documents with business, recipient, order, item, total and credit/refund fields.
16. Added read-only Meta Page/Instagram tests with secret masking and audited results.
17. Added Release Sanity checks for Meta variable presence, packaging BOM state, client-document schema/business identity and GST/HST configuration.
18. Added client-document and packaging-format planning SVG placeholders with descriptive alt text.
19. Added mobile stacking, overflow and touch-target rules for the new admin workflows.
20. Added Build 227 migration/aggregate schema updates and generator/synchronization scripts.

## Current business-system position

The application now has credible foundations for catalog, order/payment/refund records, inventory lots/movements, accounting review, content/CAIP, SEO operations, packaging and launch gates. Build 227 closes the two largest operator-surface gaps: one packaging authority for the whole business and consistent client-facing documents.

The site is still in **production-evidence and controlled-opening preparation**, not fully launch-proven. A feature existing is not evidence that its live provider, physical, regulatory or accounting outcome passed.

## Competitive/current direction incorporated

- The client-document workflow follows the common small-business pattern of preserving the original invoice/order and issuing a separate credit document for reductions/refunds, similar to current QuickBooks guidance.
- Packaging BOM and return/lot direction follows current inventory-system patterns: packages/components, batch/serial references, explicit received-versus-credit-only returns and inventory-linked costs, comparable to Zoho Inventory workflows.
- Unique SKUs and exact stock changes across sales, returns and restocks remain core, consistent with current Square inventory guidance.
- Product SEO direction continues to use single-product/variant pages, current price/availability/returns facts, relevant representative images and validated Product/Offer structured data, consistent with Google Search documentation.
- Canadian cosmetic labels remain review-first: INCI, bilingual identity, metric net quantity, dealer/contact and applicable bilingual warnings; notification is not approval.
- Canadian GST/HST credit/refund documentation remains accountant-reviewed and retained with supporting evidence.

See `COMPETITIVE.md` for historical research detail. Current primary-source links are recorded in `BUILD227_VALIDATION.md`.

## Known launch risks

- Live payment/webhook idempotency and exact-once inventory settlement/restoration still require production evidence.
- Final-unit and component-set concurrency must be proven before scarce stock is promoted.
- Tax, shipping/pickup, transactional email, policies, analytics consent, restore and full paid-order/refund rehearsals remain live gates.
- Client documents require production business identity and accountant/owner confirmation of registration/tax-adjustment fields.
- Packaging BOM rows do not consume inventory; consumption/reservation must be integrated with fulfilment only after an approved transactional design.
- Every launch soap still needs verified formula/INCI/bilingual facts, physical print proof and applicable notification/change control.
- Browser Print/Save PDF is formatted and printable but is not a printer-certified CMYK prepress file with embedded/outlined fonts and exact bleed/media boxes.
- Meta credential presence/read-only identity success is not proof of app review or publish permission. Social remains review-first.
- Real product photography is still required; planning placeholders must not enter product structured data, Open Graph or public launch-product galleries.

## Next 20 steps

1. Apply Build 227 to a backed-up D1 database and verify tables, templates and migration ledger.
2. Run the full Build 227 validation and deploy the complete package.
3. Complete production evidence for every Critical Startup Readiness gate.
4. Configure and owner/accountant-review business legal/address/GST-HST fields; issue and retain an owner-controlled invoice, packing slip, receipt, credit note and refund confirmation.
5. Link every launch product to an approved packaging project and complete its packaging BOM using reviewed purchase-lot costs.
6. Add transactional packaging-component reservation/consumption/reversal to fulfilment with exact-once movement IDs; do not infer this from BOM save.
7. Implement concurrency-safe reservations for final units and component sets.
8. Complete Stripe live signed-webhook and duplicate-delivery evidence.
9. Complete failed, abandoned, cancelled, partial/full refund and inventory-restoration evidence, including the client credit note/refund confirmation.
10. Save expected-versus-actual Canadian tax and shipping/pickup fixtures for every supported scenario.
11. Add transactional-email test records, provider IDs, retries and failure diagnostics for order, receipt, refund and fulfilment messages.
12. Upload packaging print-proof photos to R2 with version/checksum linkage.
13. Implement server-generated prepress PDF with exact media/bleed boxes and embedded or outlined fonts.
14. Add deterministic SVG text measurement, barcode/QR validation and per-region overflow blockers.
15. Add approved packaging-version lock, supersession, reprint, batch/lot and verified QR destination workflows.
16. Link verified soap formula source rows to labels without duplicating ingredient facts.
17. Run role-specific server authorization tests for deletion, reversal, document void, label approval and accounting export.
18. Run Meta read-only tests, verify provider roles/scopes/app review, then publish one deliberately reviewed product-only test; keep all automation off until proven.
19. Replace every public launch placeholder with approved real images and validate image alt text, Product/Offer structured data, canonical URLs and Search Console results.
20. Run D1/R2/deployment restore rehearsals, one real paid fulfilment, a separate refund recovery and then a monitored reversible controlled opening.

## Operating direction

Open with a small complete product list and conservative stock. Add automation only after order, payment, inventory, documents, email, refund, support, packaging and fulfilment remain observable, reconciliable and reversible through real evidence.
