# Devil n Dove Project Status and Roadmap — Build 225

## Build 225 completed actions
1. Replaced the static Startup Readiness page with a D1-backed status cockpit.
2. Added 37 detailed launch gates covering deployment, access, catalog, commerce, payments, communication, packaging, discovery, recovery, fulfilment, and controlled opening.
3. Added item status, owner, due date, evidence URL, evidence notes, blocked reason, completion timestamps, and severity.
4. Added status-history records and admin audit evidence.
5. Added filters for open/completed status, severity, phase, owner/instruction search.
6. Added progress, critical-open, high-open, blocked, in-progress, complete, and launch-state summaries.
7. Added quick Complete and Reopen controls with evidence requirements.
8. Added browser-only unsynced recovery and deliberate synchronization after D1/network failure.
9. Expanded STARTUP_GO_LIVE_GUIDE.md to mirror every database gate with exact locations, steps, and pass conditions.
10. Made PACKAGING_STUDIO.md the single packaging source of truth.
11. Merged the complete user-provided soap-label specification into PACKAGING_STUDIO.md.
12. Converted legacy soap-label specification files into compatibility pointers.
13. Added Packaging Studio interface links to the authoritative specification and startup gates.
14. Updated current/additive and aggregate schema files for the new readiness tables.
15. Updated database schema reference and deployment instructions.
16. Preserved Build 223–224 product-detail and seven-image gallery fixes.
17. Re-ran public one-H1 and metadata checks.
18. Re-ran JavaScript and CSS integrity checks.
19. Re-ran fresh-schema and repeated migration checks.
20. Added Build 225 validation and changed-file manifests.

## Current launch position
Devil n Dove is in launch proof and controlled-opening preparation. The application has broad commerce, inventory, project, content, CAIP, packaging, accounting, media, and SEO foundations. The remaining work is not another undirected feature list: it is production evidence, final data completion, regulatory/physical proof, recovery rehearsal, and stable daily operation.

Use `/admin/startup-readiness/` as the current status authority. A page existing or a local test passing does not close a gate; record deployed evidence and the stated pass condition.

## Known launch risks
- Live payment/webhook idempotency and exact-once inventory settlement/restoration still require production evidence.
- Final-unit and component-set concurrency must be proven before scarce stock is promoted broadly.
- Taxes, shipping/pickup, transactional email, policies, analytics, restore, and full order/refund rehearsals remain explicit gates.
- Every launch soap requires verified formula/INCI/bilingual content, physical print proof, packaging export fit, and applicable cosmetic notification/change control.
- Browser Print/Save PDF is not yet a proven CMYK prepress file.
- Social OAuth remains optional for selling and must stay review-first until provider approval.
- First-page local ranking cannot be guaranteed; relevance, distance, prominence, accurate business information, useful content, reviews, photos, and links must be maintained.

## Next 20 steps
1. Complete production evidence for every Critical Startup Readiness item.
2. Add automated import of Deployment Preflight results into matching readiness gates.
3. Add automatic Product Release Preflight rollups by launch-product group.
4. Add automatic product-detail/gallery checks for every selected launch product.
5. Implement concurrency-safe stock reservations for final units and component sets.
6. Complete Stripe live webhook idempotency and exact-once settlement evidence.
7. Complete failed, abandoned, cancelled, and refunded inventory restoration evidence.
8. Add saved tax/shipping scenario fixtures with expected and actual totals.
9. Add transactional-email test records, provider IDs, retry, and failure diagnostics.
10. Add R2 upload for packaging print-proof photos with checksum/version linkage.
11. Implement true server-generated print PDF with exact media/bleed boxes and embedded or outlined fonts.
12. Add deterministic SVG text measurement and per-region overflow blockers.
13. Add printer/paper calibration profiles, rulers, crop marks, and saved no-scaling settings.
14. Link verified soap recipe/formula source rows to labels without duplicating ingredient facts.
15. Add approved-label lock, supersession, reprint, batch/lot, barcode, and QR workflows.
16. Add role-specific authorization tests for delete, reversal, label approval, and accounting export.
17. Add realized margin trends across products, product families, and repeated techniques.
18. Allow approved CAIP summaries to be deliberately selected for Content Studio packages.
19. Complete social OAuth only after provider credentials, scopes, callbacks, and approvals are proven.
20. Run a controlled public opening and convert the first-week evidence into permanent operating checks.

## Operating direction
Open with a small complete product list and conservative stock. Continue background improvements only while order, payment, inventory, email, refund, support, packaging, and fulfilment workflows remain observable and reversible.
