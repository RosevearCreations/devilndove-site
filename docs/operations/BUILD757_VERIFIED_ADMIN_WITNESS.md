# Build 757 — operator acceptance and non-automatic audit renewal

Build 757 corrects two original Admin Users issues: temporary /api/auth/me errors no longer clear an HttpOnly-only session, and the user directory does not issue the initial request until the server verifies an Admin identity. The existing 12-second directory timeout and sign-in link remain available.

## Production verification (requires a genuinely authorized Admin)
1. Open the current production site in a fresh Firefox window and navigate to /admin/users/.
2. Confirm the session-check message appears until /api/auth/me returns a verified Admin identity. The directory must not read /api/admin/users for cached-only or degraded identity.
3. Sign in using the existing Admin account. The directory should appear, or display a bounded error and Refresh Users rather than hang.
4. With the developer network panel open, interrupt /api/auth/me once; confirm there is no involuntary logout from a network-only failure. A real 401/403 must still reject the session.
5. From /admin/storefront-acceptance/, open the existing Build 756 continuity section. Revalidate an original accepted Build 755 receipt and compare the original Build 754 source versions and order/case/SLA/retention evidence with the current release. Do not accept stale evidence.
6. First verified Admin manually opens a current-production-SHA renewal; a distinct verified Admin must independently confirm the same digest and source versions. Without both, certification remains HOLD.
7. Verify the Cloudflare Pages production deployment identifies the precise merged main SHA. Confirm live production API readback separately from GitHub CI; a passing CI fixture never represents real Cloudflare D1 witness evidence.

No synthetic human witness, customer communication, Resend write, retention purge, migration or private evidence export is authorized by this build.

## Release criteria
Review the PR to dev; require all existing branch-protection checks, source/quality/I.T. tests, Build 757 regression and genuine Cloudflare Development deployment to pass. Then propose the exact merged dev tree to main, require production checks and Cloudflare Pages source SHA/live readback before designating production GREEN. The two-person original field certificate remains HOLD until genuine independently authenticated actions occur.
