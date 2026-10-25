# Devil n Dove Build 468 — Product Editor Autosave, Login & 503/1102 Recovery Acceptance

**Boundary:** This build repairs and verifies recoverability for the **current** single-Product Editor and login interface. “Autosave” means temporary in-browser draft capture only. **There is no automatic server save**, no automatic retry of credential or Product write POSTs, and no new database, external channel, marketplace or paid service.

## What changed

- Login makes only one credential POST per deliberate Sign In, with a 15-second response boundary. A timeout, 503 or Cloudflare Worker error 1102 keeps the form available and presents a safe status. It never stores or logs the password or silently retries. The pre-existing route alias is used only for an explicit HTTP 405.
- The shared error reader recognizes branded Cloudflare 1102 HTML responses even when the platform omits `cf-error-type`, and avoids displaying the returned HTML to the operator. The optional Cloudflare Ray reference is validated before presentation.
- The legacy private Admin auth script remains byte-identical to the canonical cookie-first auth script, retaining the existing Build 384 compatibility gate.
- Product draft edits continue to be saved only in `sessionStorage` for a maximum 12-hour local restore window. No D1/R2 reads or writes are performed for draft capture.
- Product Save temporarily locks form fields while one explicit write is in flight, preserving the submitted snapshot; a late result cannot silently mark newer edits clean.
- A Product POST that yields HTTP 503, 1102, a network timeout, a readback mismatch or another uncertain 5xx is **not** treated as proof that the write failed. The browser draft remains; the editor disables Save until the operator presses **Retry load** and compares the authoritative Product record. An ambiguous *new Product* requires checking Product Browser for a possible duplicate first.
- A Product save confirmed successful remains successful even if a separate Etsy/Facebook destination-preference step cannot be confirmed. Owner review is required for destination reconciliation, not another Product write.
- Optional Media/QA reads stay on demand. Neither an incident nor loading the editor causes background polling, schema introspection, inventory scans, media scans or provider listing activity.

## Synthetic failure matrix

| Scenario | Automated assertion | Operator action |
| --- | --- | --- |
| Login 503 / response timeout | One POST; input retained; button re-enabled | Wait, then deliberately sign in again; verify session if prior result uncertain |
| Cloudflare 1102 HTML | Error identified without exposing HTML/body | Record Ray ID, check Cloudflare Worker invocation CPU/memory logs; retry manually later |
| Product load 503 | No write enabled without authoritative Product | Retry load manually after capacity recovers |
| Product save 503/1102/timeout | No replay; browser copy retained; Save blocked | Retry **load**, compare stored Product, resolve fields, *then* decide on Save |
| Product write readback mismatch | Treat as uncertain write, not as definitive rollback | Review price directly in original Product authority |
| Destination preference failure after confirmed Product save | Product saved; destination HOLD | Review destination state separately; do not post Product again |
| Bad input / 400 | No automatic retry | Correct the data and explicitly save |

## Field acceptance: HOLD real-owner proof

**HOLD real-owner acceptance**, pending direct private owner review. In an authenticated session on `https://devilndove.com/admin/product-editor/`, use a non-public draft Product and record:

1. Product ID, timestamp, browser/device, exact live route, request status and Cloudflare Ray (if provided); redact names, credentials, private story/media and payment details.
2. Change a safe draft field; reload without Save; choose Restore from the browser-only copy and confirm D1 was unchanged.
3. Simulate or reproduce a slow Product save using a test draft. Confirm a single POST, frozen fields, clear completion, and original CAD price readback. Do not knowingly repeat a POST whose outcome is unknown.
4. If a real 503 or 1102 occurs, inspect Cloudflare Workers/Pages request and CPU/memory metrics, request logs and D1 query readings for the same timestamp/Ray. Record whether *that specific* Product write completed. Do **not** infer from a browser error alone.
5. Sign in from a real browser in the Production environment. Confirm one POST, button recovers from a temporary failure, the password is not logged/stored, and session identity is verified through the existing cookie-first flow.
6. Validate Firefox and Chrome, narrow screen, keyboard-only input, and preservation of the local draft across a deliberate reload; verify warning language is clear. Owner approval is required before closing this HOLD.

**Do not fabricate a 503/1102 production incident, mark unknown database writes as rolled back, test with live public products, or remove Cloudflare usage limits.** No credentials are necessary for CI fixtures.

## Release proof

Run `node --test scripts/release467_build468_product_login_recovery.test.mjs`, `node --check public/js/admin-product-editor-v163.js`, `node --check public/js/login.js`, `node --check public/js/auth.js`, and `python scripts/current_application_quality_gate.py`. Promote the exact tested tree via `dev` then `main`; confirm all required checks and the Cloudflare Production Pages deployment, followed by an independent live zero-D1 proof. CI GREEN does not substitute for the field acceptance HOLD above.

Sources: [Cloudflare 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/), [Pages Functions metrics](https://developers.cloudflare.com/pages/functions/metrics/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).
