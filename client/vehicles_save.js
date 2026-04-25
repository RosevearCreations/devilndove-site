import { getCurrentCustomerSession } from "../_lib/customer-session.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:"Server configuration is incomplete." },500));
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:"Unauthorized." },401));
    const body = await request.json().catch(() => ({}));
    const vehicle_id = String(body.vehicle_id || '').trim() || null;
    const payload = normalize(body, current.customer_profile.id);
    const headers = serviceHeaders(env);
    const url = vehicle_id ? `${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(vehicle_id)}&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}` : `${env.SUPABASE_URL}/rest/v1/customer_vehicles`;
    const method = vehicle_id ? 'PATCH' : 'POST';
    const res = await fetch(url, { method, headers:{ ...headers, Prefer:'return=representation' }, body: JSON.stringify(vehicle_id ? payload : [payload]) });
    if (!res.ok) return withCors(json({ error:`Could not save vehicle. ${await res.text()}` },500));
    const rows = await res.json().catch(() => []);
    return withCors(json({ ok:true, vehicle: Array.isArray(rows)? rows[0] || null : null }));
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function normalize(b, customer_profile_id){ return {
  customer_profile_id,
  vehicle_name: text(b.vehicle_name),
  model_year: intOrNull(b.model_year),
  make: text(b.make),
  model: text(b.model),
  vehicle_size: text(b.vehicle_size),
  body_style: text(b.body_style),
  vehicle_category: text(b.vehicle_category),
  is_exotic: boolVal(b.is_exotic),
  color: text(b.color),
  mileage_km: intOrNull(b.mileage_km),
  last_wash_at: text(b.last_wash_at),
  next_cleaning_due_at: text(b.next_cleaning_due_at),
  service_interval_days: intOrNull(b.service_interval_days),
  auto_schedule_opt_in: boolVal(b.auto_schedule_opt_in),
  last_package_code: text(b.last_package_code),
  last_addons: Array.isArray(b.last_addons) ? b.last_addons : [],
  parking_location: text(b.parking_location),
  alternate_service_address: text(b.alternate_service_address),
  notes_for_team: text(b.notes_for_team),
  detailer_visible_notes: text(b.detailer_visible_notes),
  admin_private_notes: text(b.admin_private_notes),
  preferred_contact_name: text(b.preferred_contact_name),
  contact_email: text(b.contact_email),
  contact_phone: text(b.contact_phone),
  text_updates_opt_in: boolVal(b.text_updates_opt_in),
  live_updates_opt_in: boolVal(b.live_updates_opt_in),
  has_water_hookup: boolVal(b.has_water_hookup),
  has_power_hookup: boolVal(b.has_power_hookup),
  save_billing_on_file: boolVal(b.save_billing_on_file),
  billing_label: text(b.billing_label),
  is_primary: boolVal(b.is_primary),
  display_order: intOrNull(b.display_order) ?? 0,
  updated_at: new Date().toISOString()
}; }
function text(v){ const s=String(v ?? '').trim(); return s || null; }
function intOrNull(v){ if(v===null||v===undefined||v==='') return null; const n=Number(v); return Number.isInteger(n)?n:null; }
function boolVal(v){ return v===true || String(v||'').toLowerCase()==='true' || String(v||'')==='1' || String(v||'').toLowerCase()==='yes'; }
function serviceHeaders(env){ return { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json" }; }
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
