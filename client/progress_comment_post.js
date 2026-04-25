import { getCurrentCustomerSession } from "../_lib/customer-session.js";
import { maybeQueueCustomerNotification } from "../_lib/notification-hooks.js";
import { loadAppSettings } from "../_lib/app-settings.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:"Server configuration is incomplete." },500));
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:"Unauthorized." },401));
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    const message = String(body.message || '').trim();
    const parent_type = String(body.parent_type || 'booking').trim().toLowerCase();
    const parent_id = String(body.parent_id || '').trim() || null;
    if (!token) return withCors(json({ error:'Missing token.' },400));
    if (!message) return withCors(json({ error:'Message is required.' },400));
    if (!['booking','annotation','comment'].includes(parent_type)) return withCors(json({ error:'Invalid parent_type.' },400));

    const settings = await loadAppSettings(env, ['feature_flags','moderation_rules']);
    const flags = settings.feature_flags || {};
    const moderationRules = settings.moderation_rules || {};
    if (flags.customer_chat_enabled === false) return withCors(json({ error:'Client chat is disabled right now.' },403));

    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json" };
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_email,customer_profile_id,progress_enabled,assigned_staff_email,assigned_staff_name&progress_token=eq.${encodeURIComponent(token)}&limit=1`, { headers });
    if (!bookingRes.ok) return withCors(json({ error:`Could not load booking. ${await bookingRes.text()}` },500));
    const bookingRows = await bookingRes.json().catch(() => []);
    const booking = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
    if (!booking) return withCors(json({ error:'Progress record not found.' },404));
    if (booking.progress_enabled === false) return withCors(json({ error:'Progress is not enabled for this booking.' },403));
    if ((booking.customer_email || '').toLowerCase() !== (current.customer_profile.email || '').toLowerCase()) return withCors(json({ error:'This booking does not belong to the signed-in client.' },403));

    const parentCheck = await validateParent({ env, headers, booking_id: booking.id, parent_type, parent_id, author_type:'client', moderationRules });
    if (!parentCheck.ok) return withCors(json({ error: parentCheck.error }, 400));

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments`, {
      method:'POST', headers: { ...headers, Prefer:'return=representation' },
      body: JSON.stringify([{
        booking_id: booking.id,
        parent_type,
        parent_id,
        author_type:'client',
        author_name: current.customer_profile.full_name || 'Client',
        author_email: current.customer_profile.email || null,
        message,
        visibility:'customer',
        thread_status:'visible'
      }])
    });
    if (!insertRes.ok) return withCors(json({ error:`Could not save comment. ${await insertRes.text()}` },500));
    const rows = await insertRes.json().catch(() => []);
    await maybeQueueCustomerNotification({
      env, booking, customer_profile: current.customer_profile, event_type: 'client_progress_comment_posted', message, channel_hint: current.customer_profile.notification_channel || 'email', payload: { role:'client', assigned_staff_email: booking.assigned_staff_email || null, assigned_staff_name: booking.assigned_staff_name || null }
    });
    return withCors(json({ ok:true, message:'Comment posted.', comment: Array.isArray(rows)? rows[0] || null : null }));
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}

async function validateParent({ env, headers, booking_id, parent_type, parent_id, author_type, moderationRules }) {
  if (parent_type === 'booking') return { ok: true };
  if (!parent_id) return { ok: false, error: 'A parent reply target is required.' };
  if (parent_type === 'annotation') {
    if (author_type === 'client' && moderationRules.allow_client_annotation_replies === false) return { ok: false, error: 'Replies to annotations are disabled.' };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/observation_annotations?select=id,visibility,thread_status&booking_id=eq.${encodeURIComponent(booking_id)}&id=eq.${encodeURIComponent(parent_id)}&limit=1`, { headers });
    const rows = res.ok ? await res.json().catch(() => []) : [];
    const row = Array.isArray(rows) ? rows[0] || null : null;
    if (!row) return { ok: false, error: 'Parent annotation not found.' };
    if (row.visibility === 'internal') return { ok: false, error: 'That annotation is not open for client replies.' };
    if (row.thread_status === 'removed' || row.thread_status === 'hidden') return { ok: false, error: 'That annotation is no longer available.' };
    return { ok: true };
  }
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/progress_comments?select=id,visibility,thread_status,parent_type,parent_id&booking_id=eq.${encodeURIComponent(booking_id)}&id=eq.${encodeURIComponent(parent_id)}&limit=1`, { headers });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  const row = Array.isArray(rows) ? rows[0] || null : null;
  if (!row) return { ok: false, error: 'Parent comment not found.' };
  if (row.visibility === 'internal') return { ok: false, error: 'That comment is not open for client replies.' };
  if (row.thread_status === 'removed' || row.thread_status === 'hidden') return { ok: false, error: 'That comment is no longer available.' };
  return { ok: true };
}

function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
