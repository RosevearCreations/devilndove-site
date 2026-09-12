# Devil n Dove — Sanity Health Check

## Current release truth

Current candidate: **Release 467 Build 124 — Canada-First Market Controls & U.S. Shipping Pause**.

Last fully verified Development + Production checkpoint is Build 123:

- SHA `d0485a9892331e8da2cec42ed54850893b4a7ab1`
- tree `e5c15b8c2d1c1a9f091a688b9f525e8b7ce73e20`
- System `34719387920`
- Quality `34719387904`
- I.T. `34719387901`
- Hygiene `34719387931`
- Production Pages `34719482161`
- Production Live Resource Integrity `34719519418`

Result: **Build 123 six-proof closure is ingested by Build 124.**

## Build 124 safety checks

- Storefront strategy: **CANADA_FIRST**.
- Billing country allow-list: **CA only**.
- Physical shipping country allow-list: **CA only**.
- U.S. sales: **EXPLICITLY BLOCKED**.
- U.S. shipping: **EXPLICITLY BLOCKED**.
- U.S. restriction reason: `TEMPORARY_TARIFF_RESTRICTION`.
- Other markets: **UNSUPPORTED until REVIEW_BEFORE_ENABLE**.
- Local pickup: **PRESERVED**.
- Front-page banner: Canada First/U.S. shipping pause message, no additional H1.
- Shared browser/server policy: **PRESERVED**.
- Provider execution/publication added: **ZERO**.
- Accounting posting / period close: **ZERO**.
- Inventory / Creative / price mutation: **ZERO**.
- Request-time schema mutation: **ZERO**.
- D1 business-data mutation: **ZERO**.
- R2/binding mutation: **ZERO**.
- Canonical migrations: exactly `0001`–`0004`.
- Production business-data overwrite: **ZERO**.

## Restart integrity

Build 124 remains a closure candidate until its exact `dev` head receives the required external proof. Its later proof must be ingested by Build 125, not self-written into Build 124.
