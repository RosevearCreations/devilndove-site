# Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade

## Purpose

Harden Devil n Dove account password storage without breaking existing users or requiring a mass reset.

## Authority

New password writes use `pbkdf2-sha256` with a random 16-byte salt, 210000 PBKDF2 iterations and a 32-byte derived value through Web Crypto. The storage format is self-describing so verification can retain compatibility while the current scheme evolves deliberately.

Legacy `sha256$` hashes remain accepted only for verification. After a successful login against a legacy hash, the login route generates the current salted hash and conditionally updates the user record in the same atomic D1 batch used to create the session. The update includes the verified previous `password_hash` in its `WHERE` clause so a concurrent reset cannot be overwritten.

Registration, administrator bootstrap, administrator user creation, administrator password reset and member password change all write only the current scheme.

`database_admin_seed_template.sql` no longer contains a reusable password hash or executable credential INSERT. Administrator credentials must be created through the authenticated/bootstrap runtime authority.

## Boundaries

- stored plaintext passwords: forbidden
- existing password readback: impossible by design
- reusable static credential hashes: forbidden
- legacy hash new writes: forbidden
- forced mass password reset: not required
- request-time DDL: none
- schema migration: none
- canonical migrations: exactly `0001`–`0004`
- R2/provider/Cloudflare Access mutation: none
- automatic Production promotion: none

## Predecessor proof

Build 31 started only after synchronized Build 30 was re-verified:
- Development `dev`: `9ef3d76fb23d88d2ff712222b30393aa8de53b3c`
- Production `main`: `49eeae5ee864da0f52fd3c15728cff0392ed7dd1`
- shared tree: `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`
- Production Pages Deploy: `33783699520` SUCCESS

Build 31 acceptance values remain intentionally blank until the exact merged Development runtime is proven.
