# Release 467 Build 368 — 35th Promo Factual Evidence Completion Continuity VIII

Build 368 succeeds exact Build 367 Development/Production GREEN and re-measures the 35th Promo using only real execution/process, result and lesson evidence plus substantive Maker Story facts.

This build also repairs Users & Security authentication. The site is cookie-first: browser sessions live in the server-issued HttpOnly `dd_auth_token` cookie. The affected user-management endpoints still required a script-supplied Bearer token, which current browser JavaScript intentionally cannot read. They now use the canonical cookie-or-bearer `resolveSessionUser` authority.

No variable, secret, D1 migration or external service change is required for the Users repair.

Build 368 remains readiness-only. It does not fabricate evidence, auto-review a story, create public candidacy, publish, infer media rights, mutate R2 or contact Production D1 for measurement.

Next: **Build 369 — Grey Hair Source Review & Story-Plan Completion Continuity VIII**.

## Exact Build 368 measurement

Development measurement: **REAL_OUTCOME_EVIDENCE_STILL_REQUIRED**. The 35th Promo has **0 execution/process events, 0 result events, 0 lesson events**, no selected execution evidence, `story_review_status=needs_review`, `public_story_candidate=0`, and `outcome_status=unknown`. It is **not ready** for explicit human review. The four read-only statements consumed **45 / 20,000** provider rows.

Measurement artifact: `11640196668` — `sha256:952b8d86d79f1b070300c8c5dda8ce1648658a0c4172734fe9060934681cdce8`.

The Users & Security repair is code-only: no variable, secret, service, schema migration or Production D1 mutation is required.
