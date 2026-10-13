# Release 467 Build 395 — Etsy Monitoring Operator Acceptance & Exception Resolution

**Status: QUEUED / BLOCKED — not implemented, not deployed, not Production GREEN.**

## Prerequisites
- Build 393 Etsy connection and Product price source validation were reported completed by the operator; release CI and production proof not yet evidenced.
- Build 394 is currently a specification only. Its actual monitoring UI, read-only service, and scoped regression must be implemented and proved before Build 395 acceptance.
- Cloudflare Pages screenshot supplied October 13 shows **Automatic deployments paused**, Production at `main` `298e2b9` (Build 392), and three successful **Preview** builds at dev `dcc6c8c`, `c74cde7`, and `f653b42`. Preview success does NOT establish Production GREEN.
- Historical dev/main branches diverge. Do not merge all of dev to main, force push, or claim exact-tree parity without independent verification.

## Acceptance scenarios
1. Verified Etsy connection with fresh verification timestamp: show verified status and last check safely; no token material.
2. Disconnected, expired or unverified status: show clear next action, no false connected claim; reauthorization requires explicit operator action.
3. Etsy provider timeout, rate limit and unavailable: show provider error or outcome unknown without automatically retrying, publishing, or changing listings.
4. Recovered Etsy connection: clear active incident only after new verified evidence; preserve historical occurrence and timestamps.
5. Product prices: approved source-backed CAD cents only, including legitimate zero. Display two decimals. Missing source or disagreement is a review exception, not an automatic rewrite.
6. Product save: distinguish success, failure, and ambiguous network outcome; read persisted value before retry. Never issue duplicate POST for a single operator action.
7. Bound reads, no request-time schema repairs, no Production D1 mutation merely to prove an acceptance test; no sensitive credentials in UI, logs or evidence.
8. Signed-off operator evidence: UTC timestamp, deployed SHA, scenario, safe diagnostic, observed state, and reviewer decision.

## Required release procedure
1. Finish Build 394 functionality and tests on `dev`, then verify full exact-head Development CI proofs and Cloudflare preview.
2. Implement Build 395 scenario/UI exception handling and dedicated regressions with reproducible evidence.
3. Review and reconcile dev/main without blanket merging their divergent history. Promote only audited, fully green source.
4. In Cloudflare Workers & Pages > devilndove-site > Settings/Builds & deployments, identify why automatic deployments are paused; resume only after verification or perform deliberate, audited production deployment for the exact approved main commit.
5. Confirm Pages Production deployment success, correct source SHA, and Production Live Resource Integrity and live smoke checks.
6. Only then mark Build 393, 394, 395 Production GREEN as individually proven; user validations must never substitute for CI or production checks.

## Operator handoff
- GitHub Actions: https://github.com/RosevearCreations/devilndove-site/actions
- Production: https://devilndove.com
- Cloudflare deployment screenshot: current `main` build 392 with automatic deployments paused.
- No Etsy secrets, supplier records, or other private evidence to be committed.

**Next candidate after Build 395 verified Production GREEN:** Build 396 — Etsy Monitoring Reliability, Alert Routing & Audit Closure (provisional).
