# Devil n Dove Build 758 — Original Production Browser Acceptance, Verified Audit Certificate Readback & Independent Release Closure

Build 758 adds a click-only, read-only browser readback to the existing **Storefront Acceptance** Admin page. A release is not a human field certificate. Nothing here sends customer mail, writes providers, mutates D1, changes access, creates a certificate, exports private evidence, or deletes retention data.

## Owner acceptance — exact original production browser

1. Confirm Build 758 is deployed from **main**. In Cloudflare Pages, select project **devilndove-site**, Production, and compare the deployed full commit SHA with GitHub main. The GitHub checks must include Production Pages Deploy and Cloudflare Pages as successful.
2. Open **https://devilndove.com/admin/storefront-acceptance/** in Firefox, sign in with an authorized Storefront Admin account. Expand section **17. Build 758 — live release and private audit readback**.
3. Click **Verify live production source**. It reads only the public same-origin \`/release-version.json\` marker, requiring \`branch=main\`, a full 40-character SHA and production workflow-run ID. Verify it matches current **main**. An invalid or unreachable marker gives HOLD.
4. In the preceding **section 16**, click **Load original cross-release witnesses**. Select a genuine Build 755 accepted source and **Revalidate selected original certificate**. Missing original acceptance must remain HOLD; do not create synthetic evidence.
5. In section 17, click **Read selected original private certificate**. It issues one authorized, no-cache, same-origin **GET** to the existing continuity756 API for that selected task and exception. It checks production SHA, older original source fingerprint, SHA-256 digest, original Order/case/SLA/retention freshness, the no-automatic-renewal boundary, and the distinct-Admin renewal decision returned by the private D1 API.
6. When the source or two independent original Admin renewal receipts are absent, the UI must say **HOLD**, not GREEN. If both real approvals already exist and all source gates match, the UI can state **PRIVATE D1 CONTINUITY RECORDED** and display the release SHA and digest. This is server readback, not a certification that two physical people actually attended.
7. A new main SHA changes the source binding; repeat all original reviews for the new release. Do not reuse a prior release's certificate. For an actual field acceptance, the first verified Admin must open renewal in section 16 and a **different** verified Admin must independently confirm identical current evidence. These are original human actions, not automation tasks.

## Release gates

- Merge reviewed changes into **dev**, require source/quality/I.T. and Build 758 regression checks plus Cloudflare Development success for the exact dev head.
- Merge the protected exact dev code into **main** only after successful checks. Verify Cloudflare Production deploy, live custom-domain \`/release-version.json\` equals exact merged main SHA, and public/admin smoke checks.
- Production application code can be **GREEN** while independent field/human audit closure stays **HOLD**. Never turn a CI fixture or GET readback into a signed human field receipt.

## Technical boundaries

No schema migration, private JSON export, customer/provider transaction, unattended POST, new credentials, browser storage, or silent background polling. 12-second bounded same-origin GET requests only, with no-cache and redirect refusal. Readback errors remain visible and fail closed.
