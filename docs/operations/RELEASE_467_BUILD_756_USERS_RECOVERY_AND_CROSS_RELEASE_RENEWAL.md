# Build 756 — Users & Security Recovery and Genuine Cross-Release Certificate Renewal

## 1. What Build 756 fixes automatically

The **Users & Security** page previously could display a heading and blank cards when an HttpOnly Admin session cookie existed but its JavaScript-side cached profile was absent. The legacy scripts stopped before the server verified the session. Build 756 lets that page ask the canonical \`/api/auth/me\` endpoint to recover the identity, registers the Admin-ready listeners before a cached profile is required, and provides an explicit 12-second user-list timeout, retry button and visible sign-in recovery instructions. Actual access and user mutations remain secured by the server.

No Windows server restart, Git command, Cloudflare manual redeployment or customer data input is required to apply the deployed code.

## 2. Exact steps if the Users link still appears blank

1. **After the Build 756 production workflow is GREEN**, open Firefox on the normal desktop computer.
2. Press **Ctrl+Shift+R** once to force Firefox to reload the latest page assets.
3. Open **https://devilndove.com/admin/users/** directly. No extra tracking query is needed.
4. If the Admin session is valid, the **User Directory** should load, followed by the **Create User** and **Security Overview** panels. The page may briefly say **Checking the Users & Security session**.
5. If we see **Sign in again**, click it. It opens **https://devilndove.com/login/?next=%2Fadmin%2Fusers%2F**. Enter our existing Devil n Dove Admin email/password and submit **Login**. Do not create a replacement account.
6. Back on **Users & Security**, click **Refresh Users**. If the API has not answered in 12 seconds, the page will display a timeout rather than remain on a blank loader. **No user record was changed**.
7. If it still fails, copy only the **visible error message**, plus the Firefox date/time of the attempt, into the chat. **Do not share passwords, cookies, tokens, customer profiles, or account data.** A screenshot with personal customer names or email addresses should be cropped or redacted first.
8. If the page works, no additional action is required for the Users & Security repair.

## 3. Real two-Admin Build 756 cross-release field acceptance

This step is **not required for deployment**, and is only possible when a genuine older Build 755 audit is already accepted. It **cannot** be performed by one Admin signing in twice, and the system does not generate synthetic customer records, emails or sign-offs.

1. Admin A opens **https://devilndove.com/login/** and signs in with their own active account.
2. Admin A opens **https://devilndove.com/admin/storefront-acceptance/** and scrolls to **Section 16 — Cross-release original production witness continuity & independent renewal**.
3. Admin A clicks **Load original cross-release witnesses**. If there is no genuine original accepted Build 755 certificate, the list says so and this procedure **stops** with status HOLD.
4. Admin A selects the original certificate and clicks **Revalidate selected original certificate**. Read the historical accepted SHA, the current production SHA, the original SHA-256 digest, and the verified/hold status. If original evidence changed, stop and record HOLD.
5. If the status says **AWAITING_FIRST_RENEWAL_ADMIN**, Admin A enters a factual **20–350-character** note without any names, email bodies or account information, then clicks **First Admin: open current-release renewal**.
6. An **independent, authorized second person** signs in to Devil n Dove using their *own distinct Admin account* and an independent browser session. They open the same Section 16, load the original certificate, select it, and click **Revalidate selected original certificate**.
7. Admin B must read the unchanged original and current SHA values, witness reference and digest. If the evidence matches and status is **AWAITING_SECOND_RENEWAL_ADMIN**, Admin B enters a different factual 20–350-character note and clicks **Second Admin: independently renew certificate**.
8. Both Admins can re-open Section 16 and revalidate the same case. Only **CURRENT_RELEASE_CERTIFICATE_RENEWED** shows two genuine Admin receipts for the matching *current* production SHA. Any HOLD or stale digest means this review is **not** accepted.
9. The **Build 755 Section 15 private JSON evidence export** remains available for previous source-only historical audit evidence. Keep any downloaded file private. Build 756 is a *new* custody certificate, not proof of statutory retention compliance or the identity of an email's author.

## 4. Key limitations

- A successful Cloudflare deploy establishes the **software release**, not that two real people have signed an original case.
- Source fingerprint drift, changed Order/case/version, or source binding failure must remain HOLD.
- Build 756 does not send customer emails, write to Resend, delete retention data, create Admin accounts, invent original transactions, or override legal holds.
- User & Security account access or live case acceptance on the actual signed-in browser requires authorized owner use; automated GitHub tests cannot substitute for these original human actions.

## Verification links

- [Users & Security](https://devilndove.com/admin/users/)
- [Storefront Acceptance](https://devilndove.com/admin/storefront-acceptance/)
- [Devil n Dove GitHub Actions](https://github.com/RosevearCreations/devilndove-site/actions)
