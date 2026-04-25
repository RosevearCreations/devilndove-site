
import { consumeCustomerAuthToken } from "../_lib/customer-auth-tokens.js";
import { serviceHeaders, createCustomerSession, appendSetCookie } from "../_lib/customer-session.js";

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    const password = String(body.password || '');
    const valid = validatePassword(password); if (!valid.ok) return withCors(json({ error: valid.error }, 400));
    if (!token) return withCors(json({ error:'Reset token is required.' }, 400));
    const tokenRow = await consumeCustomerAuthToken({ env, rawToken: token, purpose:'password_reset' });
    if (!tokenRow?.customer_profile?.id) return withCors(json({ error:'Reset link is invalid or expired.' }, 400));
    const customer = tokenRow.customer_profile;
    const password_hash = await makePasswordHash(password, 'bcrypt');
    const patchRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?id=eq.${encodeURIComponent(customer.id)}`, { method:'PATCH', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body: JSON.stringify({ password_hash, updated_at: new Date().toISOString() }) });
    if (!patchRes.ok) throw new Error(`Could not update password. ${await patchRes.text()}`);
    const rows = await patchRes.json().catch(() => []);
    const profile = Array.isArray(rows) ? rows[0] || customer : customer;
    const session = await createCustomerSession({ env, customerProfile: profile, request });
    let headers = new Headers({ 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store' });
    headers = appendSetCookie(headers, session.cookie);
    headers = applyCors(headers);
    return new Response(JSON.stringify({ ok:true, message:'Password reset successful.', customer: formatCustomer(profile) }, null, 2), { status:200, headers });
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500)); }
}
async function makePasswordHash(password, requestedMode) { if (requestedMode === 'bcrypt') { const bcrypt = await loadBcrypt(); if (bcrypt) { const salt = await bcrypt.genSalt(12); return bcrypt.hash(password, salt); } } return `sha256:${await sha256Hex(password)}`; }
async function loadBcrypt() { try { const mod = await import('bcryptjs'); return mod.default || mod; } catch { return null; } }
async function sha256Hex(input) { const data = new TextEncoder().encode(String(input||'')); const hash = await crypto.subtle.digest('SHA-256', data); return [...new Uint8Array(hash)].map((b)=>b.toString(16).padStart(2,'0')).join(''); }
function validatePassword(password){ if(!password) return {ok:false,error:'Password is required.'}; if(password.length<8) return {ok:false,error:'Password must be at least 8 characters long.'}; if(password.length>200) return {ok:false,error:'Password is too long.'}; return {ok:true}; }
function formatCustomer(row){ return { id: row.id||null, email: row.email||null, full_name: row.full_name||null, phone: row.phone||null, tier_code: row.tier_code||null }; }
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});} 
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function applyCors(headers){const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out;}
function withCors(response){return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})});}
