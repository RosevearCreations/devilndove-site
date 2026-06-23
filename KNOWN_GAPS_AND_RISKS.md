# Known Gaps and Risks — Build 193

Canonical direction: read `PROJECT_STATUS_AND_ROADMAP.md` first. Use `LIVE_TESTING_GUIDE.md` for exact live test steps. Historical logs remain under `docs/archive/`.

## Highest risk until tested live

1. Cloudflare D1/R2/payment/email provider behaviour needs deployed evidence.
2. `PRODUCT_MEDIA_BUCKET` must be an R2 binding, not an encrypted variable.
3. R2 multipart upload needs real phone/Wi-Fi interruption testing.
4. A derivative queue is not a real image worker; WebP/AVIF generation must still be deployed and verified.
5. Stripe webhook secrets and email provider keys must never be logged or copied into evidence.
6. Customer-contact automation remains disabled until opt-in/permission/cooldown controls are reviewed.

## Business-data limits

7. Fee settings are intentionally unknown until actual account-specific rates are entered.
8. Product-family defaults do not replace product-specific costing for one-off/custom work.
9. Margin overrides must stay temporary, reviewed, reasoned, and audited.
10. Search Console/GBP observations require accurate real-world data and cannot promise ranking results.

## Content and privacy limits

11. Real photos need ownership or appropriate consent.
12. Public proof requires consent/public-use approval and accurate wording.
13. Browser reloads cannot restore image bytes; users must reselect the same file to resume multipart uploads.
14. Customer duplicate candidates require human review; shared household/gift cases may be separate people.

## Documentation rule

The two canonical files are `PROJECT_STATUS_AND_ROADMAP.md` and `AI_HANDOFF.md`. `MARKDOWN_INDEX.md` identifies supporting references; do not create another general roadmap file.

## Build 194 alignment

Build 194 note: placeholders are intentionally still present until real images have consent, descriptive alt text, compression, role assignment, and device/performance review. Product Quick Facts remain hidden until an admin profile is approved.
