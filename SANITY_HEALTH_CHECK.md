# Devil n Dove — Sanity Health Check

Current fully verified checkpoint: **Release 467 Build 148 — Seller Daily Command Centre**.

- SHA `5a51981e7831bbef4f44c19f43a36b811e0a2e79`
- tree `f4e0a88f1f7c6837176a939a19e5d4ae36596434`
- System `34772251480`
- Quality `34772251467`
- I.T. `34772251459`
- Hygiene `34772251477`
- Production Pages `34772367891`
- Production Live Resources `34772410714`

Build 149 — Seller Listing Manager & Fast Product Editing — is the active candidate. It is schema-free and uses existing Product/admin authorities. Local quick edits are allowed only with explicit sync state and `base_updated_at` conflict detection; publish, inventory, delete/archive and other high-authority actions remain live-only.

Canonical D1 migrations remain `0001`–`0004`. Build 135 transient transport retry policy remains mandatory. External provider/evidence lanes remain separate; no schema, D1 business-data, R2, provider or Production business-data mutation is authorized by the Build 149 feature slice.
