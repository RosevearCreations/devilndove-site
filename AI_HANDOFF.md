# Devil n Dove — AI Handoff

## Current authority

**Release 467 Build 31 — Password Hash Hardening + Transparent Legacy Upgrade is Development GREEN.**

Accepted runtime: `d2bae947e7256113b5cc665a24bcb26431a5ab1a` / tree `d1092b24208cc707281406ffc818e615eb7b4d24`.
Accepted proof: System Gate `33791051877`, Build 31 Proof `33791052029`, Branch Hygiene `33791051829` — all SUCCESS.

Build 31 security boundary:
- current password writes: salted/iterated `pbkdf2-sha256`
- legacy SHA-256 passwords: verification-only compatibility
- successful legacy login: conditional transparent hash upgrade in the existing atomic login batch
- plaintext password storage/readback: forbidden
- reusable static password seed: disabled
- forced mass reset: not required
- schema change: none; canonical migrations remain `0001`–`0004`

Production remains Build 30 and was not changed by Build 31: `main` `49eeae5ee864da0f52fd3c15728cff0392ed7dd1`, tree `97d2d3c57db0f37bcd9cb0761d5bc3a7f4b2556b`, Production Pages Deploy `33783699520` SUCCESS.

Do not redo Build 31. Start Build 32 only from the final Build 31 green-closure descendant after closure CI passes. External HOLD lanes remain deferred unless current evidence explicitly changes them.
