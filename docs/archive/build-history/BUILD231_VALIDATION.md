# Devil n Dove Build 231 Validation

## Result

Build 231 is a code-only product-editor reliability hotfix. All local validation passed on 2026-08-02. Production Cloudflare logs and an owner-controlled product draft are still required to prove the live resource-limit symptom is resolved.

- Build 231 regression: PASS, including a mocked authenticated request for product 45, valid compact JSON and exactly five bounded database calls.
- Retained Build 230 visual/Startup/schema regression: PASS.
- JavaScript syntax: 559 files checked, 0 failures.
- Deployment preflight: Ready, 0 blockers and 0 warnings.
- Public/admin sanity: 108 pages checked, 0 issues; final blocker check passed.
- SQLite: all three aggregate schemas executed; the current Build 230 migration applied twice with 20 active manifest rows and one ledger row.
- Cloudflare Pages Functions: Wrangler 3.114.17 compiled the complete Worker successfully; `index.js` was 4,887,277 bytes uncompressed and 881,074 bytes gzip.

## Local checks

1. Run `node scripts/build231_product_autosave_test.mjs`.
2. Run `node scripts/build230_visual_manifest_test.mjs` to retain the 43-gate/image-manifest baseline.
3. Run `node --check` on every Functions, browser, script and service-worker JavaScript file.
4. Run `python3 scripts/deployment_preflight_static_check.py`, `python3 scripts/predeploy_sanity_check.py` and `python3 scripts/final_deployment_blocker_check.py`.
5. Execute all three aggregate schemas in disposable SQLite and apply `database_upgrade_current_pass.sql` twice. Build 231 must not introduce a new ledger row or explicit SQL transaction statement.
6. Compile the full Pages Functions bundle with Wrangler.

## Production autosave/reload test

1. Deploy the complete Build 231 package; use the service-worker update or a hard refresh so `devilndove-shell-v12` and the new browser scripts are active.
2. In Cloudflare, open **Workers & Pages → devilndove project → Metrics → Errors → Invocation Statuses** and record the starting time/count for Exceeded CPU Time and Exceeded Memory.
3. Open `/admin/catalog/`, choose owner-controlled Draft product ID 45 and select **Load product into editor**. `/api/admin/product-detail?product_id=45` must return HTTP 200 JSON with `response_profile: editor_compact_v1`; the form must load without `JSON.parse` text.
4. Change the short description, wait at least three seconds and confirm **Autosaved draft #…** appears.
5. Type again while the browser’s Network panel throttles the first update. Confirm the status says newer changes are queued and a second save follows; reload the product and verify the newest text.
6. Temporarily use browser offline/request blocking for the update endpoint, change the draft and wait. Confirm the error is short, contains no Cloudflare HTML/CSS, and **Recover browser copy** appears.
7. Restore connectivity, use **Recover browser copy**, review the fields, select **Autosave now**, reload the product and verify the recovered value.
8. Review the matching Cloudflare invocation logs. If 1102 recurs, record whether the outcome is `exceededCpu` or `exceededMemory`, route, timestamp, CPU/wall time and non-secret request context; keep the Startup runtime gate Failed/Blocked.

## Pass rule

Product load and repeated draft autosave return valid JSON, preserve the newest edit, never show raw HTML/`JSON.parse` errors, and produce no new exceeded-resource event during the controlled test. A browser recovery copy is a safety net, not proof that D1 saved the draft.
