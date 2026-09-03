# Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade

## Status

**Development GREEN.**

Accepted runtime:
- SHA `d2bae947e7256113b5cc665a24bcb26431a5ab1a`
- tree `d1092b24208cc707281406ffc818e615eb7b4d24`
- System Gate `33791051877` SUCCESS
- Build 31 Proof `33791052029` SUCCESS
- Branch Hygiene `33791051829` SUCCESS

## Security authority

New password writes use `pbkdf2-sha256` with a random 16-byte salt, 210000 PBKDF2 iterations and a 32-byte derived value through Web Crypto.

Legacy SHA-256 hashes remain accepted only for verification. A successful legacy login derives a new current hash and conditionally replaces the verified previous hash inside the existing atomic D1 login batch. The conditional prior-hash guard prevents a concurrent password reset from being overwritten.

Registration, administrator bootstrap, administrator user creation, administrator password reset and member password change write only the current scheme. `database_admin_seed_template.sql` contains no reusable credential hash or executable credential INSERT.

## Boundaries

- plaintext passwords stored or returned: no
- existing password readback: impossible by design
- legacy hash new writes: forbidden
- forced mass reset: not required
- request-time DDL: none
- schema migration: none
- canonical migrations: exactly `0001`–`0004`
- R2/provider/Cloudflare Access mutation: none
- automatic Production promotion: none

## Production

Build 31 was not promoted to Production. Production remains Build 30 at `main` `49eeae5ee864da0f52fd3c15728cff0392ed7dd1`, tree `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`, with Production Pages Deploy `33783699520` SUCCESS.

## Restart

After this evidence-only closure is merged and re-proven, Build 32 may begin from the final closure descendant. Do not redo Build 31 or rerun superseded historical Build 20–30 gates as current prerequisites.
