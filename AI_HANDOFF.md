# Devil n Dove AI Handoff — Build 222

## Read these documents first
1. `AI_HANDOFF.md` — current architecture, safety boundaries, deployment order and active workflows.
2. `PROJECT_STATUS_AND_ROADMAP.md` — completed Build 222 work, launch position, known risks and the next 20 actions.
3. `STARTUP_GO_LIVE_GUIDE.md` — ordered, detailed instructions for every launch gate.

Specialist references:
- `DEVIL_N_DOVE_SOAP_LABEL_AUTOMATION_SPEC_V1.md`
- `PACKAGING_STUDIO.md`
- `CONTENT_AUTOMATION_STUDIO.md`
- `DATABASE_SCHEMA_REFERENCE.md`

Historical build notes remain evidence only and must not override this canonical set.

## Build 222 outcome
Build 222 advances launch readiness and converts the soap-label specification into an operating CAIP packaging workflow:

1. **Soap Label Studio** — `/admin/packaging/soap-labels/` provides a focused nine-tab label editor while `/admin/packaging-studio/` remains the broader packaging entry point.
2. **Photo-matched ribbon structure** — the live SVG follows the approved Glacial Purple reference: English ingredient panel, rose-led front oval, French ingredient panel, rear brand seal, bilingual claim rows and net weight.
3. **Exact physical profiles** — the preferred photo-fit profile is 11 × 1.5 inches with a centred 0.75-inch band and 2 × 1.5-inch front oval. A separate 50 mm rear-seal profile is retained because a 50 mm circle cannot fit inside a 38.1 mm-high artboard without clipping.
4. **Normalized D1 soap-label records** — templates, soap products, ingredient rows, bilingual claim rows, export evidence and physical print-test evidence are no longer dependent on one large JSON document.
5. **Rose asset library** — purple, green and oatmeal rose vectors are stored as reusable assets; a rose remains mandatory for the soap-label visual language.
6. **Approval gate** — a label version cannot be approved until a 100%-scale print test has been recorded as passed.
7. **Export evidence** — SVG, PNG, WebP, JPG and browser print preparation record filenames, versions and SHA-256 checksums. Browser printing is not represented as a true CMYK prepress PDF.
8. **Startup Readiness Guide** — `/admin/startup-readiness/` and `STARTUP_GO_LIVE_GUIDE.md` provide 20 ordered launch gates with direct paths, detailed test steps, evidence and pass conditions.
9. **Dashboard discoverability** — Startup Readiness and Soap Label Studio are available directly from `/admin/`.
10. **Documentation/schema synchronization** — the authoritative roadmap, gaps pointer, schema reference, packaging guide, specification, release notes, current migration and aggregate schemas describe Build 222 consistently.

## Deployment order
1. Back up production D1 and record the backup name and time.
2. Confirm Build 221 is already present.
3. Apply **one** of:
   - `database_build222_soap_label_startup_readiness.sql`, or
   - `database_upgrade_current_pass.sql`.
4. Do not apply both; the current-pass file contains the same Build 222 migration.
5. Deploy the complete Build 222 ZIP.
6. Follow `BUILD222_VALIDATION.md`.
7. Work through `STARTUP_GO_LIVE_GUIDE.md` in order.

Runtime schema guards can create minimum packaging records, but production D1 must still receive the reviewed migration deliberately.

## New or changed routes
- `/admin/packaging/soap-labels/` — focused Soap Label Studio.
- `/admin/packaging-studio/` — broader packaging project interface, updated to the approved soap-ribbon reference.
- `/admin/startup-readiness/` — browser-friendly go-live gate guide.
- `/api/admin/packaging-studio` — Build 222 normalized soap data, version, export and print-test actions.

## Soap-label data authority
- Product sale facts remain in `products`.
- Packaging project identity and current draft remain in `packaging_projects`.
- Soap-specific normalized content is stored in `soap_products`, `soap_ingredients` and `soap_label_claims`.
- Review snapshots remain in `packaging_project_versions`.
- Physical print evidence is stored in `soap_label_print_tests`.
- Prepared-export evidence is stored in `soap_label_exports` and the broader `packaging_export_history`.
- Small bounded visual settings may remain JSON; ingredients, claims, tests, products and exports use relational rows because they require ordering, review and independent updates.

## Packaging safety boundaries
- The approved image is a structural and visual reference, not a source of verified formula or legal copy.
- Never infer INCI names, allergens, warnings, product claims, net quantity or bilingual wording from a picture.
- SVG is the authoritative editable layout. PNG, WebP and JPG are previews.
- Browser Print/Save PDF is not a true CMYK prepress export.
- Approval requires a saved version and a passed physical print test at 100% scale.
- A label approval does not publish the product, alter inventory or submit regulatory forms.
- The 50 mm rear-circle requirement conflicts physically with a 1.5-inch (38.1 mm) artboard. Build 222 exposes two explicit profiles rather than silently clipping or changing dimensions.

## Launch-critical limitations
The site should not be considered fully ready merely because the pages load. Production proof is still required for:
- login, reset and role enforcement;
- live payment/webhook idempotency;
- exact-once inventory consumption and refund restoration;
- final-unit and component-set concurrency;
- taxes, shipping/pickup and transactional email;
- complete launch-product facts and real media rights;
- physical soap-label proof and regulatory review;
- analytics/Search Console/Business Profile verification;
- D1/R2 restore rehearsal and rollback;
- a complete paid-order-to-fulfilment rehearsal.

The exact sequence and instructions are in `STARTUP_GO_LIVE_GUIDE.md`.

## SEO and UI rules
- Exactly one H1 per exposed HTML page.
- Each public indexable page needs a distinctive title, useful meta description, canonical URL, descriptive internal links and truthful visible buyer wording.
- Admin and private operational pages remain `noindex,nofollow` where appropriate.
- Local language must remain relevant to actual Southern Ontario service or pickup reach; no build can guarantee first-page placement.
- Product and merchant structured data must match visible price, availability and product facts.
- Continue mobile touch targets, sticky action placement, overflow checks, keyboard operation and low-bandwidth fallbacks.

## Error and fallback rules
- Admin APIs return structured JSON errors and record runtime incidents when D1, authentication or validation fails.
- The Packaging Studio preserves a browser-local recovery draft when a save cannot reach D1.
- Fallback content must never imply that a save, export, payment, inventory movement or approval succeeded when it did not.
- Destructive and financial actions remain explicit, authenticated, audited and idempotent where possible.

## Validation
Use `BUILD222_VALIDATION.md`. At minimum test both dimension profiles, structured ingredient and claim rows, SVG generation, checksum recording, local-draft recovery, physical print-test gating, one-H1 coverage, public SEO metadata, local references, CSS balance, JavaScript syntax and migration idempotency.
