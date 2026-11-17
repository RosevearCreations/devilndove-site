# Build 731 — Original privacy automation health, delivery evidence and key rotation assurance

## Source boundaries
The protected Admin GET `/api/admin/production-variable-audit-406?review=731` is read-only. It independently reads original D1 versioned consent withdrawal queues, signed Admin and service ACK receipts, latest scheduler heartbeat, original retry state and latest/historical encrypted ciphertext version key references.

**SLA:** 15-minute configured cron means a 30-minute heartbeat-freshness tolerance; missing and failed ticks HOLD. Pending withdrawn-consent events older than 24 hours warn, older than seven days critical; dead letters and expired leases alert. The default operator response reviews up to 100 oldest events and explicitly reports whether total queue size permits full-queue certification; no false exhaustive claim.

**Delivery:** an original signed receipt is not remote erasure. Contradictory Admin/service ACKs, target mismatch, source consent not withdrawn, or missing verified signature flag hold source evidence. No outside removal, publication recall, Master physical activation, historical data deletion or external ACK is inferred.

**Rotation:** latest ciphertext versions referencing previous key IDs indicate an incomplete current-version rotation. Even if all latest versions reference the active key, *historical ciphertext* may retain old-key references; rotation completion is separately labeled, and old-key retirement is never automatically authorized. Active keyring absent, missing D1 or invalid key counts HOLD. No automatic decrypt/re-encrypt, key deletion, secret replacement, or Cloudflare token provisioning.

## Required release gates
1. Build 730 main `a698320428934cff97690d4927862183a09c79de` is the successful Pages/Production D1 source baseline. The Worker is **not deployed** because existing Cloudflare tokens were denied `workers/scripts/.../secrets` access; issue #951 requires a dedicated scoped Workers deployment token.
2. Build 731 exact-head Current Application Quality, System Gate, I.T. Admin Runtime and Branch Hygiene must succeed. Any source budget change needs actual measured failure and justified small review.
3. Normal protected `dev` -> `main` promotion, same-main-SHA Pages Production D1/readback, independent live-integrity proof, and separate Worker original script/cron deployment must be observed.
4. Do not claim complete Build 731 Production GREEN while the Worker remains inaccessible. Its service stays disabled by default; real Master peer enrollment is independently gated.
