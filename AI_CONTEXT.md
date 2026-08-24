# Devil n Dove AI Context — Development Build 300 Completed Stabilization Pointer

Read `AI_HANDOFF.md` for retained business/data safety history and `PROJECT_STATUS_AND_ROADMAP.md` for the pre-modular functional roadmap. For the modular Development line after the Build 280 Production freeze, read `docs/architecture/MODULAR_APPLICATION_ARCHITECTURE.md`, `BUILD298_VALIDATION.md`, `BUILD299_VALIDATION.md`, `BUILD300_VALIDATION.md`, and `docs/architecture/BUILD300_PACKAGING_STABILIZATION.md`.

**Production is frozen at Build 280 unless deliberately promoted through the separate Production workflow. Development has intentionally diverged.**

## Completed stable Packaging baseline

Builds 281–290 established the modular registry, Packaging activation, owner-side read contracts, narrow Packaging bootstrap, active-runtime legacy GET retirement, write-response decoupling, and removal of broad Catalog/Inventory reads from the mature Packaging server path.

Build 291 moved mature Packaging writes into `functions/api/_lib/packagingDomainService.js`; Build 292 made `/api/admin/packaging-write` the native write gateway; Build 293 extracted the active Packaging read service; and Build 294 retired direct legacy GET authority. The legacy `/api/admin/packaging-studio` endpoint remains an intentional tombstone only.

Builds 295–297 stabilized startup/read compatibility. Build 298 then removed the retired endpoint name from the mature editor and moved normal editor traffic to the native client.

### Build 298 completed Development proof — 2026-08-24

Activation commit:

```text
d3fa66c37665797d303a3a44f40015dd81fdf7aa
Build 298 activate native Packaging client cutover
```

Completed parity head:

```text
3a19ebc263a206acd22e6490327ffa32567e4a8a
```

Build 298 live proof established:

```text
native read:  /api/admin/packaging-bootstrap -> 200
native write: /api/admin/packaging-write     -> 200
write gateway build: 292
write service build: 291
write authority: packaging-domain-service
compatibility bridge intercepts: 0
```

Build 298 remains the proven native transport/editor baseline underneath Build 300.

## Build 299 status — NOT COMPLETE / browser controller rolled back

Build 299 attempted to make current-draft versus historical-version printing explicit. Its local regression passed and its browser controller loaded, but live validation exposed owner-visible regressions before completion:

- Packaging details/Preview still appeared stale;
- changed claims then appeared not to persist after **Save project**;
- the tested project had no saved review versions, so the historical-version path was not fully proven.

Build 299 was therefore **not signed off**.

Build 300 unloads the Build 299 browser controller from the live Packaging page. The Build 299 controller and saved-version artifact endpoint may remain in the repository for audit/history, but they are dormant from normal Packaging page operation.

See `BUILD299_VALIDATION.md` for the rollback record.

## Build 300 — COMPLETE IN DEVELOPMENT — 2026-08-24

Build 300 is the mandatory Packaging stabilization pass that restored trust in Save Project and Preview before any forward modularization resumes.

Runtime completion source:

```text
37d2d1c21e80d64211f5f50a8d4be607f23b16e4
Build 300 guard preview audit feedback regression
```

Development Pages project deployed source:

```text
devilndove-site-dev
source 37d2d1c
```

The Cloudflare `Environment = Production` label on that deployment refers to the primary environment of the Development Pages project. Real Devil n Dove Production was not contacted and remains frozen at Build 280.

### Live runtime shape

```text
Build 297 startup/defense layers
-> Build 298 native client
-> Build 300 verified-save + Preview stabilizer
-> mature Build 298 editor
```

The Build 299 browser print-source controller is not loaded.

### Verified Save Project — PASS

For `action: save_project` only, Build 300:

