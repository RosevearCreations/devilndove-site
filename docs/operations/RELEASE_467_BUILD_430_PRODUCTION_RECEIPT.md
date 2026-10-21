# Release 467 Build 430 — Production Deployment Receipt & Live Version Verification

Build 430 creates a **fail-closed, source-linked Production receipt** only after the protected Production Pages Deploy workflow has already verified the exact fully-green Development tree, Cloudflare production deployment identity, and live Production public smoke. This is neither a bypass nor proof that a particular historical deployment succeeded.

## Implementation

- `scripts/release430_production_receipt.py` reads `/tmp/production-control-plane-proof.json` and `/tmp/production-smoke.json`, verifying both are PASS, the full GitHub source SHA matches Cloudflare deployment metadata, branch is `main`, environment is `production`, project identity is correct, and a Cloudflare deployment ID and HTTPS URL exist.
- Records exact SHA, GitHub Actions run ID and link, Cloudflare deployment ID/URL/commit, evidence SHA-256 hashes, and recorded public live checks.
- Receipt is uploaded as `production-release-receipt.json` inside the existing `production-promotion-proof-<sha>` artifact, making it available for the next build's Admin status view.
- `scripts/release430_production_receipt_test.py` rejects absent, mismatched or unauthenticated release evidence and runs in both Development quality proof and the Production receipt step.
- Build 429's workflow-specific diagnostic remains the prerequisite for trustworthy reporting of all four required Development proofs.

## Interpret status carefully

`VERIFIED_PRODUCTION_RECEIPT` means the workflow **reached and passed** the Cloudflare control-plane and public smoke steps. Independent overall workflow completion/success and the current Cloudflare active Production deployment must be checked before saying **Production GREEN**. The live site's HTML is not itself an exact-commit marker: `live_html_contains_exact_sha: false` is explicitly recorded rather than inventing that claim.

No D1 migrations, customer/provider writes, shipping changes or Production gate weakening are introduced. Next proposed: **Build 431 — Release Gate Dashboard & Human-Readable Blocker Reasons**. See `docs/operations/RELEASE_467_BUILD_429_438_ROADMAP.md`.
