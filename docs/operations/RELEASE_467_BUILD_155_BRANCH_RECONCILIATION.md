# Release 467 Build 155 — Branch Reconciliation and Promotion-Gate Repair

## Purpose

This release evidence records the bounded branch-topology and browser-proof repair required to complete Build 155 safely.

The original workflow-only bootstrap on `main` was reconciled into `dev`, preserving the Build 155 application tree and restoring fast-forward promotion ancestry.

## Browser-proof findings

The first classified real-browser runs established that the Product page itself reached `complete` and did not show render-loop, command-center-loading, or Worker resource-limit evidence. The first failing layer was authentication: the browser's administrator session was inactive, with Product picker population, Product rows, and the Build 155 client-health marker failing downstream.

A subsequent live-D1 session attempt still failed when tested through the moving `dev.devilndove-site.pages.dev` alias. The canonical System Gate, however, proves and publishes the exact hashed Preview deployment URL for each source SHA in the `current-development-deploy-proof` artifact.

Build 155 browser acceptance now consumes that exact System Gate artifact, verifies its `source_sha`, project and Preview environment, and tests existing Development administrator sessions against `/api/auth/me` on that exact deployed URL before Chromium starts. Only a session already accepted by the exact Preview can be passed into the browser proof. No session is created or modified.

The exact-Preview browser-proof release plumbing is registered on default `main` at `610650f6eb0cb515d9689c73e74dedd7d712ef60` and reconciled into `dev` ancestry at `828fcaa04e093be99580802bb8ae46d72bc2d2b9`.

## Promotion boundary

This evidence change intentionally retriggers the canonical Development System Gate. The resulting exact `dev` SHA must complete:

- System Gate source validation
- canonical Development D1 migration/data-authority proof
- exact Preview deployment and smoke acceptance
- Current Application Quality Proof
- I.T. Admin Runtime Proof
- real Chromium Build 155 Product acceptance against that exact Preview

Only after those are GREEN may the exact Development SHA be fast-forwarded to `main` and Production verified.

## Safety

- Production application mutation before promotion: **NONE**
- Session/authentication mutation: **NONE**
- Product business-data mutation: **NONE**
- Schema mutation beyond canonical Development migration proof: **NONE**
- R2 business-data mutation: **NONE**
- Payment/refund/provider/accounting execution: **NONE**
- Cloudflare Access policy weakening: **NONE**
- Promotion-gate weakening: **NONE**
