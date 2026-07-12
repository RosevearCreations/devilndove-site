// Build 212 — safe OAuth callback readiness handler.
// This endpoint intentionally does not exchange codes until the provider-specific
// start route, encrypted state store, token encryption, and refresh lifecycle are enabled.

const PROVIDERS = {
  meta: { label: 'Meta', secrets: ['META_APP_ID', 'META_APP_SECRET'] },
  facebook: { label: 'Facebook', secrets: ['META_APP_ID', 'META_APP_SECRET'] },
  instagram: { label: 'Instagram', secrets: ['META_APP_ID', 'META_APP_SECRET'] },
  pinterest: { label: 'Pinterest', secrets: ['PINTEREST_APP_ID', 'PINTEREST_APP_SECRET'] },
  x: { label: 'X', secrets: ['X_CLIENT_ID', 'X_CLIENT_SECRET'] },
  tiktok: { label: 'TikTok', secrets: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'] },
  youtube: { label: 'YouTube', secrets: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'] }
};

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function htmlResponse(title, body, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)} | Devil n Dove</title><style>body{margin:0;background:#0b0f16;color:#eef2f7;font:16px/1.55 system-ui,sans-serif}.shell{max-width:760px;margin:0 auto;padding:32px 18px}.card{background:#111925;border:1px solid #334155;border-radius:18px;padding:24px}a{color:#f2c66d}.code{font-family:ui-monospace,monospace;overflow-wrap:anywhere;background:#080c12;padding:10px;border-radius:9px}</style></head><body><main class="shell"><section class="card"><h1>${escapeHtml(title)}</h1>${body}<p><a href="/admin/social-publishing/">Return to Social Publishing</a></p></section></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } });
}

export function createOAuthCallback(providerKey) {
  return async function onRequestGet(context) {
    const provider = PROVIDERS[providerKey];
    if (!provider) return htmlResponse('Unsupported OAuth provider', '<p>The requested provider is not configured.</p>', 404);
    const url = new URL(context.request.url);
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description') || url.searchParams.get('error_reason');
    const hasCode = Boolean(url.searchParams.get('code'));
    const hasState = Boolean(url.searchParams.get('state'));
    const credentialsPresent = provider.secrets.every((name) => Boolean(String(context.env?.[name] || '').trim()));

    if (error) {
      return htmlResponse(`${provider.label} connection was not completed`, `<p>The provider returned an authorization error.</p><p class="code">${escapeHtml(error)}${errorDescription ? ` — ${escapeHtml(errorDescription)}` : ''}</p><p>No access token was stored and nothing was published.</p>`, 400);
    }

    if (hasCode) {
      if (!hasState) {
        return htmlResponse(`${provider.label} connection was rejected safely`, '<p>An authorization code returned without the required state value. The request was stopped to protect against cross-site request forgery.</p><p>No access token was stored and nothing was published.</p>', 400);
      }
      return htmlResponse(`${provider.label} callback received`, `<p>The provider returned an authorization response, but Build 212 will not exchange or store it until the secure provider-specific start route, one-time state record, encrypted token storage, refresh handling, and disconnect control are enabled.</p><p class="code">Credentials configured: ${credentialsPresent ? 'yes' : 'no'}</p><p>No access token was stored and nothing was published.</p>`, 501);
    }

    return htmlResponse(`${provider.label} OAuth callback is available`, `<p>This exact HTTPS callback route is deployed and can be entered in the ${escapeHtml(provider.label)} developer dashboard.</p><p class="code">${escapeHtml(url.origin + url.pathname)}</p><p>Credential presence: ${credentialsPresent ? 'configured' : 'not configured yet'}.</p><p>This readiness page does not connect an account or publish content.</p>`);
  };
}
