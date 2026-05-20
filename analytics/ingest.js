import { loadFeatureFlags } from "../_lib/app-settings.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!env?.SUPABASE_URL || !env?.SUPABASE_SERVICE_ROLE_KEY) {
      return withCors(json({ error: "Server configuration is incomplete." }, 500));
    }
    const flags = await loadFeatureFlags(env).catch(() => ({}));
    if (flags?.analytics_tracking_enabled === false) {
      return withCors(json({ ok: true, skipped: true, reason: 'analytics disabled' }));
    }
    const body = await request.json().catch(() => ({}));
    const visitor_id = clean(body.visitor_id, 128);
    const session_id = clean(body.session_id, 128);
    const event_type = clean(body.event_type, 80) || 'page_view';
    const page_path = normalizePath(body.page_path || '/');
    const page_title = clean(body.page_title, 200);
    const referrer = clean(body.referrer, 1000);
    const country = clean(body.country, 80) || request.headers.get('cf-ipcountry') || null;
    const ip_address = request.headers.get('cf-connecting-ip') || null;
    const user_agent = request.headers.get('user-agent') || null;
    const locale = clean(body.locale, 40);
    const timezone = clean(body.timezone, 80);
    const screen = clean(body.screen, 40);
    const source = clean(body.source, 80);
    const campaign = clean(body.campaign, 120);
    const checkout_state = clean(body.checkout_state, 40);
    const basePayload = sanitizePayload(body.payload || {});
    const cf = request.cf || {};
    const payload = sanitizePayload({
      ...basePayload,
      city: clean(cf.city, 120),
      region: clean(cf.region, 120),
      region_code: clean(cf.regionCode, 32),
      postal_code: clean(cf.postalCode, 40),
      metro_code: clean(cf.metroCode, 32),
      timezone: clean(cf.timezone, 80) || timezone,
      latitude: clean(cf.latitude, 40),
      longitude: clean(cf.longitude, 40),
      colo: clean(cf.colo, 32),
      client_tcp_rtt: clean(cf.clientTcpRtt, 32),
      request_priority: clean(request.headers.get('priority'), 64),
      method: clean(request.method, 16),
      device_type: classifyDeviceType(user_agent)
    });
    if (!visitor_id || !session_id) return withCors(json({ error: 'visitor_id and session_id are required.' }, 400));
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/site_activity_events`, {
      method: 'POST',
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        visitor_id, session_id, event_type, page_path, page_title, referrer, country, ip_address, user_agent,
        locale, timezone, screen, source, campaign, checkout_state, payload, created_at: new Date().toISOString()
      }])
    });
    if (!res.ok) return withCors(json({ error: `Could not save analytics event. ${await res.text()}` }, 500));
    return withCors(json({ ok: true }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}
export async function onRequestGet() { return withCors(json({ ok: false, error: 'Method not allowed.' }, 405)); }
function serviceHeaders(env){return {apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Prefer:'return=minimal'};}
function clean(v,n=255){const s=String(v??'').trim();return s?s.slice(0,n):null;}
function normalizePath(p){const s=String(p||'/').trim();if(!s)return '/';return s.startsWith('/')?s.slice(0,255):`/${s.slice(0,254)}`;}
function sanitizePayload(payload){if(!payload||typeof payload!=='object'||Array.isArray(payload))return {};const out={};for(const[k,v]of Object.entries(payload).slice(0,40)){const key=String(k).slice(0,80);if(v==null)out[key]=null;else if(['string','number','boolean'].includes(typeof v))out[key]=typeof v==='string'?v.slice(0,500):v;}return out;}
function classifyDeviceType(userAgent){const ua=String(userAgent||'').toLowerCase();if(/mobile|iphone|ipod|android(?!.*tablet)/.test(ua)) return 'mobile';if(/ipad|tablet|kindle|silk|playbook/.test(ua)) return 'tablet';return 'desktop';}
function json(data,status=200){return new Response(JSON.stringify(data,null,2),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});} 
function corsHeaders(){return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Cache-Control':'no-store'};}
function withCors(response){const headers=new Headers(response.headers||{});for(const[k,v]of Object.entries(corsHeaders()))headers.set(k,v);return new Response(response.body,{status:response.status,statusText:response.statusText,headers});}
