# Devil n Dove — Sanity Health Check

Current candidate: **Release 467 Build 141 — Closure Evidence Cross-Artifact Consistency Verification**.

Last fully verified checkpoint is Build 140 at SHA `901d349760f9631cdbf989b549fcdac140d6569e`, tree `365e6c630e6e7b82eaadfaf85a82d9806cdc948f`.

Development proofs: System `34762269626`, Quality `34762269665`, I.T. `34762269664`, Hygiene `34762269682`. Production proofs: Pages `34762361931`, Live Resources `34762417112`.

Build 141 retains the Markdown/JSON exports, stable evidence ID, deterministic SHA-256 fingerprint, verification-manifest export and browser digest verification, then adds independent closure JSON versus verification-manifest consistency checks for evidence ID, canonical payload and canonical byte length. It does not mutate D1/R2/provider/business data. Canonical migrations remain `0001`–`0004` and live-resource retry correctness remains fail-closed.
