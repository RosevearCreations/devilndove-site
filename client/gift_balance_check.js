import { getCurrentCustomerSession } from "../_lib/customer-session.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:"Server configuration is incomplete." },500));
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.email) return withCors(json({ error:"Unauthorized." },401));
    const body = await request.json().catch(() => ({}));
    const code = String(body.code || '').trim();
    if (!code) return withCors(json({ error:"Gift code is required." },400));
    const email = String(current.customer_profile.email || '').trim().toLowerCase();
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json" };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,code,sku,type,status,remaining_cents,face_value_cents,expires_at,currency,purchaser_email,recipient_email,package_code,vehicle_size&code=eq.${encodeURIComponent(code)}&limit=1`, { headers });
    if (!res.ok) return withCors(json({ error:`Could not load gift certificate. ${await res.text()}` },500));
    const rows = await res.json().catch(() => []);
    const row = Array.isArray(rows) ? rows[0] || null : null;
    if (!row) return withCors(json({ error:"Gift certificate not found." },404));
    const allowed = [String(row.purchaser_email || '').toLowerCase(), String(row.recipient_email || '').toLowerCase()].includes(email);
    if (!allowed) return withCors(json({ error:"This gift certificate is not on your account." },403));
    return withCors(json({ ok:true, gift_certificate: row }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
