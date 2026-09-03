# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade is the active Development candidate.**

Start boundary was re-verified before Build 31: synchronized Build 30 `dev` `9ef3d76fb23d88d2ff712222b30393aa8de53b3c` and `main` `49eeae5ee864da0f52fd3c15728cff0392ed7dd1` share tree `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`; Production Pages Deploy `33783699520` SUCCESS.

Build 31 security contract:
- current writes: salted/iterated `pbkdf2-sha256`
- legacy `sha256$`: verification-only compatibility
- successful legacy login: conditional transparent upgrade inside the existing atomic login batch
- no plaintext password storage or response
- no reusable static credential hash in the administrator seed template
- no forced mass reset
- no schema change; canonical D1 migrations remain `0001`–`0004`

Build 30 remains the last accepted Production release until Build 31 is proven on Development and deliberately promoted. External HOLD lanes remain deferred and must not be opened merely to create scope.

Do not redo Build 30 or bypass Build 31 exact-head proof.
