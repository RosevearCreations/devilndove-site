# AIDP Build 423 — Devil n Dove Sysop telemetry source handoff

Devil n Dove exposes `GET /internal/rosevear/sysop/telemetry/v1` only after server-side telemetry enrollment. Required secrets are the read token and service-owned Ed25519 private key; the exact source commit is separately configured/bound.

The envelope is non-sensitive aggregate only. Customer/member/order/payment/inventory/media/message/content details do not cross this boundary. Unknown counters remain null. This source may report process heartbeat/restart observations but cannot claim a Windows host boot.

No telemetry response authorizes a product change, publication, message, financial action, restart, recovery or export. Missing enrollment returns NOT_ENROLLED/HOLD. Coordination issue: #970.
