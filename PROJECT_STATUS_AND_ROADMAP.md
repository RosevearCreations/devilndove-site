# Devil n Dove — Project Status and Roadmap

## Current release

**Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade is GREEN on Development.**

Accepted Development runtime:
- SHA `d2bae947e7256113b5cc665a24bcb26431a5ab1a`
- tree `d1092b24208cc707281406ffc818e615eb7b4d24`
- System Gate `33791051877` SUCCESS
- Build 31 Proof `33791052029` SUCCESS
- Branch Hygiene `33791051829` SUCCESS

Build 31 changes all new password writes to unique salted `pbkdf2-sha256` hashes through Web Crypto. Existing legacy SHA-256 credentials remain verification-only compatibility and are transparently upgraded after successful login with a conditional prior-hash guard inside the existing atomic login batch. Registration, bootstrap, self-service password change, admin user creation and admin password reset write only the current scheme. Static reusable administrator credential hashes are disabled.

No plaintext password storage/readback, mass reset, schema change, R2/provider/Access mutation or automatic Production promotion was introduced. Canonical migrations remain exactly `0001`–`0004`.

## Production boundary

Production remains synchronized Build 30:
- `main` `49eeae5ee864da0f52fd3c15728cff0392ed7dd1`
- tree `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`
- Production Pages Deploy `33783699520` SUCCESS

Build 31 has **not** been promoted to Production in this build.

## Next

Build 32 is ready only after this evidence-only Build 31 closure is merged and re-proven on current `dev`. Select Build 32 from current repository evidence; do not reopen Build 31 or superseded Build 20–30 prerequisites.
