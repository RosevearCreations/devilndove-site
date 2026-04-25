
import { consumeCustomerAuthToken } from "../_lib/customer-auth-tokens.js";
import { serviceHeaders } from "../_lib/customer-session.js";

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
async function handle(context){
  const { request, env } = context;
  try {
    const url = new URL(request.url);
    const body = request.method === 'POST' ? await request.json().catch(() => ({})) : {};
    const token = String(body.token || url.searchParams.get('token') || '').trim();
    if (!token) return withCors(json({ error:'Verification token is required.' }, 400));
    const tokenRow = await consumeCustomerAuthToken({ env, rawToken: token, purpose:'email_verification' });
    if (!tokenRow?.customer_profile?.id) return withCors(json({ error:'Verification link is invalid or expired.' }, 400));
    const customer = tokenRow.customer_profile;
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(customer.id)}`, { method:'PATCH', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body: JSON.stringify({ email_verified_at: new Date().toISOString() }) });
    if (!patchRes.ok) throw new Error(`Could not verify email. ${await patchRes.text()}`);
    return withCors(json({ ok:true, message:'Email verified successfully.' }));
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500)); }
}
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});} 
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
