
import { serviceHeaders } from "../_lib/customer-session.js";
import { issueCustomerAuthToken, sendCustomerAuthEmail } from "../_lib/customer-auth-tokens.js";

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    if (!email) return withCors(json({ error:'Valid email is required.' }, 400));
    const customer = await loadCustomerByEmail(env, email);
    if (!customer || customer.is_active !== true) return withCors(json({ ok:true, message:'If that email exists, a verification link has been sent.' }));
    if (customer.email_verified_at) return withCors(json({ ok:true, message:'This email is already verified.' }));
    const issued = await issueCustomerAuthToken({ env, customerProfileId: customer.id, purpose:'email_verification', expiresMinutes: 24*60, payload:{ email } });
    const dispatch = await sendCustomerAuthEmail({ env, request, customer, purpose:'email_verification', rawToken: issued.rawToken }).catch((err) => ({ ok:false, error: err?.message || 'Dispatch failed.' }));
    return withCors(json({ ok:true, message:'If that email exists, a verification link has been sent.', delivery: { ok: dispatch?.ok === true, provider: dispatch?.provider || null } }));
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500)); }
}
async function loadCustomerByEmail(env,email){const res=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,email,full_name,phone,is_active,email_verified_at&email=eq.${encodeURIComponent(email)}&limit=1`,{headers:serviceHeaders(env)}); if(!res.ok) throw new Error(`Could not load customer profile. ${await res.text()}`); const rows=await res.json().catch(()=>[]); return Array.isArray(rows)?rows[0]||null:null;}
function cleanEmail(v){const s=String(v||'').trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:null;}
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});} 
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h});}
