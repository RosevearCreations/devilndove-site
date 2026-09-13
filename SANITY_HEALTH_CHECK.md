# Devil n Dove — Sanity Health Check

Current candidate: **Release 467 Build 139 — Closure Evidence Integrity Fingerprint & Verification Manifest**.

Last fully verified checkpoint is Build 138 at SHA `5f3f0d39cdcf1ce743c9a17c40691f58fb342e8b`, tree `76e77253294ea84ea4a77f28ab684ffe3f07dd34`.

Development proofs: System `34760742040`, Quality `34760741973`, I.T. `34760741960`, Hygiene `34760741974`. Production proofs: Pages `34760868140`, Live Resources `34760912351`.

Build 139 retains the Markdown/JSON closure exports and stable evidence ID, then adds a deterministic SHA-256 fingerprint and verification-manifest export over the canonical closure payload. It does not mutate D1/R2/provider/business data. Canonical migrations remain `0001`–`0004` and live-resource retry correctness remains fail-closed.