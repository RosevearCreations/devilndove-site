# Devil n Dove — Sanity Health Check

Current fully verified checkpoint: **Release 467 Build 147 — Buyer Account, Saved Items & Order Hub**.

- SHA `3fadc908df56ba194e2cd2f9e5480f6bfbedb796`
- tree `aeee53fdd3e01aee6b01a75e83f92f57b859960f`
- System `34769839872`
- Quality `34769839865`
- I.T. `34769839876`
- Hygiene `34769839871`
- Production Pages `34769929784`
- Production Live Resources `34769969149`

`dev` and `main` were externally verified identical at this checkpoint. Build 148 — Seller Daily Command Centre — is the next authorized slice.

Build 148 is constrained to read-only aggregation of existing Today Tasks, dashboard-summary and I.T./reliability authorities. It must not reuse the legacy Command Center's request-time DDL or create a second queue. Cached dashboard context may be shown with a timestamp during disconnection, but current order/inventory actions require live revalidation.

Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport retry policy remains mandatory. External provider/evidence lanes remain separate and no schema, D1 business-data, R2, provider or Production business-data mutation is authorized by the Build 148 feature slice.
