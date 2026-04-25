import { createCustomerSession, appendSetCookie, serviceHeaders } from "../_lib/customer-session.js";

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY ) return withCors(json({ error: "Server configuration is incomplete." }, 500));
    const body = await request.json().catch(() => ({}));
    const email = cleanEmail(body.email);
    const password = String(body.password || "");
    if (!email) return withCors(json({ error: "Valid email is required." }, 400));
    if (!password) return withCors(json({ error: "Password is required." }, 400));
    const customer = await loadCustomerByEmail(env, email);
    if (!customer || customer.is_active !== true) return withCors(json({ error: "Invalid email or password." }, 401));
    if (!customer.password_hash) return withCors(json({ error: "This client account cannot sign in yet." }, 403));
    const ok = await verifyPassword(password, customer.password_hash);
    if (!ok) return withCors(json({ error: "Invalid email or password." }, 401));
    const session = await createCustomerSession({ env, customerProfile: customer, request });
    let headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    headers = appendSetCookie(headers, session.cookie);
    headers = applyCors(headers);
    return new Response(JSON.stringify({ ok: true, message: "Signed in.", customer: formatCustomer(customer) }, null, 2), { status: 200, headers });
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

async function loadCustomerByEmail(env, email) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=id,email,full_name,phone,tier_code,notes,address_line1,address_line2,city,province,postal_code,vehicle_notes,is_active,password_hash&email=eq.${encodeURIComponent(email)}&limit=1`, { headers: serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load client account. ${await res.text()}`);
  const rows = await res.json().catch(() => []);
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function verifyPassword(password, storedHash) {
  const value = String(storedHash || "");
  if (value.startsWith("sha256:")) return safeEqual(await sha256Hex(password), value.slice(7));
  if (/^\$2[aby]\$\d{2}\$/.test(value)) {
    const bcrypt = await loadBcrypt();
    if (!bcrypt) throw new Error("Password hash uses bcrypt but bcryptjs is unavailable.");
    return !!(await bcrypt.compare(password, value));
  }
  if (value.startsWith("plain:")) return safeEqual(password, value.slice(6));
  return false;
}

async function loadBcrypt() { try { const mod = await import("bcryptjs"); return mod.default || mod; } catch { return null; } }
async function sha256Hex(input) { const data = new TextEncoder().encode(String(input||"")); const hash = await crypto.subtle.digest("SHA-256", data); return [...new Uint8Array(hash)].map((b)=>b.toString(16).padStart(2,"0")).join(""); }
function safeEqual(a,b){ const x=String(a||""); const y=String(b||""); if(x.length!==y.length) return false; let out=0; for(let i=0;i<x.length;i++) out|=x.charCodeAt(i)^y.charCodeAt(i); return out===0; }
function formatCustomer(row){ return { id: row.id||null, email: row.email||null, full_name: row.full_name||null, phone: row.phone||null, tier_code: row.tier_code||null, address_line1: row.address_line1||null, address_line2: row.address_line2||null, city: row.city||null, province: row.province||null, postal_code: row.postal_code||null, vehicle_notes: row.vehicle_notes||null }; }
function cleanEmail(v){ const s=String(v||"").trim().toLowerCase(); return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)?s:null; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
