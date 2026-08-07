# Devil n Dove Build 235 Validation

## Scope

Build 235 validates server-computed Creative Automation readiness, exception prioritization, evidence exports, publication-state correctness, responsive UI, Markdown consolidation and retention of the Build 234 schema boundary.

## Local automated results

| Check | Result |
|---|---|
| `node --check public/js/admin-creative-automation.js` | Pass |
| module syntax check for `functions/api/admin/creative-automation.js` | Pass |
| `node scripts/build235_creative_readiness_test.mjs` | Pass |
| `node scripts/build234_packaging_creative_test.mjs` | Pass |
| `node scripts/build233_login_resource_test.mjs` | Pass |
| `node scripts/build232_product_removal_test.mjs` | Pass |
| `node scripts/build231_product_autosave_test.mjs` | Pass |
| `node scripts/build230_visual_manifest_test.mjs` | Pass |
| `python3 scripts/deployment_preflight_static_check.py` | Pass — Ready, 0 blockers, 0 warnings |
| `python3 scripts/predeploy_sanity_check.py .` | Pass — 108 pages, 0 issues |
| `python3 scripts/final_deployment_blocker_check.py` | Pass |
| Build 234 numbered/current-pass SHA-256 comparison | Pass — both `3db2e4344f6bcddb8fcd51a720f2dbe95190864281d65b142e3a791d2f27a744` |
| Release package manifest | Pass — Build 235, 832 tracked release files after final regeneration |
| Wrangler bundle compile | Not available in this sandbox; the configured package registry returned 404 for Wrangler. JavaScript syntax and mocked route tests passed, but Cloudflare deployment compile remains a production/developer-environment check. |

## What the Build 235 regression proves

1. A fully evidenced fixture produces source-ready results for all seven stages.
2. Readiness is calculated from specialist records rather than a master-stage checkbox.
3. A human Complete review cannot hide missing source evidence.
4. Materials with no applicable rows may be deliberately reviewed Not applicable; missing required facts remain blockers.
5. Blocked work sorts before overdue, due-soon, unassigned and ordinary active work.
6. Approved/published release facts are counted through `content_status`.
7. JSON and HTML packets include available timeline, material, inventory, output, CAIP, content, review, publication, profitability and knowledge evidence.
8. HTML export escapes stored text, uses structural headings/tables and includes print rules.
9. The browser uses authenticated API fetches and object URLs rather than exposing a public evidence endpoint.
10. The admin page has one H1, noindex metadata, responsive queue/check/export layouts and shell v16 asset refresh.
11. Build 235 adds no schema block; the Build 234 numbered and current-pass migrations remain identical.

## Production verification required

1. Deploy the complete Build 235 package and hard refresh to `devilndove-shell-v16`.
2. Confirm `/api/admin/creative-automation` returns `mode: server_readiness_queue_export_specialist_authorities_preserved` for an authenticated admin.
3. Compare every computed check for one owner-controlled project with its specialist workspace and D1 records.
4. Create controlled Blocked, overdue and unassigned fixtures and confirm queue order/date handling in the production timezone.
5. Export JSON and HTML for one project; confirm authentication, project isolation, safe filename, accessibility/print layout and absence of credentials/full-payment data.
6. Sign out and confirm both export formats return 401.
7. Confirm an approved or published Content Release record is counted through `content_status`.
8. Save a human Complete review while source facts are deliberately incomplete; confirm the page shows disagreement rather than false readiness, then correct the specialist source and recheck.
9. Correlate load/export requests with Cloudflare invocation status, CPU time and memory. A repeated 1102, exceeded CPU/memory, HTML success response or cross-project leak is a blocker.
10. Repeat phone, tablet, laptop and wide-desktop checks for queue cards, forms, tables, export controls, keyboard focus and touch targets.

## Still not proven locally

Local tests cannot prove live provider permissions/results, signed payment webhooks, duplicate delivery, concurrency, transactional email, D1/R2 restore, real product/photo rights, physical soap wrap, candle-top laser/print acceptance, paid fulfilment, refund reconciliation, legal/tax review or local search placement. Those remain explicit Startup/Prelaunch gates.
