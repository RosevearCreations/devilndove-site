# Release 467 Build 368 — 35th Promo Factual Evidence Completion Continuity VIII

Build 368 succeeds exact Build 367 Development/Production GREEN and re-measures the 35th Promo using only real execution/process, result and lesson evidence plus substantive Maker Story facts.

This build also repairs Users & Security authentication. The site is cookie-first: browser sessions live in the server-issued HttpOnly `dd_auth_token` cookie. The affected user-management endpoints still required a script-supplied Bearer token, which current browser JavaScript intentionally cannot read. They now use the canonical cookie-or-bearer `resolveSessionUser` authority.

No variable, secret, D1 migration or external service change is required for the Users repair.

Build 368 remains readiness-only. It does not fabricate evidence, auto-review a story, create public candidacy, publish, infer media rights, mutate R2 or contact Production D1 for measurement.

Next: **Build 369 — Grey Hair Source Review & Story-Plan Completion Continuity VIII**.
