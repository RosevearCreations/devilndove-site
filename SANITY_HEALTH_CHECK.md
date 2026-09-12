# Devil n Dove — Sanity Health Check

## Current release truth

Current candidate: **Release 467 Build 126 — Admin Favorites & Quick Launch**.

Last fully verified Development + Production checkpoint is Build 125:

- SHA `eca94d1ac4732c561794f914f89a2838af243617`
- tree `c7b4caf380183cd0b71b79d2f0ba73ccefce0d26`
- System Gate `34721943588`
- Current Application Quality `34721943584`
- I.T. Admin Runtime `34721943615`
- Repository Branch Hygiene `34721943593`
- Production Pages Deploy `34722069482`
- Production Live Resource Integrity `34722116635`

Result: **Build 125 six-proof closure is ingested by Build 126.**

## Build 126 safety checks

- Favorite scope: **signed-in Admin user ID + current browser**.
- Storage: **localStorage convenience state only**.
- `sessionStorage`: **NOT USED**.
- Favorites: **non-home Admin routes only**.
- Favorite count: **bounded to 8**.
- Admin-home quick launch: **up to 3 favorite links**.
- Individual remove + clear control: **PRESENT**.
- Server preference endpoint: **NONE**.
- Network write for favorites: **NONE**.
- Provider execution/publication added: **ZERO**.
- Accounting posting / period close: **ZERO**.
- Inventory / Creative / Product / price mutation: **ZERO**.
- Request-time schema mutation: **ZERO**.
- D1 business-data mutation: **ZERO**.
- R2/binding mutation: **ZERO**.
- Canonical migrations: exactly `0001`–`0004`.
- Production business-data overwrite: **ZERO**.

## Restart integrity

Build 126 remains a closure candidate until its exact `dev` head receives the required external proof. Its later proof must be ingested by Build 127, not self-written into Build 126.
