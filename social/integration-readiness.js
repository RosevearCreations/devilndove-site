// Build 212 — public, secret-safe integration prerequisite manifest.
export async function onRequestGet(context) {
  const origin = new URL(context.request.url).origin;
  const data = {
    ok: true,
    build: 'Build 212',
    publishing_enabled_by_this_endpoint: false,
    public_documents: {
      privacy: `${origin}/privacy/`,
      terms: `${origin}/terms/`,
      data_deletion: `${origin}/data-deletion/`,
      social_connections: `${origin}/social-connections/`
    },
    callbacks: {
      meta: `${origin}/api/social/oauth/meta/callback`,
      facebook: `${origin}/api/social/oauth/facebook/callback`,
      instagram: `${origin}/api/social/oauth/instagram/callback`,
      pinterest: `${origin}/api/social/oauth/pinterest/callback`,
      x: `${origin}/api/social/oauth/x/callback`,
      tiktok: `${origin}/api/social/oauth/tiktok/callback`,
      youtube: `${origin}/api/social/oauth/youtube/callback`
    },
    meta_data_deletion_callback: `${origin}/api/social/meta/data-deletion`,
    pinterest_domain_verification_meta_present: true,
    oauth_exchange_status: 'not_enabled_until_state_storage_token_encryption_refresh_and_disconnect_are_complete'
  };
  return new Response(JSON.stringify(data, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
