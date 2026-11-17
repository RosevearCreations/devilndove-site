# Build 733 — Original Privacy Operations Command Centre

## Scope and original authority
Build 733 adds a protected, manually refreshed seven-application privacy command centre at `/admin/it-integrations/`, backed by `GET/POST /api/admin/privacy-command-centre-733`. The command centre reads only Devil n Dove's original D1 metadata. It **does not remotely access seven apps**, send withdrawal events, read customer PII, decrypt ciphertext or verify outside erasure. Names and local status for Devil n Dove (source), Rosie Dazzlers, Yard Workers, iCamp, Rosevear AI Hub, AI Data Platform and Rosevear Comms Hub are shown; apps without independently connected original peer evidence remain `EXTERNAL_APP_NOT_ATTESTED`.

## Immutability and approvals
- Canonical 0055 creates `dnd_privacy_sla_reviews_733`, `dnd_privacy_sla_resolutions_733`, and `dnd_privacy_rotation_witnesses_733`. All are immutable; no UPDATE or DELETE.
- SLA review requires a verified signed original withdrawal ACK from exactly one original source lane (manual Build 728 or service Build 730), matching the original event target and hash, with consent still revoked/blocked.
- SLA resolution requires a different currently authenticated Administrator, the original review ID and matching reason code, and D1 re-checks the actual original signed ACK and source consent. Duplicate event closure is impossible.
- Key-lineage witness requires a different Administrator from the latest ciphertext version creator. The D1 trigger matches original evidence ID, adjacent versions, exact SHA-256 hashes, previous-version hash chaining, distinct key IDs, and current/latest version. This is **metadata witness only**; it never proves successful plaintext decryption, safe historical-key retirement or external key rotation.
- All Admin operations require same-origin requests, explicit user review, bounded inputs and a verified active Admin identity. No automatic background posting.

## Release gates
- `scripts/build733_privacy_sqlite_gate.py` and `scripts/build733_privacy_command_contract.mjs` enforce negative cases, immutable receipts, independent approvals and no false outside claims.
- `.github/workflows/development-d1-build733-apply.yml` applies canonical 0055 to Development D1 only, after original 0054, with original business row snapshots and independent three-table, migration receipt and foreign-key readback.
- Production migration must run through the original exact-main-SHA Pages workflow, after full exact-head Development CI and protected dev→main promotion; preserve original data. Verify Cloudflare Pages and independent live resource on exact SHA.
- The Cloudflare Worker remains **HOLD**, pending a scoped Workers deployment token provisioned privately in Actions as `CLOUDFLARE_WORKERS_API_TOKEN`; issue #951. The worker is disabled by default until independently authorized Master signer enrollment and genuine signed ACKs. Do not represent source-only Pages GREEN as complete external privacy automation GREEN.
