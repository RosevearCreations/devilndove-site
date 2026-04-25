import { createCustomerSession, appendSetCookie, serviceHeaders } from "../_lib/customer-session.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error: "Server configuration is incomplete." }, 500));
    const body = await request.json().catch(() => ({}));
    const payload = normalizeSignup(body);
    if (!payload.ok) return withCors(json({ error: payload.error }, 400));

    const existing = await findCustomerByEmail(env, payload.email);
    if (existing) return withCors(json({ error: "An account with that email already exists." }, 409));

    const password_hash = await makePasswordHash(payload.password, payload.hash_mode);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles`, {
      method: "POST",
      headers: { ...serviceHeaders(env), Prefer: "return=representation" },
      body: JSON.stringify([{
        email: payload.email,
        full_name: payload.full_name,
        phone: payload.phone,
        tier_code: payload.tier_code || "bronze",
        notes: payload.notes,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        city: payload.city,
        province: payload.province,
        postal_code: payload.postal_code,
        vehicle_notes: payload.vehicle_notes,
        notification_opt_in: payload.notification_opt_in,
        notification_channel: payload.notification_channel,
        detailer_chat_opt_in: payload.detailer_chat_opt_in,
        is_active: true,
        password_hash
      }])
    });
    if (!res.ok) throw new Error(`Could not create client account. ${await res.text()}`);

    const rows = await res.json().catch(() => []);
    const profile = Array.isArray(rows) ? rows[0] || null : null;
    if (!profile?.id) throw new Error("Client account was created without a usable profile id.");

    const session = await createCustomerSession({ env, customerProfile: profile, request });
    let headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    headers = appendSetCookie(headers, session.cookie);
    headers = applyCors(headers);
    return new Response(JSON.stringify({ ok: true, message: "Client account created.", customer: formatCustomer(profile) }, null, 2), { status: 200, headers });
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

function normalizeSignup(body) {
  const email = cleanEmail(body.email);
  const full_name = cleanText(body.full_name);
  const password = String(body.password || "");
  if (!email) return { ok: false, error: "Valid email is required." };
  if (!full_name) return { ok: false, error: "Full name is required." };
  const valid = validatePassword(password); if (!valid.ok) return valid;
  return {
    ok: true,
    email, full_name, password,
    hash_mode: normalizeHashMode(body.hash_mode),
    phone: cleanText(body.phone),
    tier_code: cleanText(body.tier_code) || "bronze",
    notes: cleanText(body.notes),
    address_line1: cleanText(body.address_line1),
    address_line2: cleanText(body.address_line2),
    city: cleanText(body.city),
    province: cleanText(body.province),
    postal_code: cleanText(body.postal_code),
    vehicle_notes: cleanText(body.vehicle_notes),
    notification_opt_in: toBoolean(body.notification_opt_in),
    notification_channel: normalizeNotificationChannel(body.notification_channel),
    detailer_chat_opt_in: toBoolean(body.detailer_chat_opt_in ?? true)
  };
}

async function findCustomerByEmail(env, email) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,email&email=eq.${encodeURIComponent(email)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not verify client email. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}
async function makePasswordHash(password, requestedMode) { if (requestedMode === "bcrypt") { const bcrypt = await loadBcrypt(); if (bcrypt) { const salt = await bcrypt.genSalt(12); return bcrypt.hash(password, salt); } } return `sha256:${await sha256Hex(password)}`; }
async function loadBcrypt() { try { const mod = await import("bcryptjs"); return mod.default || mod; } catch { return null; } }
async function sha256Hex(input) { const data = new TextEncoder().encode(String(input||"")); const hash = await crypto.subtle.digest("SHA-256", data); return [...new Uint8Array(hash)].map((b)=>b.toString(16).padStart(2,"0")).join(""); }
function validatePassword(password){ if(!password) return {ok:false,error:"Password is required."}; if(password.length<8) return {ok:false,error:"Password must be at least 8 characters long."}; if(password.length>200) return {ok:false,error:"Password is too long."}; return {ok:true}; }
function normalizeHashMode(value){ const s=String(value||"").trim().toLowerCase(); return s === "sha256" ? "sha256" : "bcrypt"; }
function formatCustomer(row){ return { id: row.id||null, email: row.email||null, full_name: row.full_name||null, phone: row.phone||null, tier_code: row.tier_code||null, address_line1: row.address_line1||null, address_line2: row.address_line2||null, city: row.city||null, province: row.province||null, postal_code: row.postal_code||null, vehicle_notes: row.vehicle_notes||null, notification_opt_in: row.notification_opt_in===true, notification_channel: row.notification_channel||'email', detailer_chat_opt_in: row.detailer_chat_opt_in!==false }; }
function cleanText(v){ const s=String(v??"").trim(); return s||null; }
function cleanEmail(v){ const s=String(v||"").trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:null; }
function toBoolean(v){ if(typeof v === 'boolean') return v; const s=String(v||"").trim().toLowerCase(); return s==='true'||s==='1'||s==='yes'||s==='on'; }
function normalizeNotificationChannel(v){ const s=String(v||"").trim().toLowerCase(); return ['email','sms','none'].includes(s)?s:'email'; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
