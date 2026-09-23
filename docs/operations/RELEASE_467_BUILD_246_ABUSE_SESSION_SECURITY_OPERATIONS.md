# Release 467 Build 246 — Abuse Resistance, Session Control & Security Operations

Build 246 starts from exact Build 245 Development head `b4eeed8895a8a04247b68a626c9018caadd8c9ad` and tree `8ac58d89c62750e7d266ad849a3ac23fdcabf7e9`, promoted to Production main `2312b35c5d527721219c48985325eeba8f3ecd3f`.

## Scope

- bound login attempts to 8 per 15-minute client+identity window using ephemeral Cloudflare Cache counters;
- bound authenticated password-change attempts to 6 per 15-minute client+user window;
- preserve the existing privacy-safe account-recovery authority at 3 requests/contact email/hour and 6/IP/hour;
- expose accurate active, expired, expiring-soon and stale-expired session facts;
- add an explicit member **Revoke Other Sessions** control that keeps the current session;
- require password step-up for Admin session cleanup and record the cleanup in existing admin audit evidence;
- make the Admin security summary compatible with cookie-first sessions and report current security controls and cleanup needs;
- never return or log password values, session tokens, throttle fingerprints or account-existence recovery facts.

The Cloudflare Cache abuse counter fails open on a platform cache outage so legitimate users are not permanently locked out by a security-control dependency. Existing authentication, D1 session authority and account-recovery records remain unchanged.

## Safety

No schema change, request-time DDL, R2 mutation, provider execution/publication, Product publication, Inventory movement or Finance posting is introduced.

Next authorized release: **Build 247 — Non-Product Visual Coverage & Media Placement Closure**.
