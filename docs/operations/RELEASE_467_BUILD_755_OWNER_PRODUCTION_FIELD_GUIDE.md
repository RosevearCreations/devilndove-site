# Build 755 — owner checklist for original field acceptance and private audit export

**Release and human evidence are different gates.** The protected \`dev\` → \`main\` software deployment can be GREEN after GitHub and Cloudflare confirm exact source. This does **not** imply a customer reply, original two-human sign-off, retention closure, legal compliance or deletion authority. The application refuses to create those facts without original evidence.

## Where

- Live sign-in: https://devilndove.com/login/
- Signed-in Storefront Acceptance Desk: https://devilndove.com/admin/storefront-acceptance/
- Sections on the Acceptance Desk: **11 (Build 751), 12 (Build 752), 13 (Build 753), 14 (Build 754), 15 (Build 755)**.
- Use the live **devilndove.com** hostname, not a Cloudflare preview or local copy.
- Keep private audit exports away from public social posts, GitHub, emails and storefront uploads.

## When does an owner need to do anything?

**Only after Build 755 production deployment is GREEN**, and only to accept a **genuine existing production customer-care exception**. No owner action is needed to deploy the code. The original field witness and export cannot be completed by a simulated Admin or a synthetic customer record.

## Requirements before accepting a real case

1. Have an existing real original Build 749 customer-care task tied to a canonical Order and original Build 746 case.
2. Have a real original Build 753 SLA exception recorded and independently reviewed. If no original task/exceptions are present, stop. Empty dashboards and HOLD are correct, not failures.
3. Have **two distinct, active Storefront Admin user accounts**. A single person repeatedly logging into the same account does not meet independent Admin review. The second reviewer must be an authorized real person with their own account and must inspect the evidence independently. Do not share passwords or sessions.
4. The production marker must display a 40-character \`main\` SHA. Missing/invalid marker = HOLD. Do not bypass the origin check.
5. For **internal retention-review closure only**, additionally require the original approved Build 751 plan, completed Build 751 retention check, original Build 752 due-review acknowledgement **and** separate Admin confirmation, and no active legal hold/custody escalation. This is an internal operational review, **not** a legal retention determination.

## Exact click-by-click procedure

1. **Admin A — sign in:** In Firefox, open https://devilndove.com/login/ and sign in using the first authorized Admin's own credentials. Open https://devilndove.com/admin/storefront-acceptance/.
2. **Confirm genuine source:** Scroll to **Section 11 / Build 751**, choose **Load private SLA and retention dashboard**, and inspect the original task/order. A provider thread is only verified when genuine read-only Resend metadata and an independent Admin review exist. Do not create synthetic customer replies.
3. **Build 753 escalation:** Scroll to **Section 13**. Click **Load private SLA exceptions**. Select the original exception. If it is not already raised, Admin A enters a factual nonpersonal note of **20–350 characters** and clicks **Record private escalation**. Admin B must sign in with their **own** account, reopen Section 13, load and inspect the exact exception, and click **Independent Admin review**. Select a HOLD decision instead of PASS if the original evidence is insufficient.
4. **Build 754 first witness:** Admin A opens **Section 14** and clicks **Inspect original production certification**. Verify the production SHA is shown. Choose the original exception and enter a factual 20–350-character note; click **First Admin: record original production source**. Write down the private receipt UUID only if needed for internal reference. Do not copy email bodies.
5. **Build 754 second witness:** Admin B signs in with their separate Admin account (preferably a separate Firefox private window/session), opens the same signed-in Acceptance Desk, clicks **Inspect original production certification**, selects the same original exception, reads the same production SHA and first receipt, enters their independent factual note and clicks **Second Admin: independently certify**. The server refuses the same Admin account or changed source revisions. Do not retry blindly after an uncertain save; reload the private receipts first.
6. **Optional internal retention closure:** Only after the original approved retention review is finished, two-Admin review is recorded, and any legal hold/custody escalation is legitimately resolved, return to **Section 14**, select that original retention exception, and click **Record completed internal retention review**. If the application says HOLD, **stop** and inspect the missing original evidence rather than creating a replacement.
7. **Build 755 revalidation:** Admin A opens **Section 15**, clicks **Read original private acceptance evidence**, chooses the original case, then clicks **Revalidate selected original case**. Read the displayed original field, provider, retention and audit status. A verified original field source is required before either Build 755 Admin approval action.
8. **First independent audit:** Admin A enters a new factual nonpersonal note (20–350 characters) and clicks **First Admin: record independent audit**. The private original SHA-256 digest is bound to this audit receipt. The UI reloads the original source.
9. **Second independent audit:** Admin B independently logs into the live site with their own credentials, opens **Section 15**, clicks **Read original private acceptance evidence**, selects the same case, then **Revalidate selected original case**. Compare the SHA-256 digest to Admin A's saved receipt. Enter their own factual note and click **Second Admin: accept identical original evidence**. If the source or digest drifted, the server refuses the acceptance.
10. **Download private audit evidence:** While still authenticated, select the case and click **Revalidate selected original case**, then **Export selected private SHA-256 JSON audit**. The browser saves \`devilndove-build755-private-audit-<task-id>.json\` to its usual Downloads location (or asks where to save). Keep it in a secure local evidence folder, do not publish it. The export contains original source identifiers, immutable receipt references and source status, not customer emails or message bodies.
11. **Confirm final original field status:** In Section 15, revalidate the same original case. **TWO_ADMIN_SOURCE_AUDIT_ACCEPTED** means two independent verified original Admin actions are recorded against the unchanged source hash. If the status is **HOLD**, **AWAITING_FIRST_AUDITOR**, or **AWAITING_INDEPENDENT_ADMIN**, do not call the field ceremony complete.

## What to do when HOLD appears

- **No original cases:** there is nothing legitimate to certify; leave the field acceptance pending.
- **One Admin account only:** a distinct human Admin account must be authorized through the site's existing Admin identity process. Do not create an extra account just to pretend it is an independent reviewer.
- **Production source marker missing:** check production deployment status in https://github.com/RosevearCreations/devilndove-site/actions and keep field acceptance on HOLD.
- **Provider readback missing:** the 48-hour SLA exception may be factual, but genuine customer-reply verification remains HOLD. Do not claim an email was received.
- **Legal hold, stale Order/case, version drift or SHA mismatch:** stop; the application will not close retention or certify the stale evidence.
- **Save timed out:** reload the Section 15 original receipt list before trying again; the prior write may already exist.

**Privacy:** Do not enter customer names, email addresses, payment details, shipping addresses, email bodies or secrets into evidence notes. No external notification, customer contact, provider write, purge or statutory retention approval is performed by Build 755.
