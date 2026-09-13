# Devil n Dove — Sanity Health Check

Current candidate: **Release 467 Build 143 — Adaptive Mobile/Desktop/Web Application Shell**.

Last fully verified checkpoint is Build 142 at SHA `0b022c355217c00a7313aa2cb3e4b37a2b9a2b45`, tree `acf47b86db2cd170dc1fadd2a9e827e485e7c908`.

Development proofs: System `34765428970`, Quality `34765428976`, I.T. `34765428961`, Hygiene `34765428957`. Production proofs: Pages `34765518900`, Live Resources `34765564112`.

Build 143 ingests that exact closure and adds a shared adaptive application shell across Mobile app/PWA, Tablet, Desktop app/PWA and responsive Web. Buyer navigation exposes Shop, Search, device-local Saved, Cart and Account; seller navigation exposes Home, Orders, Products, Create and More through existing routes. Connectivity state is global and accessible, scroll position can recover through Back/Forward navigation, and offline Account navigation is stopped safely rather than forcing a failed login path.

Device-local Saved state is explicitly non-authoritative: it does not reserve inventory, sync to an account, or make a stored price current. Live price, stock, account, checkout, payment and seller mutations remain server-authoritative.

The Release 450 installable-client identity remains unchanged and `/api/`, admin/auth-sensitive paths remain outside cache authority. Build 137–142 closure evidence remains available, including Markdown/JSON exports, stable evidence ID, SHA-256 fingerprint, verification manifest, browser digest verification and JSON-versus-manifest consistency checks.

Build 143 does not mutate D1/R2/provider/business data. Canonical migrations remain `0001`–`0004` and live-resource retry correctness remains fail-closed.
