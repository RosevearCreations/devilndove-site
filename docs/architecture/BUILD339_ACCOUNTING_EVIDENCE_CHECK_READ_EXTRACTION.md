# Build 339 — Accounting Evidence Check Read Extraction

Evidence Check was already non-mutating. Build 339 gives it an Accounting-owned schema-aware read contract and passive service so missing evidence tables/columns are reported explicitly instead of being an unowned legacy read.
