export async function onRequestGet({ env }) {
  const k = env.STRIPE_SECRET_KEY || "";
  const mode = k.startsWith("sk_test_") ? "test"
            : k.startsWith("sk_live_") ? "live"
            : "missing/unknown";
  return new Response(JSON.stringify({ ok: true, stripe_key_mode: mode }), {
    headers: { "content-type": "application/json" },
  });
}
