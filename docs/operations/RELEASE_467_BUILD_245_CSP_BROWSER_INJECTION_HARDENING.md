# Release 467 Build 245 — CSP & Browser Injection-Surface Hardening

Build 245 starts from exact Build 244 Development head `1d8111e948db0d3ee176f86a8a74e12dcdbec4e3` and tree `bddcec6079d5f906a39fd938cd47a61b594d434a`, promoted to Production main `f65d13c3b9d686d5e88168dcee84f25f580b6323`.

Build 245 removes `'unsafe-inline'` from runtime `script-src` by generating a fresh per-response nonce and stamping every script element, including inline JSON-LD and existing inline script blocks. Legacy inline event attributes remain explicitly isolated under `script-src-attr 'unsafe-inline'` for compatibility, and inline styles remain allowed in this bounded build because the application still has broad inline-style usage. The static header layer gains a stricter report-only policy matching the direction of travel.

During implementation we also corrected the inherited Build 244 mutation-origin guard placement so it executes at the request entry point before bypass routing, rather than only in the GET HTML response path.

No schema, D1/R2 business data, provider, publication, Inventory or Finance authority changes are introduced.

Next authorized release: **Build 246 — Abuse Resistance, Session Control & Security Operations**.
