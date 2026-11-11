# Devil n Dove 681 — Exception SLA, Signed Master Receipts and Owner History

Build 681 extends the protected, source-owned financial evidence workflow. It does **not** grant Master connection or independently certify net business profit.

## Owner exception SLA

The read-only campaign projection `financial681` derives each episode from immutable recorded events. Its initial targets are **provisional**, not contractual: owner acknowledgement within 24 hours of opening, and resolution within 72 hours. Responses label `AWAITING_ACK`, `ACK_OVERDUE`, `RESOLUTION_OVERDUE`, `ACK_AND_RESOLUTION_OVERDUE`, `ACKNOWLEDGED_OPEN`, `RESOLVED`, or `HOLD_INVALID_CLOCK`. It returns observed age, due timestamps, and an explicit `scan_complete` flag.

The operator can acknowledge a still-open, same-queue exception exactly once per episode using `owner_exception_ack_681`, with explicit owner review. The action appends `owner_exception_acknowledged_681` on a separate platform key to preserve the Build 680 open/resolve workflow and returns no financial acceptance. A truncated audit refuses acknowledgements. Closure still requires the existing supervised resolution action.

## Signed Master receipt lifecycle

`financial681.master_receipts` returns a restricted, read-only view of previously recorded signed ACK receipts. It never exports their raw signatures or source financial documents. Each record is classified as `SIGNED_AT_INTAKE_RECEIPT_ONLY`, `EXPIRED_OR_INVALID_TIME`, or `SUPERSEDED_OR_SOURCE_MISMATCH`, based on the current 679 source fingerprint, configured deployed source revision and 24-hour receipt freshness. The signature was checked at **intake** by Build 680; the read model does not re-authenticate the remote runtime or assert an independent Master acknowledgement.

The connection state remains `HOLD_INDEPENDENT_RUNTIME_TRANSPORT_AND_MASTER_ADMISSION`; Master acceptance is false until independently verified under AI Data Platform's own trust boundary.

## Owner acceptance history

`financial681.owner_history` presents the last 25 available source-recorded acceptance and exception-acknowledgement events with their time and evidence category. It does not leak private customer details, signatures, or raw payment references. Incomplete scans remain HOLD, never treated as an exhaustive history. No rewrite of payment, product-cost, order or accounting records is authorized.

## Release, testing and Master integration

An exported deterministic `exceptionSla681` function is regression-tested for opened, acknowledged, resolved, overdue and invalid-clock states in `scripts/build679_verified_campaign_net_contract.mjs`. No D1 migrations or new public endpoints are added.

Direct Master handoff: https://github.com/RosevearCreations/ai-data-platform/issues/850

The exact Dev green checks, Cloudflare production deployment, live source version and public smoke are independent prerequisites. A GREEN code deployment is not financial certification.
