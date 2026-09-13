# Devil n Dove — Sanity Health Check

Current candidate: **Release 467 Build 136 — Production Proof Retry Telemetry & Closure Visibility**.

Last fully verified checkpoint is Build 135 at SHA `e48f2bab89cfcb67cc24eec7fab3296aa1ed3750`, tree `a1eff3544b4ecddb07d539de52eab71f3b81c9a3`.

Development proofs: System `34735075779`, Quality `34735075777`, I.T. `34735075772`, Hygiene `34735075770`. Production proofs: Pages `34735145318`, Live Resources `34735184613`.

Build 136 adds read-only closure and retry-policy visibility only. The Build 135 transport policy remains bounded to three transient attempts; permanent 4xx and real resource failures remain blocking. It does not mutate D1/R2/provider/business data. Canonical migrations remain `0001`–`0004`.
