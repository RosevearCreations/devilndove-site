# Release 467 Build 253 — Session & Abuse-Control Runtime Evidence

Build 253 starts from exact Build 252 Development head `ec749569908b2ebbf393ca1ec2181e586a10f548` and Production main `3c14d72ed481035d82f3cffa2d16f733f603f1d9`, sharing tree `bc93b89d4b649d035e4dc5cb0f9deeb9d01399e2`.

## Scope

This release exercises the existing post-hardening authentication controls without changing their runtime policy:

- cookie-first session resolution with Bearer compatibility retained for non-browser automation;
- same-origin mutation acceptance and cross-origin browser mutation rejection;
- bounded authentication throttling with a 429 + Retry-After response after budget exhaustion;
- revoke-other-sessions behavior while preserving the authenticated current session;
- admin step-up rejection when password confirmation is absent and success when confirmation is valid;
- explicit checks that session tokens, password values and throttle fingerprints are not emitted by the evidence harness.

## Evidence mode

The acceptance harness uses synthetic in-memory Cloudflare Cache and D1-compatible mocks. It does not call Production, use real credentials, mutate real D1/R2 data, invoke providers, publish Products, move Inventory or post Finance entries.

The dedicated gate runs the bounded Node runtime harness and also retains the Build 243 cookie-first session, Build 244 CSRF/origin and Build 246 abuse/session-control source contracts.

## Promotion boundary

Build 253 remains blocked from Production until the exact candidate passes the full pull-request matrix, the merged `dev` head is externally GREEN, and the identical verified Development tree is promoted to protected `main`.

Next authorized release: **Build 254 — Operator Journey Friction Review**.

Future queue exhausted: **false**.

## Current-surface identity

Current Reliability, Deployment Preflight and I.T. operator surfaces identify Release 467 Build 253 while retaining Build 252 as the exact verified Production predecessor.
