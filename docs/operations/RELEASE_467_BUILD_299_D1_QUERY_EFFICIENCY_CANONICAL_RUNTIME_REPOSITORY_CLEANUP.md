# Release 467 Build 299 — D1 Query Efficiency + Canonical Runtime/Repository Cleanup

Build 299 is a bounded reliability/cleanup release over exact Build 298 Production GREEN.

The hot public/admin read paths now share a bounded schema-column snapshot that composes multiple `pragma_table_info()` table-valued reads into one D1 statement, with a compatibility fallback only if that SQLite surface is unavailable. Products, Product Detail, Featured Products and Universal Search use the shared snapshot instead of repeated per-table PRAGMA fan-out.

Workshop Journal and Capabilities no longer issue a `sqlite_master` preflight before their ordinary read. Product Detail no longer probes `sqlite_master` before story-note and review reads. Creations no longer probes for `public_display_priorities`; it tries the richer query and falls back to the plain canonical query only on failure. An empty Creations search no longer carries six redundant wildcard predicates.

Universal Search retains free-form substring semantics for human text, but reference-like quick-jump queries use prefix matching so existing indexes can participate where SQLite's plan permits. Build 299 does not add FTS/trigram tables or keyset schema merely because the roadmap mentioned them: the exact Development workflow measures corpus sizes, provider rows-read and query plans first. Any later index/FTS change must be justified by that evidence.

Repository cleanup removes eight byte-identical top-level API copies whose canonical Pages Functions live under `functions/api/` and which had no repository consumers beyond their canonical twins: `auth-login.js`, `catalog-items.js`, `health.js`, `image-derivative.js`, `movies.js`, `paypal-return.js`, `site-search-event.js`, and `stripe-return.js`. Historical release authorities, gates, migration evidence and non-identical compatibility copies are retained.

Build 298 predecessor: Development `2fae62c9b5f78e31d8325bd63d93c1674a11c3c6`, Production `5da8e2457ec64a9a54523bd56eb523c9abd5ec8c`, shared tree `396b3491620307b041cda8ac066f97ea44f2b0ef`.

Build 299 is schema-neutral and its provider measurement contacts only the canonical Development D1 with read-only SQL. Production D1 is not contacted by the measurement job.

**Next: Build 300 — CAIP Maker Content Outcomes Renewal & Automation Refinement.**