1. calls the unchanged Build 298 native client;
2. writes through `/api/admin/packaging-write` and the proven Build 292 -> 291 authority chain;
3. immediately performs a fresh native read of the same project;
4. compares the fresh D1-backed result with the editor payload for core project fields and the complete structured claims array;
5. returns success only when the fresh read matches;
6. otherwise returns an explicit verification failure so the mature editor keeps its browser draft and does not display a false-success state.

Live proof:

```text
verifiedSaveCount = 2
failedVerificationCount = 0
lastVerification.ok = true
expected_claim_count = 3
actual_claim_count = 3
claims_match = true
core_match = true
mismatch_fields = []
```

A successful message includes:

```text
Verified by fresh D1 read-back.
```

This establishes that after Build 300 stabilization, ordinary fields and structured claims are genuinely persisted and agree with fresh D1 read-back.

### Full-ribbon Preview — PASS

The stale-looking Preview was traced to presentation rather than persistence. The soap SVG is a wide ribbon and the claims panel sits near the far-right edge; the old detail-width presentation could leave the changed claims outside the visible viewport after rerender.

Build 300 now defaults Preview to **Fit full label**, while **Detail / scroll** preserves the old large inspection view when wanted. The fitted browser view does not change physical SVG millimetre dimensions, print output, or exports.

Live proof:

```text
preview_mode = fit
preview_fit_count = 1
forced_preview_refresh_count = 0
dom_claim_count = 2
rendered_claim_count = 2
preview_claim_target_count = 2
preview_svg_present = true
preview_claims_match_dom = true
dom_matches_verified = true
```

The mature soap renderer does print `Front tagline`; Build 300 leaves that normal label/rendered behavior intact.

### Preview audit stability — PASS

A live diagnostic exposed a self-triggering Preview audit loop. The Preview status UI was mutating text inside the same subtree watched by the Build 300 `MutationObserver`.

Build 300 now:

- updates Preview status text only when its value actually changes;
- ignores mutations originating inside the Build 300 Preview controls;
- continues to audit genuine editor/SVG rerenders.

Final idle proof:

```text
audit_before = 4
audit_after = 4
audit_delta = 0
```

This is the required proof that the browser runtime settles while idle.

### Build 300 local regression — PASS

```text
PASS: Build 300 JavaScript syntax
PASS: Build 300 verifies Save Project, fits/audits the full live soap preview, and prevents preview-audit observer feedback
PASS: Packaging page restored to proven Build 298 runtime with Build 300 stabilizer only
PASS: mature editor and proven native read/write/tombstone authorities are unchanged
PASS: Build 299 is explicitly not signed off and its browser controller rollback is documented
PASS: exact Build 300 stabilization changed-file boundary
PASS: no SQL/schema, Cloudflare binding/config, R2, or Production change
BUILD 300 PACKAGING STABILIZATION: PASS
No Cloudflare resource was contacted.
```

## Build 300 preserved authority/safety boundary

Build 300 does not change:

- mature editor `public/js/admin-packaging-studio.js` Build 298;
- Build 298 native client launcher/module;
- Build 293/286 Packaging read authority;
- Build 292/291 Packaging write authority;
- Build 294 retired-route tombstone;
- SQL/schema;
- Cloudflare binding/config;
- R2 configuration;
- real Production.

The Production freeze remains Build 280.

## Next Packaging rule

Build 300 is now complete, so forward work may resume only from this stabilized baseline.

Before altering Packaging runtime in a future build:

1. pin the completed Build 300 historical boundary/regression rather than allowing it to follow future `HEAD`;
2. keep Build 299 marked incomplete unless its historical print-source behavior is deliberately redesigned and separately proven;
3. do not combine Packaging modularization with the separate schema-parity/data-copy track;
4. preserve the Build 298 native read/write authorities unless a future build intentionally replaces them with its own regression and live proof.

The safest next Packaging pass is an audit-first pass. Do not delete compatibility layers or tombstones merely because normal Build 300 traffic is healthy; first prove each remaining dependency and remove only one bounded layer at a time.

Schema parity/data-copy remains a completely separate track and must not be mixed into Packaging stabilization/modularization work.