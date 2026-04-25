import { getCurrentCustomerSession, touchCustomerSession, rotateCustomerSession, appendSetCookie } from "../_lib/customer-session.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }

async function handle(context){
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:"Server configuration is incomplete." },500));
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:"Unauthorized." },401));
    await touchCustomerSession({ env, sessionId: current.session?.id || null, request });
    let rotatedCookie = null;
    if (current.needs_rotation === true) {
      const rotated = await rotateCustomerSession({ env, request, currentSession: current.session, customerProfile: current.customer_profile });
      rotatedCookie = rotated.cookie || null;
    }
    const headers = serviceHeaders(env);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=*&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&order=display_order.asc,created_at.desc`, { headers });
    if (!res.ok) return withCors(json({ error:`Could not load vehicles. ${await res.text()}` },500));
    const rows = await res.json().catch(() => []);
    let headersOut = new Headers({ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
    if (rotatedCookie) headersOut = appendSetCookie(headersOut, rotatedCookie);
    headersOut = applyCors(headersOut);
    return new Response(JSON.stringify({ ok:true, vehicles:Array.isArray(rows)?rows:[] }, null, 2), { status:200, headers: headersOut });
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function serviceHeaders(env){ return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json" }; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
