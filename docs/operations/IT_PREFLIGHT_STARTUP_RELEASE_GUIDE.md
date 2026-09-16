# I.T. Preflight, Startup & Release Guide

## Current release baseline

Release 467 uses `main` as the current Production source and `dev` as the Development candidate lane. Forward D1 authority remains `migrations/canonical/manifest.json` plus `scripts/d1_migrate.py`; canonical migrations remain exactly `0001`–`0005`. Request-time DDL and automatic Production promotion remain closed.

## Canonical Development target

- Cloudflare Pages project: `devilndove-site`
- Development Preview: `https://dev.devilndove-site.pages.dev`
- Development D1: `devilndove-dev`

## Standard release sequence

1. Verify the previous exact SHA/tree and external proofs.
2. The next build ingests that closure; the previous build never self-records later proof.
3. Prove the exact `dev` head through System, Quality, I.T., Hygiene and build-specific acceptance.
4. For browser/runtime incidents, execute the affected authenticated workflow in a real browser after the exact Preview deployment; HTTP-only smoke is insufficient.
5. Non-force promote the identical Development commit to `main` only after Development is GREEN.
6. Require Production Pages Deploy and Production Live Resource Integrity.
7. Execute incident-specific Production browser/route proof when required.
8. Only then call `main` / Production GREEN.

Production live-resource retries remain capped at three transient attempts; permanent 4xx and genuine resource failures fail closed. Stripe Development, PayPal sandbox and Social/OAuth remain `HOLD_EXTERNAL`; CAIP private media remains `EVIDENCE_DEPENDENT`.

<!-- CURRENT_RELEASE_RESTART_AUTHORITY_START -->
## Current Release 467 restart authority — Build 161 candidate

Build 160 **Product Production Browser Recovery** is the last fully verified Development and current Production baseline.

- Last fully verified Development SHA: `4963a718166a7010c2075c803a26b13dadaf88db`
- Current Production main SHA: `4963a718166a7010c2075c803a26b13dadaf88db`
- Exact shared tree: `55e10b5507ac14ac1bc8937365789861c4119bea`
- Development System Gate: `35149251365`
- Development Current Application Quality: `35149251447`
- Development I.T. Admin Runtime: `35149251412`
- Development Repository Branch Hygiene: `35149251413`
- Build 160 source proof: `35149251640`
- Production Pages Deploy: `35160325113`
- Production Live Resource Integrity: `35160415476`
- Products Production Browser Proof: `35160415542`
- Products Route Production Proof: `35160415443`

Build 161 **Universal Search, Recent Work & Command Centre QoL** is the active Development candidate. It adds a shared Admin-only search and navigation layer while keeping `data/admin-navigation-modules.json` as the canonical route authority.

The Build 161 search endpoint is authenticated, GET-only and bounded. It searches existing Product, Inventory/Tools, Project, Order, Custom Work, Content and Media authorities only where their tables and searchable columns exist. It does not create a second business-data authority. Recent work and favourites remain browser-local and do not write D1.

Keyboard access uses Ctrl/Cmd+K and `/`; same-origin Admin destinations can receive a bounded `dd_return` context so operators can return to the prior workspace. The existing Command Centre displays recent work and favourites without changing Product, Inventory, Finance, payment, provider, R2 or accounting mutation authority.

Build 161 acceptance requires the dedicated Build 161 source proof plus System Gate, Current Application Quality, I.T. Admin Runtime and Repository Branch Hygiene on one exact final `dev` SHA. Only that exact GREEN commit may be non-force promoted to `main`, followed by Production Pages Deploy, Production Live Resource Integrity and the retained Production Product proofs required by the repository release process.
<!-- CURRENT_RELEASE_RESTART_AUTHORITY_END -->
