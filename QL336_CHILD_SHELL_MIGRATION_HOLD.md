# QL-336 — Maker-commerce child-shell preparation (HOLD)

Devil n Dove remains the first owned maker business, not an authenticated multi-maker connector.

- New shell-level GET handlers are distinct from legacy integration v1 and always return **503 HOLD**, with no Etsy, order, inventory, image, customer, payment or fulfilment access. Child overrides, writes and unrelated routes are denied.
- **Unapplied proposal** `migrations/proposed/0051_ql336_owned_child_shell_hold.sql` defines **pending-only** children, memberships, unique legacy resource claims and opaque, non-secret provider-handle references. It is intentionally **outside** the canonical manifest, since the protected Current Deployment Preflight requires a Development-applied checksum before a canonical D1 migration enters a release. Source backup, Development-first application proof and separate authorization are prerequisites.
- D1/SQLite has no native RLS. Future active tenancy demands server-side query-by-child enforcement, R2 object isolation, Etsy shop and marketplace/provider partitioning, session roles and explicit cross-child 403/no-rows tests. A registry row must never substitute for these controls.
- First child slug for later source review: `devil-n-dove`. No second maker is enrolled, and no existing data or provider action is changed.

Local acceptance: `node --test scripts/release467_build610_ql336_child_shell.test.mjs` and `python3 scripts/migration_policy_gate.py`. Live multi-tenant enrollment and signed TEST are **NO-GO** pending separately reviewed proof.

**Performance budget review:** QL-336 introduces exactly three small runtime files (two Cloudflare shell route entries and one shared fail-closed validator). The pre-existing cap of 1,800 runtime files is increased by exactly three to **1,803**; total runtime byte cap (18,000,000), per-file size caps, data-URI caps and the mandatory protected performance gate remain unchanged. Current source inventory is 1,803 files / 17,999,565 bytes. Future expansion still requires the existing budget review.
