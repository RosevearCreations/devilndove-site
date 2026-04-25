
import { getCurrentCustomerSession } from "../_lib/customer-session.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }){
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:'Unauthorized.' },401));
    const body = await request.json().catch(()=>null);
    const rating = Number(body?.rating || 0);
    if (!(rating >= 1 && rating <= 5)) return withCors(json({ error:'Rating must be between 1 and 5.' },400));
    const payload = { customer_profile_id: current.customer_profile.id, booking_id: String(body?.booking_id || '').trim() || null, vehicle_id: String(body?.vehicle_id || '').trim() || null, review_source: String(body?.review_source || 'app').trim() || 'app', rating, review_title: String(body?.review_title || '').trim() || null, review_text: String(body?.review_text || '').trim() || null, is_public: body?.is_public === true, status: 'submitted', google_review_url: String(body?.google_review_url || '').trim() || null, reviewer_name: current.customer_profile.full_name || current.customer_profile.email || 'Customer', updated_at: new Date().toISOString() };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_reviews`, { method:'POST', headers:{ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' }, body: JSON.stringify([payload]) });
    if (!res.ok) return withCors(json({ error: await res.text() },500));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, review: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) { return withCors(json({ error:String(err) },500)); }
}
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
