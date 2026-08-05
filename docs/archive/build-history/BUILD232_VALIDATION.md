# Devil n Dove Build 232 Validation

## Result

Build 232 is a code-only archived-product correction/removal reliability hotfix. All local validation passed on 2026-08-02. An owner-controlled disposable archived product, a separate protected-history product and Cloudflare logs are still required to prove the live symptom is resolved.

- Build 232 regression: PASS, including all aggregate-schema product-reference classifications, a 17-call mocked archived-product preflight and one mocked D1 batch containing inventory release, audit cleanup, preserved-record detachment and final deletion.
- Retained Build 231 autosave/reload and Build 230 visual/Startup/schema regressions: PASS.
- JavaScript syntax: 560 files checked, 0 failures.
- Deployment preflight: Ready, 0 blockers and 0 warnings.
- Public/admin sanity: 108 pages checked, 0 issues; final blocker check passed.
- SQLite: all three aggregate schemas executed; current Build 230 migration applied twice with 20 active manifest rows and one ledger row.
- Cloudflare Pages Functions: Wrangler 3.114.17 compiled the complete Worker successfully; `index.js` was 4,886,212 bytes uncompressed and 881,443 bytes gzip.

## Local checks

1. Run `node scripts/build232_product_removal_test.mjs`.
2. Retain the prior reliability baselines with `node scripts/build231_product_autosave_test.mjs` and `node scripts/build230_visual_manifest_test.mjs`.
3. Run `node --check` on every Functions, browser, script and service-worker JavaScript file.
4. Run `python3 scripts/deployment_preflight_static_check.py`, `python3 scripts/predeploy_sanity_check.py` and `python3 scripts/final_deployment_blocker_check.py`.
5. Execute all three aggregate schemas in disposable SQLite and apply `database_upgrade_current_pass.sql` twice. Build 232 must not introduce a new ledger row or explicit SQL transaction statement.
6. Compile the complete Pages Functions bundle with Wrangler.

## Production archived-product test

1. Deploy the complete Build 232 package and hard refresh so `devilndove-shell-v13` and the new browser scripts are active.
2. Open Cloudflare Workers & Pages → Devil n Dove → Metrics → Errors → Invocation Statuses and record starting counts for Exceeded CPU Time and Exceeded Memory.
3. Create or identify one owner-controlled disposable product with no order, payment, customer, accounting, packaging, creative-project, recall or other business history. Record its product ID and System #, then archive it.
4. Open `/admin/products/` → **Draft & Archive Cleanup** → **Archived**, find that record and select **Check removal**.
5. Confirm `/api/admin/delete-product?product_id=<ID>` returns HTTP 200 JSON with `cleanup_profile: bounded_registry_v1`; **Removal allowed** must appear. Archive status and its ordinary media-change audit must not block it.
6. Use a second owner-controlled product with protected order, packaging, creative-project or comparable retained history. Select **Check removal** and confirm **Archive only** lists its blocking table/count and permanent removal remains disabled. Do not delete it.
7. On the disposable record, link one test supply and reserve one unit. Open **Correct / return raw inventory**. Confirm the suggested release is no greater than Reserved and keep physical return at zero unless unused stock was truly put back.
8. Enter a factual reason, choose **Delete unused product and apply reviewed inventory actions**, type `DELETE PRODUCT` exactly and enter the current administrator password.
9. Confirm one success response, the product disappears, its System # is not reused, Reserved changes exactly once, On hand remains unchanged for reservation-only release, and deletion/material/admin audits identify the actor, product, reason and time.
10. Recheck the protected-history product and confirm it remains archived and unchanged.
11. Review matching Cloudflare `/api/admin/delete-product` GET/POST invocations. If a resource limit recurs, record `exceededCpu` or `exceededMemory`, route, timestamp, CPU/wall time and non-secret product ID; keep the Startup gate Failed/Blocked.

## Pass rule

An unused archived product loads the bounded correction preflight and can be removed with reviewed inventory effects exactly once; a history-backed product remains Archive-only; all responses are valid JSON; and the controlled run produces no new exceeded-resource event. Deletion is never used for an ordered, paid, customer-linked, accounting-linked, packaging-linked, project-linked or recalled product.
