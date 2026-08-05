# Build 212 Validation — Social Platform Prerequisites

## Added public pages
- `/privacy/` and exact `/privacy.html`
- `/terms/` and exact `/terms.html`
- `/data-deletion/` and exact `/data-deletion.html`
- `/social-connections/` and exact `/social-connections.html`

## Added exact callback endpoints
- `/api/social/oauth/meta/callback`
- `/api/social/oauth/facebook/callback`
- `/api/social/oauth/instagram/callback`
- `/api/social/oauth/pinterest/callback`
- `/api/social/oauth/x/callback`
- `/api/social/oauth/tiktok/callback`
- `/api/social/oauth/youtube/callback`
- `/api/social/meta/data-deletion`
- `/api/social/integration-readiness`

## Safety contract
The callback routes prove the exact HTTPS endpoint exists and safely report provider errors. They do not exchange authorization codes until the related start route, one-time state storage, encrypted token persistence, expiry/refresh handling, and disconnect/revoke controls are implemented. A callback receiving a code without state rejects it. No route publishes content.

## Pinterest verification
The exact tag below is present once in every HTML `<head>`:

```html
<meta name="p:domain_verify" content="416962017515ec25302304e522b8bd8a"/>
```

## Deployment tests
1. Open each public policy URL and confirm it returns HTTP 200 without requiring login.
2. Open each OAuth callback URL without query parameters and confirm the readiness page names the correct provider.
3. Open `/api/social/integration-readiness` and confirm all production URLs use `https://devilndove.com` when tested on the custom domain.
4. Confirm the Pinterest verification tag is in the deployed home-page source, not only the rendered DOM.
5. Do not start a live OAuth authorization until the provider-specific start/state/token lifecycle is completed.
6. Test the public pages at 360px, 390px, 768px, and desktop widths.
