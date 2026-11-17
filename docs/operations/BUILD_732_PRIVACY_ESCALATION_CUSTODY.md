# Build 732 — Privacy escalation and original source custody

Build 732 adds an Admin-only, on-demand `?review=732` readback, with no external messages or new schema. Original D1 is the authority. It uses original withdrawal outbox, independently recorded manual/service signed-ACK receipts, retry state, privacy scheduler receipts and ciphertext version key references.

## Assurance
- Per-Master summary (AI Data Platform, Rosevear AI Hub, Rosevear Comms Hub) of 24-hour/7-day SLA breach, dead-letter, expired lease, source consent, signed ACK mismatch and queue-boundedness. Unexpected targets fail closed.
- Recovery requires two valid original D1 run receipts and a fresh heartbeat with coherent event/held/signed counts. A fresh D1 tick is **not** proof of independently deployed Cloudflare Worker or original peer availability.
- The signed receipt is original local evidence only. No remote deletion, legal consent compliance or physically active Master receiver is inferred; source-reported peer enrollment is not a substitute for independent live possession proof.
- Key custody separates current versions from historical old-key references; it does **not** decrypt or re-encrypt ciphertext, validate key retirement, perform Cloudflare secret updates or purge data.
- Bounded first 100 original withdrawal events. If there are more than 100 source events, all cross-application compliance claims are expressly HOLD.
- The Admin UI is manually refreshed, not a scheduler and cannot trigger a remote send.

## Release gates
Build 731 main baseline `b4629b2d7075ee0bdd2c3ee354cb8841703b8b2f` was successfully deployed to Pages and independently verified. However, the Cloudflare Worker remains blocked due to missing `CLOUDFLARE_WORKERS_API_TOKEN`, owner issue [#951](https://github.com/RosevearCreations/devilndove-site/issues/951). Without that scoped Cloudflare token, **complete Build 732 automation Production GREEN cannot be certified**, even if Pages and D1 are successful.

Mandatory original exact-head System Gate, Current Application Quality, I.T. Admin Runtime, Branch Hygiene, protected dev/main merge, Cloudflare Production Pages and independent live-resource proof. Worker requires real original script and cron readback using valid credentials. Leave `DND730_AUTOMATION_ENABLED=false` until separately owner-authorized and actual Master signer enrollment is proven. Do not synthesize a signed ACK, live remote erasure or encryption rotation.
