# Devil n Dove Build 738 — Forgot Account Support Queue & Identity Review

## Scope and security boundary
- The existing customer account-help page posts a generic forgot-email staff request to `/api/auth/account-help-request`. This is **not** a credential recovery shortcut.
- Build 738 hardens the original public account-help submission with bounded validated data, same-origin browser checks, an atomic one-statement original D1 rate ceiling (3/contact-address/hour and 6/platform-client-IP/hour), and generic unenumerating public results.
- The staff queue reads original `auth_recovery_requests` records via verified Admin middleware, not untrusted self-declared role headers. List view shows **masked** contact address, case number, type and timestamps. An authenticated Admin must select a case to read the original submitted text privately.
- New protected `/admin/account-help-review/` screen supports only two auditable manual transitions: `open → reviewed`, `reviewed → closed`. Each transition is source-state guarded and records a same-transaction original `admin_action_audit` receipt with a non-PII reason code.
- `closed` means staff triage finished, NOT identity proof, a match to a registered account, alternate email authority, successful live recovery, customer satisfaction, or independently accepted service-level agreement.
- There is no account search, credential change, session deletion, identity doc upload, automatic customer email, direct private-mail dispatch, new Master source grant, or automated privacy Worker action in this build.
- This build does not change the canonical D1 stream. It relies on existing live `auth_recovery_requests` and `admin_action_audit` tables. Original production schema availability must be verified in the final runtime proof; a source test alone does not establish live support intake acceptance.

## Evidence and regressions
- `scripts/build738_account_help_sqlite_gate.py` extracts **actual source SQL** and tests the original table schema against concurrent contacts, unique-email IP spraying, expiry of hourly quota, state transitions, and atomic audit rows in ephemeral SQLite.
- `scripts/build738_account_help_contract.mjs` imports the actual request handlers: denies non-admin list and decisions, CSRF, invalid case actions, alternate email delivery, missing D1, and shows private-case detail vs masked list. No network/email.
- `.github/workflows/current-application-quality.yml` requires these scripts plus syntax checks and previously implemented Build 734–737 suites.
- Check all exact Development gates, canonical Preview, exact Production main SHA Cloudflare Pages, independent live resource integrity and disabled privacy Worker/cron. Green applies only to software deployment and recorded checks.

## Actual outstanding acceptance (not silently authorized)
1. Build 736 private consenting owner inbox-code confirmation, then one separately consented ordinary customer-owned reset session, provider-issued and true inbox-delivery receipts (Resend acceptance alone is not delivery).
2. Original Stripe/PayPal payment/refund/chargeback settlement acceptance and owner-reviewed financial reconciliation (no live payment or refund initiated by Build 738).
3. Original seven-app Sysop telemetry read-only source acceptance coordinated with AI Data Platform Build 423, Comms QL-474 and AI Hub; real signer public pins and limited transport identity must be independently enrolled off GitHub. **Never claim seven apps CONNECTED without original signed receiver acknowledgments.**
4. Advertising provider account, campaign scope, budgets, legal rights, billing account, verification and explicit owner spend authorization. Etsy remains paused; other social providers HOLD; no ad spending by this build.

## Completion policy
The past scores in the owner-supplied 26-category table were example figures and are not evidence of operational readiness. The source-of-truth reassessment must use actual source/CI evidence, distinguish functional source implementation from real-provider acceptance, and show each category separately. An isolated security/triage build cannot truthfully claim +5 to +10 percentage points across the full application. Future builds should be scoped to deliver meaningful 5–10 point improvements to their **targeted feature group**, with whole-app score changes reported only when substantiated.

## Successor
Next proposed **Build 739 — Original Three-Master Peer Enrollment Pilot**. Owner consent and signer/receiver enrollment remain separate external acceptance gates.
