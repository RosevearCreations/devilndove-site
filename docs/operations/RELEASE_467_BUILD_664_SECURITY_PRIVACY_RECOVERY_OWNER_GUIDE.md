# Devil n Dove Build 664 — Security, Privacy, Tenant Isolation, Backup & Recovery Verification

**Source:** `RosevearCreations/devilndove-site`, owned-business shell `devilndove`.
**Owner route:** `/admin/operations/` → Security Overview, using existing authenticated `/api/admin/security-summary` GET.
**Purpose:** preserve the original account, session, customer, workshop and media authorities while adding repeatable source-negative tests and honest recovery readiness. A source-code PASS or **Production GREEN** does not independently attest that backups exist, were restored, that real worker/customer devices passed, or that the Master Shell is CONNECTED.

## What Build 664 verifies in software

| Axis | Repeatable evidence | Real-world acceptance |
| --- | --- | --- |
| Authentication | An anonymous user, non-admin worker, inactive user and expired session cannot read the security summary; active Admin can read only aggregate counts. `DD_DB` fallback and fail-closed `503` are checked. | **HOLD** — separate genuine user roles, device/session tests and source screenshots are still required. |
| Privacy | Security API sends private/no-store headers, excludes other users' identities, passwords, tokens and query errors; source redaction is tested. No new export or provider integration. | **HOLD** — original owner privacy/retention audit, consent and field verification. |
| Tenant/shell boundary | Existing QL-336 source gate denies child-header impersonation and non-GET methods. Unapproved QL-364 TEST remains held. | **HOLD** — Devil n Dove is an *owned-business shell*, not a certified multi-tenant storefront. No cross-tenant or cross-app access grant. |
| Recovery safety | Existing recovery probe accepts only approved HTTPS asset hosts; Build 664 additionally denies embedded credentials, query strings, fragments and alternate ports. | **HOLD** — `HEAD` object existence is not a verified restore. No automatic incident closure or restored data is claimed by Build 664. |
| Backup and restore | Admin Security Overview explicitly reports `UNKNOWN_NO_ORIGINAL_RECEIPT` and `HOLD_NO_INDEPENDENT_RESTORE`. | **NO_WITNESSED_RESTORE** — original owner-controlled D1/R2 snapshot and independent isolated restore still missing. |
| Master Shell | Source owns its users/customer records. AI Data master monitors approved evidence; Comms master handles separately authorized incident routes. | **DISCONNECTED / HOLD** — unchanged original signer, consent, manifest and signed TEST requirements. |

The Security Overview's reported cookie/CSP/throttle controls are **code-declared**, not complete live-device compliance findings. The summary is available only after an authenticated Admin session and returns `Cache-Control: private, no-store`; database errors return a generic failure, never SQL or stored values. A site or build CI check does not transform UNKNOWN into VERIFIED.

## Independent owner backup/recovery acceptance — do this only in a protected setup

1. **Inventory actual authority:** identify the production D1 database, R2 buckets used for product and private CAIP media, responsible owner account, and separate recovery/test environment. Never paste an access token, employee/customer record, password, recovery key or full private object URL into ChatGPT or a GitHub issue.
2. **Record original backup proof:** backup/snapshot ID, timestamp and source, immutable object-count/size and digest where available, retention policy, encrypted custody and independently confirmed retrieval. An unsourced dashboard label, build artifact, or source manifest is not a backup receipt.
3. **Perform an owner-approved isolated restore drill:** restore a representative D1 snapshot to a disposable staging database and representative R2 object versions to a private staging location. Do not overwrite live D1, live media, production environment bindings or real accounts. Record exact schema and record counts, object SHA-256/digest checks, no customer data spill, role/tenant negative test, and elapsed recovery time. Do not declare success from `HEAD` alone.
4. **Independent witness and owner review:** have the second authorized owner independently inspect the original receipts and staging acceptance. Record tester, verifier, source/target, snapshot revision, restoration start/finish, failure conditions, evidence location and signed owner decision through the approved private process. Measure RPO/RTO from real evidence, not assumptions.
5. **Only then update operational status** via an authorized future workflow. If any original is absent, expired or differs, leave backup/restore acceptance **HOLD**. The Build 664 Security Overview cannot write proof, run a restore, or set Master Shell CONNECTED.

## Privacy and role/tenant field matrix

| Identity/device | Expected negative or limited result | Owner evidence |
| --- | --- | --- |
| Anonymous / expired session | `401` on Admin security GET | Real separate browser/device request, no token sharing |
| Worker or customer role | `401` on Admin security GET; no Admin controls | Distinct real account role, mobile/tablet, and session freshness |
| Active owner Admin | Bounded aggregate user/session counts, no other-user PII or secrets | Signed-in Admin review on desktop and tablet |
| Forged child/tenant shell header | `403` from QL-336 source handler | Original isolated source request and logged deny receipt |
| Unsigned private Comms TEST | `503` HOLD; no receipt or receiver activation | Independently approved QL-364/QL-404 original signer and one-use signed receipt |
| Cross-application customer/business access | **Not granted** by source shell identity | Separate owner consent and true negative access proof; do not infer from CI |

## Automated checks and release procedure

Run from the repository:

```bash
node --check functions/api/admin/security-summary.js
node --check functions/api/admin/_operationalRecovery.js
node --check public/js/admin-security-summary.js
node --test scripts/release467_build664_security_privacy_tenant_recovery.test.mjs
python scripts/release465_performance_budget_gate.py
```

Build 664's focused test suite is included in the protected `.github/workflows/current-application-quality.yml` quality job. Promote the feature to `dev`, wait for the complete development release gates, then promote `dev` to `main` and require the Cloudflare Pages and `prove-live-resources` production checks. Record exact commit SHA. **Production GREEN verifies the software release only.**

## Next build

**665 — Etsy, Meta, Social Publishing & Advertising Readiness.** Provider account authority, channel credentials, consent and live writes remain separately gated; do not unpause Etsy or activate Meta/social publication from a software readiness check.
