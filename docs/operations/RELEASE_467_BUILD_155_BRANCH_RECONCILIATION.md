# Release 467 Build 155 — Branch Reconciliation and Promotion-Gate Repair

## Purpose

This release evidence records the bounded branch-topology and browser-proof repair required to complete Build 155 safely.

The original workflow-only bootstrap on `main` was reconciled into `dev`, preserving the Build 155 application tree and restoring fast-forward promotion ancestry.

## Browser-proof findings

The first classified real-browser runs established that the Product page itself reached `complete` and did not show render-loop, command-center-loading, or Worker resource-limit evidence. The first failing layer was authentication: the browser's administrator session was inactive, with Product picker population, Product rows, and the Build 155 client-health marker failing downstream.

The browser proof was then bound to the exact hashed Preview URL published by the successful System Gate. That exact-Preview check proved the repository had no currently usable Development administrator session for automated acceptance; the configured Development session secret and Cloudflare Access service credentials are both absent, and old unexpired session rows were not accepted by `/api/auth/me`.

Build 155 acceptance now uses a bounded authentication fixture. It first tries any existing Development admin session. If none is accepted, the workflow creates one cryptographically random Development-only admin session with a 20-minute database expiry, masks its token before use, requires `/api/auth/me` on the exact deployed Preview to accept it, runs the real Chromium Product-screen proof, and removes the fixture in an `always()` cleanup step. The fixture is limited to the `sessions` authentication table and does not change any user credentials, Product records, inventory, R2 media, financial state, or Production data.

The bounded-session browser-proof release plumbing is registered on default `main` at `6ba917be5b0ef66eced84ae47823ec330a6a3af1` and reconciled into `dev` ancestry at `5785a91b0b4417df7bcb4c39e40d7dad65ffb8f2`.

## Promotion boundary

This evidence change intentionally retriggers the canonical Development System Gate. The resulting exact `dev` SHA must complete:

- System Gate source validation
- canonical Development D1 migration/data-authority proof
- exact Preview deployment and smoke acceptance
- Current Application Quality Proof
- I.T. Admin Runtime Proof
- authenticated real Chromium Build 155 Product acceptance against that exact Preview
- successful removal of any temporary Build 155 acceptance session

Only after those are GREEN may the exact Development SHA be fast-forwarded to `main` and Production verified.

## Safety

- Production application/data mutation before promotion: **NONE**
- Development authentication mutation: **one bounded temporary session row only when required; deleted after acceptance**
- User credential mutation: **NONE**
- Product/inventory business-data mutation: **NONE**
- Schema mutation beyond canonical Development migration proof: **NONE**
- R2 business-data mutation: **NONE**
- Payment/refund/provider/accounting execution: **NONE**
- Cloudflare Access policy weakening: **NONE**
- Promotion-gate weakening: **NONE**
