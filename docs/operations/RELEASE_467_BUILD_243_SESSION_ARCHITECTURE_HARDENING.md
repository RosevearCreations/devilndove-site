# Release 467 Build 243 — Session Architecture Hardening

Build 243 starts from exact Build 242 Development head `5977a1aa9674eb378d5aede0b31648a73ac770c6` and shared tree `3ea103b093c4dcbf1670346dcce0ec6acf214470`, promoted to Production main `ae9ca2b48700f4b48e6eb7e6bb465f0472d5e41f`.

## Scope

Build 243 migrates normal browser authentication toward a cookie-first session architecture.

- the server-issued `dd_auth_token` remains HttpOnly and SameSite=Lax;
- browser JavaScript no longer stores or reads the session secret from localStorage or a script-readable cookie;
- normal same-origin API calls no longer synthesize an Authorization Bearer header from browser state;
- login, registration and bootstrap responses no longer return bearer-equivalent session material in JSON;
- browser login success is established from the returned user identity plus the HttpOnly cookie set by the server;
- existing server-side Bearer parsing remains available for non-browser automation/diagnostic compatibility;
- session expiry remains server-controlled and is exposed only as non-secret metadata;
- session rotation remains server-managed and can be strengthened later without returning the secret to JavaScript.

## Compatibility

The member/Admin UI keeps a cached non-secret user identity only as a provisional display hint. Server-side `/api/auth/me` remains the authentication authority. Existing D1 session rows and compatibility token columns are not migrated or rewritten in this build.

## Safety

Build 243 adds no schema change, request-time DDL, D1/R2 business-data mutation, provider execution/publication, Product publication, Inventory movement or Finance posting. No session secret is logged or returned in browser JSON.

## Acceptance

Build 243 is accepted only when:
1. Build 242 exact Development + Production closure is ingested;
2. browser auth helpers do not read/write bearer-equivalent session tokens;
3. browser API calls use same-origin credentials without bearer synthesis;
4. login/register/bootstrap JSON omits the session secret while still setting the HttpOnly cookie;
5. server Bearer compatibility remains available for existing non-browser automation;
6. member/Admin auth flows retain server verification and expiry metadata;
7. System, Application Quality, I.T. Runtime, Repository Branch Hygiene and Build 243 dedicated gates are GREEN on the exact Development head.

Next authorized release: **Build 244 — CSRF / Origin Protection for Mutating Routes**.
