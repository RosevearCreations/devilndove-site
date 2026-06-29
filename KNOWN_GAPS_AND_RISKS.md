# Known Gaps and Risks — Build 197

Read `PROJECT_STATUS_AND_ROADMAP.md` for the current prioritized list. This retained pointer lists only active release risks:

- Build 197 has not fixed the live site until the D1 migration and Pages deployment are completed and smoke-tested.
- A degraded 200 admin dashboard response is safer than a 503 but still signals that optional data/schema should be reviewed.
- Real cost, fee, labour, packaging, overhead, and waste figures remain owner-entered facts.
- R2 derivatives, Stripe/email/webhook delivery, Search Console/GBP inputs, and device screenshots need live evidence.
- Only explicit image row removal deletes product-image records. Source R2 files are intentionally not automatically deleted because they may be reused.
- Historic documents remain retained; the two canonical files control current direction.
