# Release 467 Build 244 — CSRF / Origin Protection for Mutating Routes

Build 244 starts from exact Build 243 Development head `146b588a0ad060d8b68914440eef485d32d2bd35` and shared tree `909ac24bfd97b4ed2a20b004db8d3e4cf73b914a`, promoted to Production main `c725b19e6dd9c051e8efb552abab734ff0532894`.

## Scope

Build 244 adds explicit same-origin protection for state-changing browser requests in the cookie-first session model.

- POST, PUT, PATCH and DELETE requests under `/api/` are evaluated by one shared guard;
- a browser `Origin` must exactly match the request origin;
- `Referer` is used as a same-origin fallback;
- Fetch Metadata rejects browser `cross-site` and unproven `same-site` mutations when Origin/Referer are absent;
- existing non-browser Bearer automation remains compatible;
- headerless API/diagnostic clients remain compatible;
- Stripe and PayPal webhooks plus the Meta data-deletion callback stay on their separately validated provider callback/signature paths;
- the guard does not replace provider-signature verification.

## Safety

Build 244 adds no schema change, request-time DDL, D1/R2 business-data mutation, provider execution/publication, Product publication, Inventory movement or Finance posting.

## Acceptance

Build 244 is accepted only when:
1. Build 243 exact Development + Production closure is ingested;
2. all browser state-changing `/api/` requests pass through the shared origin guard before route/module bypass logic;
3. mismatched Origin/Referer and cross-site Fetch Metadata fail closed with HTTP 403;
4. same-origin browser requests remain allowed;
5. deliberate Bearer and headerless non-browser API clients remain compatible;
6. provider callback exemptions are explicit and remain on separate signature validation;
7. System, Application Quality, I.T. Runtime, Repository Branch Hygiene and Build 244 dedicated gates are GREEN on the exact Development head.

Next authorized release: **Build 245 — CSP & Browser Injection-Surface Hardening**.
