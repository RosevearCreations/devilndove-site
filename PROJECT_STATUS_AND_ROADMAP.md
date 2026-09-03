# Devil n Dove — Project Status and Roadmap

## Current release

**Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade is the active Development candidate.**

Build 31 started only after synchronized Build 30 was re-verified: `dev` `9ef3d76fb23d88d2ff712222b30393aa8de53b3c` and `main` `49eeae5ee864da0f52fd3c15728cff0392ed7dd1` both resolve to tree `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`; Production Pages Deploy `33783699520` is SUCCESS.

Build 31 replaces new password writes with a unique salted `pbkdf2-sha256` hash using Web Crypto, while retaining verification-only compatibility for existing `sha256$` credentials. A successful legacy login upgrades that user's hash conditionally inside the existing atomic login batch. Registration, bootstrap, self-service password change, admin user creation, and admin password reset write only the current format. The reusable legacy password hash was removed from `database_admin_seed_template.sql`.

No plaintext password is stored or returned. No mass reset is required. No schema change is introduced and canonical migrations remain exactly `0001`–`0004`.

## Current boundary

Build 31 is Development-only until its exact feature head and merged `dev` runtime pass Build 31 Proof, System Gate, I.T./root-admin authority, Branch Hygiene, exact Preview deployment/bindings and smoke.

Production remains the synchronized Build 30 boundary until a later explicit promotion is requested and independently verified.

## Next

Complete Build 31 feature proof and Development acceptance. Do not open an external HOLD lane or invent unrelated scope while this security slice is active.
