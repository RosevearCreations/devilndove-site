# Release 467 Build 393 — Etsy Live Callback Acceptance & Verified Product Price Reconciliation

Status: **ACCEPTANCE PENDING** (not a GREEN assertion).

## Baseline
Build 392 introduced Cloudflare Workers-compatible `redirect: 'manual'` with strict redirect rejection. Previously consumed Etsy authorization URLs cannot be reused.

## Etsy production operator acceptance
1. In production, sign into **Admin → I.T. Integrations → Etsy**.
2. Start a **new** Connect Etsy attempt; approve the Etsy grant using the fresh authorization link.
3. Confirm the callback returns to the admin integration screen without Cloudflare 502, redirect-mode TypeError, authorization-state error, or exposed OAuth secret.
4. Verify the integration status is `connected` **and** shop verification is `connected_verified`; capture UTC timestamp and safe status/screenshot only.
5. If unsuccessful, record UTC time, Cloudflare Ray ID, sanitized diagnostic and production deployment SHA. Do not reuse authorization grants. Do not label synthetic regression as live acceptance.
6. Confirm OAuth acceptance does **not** create/edit Etsy listings or initiate publication.

## Product price reconciliation
1. Inventory candidate Products with displayed price CAD $0.00; do not assume any candidate has an incorrect zero price.
2. For each candidate, locate the prior **approved** price and the originating factual source (invoice, prior approved catalog value, or pricing decision). Record source identifier and reviewer decision, not private source contents.
3. Do not infer a price from product cost, competing listings, tax class, or supplier evidence.
4. Make a single deliberate authorized Product Editor save with currency fixed to two decimals. Verify the exact stored CAD cents in authenticated API/readback and after a fresh browser reload.
5. Record only reviewed product ID, approved source, before/after cents, save result, timestamp, and reviewer; do not bulk-rewrite prices or inventory, tax, SKUs, or unrelated fields.
6. Failed or ambiguous saves are **not** confirmation. Read persisted state before any retry to avoid duplicate writes.

## Release gate
- Exact Development branch-head: dedicated regression, System Gate, Current Application Quality, I.T. Runtime, Repository Branch Hygiene, preview and applicable data-integrity proofs.
- Explicit live Etsy evidence, real authenticated Product save/readback, and human-reviewed price source acceptance.
- Promote only the **verified identical tree** to `main`; verify Production Cloudflare Pages deployment plus Production Live Resource Integrity at the promoted SHA.
- No automatic provider mutations, publishing, financial price assumptions, Production D1 writes, or production data copying for the sake of a test.

## Evidence ledger
| Gate | Evidence | Result |
| --- | --- | --- |
| New Etsy grant completed | Pending human operator and live callback | PENDING |
| Shop `connected_verified` | Pending live integration status | PENDING |
| Source-backed Product price review | Pending approved source for each edited item | PENDING |
| Authenticated save/readback and refresh | Pending real browser/API evidence | PENDING |
| Development CI/preview at exact SHA | Pending workflow checks | PENDING |
| Production deployment/integrity at exact SHA | Not initiated | PENDING |

**Next queued after verified GREEN:** Build 394 — Etsy Connection Monitoring & Product Price Drift Safeguards (provisional; do not execute before Build 393 acceptance).
