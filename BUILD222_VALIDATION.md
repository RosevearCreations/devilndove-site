# Build 222 Validation — Soap Label Automation and Startup Readiness

**Build:** 222  
**Validation status:** Static and local database validation passed  
**Production status:** Requires the deployment and live-test gates in `STARTUP_GO_LIVE_GUIDE.md`

## Scope validated

Build 222 introduces the normalized Soap Label Automation workflow, the dedicated Soap Label Studio route, physical print-test evidence, approval gates, an approved Glacial Purple reference profile, reusable rose assets, the Startup Readiness guide and synchronized aggregate/current database schemas.

## Automated validation results

| Check | Result |
|---|---|
| JavaScript syntax | PASS — 492 JavaScript files parsed with `node --check` |
| HTML H1 policy | PASS — 104 HTML files, exactly one H1 on every page |
| Public SEO essentials | PASS — no public page missing title, meta description or canonical link |
| Local HTML references | PASS — 1,895 local script, stylesheet, image and navigation references checked; none unresolved |
| CSS structure | PASS — 2,213 opening and 2,213 closing braces; no negative nesting balance |
| Merge-marker scan | PASS — no unresolved conflict markers |
| Core aggregate schema | PASS — `database_schema.sql` created 352 tables in fresh SQLite |
| Store aggregate schema | PASS — `database_store_schema.sql` created 365 tables in fresh SQLite |
| Full aggregate schema | PASS — `database_full_schema.sql` created 404 tables in fresh SQLite |
| Current migration repeatability | PASS — `database_upgrade_current_pass.sql` applied twice without duplicate seeded soap-label templates |
| Deployment preflight script | PASS — Build 222, zero static blockers and zero static warnings |
| SVG source validation | PASS — purple, green and oatmeal rose SVG assets parsed as XML and rendered with Inkscape |
| Generated label master | PASS — generated SVG reports 279.4 mm × 38.1 mm, contains required English/French/front/rear/claims/weight regions, parses as XML and renders successfully |
| Approved reference image | PASS — valid 2,048 × 462 RGBA PNG |
| Ingredient truncation check | PASS — approved-reference data generated without ellipsis after the 55-character/eight-line panel adjustment |
| Specification synchronization | PASS — root and `docs/packaging/soap-label-system/` specification copies are byte-identical |
| Final deployment blocker script | PASS |

## Soap Label Studio functional validation checklist

After deployment, sign in as an administrator and open:

```text
Admin → Packaging Studio → Soap Label Studio
/admin/packaging/soap-labels/
```

Complete these tests in order:

1. Create a disposable Glacial Purple soap-label project using the photo-fit template.
2. Confirm the preview is one continuous 11-inch ribbon, not separate front and rear pieces.
3. Confirm the 0.75-inch band is vertically centred inside the 1.50-inch SVG artboard.
4. Confirm the front oval is 2.00 × 1.50 inches and extends above and below the band.
5. Confirm the English ingredients appear to the left of the front oval.
6. Confirm the French ingredients appear after the front oval.
7. Confirm the rear brand seal appears after the French panel.
8. Confirm all four bilingual claim rows and net quantity remain visible without overlap.
9. Change the rose colour and verify the preview updates without replacing the rose with another flower.
10. Save the project, reload the page and confirm ingredient rows, claims, colours and artwork settings return from D1.
11. Save a review version and confirm a version-history record appears.
12. Export SVG and confirm the document declares physical millimetre dimensions.
13. Export PNG and WebP and confirm they are treated as previews rather than authoritative print masters.
14. Use Print / Save PDF and confirm the browser print dialog is set to 100% / Actual Size with no fit-to-page scaling.
15. Measure a physical print and enter strip, band, front oval and rear-seal measurements.
16. Record wrap fit, legibility and overlap outcomes.
17. Confirm approval is blocked until a passed 100%-scale physical print test exists.
18. Confirm approval is blocked when a required bilingual ingredient row is incomplete.
19. Confirm approval is blocked when the conservative ingredient-panel estimate exceeds eight lines.
20. Confirm browser-local draft recovery appears when an API request is intentionally interrupted.

## Dimension decision that remains open

The supplied specification states both a 1.50-inch / 38.1 mm artboard and a 50 mm rear circle. A 50 mm circle cannot fit inside a 38.1 mm-high artboard without clipping. Build 222 therefore includes:

- **Photo-fit profile:** 38.1 mm artboard and 38.1 mm rear seal.
- **50 mm rear-seal profile:** 50 mm-high artboard and true 50 mm rear seal.

Print both at 100%, wrap each around the actual soap and record the chosen production profile. Do not approve either profile based only on the browser preview.

## Launch limitations not validated in this container

These require deployed services, real credentials or physical evidence:

- Cloudflare Pages Functions and production D1 bindings.
- R2 upload, storage, private-proof access and restore behaviour.
- True server-generated CMYK prepress PDF with embedded or outlined fonts, crop marks and verified bleed boxes.
- Actual printer calibration, paper stock, cutting, folding, overlap and soap-bar fit.
- Final bilingual ingredient, claim, cosmetic, consumer-packaging and net-quantity compliance review.
- Production Stripe checkout, webhook exact-once settlement, refund and inventory restoration.
- Transactional email delivery and reply handling.
- Social OAuth provider approval.
- Search Console, Google Business Profile and live local-ranking evidence.

## Deployment order

1. Back up production D1 and export a recoverable copy.
2. Apply **either** `database_build222_soap_label_startup_readiness.sql` **or** `database_upgrade_current_pass.sql`; do not apply both.
3. Deploy the complete Build 222 package.
4. Open `/admin/startup-readiness/` and complete the gates in order.
5. Run the post-deploy smoke tests in `POST_DEPLOY_SMOKE_TEST.md`.
6. Complete the Soap Label Studio functional checklist above.
7. Record physical print evidence before approving a soap label.
8. Do not open scarce-stock or limited-set sales broadly until payment/inventory exact-once behaviour is proven in production.
