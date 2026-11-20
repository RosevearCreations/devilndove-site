# Devil n Dove Build 740 — Owner-Gated Privacy Sender Activation Ceremony

## Verified source baseline
Starting protected Production main is 7eed00be1decc01ba78f7e1f23dfb0865e774330 (Build 739). Build 740 is an owner-gated PRE-FLIGHT, not permission to turn on the privacy sender. Software Production GREEN is separate from actual independently witnessed original receiver and owner approval.

## Implemented security improvements
1. The scheduled Worker requires BOTH DND730_AUTOMATION_ENABLED=true and separate DND740_OWNER_ACTIVATION_CONFIRMED=true, exact DND740_APPROVED_SCOPE=CONSENT_WITHDRAWAL_ONLY, and syntactically valid DND740_INDEPENDENT_WITNESS_SHA256. These are extra kill switches, not independently verifiable approval evidence. Both environments remain explicitly OFF and scope NONE.
2. Before D1 retry initialization, event leasing or HTTP, the Worker checks all THREE original Master peer configs and their recent signed D1 source proofs. Original proof rows must have matching pinned key/enrollment receipt, observed_live_response=1, signature_verified=1 and age <= 7 days. Missing or stale proof fails closed before D1 mutation. The previous Worker had not checked both stored signed-proof flags.
3. New verified-Admin privacy-sender-ceremony-740 API reuses original Build 739 source review, returns 6 acceptance gates, original peer status and next required evidence. No secrets, customer identities, or contact data are returned.
4. An Admin can explicitly prepare a non-binding review packet using same-origin POST, exact permitted scope, explicit checkbox and reason code. The endpoint refuses any activate operation or request-supplied proof assertion; it never stores an authorization, updates passwords, changes keys, sends messages, enrolls a Master or alters the Worker.
5. The I.T. screen provides manual original-source status and review packet preparation, clearly warning that no activation is performed. Actual recipient and observer acceptance remains HOLD.

## Missing independent acceptance
- Independent original key/receiver owner enrollment for AI Data Platform, Rosevear AI Hub and Rosevear Comms Hub. Existing local signed D1 rows are not physical remote receiver ownership evidence.
- Three original live one-use signed receiver acknowledgements and replay/nonce rejection.
- Separate original owner and witness decision and trustworthy stored custody, not a self-asserted checkbox or fake signature.
- Verified consent scope and a supervised one-event test after approval, including original D1/Cloudflare/receiver receipts and explicit rollback.
- Genuine original Windows host Sysop reboot/telemetry proof; no remote reboot is requested or performed.
- Build 736 real owner inbox-code and ordinary-user recovery email delivery remains a separate HOLD lane.

## Quality and production checks
- scripts/build740_privacy_sender_ceremony_contract.mjs runs actual API/Worker denial tests, verifies all six HOLDs, same-origin checks, missing D1, forbidden activate, synthetic input refusal, absence of D1 writes and network requests, and dual disabled Worker flags.
- Current Application Quality includes the new suite alongside original Builds 730 and 734-739 suites.
- Privacy Worker Production Follow-up independently checks both Worker environment defaults remain OFF/scope NONE. The production chain must still pass exact-Dev System/Quality/I.T./Hygiene, protected exact-tree main, original Pages, live-resource and disabled Worker/cron readback.
- No schema migration and no real external sender or key enrollment.

## Completion and successor
Meaningful targeted safety improvement in the privacy sender readiness controls, but no artificial increase in overall 53-axis ~41% full-business completion without external acceptance. Next proposed Build 741 — Signed Withdrawal Retry & Dead-Letter Operations. 15 future proposed builds, 741 through 755.

Evidence: https://github.com/RosevearCreations/devilndove-site/issues/978
