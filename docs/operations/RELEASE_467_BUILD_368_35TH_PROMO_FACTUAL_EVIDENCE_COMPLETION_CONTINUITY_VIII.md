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

## Build 368 corrective Admin runtime repair

The live Users & Security 401 was traced to legacy Bearer-only admin endpoints after the cookie-first session migration; Build 368 already moves those endpoints to the shared HttpOnly-cookie-compatible resolver. A subsequent Firefox Admin-home slowdown showed that the lean dashboard still executed obsolete Build 249/250/254 browser-measurement wrappers. The corrective Build 368 revision retires those wrappers **only on the lean Admin home**, while retaining Build 240's 60-second safe-read coalescing and 8-second live timeout.

No Cloudflare variable, secret, external provider, D1 migration, R2 change or business-data mutation is required. Production verification surfaces are `https://devilndove.com/admin/` and `https://devilndove.com/admin/users/`.


## Final corrective exact-tree closure

- Development: `d36a643fc8b8805f1b4dbdb3fc0963ba375c07c3`, tree `18b63f5f1910fe48ac40497f217e99d08132c00b`
- Production: `253824ef52cc4faa90b4f5fe42cc177264bf2df1`, same tree
- Development proofs: System `37981315804`, Quality `37981315817`, I.T. Runtime `37981315815`, Hygiene `37981315760`, D1 Fan-Out `37981315890`, Build-specific `37981315756`
- Production Pages: `37981619129`
- Production Live Resource Integrity: `37981772067`

Build 369 successor-ingests this closure.
