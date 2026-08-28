# I.T. Preflight / Startup Release Guide — Build 446

This is the operator authority for technical release issues. Business feature direction belongs in `PROJECT_STATUS_AND_ROADMAP.md`; current technical HOLDs are recorded there and surfaced in `/admin/it-platform/`.

## Startup sequence

1. Confirm `development-release.json` and `dev` are the intended Development source.
2. Confirm target is `devilndove-site-dev`, never separate live `devilndove-site`.
3. Run the active Build 446 system gate.
4. Use `/api/admin/infrastructure-readiness` or the I.T. page to check D1/R2 bindings and schema state read-only.
5. If a retained guarded migration is reported as genuinely missing, use its Development-only recovery runner; otherwise do not run SQL.
6. Review runtime incidents, public API health, route usage, schema drift and cache/service-worker identity.
7. Review each current HOLD and its exact pass condition.
8. Deploy only the exact green `dev` head to Development and perform bounded live acceptance.
9. Keep separate live Production promotion closed unless explicitly authorized.

## Repository/recovery authority

Git history is the archive. `database_full_schema.sql` is the aggregate fresh-install schema. Only Build 440 Product/Inventory/Tool recovery plus carried Build 442 I.T. and Build 443 carousel recovery remain standalone because current gates/recovery still consume them. Build 446 adds no D1 migration.

## Current technical HOLDs

- Carousel schema/live acceptance where readiness reports missing authority.
- I.T. explicit user-grant schema/enforcement where readiness reports missing authority.
- Stripe Development end-to-end acceptance.
- PayPal sandbox end-to-end acceptance.
- CAIP private R2 delivery/range/timecode/storage evidence.
- Separate live Production promotion.

Stop a release when the exact deployed commit is unknown, schema authority is uncertain, a required binding is absent, failures return false success/raw HTML, a destructive action cannot be bounded/reversed, or any command could contact separate live Production unintentionally.
