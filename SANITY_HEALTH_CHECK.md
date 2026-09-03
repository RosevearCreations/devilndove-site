# Devil n Dove — Sanity / Health Check

**Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade: DEVELOPMENT CANDIDATE.**

Verified predecessor boundary before Build 31:
- `dev` `9ef3d76fb23d88d2ff712222b30393aa8de53b3c`
- `main` `49eeae5ee864da0f52fd3c15728cff0392ed7dd1`
- shared tree `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`
- Production Pages Deploy `33783699520`: SUCCESS

Build 31 candidate security state:
- new password writes use unique salted `pbkdf2-sha256`
- legacy `sha256$` remains verification-only compatibility
- successful legacy login upgrades the hash conditionally in the login batch
- reusable static admin password hash removed
- plaintext password storage/readback remains forbidden
- no schema change; canonical migrations remain exactly `0001`–`0004`

**Verdict: Build 30 remains GREEN in Development/Production; Build 31 must still complete exact-head and merged Development acceptance before becoming GREEN.**
