# Devil n Dove Build 731 — release custody

Build 731 application code was merged with PR #953 at main SHA `6e45d3b1119030d529219778957b98ad80ef3670`.
Successful original four Development runs: System Gate 44002113675, Current Application Quality 44002113664, I.T. Admin Runtime 44002113698, Branch Hygiene 44002113659.
Successful same-SHA Production Cloudflare Pages 44002400045 and independent live resource proof 44002528646.

**Scheduled privacy Worker: HOLD.** Production follow-up #44002528761 failed because the named Actions secret `CLOUDFLARE_WORKERS_API_TOKEN` is not yet provisioned. It did not prove a script or 15-minute cron on Cloudflare. Earlier both existing tokens were confirmed denied Workers scripts deploy access. Owner action in issue #951 is required. Never claim the worker is running, original Master receiver acknowledgements are real, outside deletion occurred, or old encryption keys can retire.

The Build 731 post-release corrective workflow on Development keeps the proven primary Cloudflare D1 reader and requires the separate Workers token for deploy/cron, with a fail-closed missing-secret message. Keep it behind exact-head four Development checks and protected main promotion, and distinguish Pages GREEN from whole privacy automation GREEN.
