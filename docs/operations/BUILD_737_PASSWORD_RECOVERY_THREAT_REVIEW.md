# Devil n Dove Build 737 — Password Recovery Threat Model and Abuse-Resistance Review

## Owner-authorized scope and starting authority
Starting protected dev/main baseline: Build 736 exact SHA \`6abdc81dacc0c75cbb34074d684ee1820fd05242\`. Build 737 is a bounded security hardening and original-source regression release: it does not enroll new external receivers, send unsolicited mail, modify a real customer credential, create a new D1 schema, or activate a scheduled privacy worker. Build 736's actual owner-inbox confirmation remains separately operator-gated.

## Threat model and mitigations
| Threat / test | Original source guard | Build 737 verification / honest limitation |
| --- | --- | --- |
| Parallel requests for one email from many IPs | One atomic D1 INSERT … SELECT, per-action identity SHA-256 quota 3/hour | 18 simultaneous competing SQLite writers must admit exactly three; simulates the original SQL, not independent live D1 load |
| One source IP rotates identities to flood mail | Per-action source-IP SHA-256 quota 12/hour | 24 unique identities sharing one IP admit only 12; note carrier-grade NAT may cause temporary shared-IP throttling |
| Caller spoofs X-Forwarded-For to evade quota | Original Cloudflare CF-Connecting-IP source | Removed untrusted X-Forwarded-For fallback; absent trusted platform header shares a conservative "unknown" quota; Cloudflare edge integrity remains an external configuration dependency |
| Expired, undelivered or previously spent token | Original token SELECT requires sent_at, unclaimed token, > now and active account | Original SELECT replayed against canonical D1 SQLite; all invalid cases denied, with 30-minute link policy unchanged |
| Same reset link redeemed twice | Atomic D1 claim and password update requires matching one-time claim_id | Original claim SQL changes exactly once; second claim zero, existing sessions deleted, other outstanding tokens invalidated |
| An attacker intentionally exhausts a shared IP | Append-only 1-hour per-action windows, no permanent account lock | Older-than-one-hour source receipts cease to count. A real NAT may still have temporary lockouts; review customer support fallback rather than bypassing limits |
| Cross-site, malformed, oversized requests | Same-origin / Fetch Metadata policy, body cap, whitelisted actions | Added explicit null/array JSON rejection; in-process route tests exercise malicious Origin and Sec-Fetch-Site and missing D1 |
| User or account existence disclosure | Generic reset request / reminder response; registered-email-only dispatch | No public per-address presence result; external timing, bounce, inbox and provider observability still require owner-supervised review |
| Credential compromise after legitimate reset | Salted password-hash utility, all sessions deleted, other reset tokens invalidated | Original SQL state transitions tested; this is not a live password-change acceptance ceremony |

## Release checks
- No new canonical migration. Existing \`0056\` remains the token and abuse receipt source; \`0057\` remains the owner inbox pilot source.
- \`scripts/build737_recovery_threat_model_gate.py\` extracts original production SQL (not a handwritten quota approximation), tests synthetic parallelism, expiry, replay, session removal, sibling-token invalidation and one-hour recovery on ephemeral SQLite.
- \`scripts/build737_recovery_endpoint_contract.mjs\` exercises the actual request handler for malformed JSON, cross-origin rejection and fail-closed missing DB.
- These tests run in \`.github/workflows/current-application-quality.yml\`, with existing Builds 734–736 tests and the independent four Development / Production acceptance gates unchanged.
- This is a threat-model review and source-level regression, **not** a live penetration test or external-provider deliverability certification. No actual user credentials, production DB reads/writes or live email messages are part of the test scripts.

## Remaining external gates / operator action
1. Independently confirm protected dev exact-head four workflows (including canonical Development Preview), then protected main exact-tree promotion and Production Cloudflare Pages, live-resource integrity, and original privacy Worker disabled / genuine cron readback.
2. Review owner consent and actual inbox-code confirmation from Build 736; Resend provider acceptance alone never proves inbox delivery, and customer recovery delivery is still a distinct unverified lane.
3. Inspect Cloudflare IP-header trust and real-world NAT/shared-network false positives, D1 rate/latency metrics, Resend suppression/bounces and support experience under consented, supervised test conditions. A source test PASS alone must not be called real-world attack resistance.
4. Keep \`DND730_AUTOMATION_ENABLED=false\`; no automatic privacy dispatch, customer password change, auto-email campaigns, Master receiver enrollment or provider authorizations.
5. Successor proposed **Build 738 — Forgot Account Support Queue & Identity Review**. Future proposed builds: 18 (738–755), not a count of all remaining work.

Evidence: \`functions/api/auth/recovery-734.js\`, \`migrations/canonical/0056_release467_auth_recovery_privacy_sender_custody.sql\`, \`scripts/build735_atomic_abuse_d1_gate.py\`, \`scripts/build737_recovery_threat_model_gate.py\`, \`scripts/build737_recovery_endpoint_contract.mjs\`, \`docs/architecture/NEXT_20_BUILDS.md\`.
